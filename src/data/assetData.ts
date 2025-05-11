
export interface Asset {
  symbol: string;
  name: string;
}

// Popular stocks for quick selection
export const popularStocks: Asset[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "META", name: "Meta" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "JPM", name: "JPMorgan Chase" }
];

// Fallback data for when API calls fail
export const allStocks: Asset[] = [
  ...popularStocks,
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "DIS", name: "Walt Disney" },
  { symbol: "INTC", name: "Intel Corporation" },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "PYPL", name: "PayPal" },
  { symbol: "SBUX", name: "Starbucks" },
  { symbol: "QCOM", name: "Qualcomm" },
  { symbol: "CSCO", name: "Cisco Systems" },
  { symbol: "T", name: "AT&T" },
  { symbol: "VZ", name: "Verizon" },
  { symbol: "WMT", name: "Walmart" },
  { symbol: "KO", name: "Coca-Cola" },
  { symbol: "PEP", name: "PepsiCo" },
  { symbol: "MCD", name: "McDonald's" },
  { symbol: "BA", name: "Boeing" },
  { symbol: "GE", name: "General Electric" },
  { symbol: "IBM", name: "IBM" },
  { symbol: "XOM", name: "Exxon Mobil" },
  { symbol: "CVX", name: "Chevron" },
  { symbol: "JNJ", name: "Johnson & Johnson" }
];

/**
 * Find assets in the local data that match the query
 */
export const searchLocalAssets = (query: string): Asset[] => {
  if (!query || query.length < 2) return [];
  
  return allStocks.filter(asset => 
    asset.symbol.toLowerCase().includes(query.toLowerCase()) || 
    asset.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20);
};
