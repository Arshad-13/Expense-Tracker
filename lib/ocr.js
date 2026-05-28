/**
 * Calls the OCR.space API to extract text from an image file.
 * @param {File} file - The image file of the receipt.
 * @param {string} apiKey - Your OCR.space API key.
 * @returns {Promise<string|null>} The parsed text from the receipt or null on failure.
 */


/**
 * Processes a receipt image file to extract structured data.
 * This function encapsulates the entire workflow:
 * 1. Calls the OCR.space API to get raw text from the image.
 * 2. Parses the raw text to extract amount, date, category, and line items.
 *
 * @param {File} file - The image file of the receipt.
 * @param {string} apiKey - Your OCR.space API key.
 * @returns {Promise<object>} A promise that resolves to an object with the structured receipt data.
 * @throws {Error} Throws an error if the API call fails or if text cannot be extracted.
 */
export async function processReceipt(file, apiKey) {
  // --- Helper Class for Text Extraction (Internal) ---
  class ReceiptExtractor {
    constructor(text) {
      this.text = text;
      this.lines = text.split('\n');
      this.patterns = {
        amount: /(?:total|amount|due|balance)[\s:]*([\$€₹]?\s*\d+[\.,]\d{2})/i,
        date: /(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})|(\w+\s\d{1,2},\s\d{4})/i,
        currency: /([\$€₹]|USD|EUR|INR)/i,
      };
      this.categoryKeywords = {
        'Food & Dining': ['restaurant', 'cafe', 'food', 'grill', 'pizza', 'kitchen'],
        'Groceries': ['market', 'grocery', 'supermarket', 'mart'],
        'Travel': ['taxi', 'cab', 'uber', 'lyft', 'airlines', 'transit'],
        // Add more categories and keywords as needed
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
      // Fallback: find the largest number with two decimal places
      const allNumbers = this.text.match(/\d+[\.,]\d{2}/g) || [];
      if (allNumbers.length > 0) {
        const numericValues = allNumbers.map(n => parseFloat(n.replace(',', '.')));
        return Math.max(...numericValues).toFixed(2);
      }
      return null;
    }

    extractDate() {
      return this._findMatch(this.patterns.date);
    }

    extractCurrency() {
      return this._findMatch(this.patterns.currency);
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
        // Skip if the line contains a filter keyword, indicating it's not an item
        if (filterKeywords.some(keyword => trimmedLine.toLowerCase().includes(keyword))) {
          continue;
        }

        const match = trimmedLine.match(lineItemRegex);
        if (match) {
          const quantity = parseInt(match[1], 10) || 1;
          const itemName = match[2].trim();
          const price = parseFloat(match[3].replace(',', '.'));

          // Basic validation to ensure it's a plausible item
          if (itemName && !isNaN(price)) {
            items.push({
              item_name: itemName,
              price: price,
              quantity: quantity,
            });
          }
        }
      }
      return items;
    }

    /**
     * Extracts all information and returns a structured object.
     * @returns {object} The structured receipt data.
     */
    getAll() {
      return {
        total_amount: this.extractAmount(),
        transaction_date: this.extractDate(),
        currency: this.extractCurrency(),
        category: this.extractCategory(),
        line_items: this.extractLineItems(),
      };
    }
  }

  // --- Helper Function for API Call (Internal) ---
  async function getTextFromOcr(file, apiKey) {
    if (!file) {
      throw new Error("No file provided for OCR.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isTable", "true");
    formData.append("OCREngine", "2");
    formData.append("language", "eng");

    try {
      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          "apikey": apiKey,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        throw new Error(`OCR API Error: ${result.ErrorMessage}`);
      }
      
      const parsedText = result.ParsedResults[0]?.ParsedText;
      if (!parsedText) {
          throw new Error("OCR processing succeeded but returned no text.");
      }

      return parsedText;

    } catch (error) {
      // Re-throw the error to be caught by the main function's handler
      throw new Error(`Failed to call OCR API: ${error.message}`);
    }
  }
  
  // --- Main Logic ---
  const rawText = await getTextFromOcr(file, apiKey);
  const extractor = new ReceiptExtractor(rawText);
  const receiptData = extractor.getAll();

  return receiptData;
}


// --- USAGE EXAMPLE (for a non-DOM environment like Node.js or a web worker) ---

/*
// This is how you would use the function.
// You need a `File` object (in the browser) or a readable stream/buffer (in Node.js)
// and your API key.

// In a browser context, you'd get the file from an input element first:
// const file = document.getElementById('myFileInput').files[0];

// In a Node.js context, you might need a library like 'form-data' and 'node-fetch'
// and you would read the file from the filesystem.

async function runExample(fileObject) {
  const apiKey = 'K89671984588957'; // IMPORTANT: Replace with your actual key

  if (!fileObject) {
    console.error("Please provide a file object.");
    return;
  }

  try {
    console.log("Processing receipt...");
    const data = await processReceipt(fileObject, apiKey);
    
    console.log("\n--- Extracted Information ---");
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error("An error occurred during receipt processing:", error.message);
  }
}

// To run this example, you would call `runExample(yourFileObject)`.
*/