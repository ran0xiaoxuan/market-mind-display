
import { EnhancedAsset } from "@/services/enhancedAssetApiService";

// Enhanced asset data with more comprehensive information
export const enhancedPopularStocks: EnhancedAsset[] = [
  { 
    symbol: "AAPL", 
    name: "Apple Inc.", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 3000000000000,
    sector: "Technology",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corporation", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 2800000000000,
    sector: "Technology",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc. Class A", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 1700000000000,
    sector: "Communication Services",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "AMZN", 
    name: "Amazon.com Inc.", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 1500000000000,
    sector: "Consumer Discretionary",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "TSLA", 
    name: "Tesla Inc.", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 800000000000,
    sector: "Consumer Discretionary",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "META", 
    name: "Meta Platforms Inc.", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 750000000000,
    sector: "Communication Services",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "NVDA", 
    name: "NVIDIA Corporation", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 1800000000000,
    sector: "Technology",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "JPM", 
    name: "JPMorgan Chase & Co.", 
    exchange: "NYSE", 
    type: "stock", 
    marketCap: 500000000000,
    sector: "Financials",
    lastUpdated: new Date().toISOString()
  },
  { 
    symbol: "FNGA", 
    name: "China SXT Pharmaceuticals Inc.", 
    exchange: "NASDAQ", 
    type: "stock", 
    marketCap: 15000000,
    sector: "Healthcare",
    lastUpdated: new Date().toISOString()
  }
];

// Comprehensive stock database with enhanced search capabilities
export const enhancedAllStocks: EnhancedAsset[] = [
  ...enhancedPopularStocks,
  { symbol: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ", type: "stock", marketCap: 150000000000, sector: "Communication Services", lastUpdated: new Date().toISOString() },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE", type: "stock", marketCap: 200000000000, sector: "Communication Services", lastUpdated: new Date().toISOString() },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", type: "stock", marketCap: 200000000000, sector: "Technology", lastUpdated: new Date().toISOString() },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", exchange: "NASDAQ", type: "stock", marketCap: 250000000000, sector: "Technology", lastUpdated: new Date().toISOString() },
  { symbol: "PYPL", name: "PayPal Holdings Inc.", exchange: "NASDAQ", type: "stock", marketCap: 80000000000, sector: "Financials", lastUpdated: new Date().toISOString() },
  { symbol: "SBUX", name: "Starbucks Corporation", exchange: "NASDAQ", type: "stock", marketCap: 110000000000, sector: "Consumer Discretionary", lastUpdated: new Date().toISOString() },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", exchange: "NASDAQ", type: "stock", marketCap: 180000000000, sector: "Technology", lastUpdated: new Date().toISOString() },
  { symbol: "CSCO", name: "Cisco Systems Inc.", exchange: "NASDAQ", type: "stock", marketCap: 200000000000, sector: "Technology", lastUpdated: new Date().toISOString() },
];

/**
 * Enhanced local asset search with fuzzy matching and ranking
 */
export const searchEnhancedLocalAssets = (query: string): EnhancedAsset[] => {
  if (!query || query.length < 1) return [];
  
  const queryLower = query.toLowerCase();
  
  return enhancedAllStocks
    .filter(asset => 
      asset.symbol.toLowerCase().includes(queryLower) || 
      asset.name.toLowerCase().includes(queryLower) ||
      (asset.sector && asset.sector.toLowerCase().includes(queryLower))
    )
    .sort((a, b) => {
      const aSymbolLower = a.symbol.toLowerCase();
      const bSymbolLower = b.symbol.toLowerCase();
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      
      // Enhanced ranking algorithm
      if (aSymbolLower === queryLower && bSymbolLower !== queryLower) return -1;
      if (bSymbolLower === queryLower && aSymbolLower !== queryLower) return 1;
      
      if (aSymbolLower.startsWith(queryLower) && !bSymbolLower.startsWith(queryLower)) return -1;
      if (bSymbolLower.startsWith(queryLower) && !aSymbolLower.startsWith(queryLower)) return 1;
      
      if (aSymbolLower.includes(queryLower) && !bSymbolLower.includes(queryLower)) return -1;
      if (bSymbolLower.includes(queryLower) && !aSymbolLower.includes(queryLower)) return 1;
      
      if (aNameLower.startsWith(queryLower) && !bNameLower.startsWith(queryLower)) return -1;
      if (bNameLower.startsWith(queryLower) && !aNameLower.startsWith(queryLower)) return 1;
      
      // Market cap tie breaker
      return (b.marketCap || 0) - (a.marketCap || 0);
    })
    .slice(0, 20);
};

/**
 * Get trending assets based on market cap and sector
 */
export const getTrendingAssets = (): EnhancedAsset[] => {
  return enhancedAllStocks
    .filter(asset => asset.marketCap && asset.marketCap > 50000000000)
    .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
    .slice(0, 10);
};
