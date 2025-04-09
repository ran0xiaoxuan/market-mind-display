
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const currentAssets = assetType === "stocks" 
    ? [...popularStocks, ...additionalStocks] 
    : [...popularCryptocurrencies, ...additionalCryptocurrencies];
  
  const popularAssets = assetType === "stocks" ? popularStocks : popularCryptocurrencies;

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
        <label htmlFor="asset-select" className="block text-sm font-medium mb-2">
          {assetType === "stocks" ? "Select a stock" : "Select a cryptocurrency pair"}
        </label>

        <div className="relative">
          <Select onValueChange={onAssetSelect} value={selectedAsset || undefined}>
            <SelectTrigger className="w-full" id="asset-select">
              <SelectValue placeholder={assetType === "stocks" 
                ? "Select a stock to trade" 
                : "Select a cryptocurrency pair to trade"} 
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{assetType === "stocks" ? "Stocks" : "Cryptocurrency Pairs"}</SelectLabel>
                {currentAssets.map((asset) => (
                  <SelectItem key={asset.symbol} value={asset.symbol}>
                    {asset.name} ({asset.symbol})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-2">
          {assetType === "stocks" ? "Popular Stocks" : "Popular Cryptocurrencies"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {popularAssets.map((asset) => (
            <Button 
              key={asset.symbol} 
              variant={selectedAsset === asset.symbol ? "default" : "outline"} 
              className="justify-center"
              onClick={() => onAssetSelect(asset.symbol)}
            >
              {asset.symbol}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};
