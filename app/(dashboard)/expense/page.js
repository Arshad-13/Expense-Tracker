'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { scanAndFillForm } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Utility function to clean price from API response and extract numeric value
const cleanPrice = (priceString) => {
  if (!priceString) return '';
  // Remove currency symbols and keep only numbers and decimal point
  return priceString.toString().replace(/[^0-9.-]/g, '').trim();
};

// Currency search component
function CurrencySearchDropdown({ value, onChange, currentCurrency }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currencies, setCurrencies] = useState([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch currencies from REST Countries API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const countries = await response.json();
        
        const currencyMap = new Map();
        
        countries.forEach(country => {
          if (country.currencies) {
            Object.entries(country.currencies).forEach(([code, details]) => {
              if (details.name && details.symbol) {
                currencyMap.set(code, {
                  code,
                  name: details.name,
                  symbol: details.symbol
                });
              }
            });
          }
        });
        
        const uniqueCurrencies = Array.from(currencyMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setCurrencies(uniqueCurrencies);
        setFilteredCurrencies(uniqueCurrencies);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
        // Fallback currencies
        const fallbackCurrencies = [
          { code: 'USD', symbol: '$', name: 'United States dollar' },
          { code: 'EUR', symbol: '€', name: 'Euro' },
          { code: 'GBP', symbol: '£', name: 'British pound' },
          { code: 'INR', symbol: '₹', name: 'Indian rupee' },
          { code: 'JPY', symbol: '¥', name: 'Japanese yen' },
          { code: 'CAD', symbol: '$', name: 'Canadian dollar' },
        ];
        setCurrencies(fallbackCurrencies);
        setFilteredCurrencies(fallbackCurrencies);
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Filter currencies based on search term
  useEffect(() => {
    const filtered = currencies.filter(currency =>
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.symbol.includes(searchTerm)
    );
    setFilteredCurrencies(filtered);
  }, [searchTerm, currencies]);

  const handleSelect = (currency) => {
    onChange(currency.code);
    setSearchTerm('');
    setIsOpen(false);
  };

  const displayValue = currentCurrency ? 
    `${currentCurrency.symbol} ${currentCurrency.code} - ${currentCurrency.name}` : 
    'Search currencies...';

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search currencies..."
          className="mt-1 block w-full bg-white dark:bg-background"
          disabled={loading}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="animate-spin h-4 w-4 text-accent" />
          </div>
        )}
      </div>
      
      {isOpen && !loading && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCurrencies.length > 0 ? (
            filteredCurrencies.map((currency) => (
              <div
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className="px-3 py-2 cursor-pointer hover:bg-secondary flex items-center justify-between text-foreground"
              >
                <span className="font-medium">{currency.symbol} {currency.code}</span>
                <span className="text-muted-foreground text-sm truncate ml-2">{currency.name}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-muted-foreground">No currencies found</div>
          )}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}

// A helper component to show a loading state on the scan button
function ScanButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-accent hover:bg-accent/90 text-white font-semibold"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Scanning...
        </>
      ) : (
        'Scan & Fill Form'
      )}
    </Button>
  );
}

const FALLBACK_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'United States dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British pound' },
  { code: 'INR', symbol: '₹', name: 'Indian rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese yen' },
  { code: 'CAD', symbol: '$', name: 'Canadian dollar' },
];

