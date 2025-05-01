
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { debounce } from "lodash";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popularAssets, setPopularAssets] = useState<Asset[]>([]);

  // Define the initial popular assets
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

  // Update popular assets when assetType changes
  useEffect(() => {
    setPopularAssets(assetType === "stocks" ? popularStocks : popularCryptocurrencies);
  }, [assetType]);

  // API key for Financial Modeling Prep API
  const FMP_API_KEY = "demo"; // Replace with actual API key for production

  // Search for assets with debounce
  const searchAssets = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        let url = "";
        
        if (assetType === "stocks") {
          url = `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=20&exchange=NASDAQ,NYSE&apikey=${FMP_API_KEY}`;
        } else {
          url = `https://financialmodelingprep.com/api/v3/symbol/available-cryptocurrencies?apikey=${FMP_API_KEY}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        let results: Asset[] = [];
        
        if (assetType === "stocks") {
          results = data.map((item: any) => ({
            symbol: item.symbol,
            name: item.name
          }));
        } else {
          // Filter crypto results by query
          results = data
            .filter((item: any) => 
              item.symbol.toLowerCase().includes(query.toLowerCase()) || 
              item.name.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 20)
            .map((item: any) => ({
              symbol: `${item.symbol}/USDT`,
              name: `${item.name}/USDT`
            }));
        }
        
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching assets:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [assetType]
  );

  useEffect(() => {
    if (isSearchOpen) {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets]);

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

        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal h-10"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {selectedAsset 
            ? `${selectedAsset} - ${popularAssets.find(a => a.symbol === selectedAsset)?.name || searchResults.find(a => a.symbol === selectedAsset)?.name || ''}`
            : assetType === "stocks" 
              ? "Search for a stock..."
              : "Search for a cryptocurrency..."
          }
        </Button>
        
        <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <CommandInput 
            placeholder={assetType === "stocks" ? "Search all US stocks..." : "Search cryptocurrencies..."} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No assets found.
                </p>
              )}
            </CommandEmpty>
            <CommandGroup heading="Search Results">
              {searchResults.map((asset) => (
                <CommandItem
                  key={asset.symbol}
                  onSelect={() => {
                    onAssetSelect(asset.symbol);
                    setIsSearchOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span>{asset.symbol}</span>
                    <span className="text-xs text-muted-foreground">{asset.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
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
