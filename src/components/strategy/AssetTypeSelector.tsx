import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { debounce } from "lodash";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [apiKey, setApiKey] = useState<string | null>(null);

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

  // Fallback local data for when API calls fail
  const allStocks = [
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

  const allCryptos = [
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

  // Get API key from Supabase
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-fmp-key', {
          method: 'GET',
        });
        
        if (data?.apiKey) {
          setApiKey(data.apiKey);
          console.log("API key retrieved successfully");
        } else {
          console.error("API key not found");
          toast({
            title: "API Key Error",
            description: "Could not retrieve API key, using fallback data",
          });
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        toast({
          title: "API Key Error",
          description: "Could not retrieve API key, using fallback data",
        });
      }
    };
    
    fetchApiKey();
  }, []);

  // Update popular assets when assetType changes
  useEffect(() => {
    setPopularAssets(assetType === "stocks" ? popularStocks : popularCryptocurrencies);
  }, [assetType]);

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
        const fmpApiKey = apiKey || "demo"; // Use actual API key or fall back to demo
        
        if (assetType === "stocks") {
          url = `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=20&exchange=NASDAQ,NYSE&apikey=${fmpApiKey}`;
        } else {
          url = `https://financialmodelingprep.com/api/v3/symbol/available-cryptocurrencies?apikey=${fmpApiKey}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        let results: Asset[] = [];
        
        if (assetType === "stocks") {
          results = data.map((item: any) => ({
            symbol: item.symbol,
            name: item.name || item.symbol
          }));
        } else {
          // Filter crypto results by query
          results = data
            .filter((item: any) => 
              item.symbol?.toLowerCase().includes(query.toLowerCase()) || 
              item.name?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 20)
            .map((item: any) => ({
              symbol: `${item.symbol}`,
              name: item.name || item.symbol
            }));
        }
        
        setSearchResults(results);

        if (results.length === 0) {
          // Fallback to local data if API returns empty results
          const localAssetsList = assetType === "stocks" ? allStocks : allCryptos;
          
          const localResults = localAssetsList.filter(asset => 
            asset.symbol.toLowerCase().includes(query.toLowerCase()) || 
            asset.name.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 20);
          
          setSearchResults(localResults);
          
          if (localResults.length > 0) {
            toast({
              title: "Using local data",
              description: "External API results unavailable, showing local matches"
            });
          }
        }
      } catch (error) {
        console.error("Error searching assets:", error);
        
        // Fall back to local data if API fails
        const localAssetsList = assetType === "stocks" ? allStocks : allCryptos;
        
        const results = localAssetsList.filter(asset => 
          asset.symbol.toLowerCase().includes(query.toLowerCase()) || 
          asset.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 20);
        
        setSearchResults(results);
        
        if (results.length > 0) {
          toast({
            title: "Using local data",
            description: "API unavailable, showing local matches"
          });
        }
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [assetType, apiKey, allStocks, allCryptos]
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
        
        <CommandDialog 
          open={isSearchOpen} 
          onOpenChange={setIsSearchOpen}
        >
          <DialogTitle className="sr-only">
            {assetType === "stocks" ? "Search Stocks" : "Search Cryptocurrencies"}
          </DialogTitle>
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
