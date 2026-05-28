import { NextResponse } from 'next/server'

// Cache exchange rates for 1 hour
const ratesCache = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export async function GET(request, { params }) {
  try {
    const { base } = await params
    const baseCurrency = base?.toUpperCase()
    
    if (!baseCurrency) {
      return NextResponse.json(
        { error: 'Base currency is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = baseCurrency
    const cachedData = ratesCache.get(cacheKey)
    const now = Date.now()
    
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedData.data)
    }

    // Fetch fresh data from Exchange Rate API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
      headers: {
        'User-Agent': 'ExpenseApp/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Exchange Rate API error: ${response.status}`)
    }

    const exchangeData = await response.json()

    // Transform the data
    const transformedData = {
      base: exchangeData.base,
      date: exchangeData.date,
      rates: exchangeData.rates,
      timestamp: now
    }

    // Cache the data
    ratesCache.set(cacheKey, {
      data: transformedData,
      timestamp: now
    })

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}

// Also support POST for bulk currency conversion
export async function POST(request, { params }) {
  try {
    const { base } = await params
    const baseCurrency = base?.toUpperCase()
    const body = await request.json()
    const { amount, targetCurrencies = [] } = body

    if (!baseCurrency || !amount) {
      return NextResponse.json(
        { error: 'Base currency and amount are required' },
        { status: 400 }
      )
    }

    // Get exchange rates
    const ratesResponse = await GET(request, { params })
    const ratesData = await ratesResponse.json()

    if (!ratesData.rates) {
      throw new Error('Failed to get exchange rates')
    }

    // Calculate conversions
    const conversions = {}
    
    if (targetCurrencies.length > 0) {
      // Convert to specific currencies
      targetCurrencies.forEach(currency => {
        const rate = ratesData.rates[currency.toUpperCase()]
        if (rate) {
          conversions[currency.toUpperCase()] = {
            rate,
            amount: (amount * rate).toFixed(2)
          }
        }
      })
    } else {
      // Convert to all available currencies
      Object.entries(ratesData.rates).forEach(([currency, rate]) => {
        conversions[currency] = {
          rate,
          amount: (amount * rate).toFixed(2)
        }
      })
    }

    return NextResponse.json({
      baseCurrency,
      baseAmount: amount,
      conversions,
      date: ratesData.date
    })

  } catch (error) {
    console.error('Error converting currency:', error)
    return NextResponse.json(
      { error: 'Failed to convert currency' },
      { status: 500 }
    )
  }
}