export default function ExpensePage() {
  // State for the manual form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [total, setTotal] = useState('');
  const [category, setCategory] = useState('General');
  const [currency, setCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState(FALLBACK_CURRENCIES);
  const [lineItems, setLineItems] = useState([
    { itemName: '', quantity: 1, price: '' },
  ]);
  
  // Get current currency symbol
  const currentCurrency = currencies.find(c => c.code === currency);

  // useFormState hook to manage the Server Action for OCR
  const initialState = { status: null, message: null, data: null };
  const [state, formAction] = useActionState(scanAndFillForm, initialState);

  // This effect runs when the server action returns data, populating the form
  useEffect(() => {
    if (state.status === 'success' && state.data) {
      const { total_amount, transaction_date, category, line_items } = state.data;
      
      // Clean and set total amount
      setTotal(cleanPrice(total_amount) || '');
      setDate(transaction_date || new Date().toISOString().split('T')[0]);
      setCategory(category || 'General');
      
      // Clean prices in line items
      const cleanedLineItems = (line_items || []).map(item => ({
        ...item,
        price: cleanPrice(item.price) || ''
      }));
      
      setLineItems(cleanedLineItems.length > 0 ? cleanedLineItems : [{ itemName: '', quantity: 1, price: '' }]);
    }
  }, [state]);

  // --- Handlers for manual manipulation of line items ---
  const handleItemChange = (index, event) => {
    const values = [...lineItems];
    values[index][event.target.name] = event.target.value;
    setLineItems(values);
  };

  const handleAddItem = () => {
    setLineItems([...lineItems, { itemName: '', quantity: 1, price: '' }]);
  };

  const handleRemoveItem = (index) => {
    const values = [...lineItems];
    values.splice(index, 1);
    setLineItems(values);
  };
  
  const handleManualSubmit = async (event) => {
    event.preventDefault();
    const expenseData = { 
      date, 
      total, 
      category, 
      currency: currency,
      currencySymbol: currentCurrency?.symbol,
      lineItems 
    };
    
    try {
      console.log('--- Manual Submission ---', expenseData);
      
      // Import the server action dynamically
      const { saveToDraft } = await import('./saveToDraft');
      const result = await saveToDraft(expenseData);
      
      if (result.success) {
        alert(`${result.message} Total: ${currentCurrency?.symbol}${total}`);
        // Reset form
        setTotal('');
        setLineItems([{ itemName: '', quantity: 1, price: '' }]);
      } else {
        alert(`Error: ${result.message}`);
      }
      
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold font-playfair text-foreground text-center mb-2">Add New Expense</h1>
        <p className="text-center text-muted-foreground mb-6">Fill the form manually or scan a receipt to start.</p>
        
        {/* --- OCR Section --- */}
        <Card className="bg-white dark:bg-card border-border shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Option 1: Scan a Receipt</CardTitle>
            <CardDescription>Upload a receipt image or PDF to auto-fill form details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input
                type="file"
                name="receipt"
                required
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
              />
              <ScanButton />
              {state?.message && (
                <p className={`text-sm font-medium ${state.status === 'error' ? 'text-destructive' : 'text-emerald-500'}`}>
                  {state.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* --- Manual Form Section --- */}
        <Card className="bg-white dark:bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Option 2: Enter Details Manually</CardTitle>
            <CardDescription>Fill out the expense claim form manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    type="date" 
                    id="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    required 
                    className="bg-white dark:bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total Amount ({currentCurrency?.symbol})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currentCurrency?.symbol}
                    </span>
                    <Input 
                      type="number" 
                      id="total" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={total} 
                      onChange={(e) => setTotal(e.target.value)} 
                      required 
                      className="pl-8 bg-white dark:bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <CurrencySearchDropdown 
                  value={currency} 
                  onChange={setCurrency} 
                  currentCurrency={currentCurrency}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  required 
                  className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>General</option>
                  <option>Groceries</option>
                  <option>Food & Dining</option>
                  <option>Travel</option>
                  <option>Shopping</option>
                </select>
              </div>
              
              {/* Line Items Sub-form */}
              <div className="space-y-3">
                <h3 className="text-md font-semibold text-foreground">Line Items</h3>
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input 
                        type="text" 
                        name="itemName" 
                        placeholder="Item Name" 
                        value={item.itemName} 
                        onChange={e => handleItemChange(index, e)} 
                        className="col-span-5 bg-white dark:bg-background"
                      />
                      <Input 
                        type="number" 
                        name="quantity" 
                        placeholder="Qty" 
                        value={item.quantity} 
                        onChange={e => handleItemChange(index, e)} 
                        className="col-span-2 bg-white dark:bg-background"
                      />
                      <div className="col-span-4 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {currentCurrency?.symbol}
                        </span>
                        <Input 
                          type="number" 
                          name="price" 
                          placeholder="0.00" 
                          step="0.01" 
                          value={item.price} 
                          onChange={e => handleItemChange(index, e)} 
                          className="pl-7 bg-white dark:bg-background"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)} 
                        className="col-span-1 text-destructive hover:text-destructive/80 font-bold text-center"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddItem} 
                  className="w-full sm:w-auto bg-white dark:bg-background"
                >
                  + Add Item
                </Button>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Confirm and Save Expense
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}