'use server';

/**
 * This class is a self-contained parser for extracting structured data from raw receipt text.
 * It runs exclusively on the server and is not exposed to the client.
 */
class ReceiptExtractor {
  constructor(text) {
    this.text = text;
    this.lines = text.split('\n');
    this.patterns = {
      // Looks for keywords indicating totals, grand totals, due amounts, or net pay, followed by a price
      amount: /(?:total|amount\s*due|due|balance|grand\s*total|net\s*pay|total\s*pay)[\s:]*([\$€₹£]?\s*\d+[\.,]\d{2})/i,
      // Matches standard date formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, and month name formats
      date: /(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})|(\w{3,9}\s\d{1,2},\s\d{4})|(\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2})/i,
    };
    this.categoryKeywords = {
      'Food & Dining': ['restaurant', 'cafe', 'food', 'grill', 'pizza', 'kitchen', 'coffee', 'starbucks', 'diner', 'bistro', 'pub', 'bar', 'eats', 'mcdonald', 'burger', 'subway', 'dinner', 'lunch', 'breakfast'],
      'Groceries': ['market', 'grocery', 'supermarket', 'mart', 'walmart', 'target', 'whole foods', 'kroger', 'safeway', 'costco', 'aldi', 'lidl', 'deli', 'bakery'],
      'Travel': ['taxi', 'cab', 'uber', 'lyft', 'airlines', 'transit', 'fuel', 'petrol', 'gas', 'shell', 'chevron', 'exxon', 'bp', 'flight', 'hotel', 'motel', 'stay', 'railway', 'train', 'parking', 'toll'],
      'Shopping': ['store', 'shop', 'boutique', 'books', 'amazon', 'mall', 'outlet', 'clothing', 'apparel', 'shoes', 'electronics', 'apple', 'best buy', 'department', 'retail'],
    };
  }

  _findMatch(pattern) {
    const match = this.text.match(pattern);
    return match ? match[1] || match[0] : null;
  }

  extractAmount() {
    // 1. Try keyword-based matching
    const keywordMatch = this._findMatch(this.patterns.amount);
    if (keywordMatch) {
      const cleaned = keywordMatch.replace(/[^\d.,]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        return parsed.toFixed(2);
      }
    }

    // 2. Fallback: Parse all amounts and find the largest reasonable amount
    const priceRegex = /\b\d+[\.,]\d{2}\b/g;
    const matches = this.text.match(priceRegex) || [];
    if (matches.length > 0) {
      const values = matches
        .map(m => parseFloat(m.replace(',', '.')))
        .filter(v => v > 0 && v < 50000); // Filter out card numbers or timestamps
      if (values.length > 0) {
        return Math.max(...values).toFixed(2);
      }
    }
    return '';
  }

  extractDate() {
    const match = this._findMatch(this.patterns.date);
    if (match) {
      try {
        const parsedDate = new Date(match);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Failed to parse date string:', match);
      }
    }
    
    // Look for YYYY-MM-DD, DD/MM/YYYY or MM/DD/YYYY
    const dateRegex = /\b(\d{1,4})[-\/.](\d{1,2})[-\/.](\d{1,4})\b/;
    const dateMatch = this.text.match(dateRegex);
    if (dateMatch) {
      let [_, part1, part2, part3] = dateMatch;
      // Normalizing components
      let year = part3.length === 4 ? part3 : part1.length === 4 ? part1 : '20' + part3;
      let month = part3.length === 4 ? part1 : part2;
      let day = part3.length === 4 ? part2 : part3.length === 2 ? part2 : part1;
      
      const parsedDate = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
    
    return new Date().toISOString().split('T')[0]; // Default to current date
  }

  extractCategory() {
    const textLower = this.text.toLowerCase();
    for (const category in this.categoryKeywords) {
      for (const keyword of this.categoryKeywords[category]) {
        if (textLower.includes(keyword)) {
          return category;
        }
      }
    }
    return 'General';
  }

  extractLineItems() {
    const items = [];
    const lineItemRegex = /(?:(\d+)\s*[xX]?\s+)?([a-zA-Z0-9\s#\-\.\'\&]{3,40}?)\s+([%s€₹£]?\s*[\d,]+\.\d{2})/;
    const filterKeywords = ['total', 'subtotal', 'tax', 'cash', 'change', 'vat', 'gst', 'discount', 'visa', 'mastercard', 'amex', 'card', 'payment', 'balance', 'rounding', 'invoice', 'receipt', 'due'];
    
    for (const line of this.lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Skip lines with summary/meta keywords
      if (filterKeywords.some(keyword => trimmedLine.toLowerCase().includes(keyword))) {
        continue;
      }

      const match = trimmedLine.match(lineItemRegex);
      if (match) {
        const quantity = parseInt(match[1], 10) || 1;
        const itemName = match[2].trim();
        const priceStr = match[3].replace(/[^\d.,]/g, '').replace(',', '.');
        const price = parseFloat(priceStr).toFixed(2);
        
        if (itemName && itemName.length > 2 && !isNaN(price)) {
          items.push({ itemName, quantity, price });
        }
      }
    }
    return items;
  }

  getAll() {
    const lineItems = this.extractLineItems();
    if (lineItems.length === 0) {
      lineItems.push({ itemName: 'Uncategorized Item', quantity: 1, price: this.extractAmount() || '0.00' });
    }
    return {
      total_amount: this.extractAmount(),
      transaction_date: this.extractDate(),
      category: this.extractCategory(),
      line_items: lineItems,
    };
  }
}

/**
 * This is the Next.js Server Action. It runs securely on the server.
 * It handles the file upload, calls the OCR service with a secret API key,
 * parses the result, and returns structured data.
 *
 * @param {object} prevState - The previous state from the useActionState hook.
 * @param {FormData} formData - The form data submitted by the user, containing the receipt file.
 * @returns {Promise<object>} A new state object for the form with status, message, and parsed data.
 */
export async function scanAndFillForm(prevState, formData) {
  const file = formData.get('receipt');
  if (!file || file.size === 0) {
    return { status: 'error', message: 'Please provide a valid receipt file.' };
  }

  // Securely access the API keys from server-side environment variables.
  const ocrApiKey = process.env.OCR_API_KEY;
  if (!ocrApiKey) {
    console.error('OCR_API_KEY is not set in the environment variables.');
    return { status: 'error', message: 'OCR API key is not configured on the server. Please contact support.' };
  }

  const isGif = file.type === 'image/gif' || (file.name && file.name.toLowerCase().endsWith('.gif'));

  const ocrFormData = new FormData();
  ocrFormData.append('file', file);
  ocrFormData.append('isTable', 'true');
  ocrFormData.append('OCREngine', isGif ? '1' : '2');
  ocrFormData.append('language', 'eng');

  try {
    // 1. Call the external OCR API
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'apikey': ocrApiKey },
      body: ocrFormData,
    });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage.join(', '));
    }
    
    const parsedText = result.ParsedResults[0]?.ParsedText;
    if (!parsedText) {
      throw new Error('The OCR service could not extract any text from the image.');
    }

    // 2. Parse the extracted text using the high-performance local regex parser
    console.log('Parsing receipt text using the high-performance local regex parser...');
    const extractor = new ReceiptExtractor(parsedText);
    const data = extractor.getAll();
    const successMessage = 'Form filled successfully using local receipt parsing!';
    
    // 3. Return a success state with the data
    return { status: 'success', message: successMessage, data: data };

  } catch (error) {
    console.error('Error in Server Action:', error);
    return { status: 'error', message: error.message };
  }
}