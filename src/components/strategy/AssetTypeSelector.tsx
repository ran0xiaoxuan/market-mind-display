
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
import { 
  getFmpApiKey, 
  searchStocks, 
  searchCryptocurrencies,
  Asset
} from "@/services/assetApiService";
import { 
  popularStocks, 
  popularCryptocurrencies, 
  searchLocalAssets 
} from "@/data/assetData";

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
  const [apiRetries, setApiRetries] = useState(0);
  const [useLocalData, setUseLocalData] = useState(false);

  // Fetch API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getFmpApiKey();
        
        if (key) {
          setApiKey(key);
          console.log("API key retrieved successfully");
          setUseLocalData(false);
        } else {
          console.error("API key not found");
          toast({
            title: "API Key Error",
            description: "Using local data for search results",
          });
          setUseLocalData(true);
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        toast({
          title: "API Key Error",
          description: "Using local data for search results",
        });
        setUseLocalData(true);
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
      // Allow empty queries to show popular results
      if (!query) {
        setSearchResults(popularAssets);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        // Always check local data first for immediate feedback
        const localResults = searchLocalAssets(query, assetType);
        
        // If we have local results, show them immediately
        if (localResults.length > 0) {
          setSearchResults(localResults);
        } else {
          // If no local results, show popular assets until API results come in
          setSearchResults(popularAssets);
        }
        
        // If using local data only, we're done
        if (useLocalData) {
          setIsLoading(false);
          return;
        }
        
        // Otherwise try to fetch from API
        if (!apiKey) {
          throw new Error("API key not available");
        }
        
        let apiResults: Asset[] = [];
        
        if (assetType === "stocks") {
          apiResults = await searchStocks(query, apiKey);
        } else {
          apiResults = await searchCryptocurrencies(query, apiKey);
        }
        
        // If we got API results, use those (they're more accurate/complete)
        if (apiResults.length > 0) {
          setSearchResults(apiResults);
        }
        // If API returned no results but we had local results, keep using those
        
      } catch (error) {
        console.error(`Error searching ${assetType}:`, error);
        
        // Retry with new API key if possible
        if (apiRetries < 2) {
          setApiRetries(prev => prev + 1);
          const newKey = await getFmpApiKey();
          if (newKey && newKey !== apiKey) {
            setApiKey(newKey);
            // Don't show toast here, we'll retry the search
          } else {
            setUseLocalData(true);
            toast({
              title: "API Search Failed",
              description: "Using local data for search results"
            });
          }
        }
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [assetType, apiKey, useLocalData, apiRetries, popularAssets]
  );

  // Trigger search when query changes or search dialog opens
  useEffect(() => {
    if (isSearchOpen) {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets]);

  // Handle search dialog open
  const handleSearchOpen = () => {
    setIsSearchOpen(true);
    // If there's already a query, trigger search immediately
    searchAssets(searchQuery);
  };

  // Select asset and close dialog
  const handleSelectAsset = (asset: Asset) => {
    onAssetSelect(asset.symbol);
    setIsSearchOpen(false);
    setSearchQuery(""); // Clear the search query when an item is selected
  };

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
          onClick={handleSearchOpen}
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
          onOpenChange={(open) => {
            setIsSearchOpen(open);
            if (!open) {
              // Don't clear search query immediately to allow selection to process
            }
          }}
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
                  value={asset.symbol} // Set the value to be matched against the search
                  onSelect={() => handleSelectAsset(asset)}
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
