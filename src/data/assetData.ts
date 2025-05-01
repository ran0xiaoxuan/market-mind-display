
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

// Popular cryptocurrencies for quick selection
export const popularCryptocurrencies: Asset[] = [
  { symbol: "BTC/USDT", name: "Bitcoin/USDT" },
  { symbol: "ETH/USDT", name: "Ethereum/USDT" },
  { symbol: "SOL/USDT", name: "Solana/USDT" },
  { symbol: "ADA/USDT", name: "Cardano/USDT" },
  { symbol: "DOT/USDT", name: "Polkadot/USDT" },
  { symbol: "XRP/USDT", name: "Ripple/USDT" },
  { symbol: "DOGE/USDT", name: "Dogecoin/USDT" },
  { symbol: "LINK/USDT", name: "Chainlink/USDT" }
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

export const allCryptos: Asset[] = [
  ...popularCryptocurrencies,
  { symbol: "AVAX/USDT", name: "Avalanche/USDT" },
  { symbol: "MATIC/USDT", name: "Polygon/USDT" },
  { symbol: "DOT/USDT", name: "Polkadot/USDT" },
  { symbol: "UNI/USDT", name: "Uniswap/USDT" },
  { symbol: "ATOM/USDT", name: "Cosmos/USDT" },
  { symbol: "LTC/USDT", name: "Litecoin/USDT" },
  { symbol: "BCH/USDT", name: "Bitcoin Cash/USDT" },
  { symbol: "XLM/USDT", name: "Stellar/USDT" },
  { symbol: "EOS/USDT", name: "EOS/USDT" },
  { symbol: "TRX/USDT", name: "TRON/USDT" },
  { symbol: "FIL/USDT", name: "Filecoin/USDT" },
  { symbol: "ALGO/USDT", name: "Algorand/USDT" },
  { symbol: "VET/USDT", name: "VeChain/USDT" },
  { symbol: "XTZ/USDT", name: "Tezos/USDT" },
  { symbol: "NEAR/USDT", name: "NEAR Protocol/USDT" }
];

/**
 * Find assets in the local data that match the query
 */
export const searchLocalAssets = (
  query: string, 
  assetType: "stocks" | "cryptocurrency"
): Asset[] => {
  if (!query || query.length < 2) return [];
  
  const localAssetsList = assetType === "stocks" ? allStocks : allCryptos;
  
  return localAssetsList.filter(asset => 
    asset.symbol.toLowerCase().includes(query.toLowerCase()) || 
    asset.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20);
};
