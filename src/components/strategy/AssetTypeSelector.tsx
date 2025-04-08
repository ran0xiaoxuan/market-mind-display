
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface Asset {
  symbol: string;
  name: string;
}

interface AssetTypeSelectorProps {
  assetType: "stocks" | "cryptocurrency";
  selectedAsset: string;
  onAssetTypeChange: (type: "stocks" | "cryptocurrency") => void;
  onAssetSelect: (symbol: string) => void;
}

export const AssetTypeSelector = ({
  assetType,
  selectedAsset,
  onAssetTypeChange,
  onAssetSelect,
}: AssetTypeSelectorProps) => {
  const popularStocks = [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "GOOGL", name: "Google" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "META", name: "Meta" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "JPM", name: "JPMorgan Chase" }
  ];
  
  const popularCryptocurrencies = [
    { symbol: "BTC/USDT", name: "Bitcoin/USDT" },
    { symbol: "ETH/USDT", name: "Ethereum/USDT" },
    { symbol: "SOL/USDT", name: "Solana/USDT" },
    { symbol: "ADA/USDT", name: "Cardano/USDT" },
    { symbol: "DOT/USDT", name: "Polkadot/USDT" },
    { symbol: "XRP/USDT", name: "Ripple/USDT" },
    { symbol: "DOGE/USDT", name: "Dogecoin/USDT" },
    { symbol: "LINK/USDT", name: "Chainlink/USDT" }
  ];

  const additionalStocks = [
    { symbol: "NFLX", name: "Netflix" },
    { symbol: "DIS", name: "Disney" },
    { symbol: "INTC", name: "Intel" },
    { symbol: "AMD", name: "AMD" },
    { symbol: "BA", name: "Boeing" },
    { symbol: "KO", name: "Coca-Cola" },
    { symbol: "PEP", name: "PepsiCo" },
    { symbol: "WMT", name: "Walmart" },
    { symbol: "T", name: "AT&T" },
    { symbol: "VZ", name: "Verizon" }
  ];

  const additionalCryptocurrencies = [
    { symbol: "BNB/USDT", name: "Binance Coin/USDT" },
    { symbol: "XLM/USDT", name: "Stellar/USDT" },
    { symbol: "LTC/USDT", name: "Litecoin/USDT" },
    { symbol: "BCH/USDT", name: "Bitcoin Cash/USDT" },
    { symbol: "MATIC/USDT", name: "Polygon/USDT" },
    { symbol: "AVAX/USDT", name: "Avalanche/USDT" },
    { symbol: "ATOM/USDT", name: "Cosmos/USDT" },
    { symbol: "UNI/USDT", name: "Uniswap/USDT" },
    { symbol: "AAVE/USDT", name: "Aave/USDT" },
    { symbol: "ALGO/USDT", name: "Algorand/USDT" }
  ];

  return (
    <Card className="p-6 mb-10 border">
      <h2 className="text-xl font-semibold mb-2">Select Asset Type</h2>
      <p className="text-sm text-muted-foreground mb-4">Choose the type of asset you want to trade</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button 
          variant={assetType === "stocks" ? "default" : "outline"} 
          className="justify-center h-12"
          onClick={() => onAssetTypeChange("stocks")}
        >
          Stocks
        </Button>
        <Button 
          variant={assetType === "cryptocurrency" ? "default" : "outline"} 
          className="justify-center h-12"
          onClick={() => onAssetTypeChange("cryptocurrency")}
        >
          Cryptocurrency
        </Button>
      </div>
      
      <div className="mb-6 relative">
        <label htmlFor="search-asset" className="block text-sm font-medium mb-2">
          {assetType === "stocks" ? "Search for a stock" : "Search for a cryptocurrency pair"}
        </label>
        <div className="relative">
          <Input 
            id="search-asset" 
            placeholder={assetType === "stocks" ? "Search for a stock (e.g., AAPL)" : "Search for a cryptocurrency pair (e.g., BTC/USDT)"}
            value={selectedAsset}
            onChange={(e) => onAssetSelect(e.target.value)}
            className="w-full"
            list="asset-options"
            autoComplete="off"
          />
          <datalist id="asset-options" className="absolute left-0 w-full z-10">
            {assetType === "stocks" 
              ? [...popularStocks, ...additionalStocks].map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>{stock.name} ({stock.symbol})</option>
                ))
              : [...popularCryptocurrencies, ...additionalCryptocurrencies].map((crypto) => (
                  <option key={crypto.symbol} value={crypto.symbol}>{crypto.name}</option>
                ))
            }
          </datalist>
        </div>
      </div>
      
      {assetType === "stocks" ? (
        <div>
          <p className="text-sm font-medium mb-2">Popular Stocks</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {popularStocks.map((stock) => (
              <Button 
                key={stock.symbol} 
                variant={selectedAsset === stock.symbol ? "default" : "outline"} 
                className="justify-center"
                onClick={() => onAssetSelect(stock.symbol)}
              >
                {stock.symbol}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium mb-2">Popular Cryptocurrencies</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {popularCryptocurrencies.map((crypto) => (
              <Button 
                key={crypto.symbol} 
                variant={selectedAsset === crypto.symbol ? "default" : "outline"} 
                className="justify-center"
                onClick={() => onAssetSelect(crypto.symbol)}
              >
                {crypto.symbol}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
