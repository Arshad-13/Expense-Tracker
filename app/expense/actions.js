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
      amount: /(?:total|amount|due|balance)[\s:]*([\$€₹]?\s*\d+[\.,]\d{2})/i,
      date: /(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})|(\w+\s\d{1,2},\s\d{4})/i,
    };
    this.categoryKeywords = {
      'Food & Dining': ['restaurant', 'cafe', 'food', 'grill', 'pizza', 'kitchen'],
      'Groceries': ['market', 'grocery', 'supermarket', 'mart'],
      'Travel': ['taxi', 'cab', 'uber', 'lyft', 'airlines', 'transit', 'fuel'],
      'Shopping': ['store', 'shop', 'boutique', 'books'],
    };
  }

  _findMatch(pattern) {
    const match = this.text.match(pattern);
    return match ? match[1] || match[0] : null;
  }

  extractAmount() {
    const keywordMatch = this._findMatch(this.patterns.amount);
    if (keywordMatch) {
      return keywordMatch.replace(/[^\d.,]/g, '').trim();
    }
    // Fallback: Find the largest number with two decimal places in the text
    const allNumbers = this.text.match(/\d+[\.,]\d{2}/g) || [];
    if (allNumbers.length > 0) {
      const numericValues = allNumbers.map(n => parseFloat(n.replace(',', '.')));
      return Math.max(...numericValues).toFixed(2);
    }
    return ''; // Return empty string for form consistency
  }

  extractDate() {
    const match = this._findMatch(this.patterns.date);
    // Attempt to format the date into YYYY-MM-DD for standard date inputs
    if (match) {
      try {
        return new Date(match).toISOString().split('T')[0];
      } catch (e) {
        return match; // Fallback to the raw matched text if parsing fails
      }
    }
    return ''; // Return empty string for form consistency
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
    return 'General'; // Default category
  }

  extractLineItems() {
    const items = [];
    const lineItemRegex = /(?:(\d+)\s*[xX]?\s*)?(.+?)\s+([\d,]+\.\d{2})/;
    const filterKeywords = ['total', 'subtotal', 'tax', 'cash', 'change', 'vat', 'gst', 'discount'];
    
    for (const line of this.lines) {
      const trimmedLine = line.trim();
      // Skip lines that are likely summary fields, not purchase items
      if (filterKeywords.some(keyword => trimmedLine.toLowerCase().includes(keyword))) {
        continue;
      }

      const match = trimmedLine.match(lineItemRegex);
      if (match) {
        const quantity = parseInt(match[1], 10) || 1;
        const itemName = match[2].trim();
        const price = parseFloat(match[3].replace(',', '.')).toFixed(2);
        
        // Ensure plausible data was extracted before adding
        if (itemName && !isNaN(price)) {
          items.push({ itemName, quantity, price });
        }
      }
    }
    return items;
  }

  /**
   * Gathers all extracted data into a single object for the form.
   * @returns {object} Structured data ready to be used to populate the form state.
   */
  getAll() {
    const lineItems = this.extractLineItems();
    // If no line items were found, provide a default empty one for a better user experience.
    if (lineItems.length === 0) {
      lineItems.push({ itemName: '', quantity: 1, price: '' });
    }
    return {
      total_amount: this.extractAmount(),
      transaction_date: this.extractDate(),
      category: this.extractCategory(),
      line_items: lineItems,
    };
  }
}


import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Simple Gemini wrapper to analyze OCR text and extract receipt data
 * @param {string} rawOcrText - Raw text from OCR
 * @returns {Promise<object>} - Parsed receipt data
 */
