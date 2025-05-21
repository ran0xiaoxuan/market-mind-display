
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { debounce } from "lodash";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getFmpApiKey, searchStocks, Asset } from "@/services/assetApiService";
import { popularStocks, searchLocalAssets } from "@/data/assetData";

interface AssetTypeSelectorProps {
  selectedAsset: string;
  onAssetSelect: (symbol: string) => void;
}

export const AssetTypeSelector = ({
  selectedAsset,
  onAssetSelect
}: AssetTypeSelectorProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<Asset | null>(null);
  const [isSearchError, setIsSearchError] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch API key on component mount and retry if needed
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        const key = await getFmpApiKey();
        setApiKey(key);
        setIsApiAvailable(!!key);
        console.log("API key retrieved successfully:", !!key);
        
        // If we have a key, let's validate it with a simple search
        if (key) {
          try {
            const testResults = await searchStocks("AAPL", key);
            const isValid = Array.isArray(testResults) && testResults.length > 0;
            setIsApiAvailable(isValid);
            
            if (!isValid && retryCount < 2) {
              console.log("API key validation failed, retrying...");
              setRetryCount(prev => prev + 1);
            }
          } catch (error) {
            console.error("API key validation failed:", error);
            setIsApiAvailable(false);
          }
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        setIsApiAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, [retryCount]);

  // Set selected asset details when selectedAsset changes
  useEffect(() => {
    if (selectedAsset) {
      // First check if the asset is in the popular assets
      const assetDetails = popularStocks.find(asset => asset.symbol === selectedAsset);
      if (assetDetails) {
        setSelectedAssetDetails(assetDetails);
      } else if (searchResults.length > 0) {
        // If not in popular assets, check search results
        const assetFromResults = searchResults.find(asset => asset.symbol === selectedAsset);
        if (assetFromResults) {
          setSelectedAssetDetails(assetFromResults);
        }
      }
    } else {
      setSelectedAssetDetails(null);
    }
  }, [selectedAsset, searchResults]);

  // Search for assets with debounce
  const searchAssets = useCallback(debounce(async (query: string) => {
    // Only search if query is not empty
    if (!query || query.trim() === "") {
      setSearchResults(popularStocks); // Show popular stocks when no query
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setIsSearchError(false);
    
    try {
      // Always attempt to use the FMP API first with fresh API key
      const key = apiKey || await getFmpApiKey();
      
      if (!key) {
        throw new Error("No API key available");
      }
      
      const results = await searchStocks(query, key);
      setSearchResults(results);
      
      if (results.length === 0 && query.length > 0) {
        toast({
          title: "No Results Found",
          description: `No stocks found matching "${query}"`
        });
      }
    } catch (error) {
      console.error(`Error searching stocks:`, error);
      setIsSearchError(true);
      
      // Show error toast only if we have a query
      if (query.length > 0) {
        toast({
          title: "Search Failed",
          description: "Could not fetch live market data. Please check your connection and try again.",
          variant: "destructive"
        });
      }
      
      // Use local fallback data as last resort
      const localResults = searchLocalAssets(query);
      setSearchResults(localResults);
    } finally {
      setIsLoading(false);
    }
  }, 300), [apiKey]);

  // Reset search error state when query changes
  useEffect(() => {
    setIsSearchError(false);
  }, [searchQuery]);

  // Trigger search when query changes
  useEffect(() => {
    if (isSearchOpen) {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets]);

  // Handle search dialog open
  const handleSearchOpen = () => {
    setIsSearchOpen(true);
    
    // Try to load fresh market data for popular stocks on dialog open
    setIsLoading(true);
    if (isApiAvailable && apiKey) {
      searchStocks("", apiKey)
        .then(results => {
          if (results.length > 0) {
            setSearchResults(results);
          } else {
            setSearchResults(popularStocks);
          }
        })
        .catch(() => {
          setSearchResults(popularStocks);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSearchResults(popularStocks);
      setIsLoading(false);
    }
  };

  // Retry connecting to the FMP API
  const handleRetryApiConnection = () => {
    setRetryCount(prev => prev + 1);
    setIsApiAvailable(true); // Optimistically set to true until we know otherwise
    
    toast({
      title: "Reconnecting to Market Data",
      description: "Attempting to connect to live market data..."
    });
  };

  // Select asset and close dialog
  const handleSelectAsset = (asset: Asset) => {
    onAssetSelect(asset.symbol);
    setSelectedAssetDetails(asset);
    setIsSearchOpen(false);
  };

  return (
    <Card className="p-6 mb-10 border">
      <h2 className="text-xl font-semibold mb-2">Target Asset</h2>
      
      <div className="mb-6 relative">
        <Button 
          variant="outline" 
          className="w-full justify-start text-left font-normal h-10" 
          onClick={handleSearchOpen}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {selectedAsset ? `${selectedAsset} - ${selectedAssetDetails?.name || ''}` : "Search for a stock..."}
        </Button>
        
        <CommandDialog 
          open={isSearchOpen} 
          onOpenChange={(open) => {
            setIsSearchOpen(open);
            if (!open) {
              setTimeout(() => {
                setSearchQuery("");
                setIsSearchError(false);
              }, 100);
            }
          }}
        >
          <DialogTitle>
            Search Stocks
          </DialogTitle>
          <DialogDescription>
            {isApiAvailable 
              ? "Search for stocks by symbol or name" 
              : "Live market data currently unavailable. Using local data."}
          </DialogDescription>
          <CommandInput 
            placeholder="Type to search for stocks..." 
            value={searchQuery} 
            onValueChange={setSearchQuery} 
            autoFocus={true} 
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchQuery.trim() === "" ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Type to search for stocks
                </p>
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No stocks found
                </p>
              )}
            </CommandEmpty>
            
            {searchResults.length > 0 && (
              <CommandGroup heading={searchQuery ? "Search Results" : "Popular Stocks"}>
                {searchResults.map(asset => (
                  <CommandItem 
                    key={asset.symbol} 
                    value={`${asset.symbol} ${asset.name}`} 
                    onSelect={() => handleSelectAsset(asset)}
                  >
                    <div className="flex flex-col">
                      <span>{asset.symbol}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      </div>
      
      {!isApiAvailable && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
          <span>Using local stock data. Live market data currently unavailable.</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 flex items-center gap-1"
            onClick={handleRetryApiConnection}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}
    </Card>
  );
};