async function GeminiWrapper(rawOcrText) {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0, // Make output more deterministic
  });

  const prompt = `You are an expert at analyzing receipts. Extract the following information from this receipt text and return it as a JSON object:

{
  "total_amount": "string (final total like '12.34')",
  "transaction_date": "string (YYYY-MM-DD format, assume 2025 if year missing)",
  "category": "string (choose from: 'Food & Dining', 'Groceries', 'Travel', 'Shopping', 'General')",
  "line_items": [
    {
      "itemName": "string",
      "quantity": number,
      "price": "string"
    }
  ]
}

Rules:
- Return ONLY valid JSON, no extra text
- Use empty string "" for missing text fields
- Use empty array [] if no line items found
- Ensure the total_amount is the final grand total
- If unsure about category, use "General"

Receipt text:
${rawOcrText}`;

  try {
    console.log("Calling Gemini API...");
    const result = await model.invoke(prompt);
    
    // Parse the JSON response
    const jsonText = result.content.trim();
    var parsedData;
    
    console.log(jsonText);
    try {
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/);
      const cleanJson = jsonMatch ? jsonMatch[1].trim() : jsonText;
      parsedData = JSON.parse(cleanJson);
    } catch (err) {
      console.error("Failed to parse Gemini JSON response:", err, jsonText);
      parsedData = { total_amount: '', transaction_date: '', category: 'General', line_items: [] };
    }
    // Ensure we have the right structure with fallbacks
    const data = {
      total_amount: parsedData.total_amount || '',
      transaction_date: parsedData.transaction_date || '',
      category: parsedData.category || 'General',
      line_items: Array.isArray(parsedData.line_items) ? parsedData.line_items : []
    };
    
    // If no line items, add default empty one
    if (data.line_items.length === 0) {
      data.line_items.push({ itemName: '', quantity: 1, price: '' });
    }
    
    console.log("Gemini parsing successful");
    return data;
    
  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw new Error("AI parsing failed");
  }
}

/**
 * This is the Next.js Server Action. It runs securely on the server.
 * It handles the file upload, calls the OCR service with a secret API key,
 * parses the result, and returns structured data or an error message.
 *
 * @param {object} prevState - The previous state from the useFormState hook (not used here but required by the hook).
 * @param {FormData} formData - The form data submitted by the user, containing the receipt file.
 * @returns {Promise<object>} A new state object for the form with status, message, and optional data.
 */
export async function scanAndFillForm(prevState, formData) {
  const file = formData.get('receipt');
  if (!file || file.size === 0) {
    return { status: 'error', message: 'Please provide a valid receipt file.' };
  }

  // Securely access the API keys from server-side environment variables.
  const ocrApiKey = process.env.OCR_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  
  if (!ocrApiKey) {
    console.error('OCR_API_KEY is not set in the environment variables.');
    return { status: 'error', message: 'OCR API key is not configured on the server. Please contact support.' };
  }

  const ocrFormData = new FormData();
  ocrFormData.append('file', file);
  ocrFormData.append('isTable', 'true');
  ocrFormData.append('OCREngine', '2');
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

    // 2. Parse the extracted text using AI or fallback to regex parsing
    let data;
    let successMessage = 'Form filled successfully!';
    
    // Try Gemini AI first if Google API key is available
    if (googleApiKey) {
      try {
        console.log('Using Gemini AI for intelligent parsing...');
        data = await GeminiWrapper(parsedText);
        successMessage = 'Form filled successfully using AI analysis!';
      } catch (geminiError) {
        console.warn('Gemini AI parsing failed, falling back to regex parsing:', geminiError.message);
        const extractor = new ReceiptExtractor(parsedText);
        data = extractor.getAll();
        successMessage = 'Form filled successfully using fallback parsing!';
      }
    } else {
      console.log('Google API key not found, using regex parsing...');
      const extractor = new ReceiptExtractor(parsedText);
      data = extractor.getAll();
      successMessage = 'Form filled successfully using regex parsing!';
    }
    
    // 3. Return a success state with the data
    return { status: 'success', message: successMessage, data: data };

  } catch (error) {
    console.error('Error in Server Action:', error);
    return { status: 'error', message: error.message };
  }
}