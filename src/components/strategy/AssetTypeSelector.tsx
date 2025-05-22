import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { debounce } from "lodash";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getFmpApiKey, searchStocks, validateFmpApiKey, Asset } from "@/services/assetApiService";
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
  const [isConnecting, setIsConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch and validate API key on component mount and retry if needed
  useEffect(() => {
    const fetchAndValidateApiKey = async () => {
      try {
        setIsConnecting(true);
        console.log("Fetching and validating FMP API key...");

        // First, fetch the API key
        const key = await getFmpApiKey();
        setApiKey(key);
        if (!key) {
          console.log("No API key retrieved");
          throw new Error("Could not retrieve market data API key");
        }

        // Then validate it with a test call
        console.log("Validating API key...");
        const isValid = await validateFmpApiKey(key);
        if (!isValid) {
          console.log("API key validation failed");
          throw new Error("Market data API key validation failed");
        }
        toast({
          title: "Market Data Connected",
          description: "Successfully connected to live market data.",
          variant: "default"
        });
      } catch (error) {
        console.error("Error in API key validation:", error);
        toast({
          title: "Market Data Connection Issue",
          description: "Could not connect to market data service. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsConnecting(false);
      }
    };
    fetchAndValidateApiKey();
  }, [retryCount]);

  // Set selected asset details when selectedAsset changes
  useEffect(() => {
    if (!selectedAsset) {
      setSelectedAssetDetails(null);
      return;
    }

    // Check if the asset is in the search results
    const assetFromResults = searchResults.find(asset => asset.symbol === selectedAsset);
    if (assetFromResults) {
      setSelectedAssetDetails(assetFromResults);
      return;
    }

    // If we reach here and still don't have details, try to fetch them
    if (apiKey) {
      searchStocks(selectedAsset, apiKey).then(results => {
        const match = results.find(asset => asset.symbol === selectedAsset);
        if (match) {
          setSelectedAssetDetails(match);
        }
      });
    }
  }, [selectedAsset, searchResults, apiKey]);

  // Search for assets with debounce
  const searchAssets = useCallback(debounce(async (query: string) => {
    setIsLoading(true);
    setIsSearchError(false);
    try {
      // Get fresh API key if needed
      const key = apiKey || (await getFmpApiKey());
      if (!key) {
        throw new Error("Could not retrieve market data API key");
      }

      // Fetch results from the API service
      const results = await searchStocks(query, key);
      setSearchResults(results);

      // Show toast for no results
      if (results.length === 0 && query.length > 0) {
        toast({
          title: "No Results Found",
          description: `No stocks found matching "${query}"`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error(`Error searching stocks:`, error);
      setIsSearchError(true);
      if (query.length > 0) {
        toast({
          title: "Search Failed",
          description: "Could not fetch market data. Please try again.",
          variant: "destructive"
        });
      }
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
    if (isSearchOpen && apiKey) {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets, apiKey]);

  // Handle search dialog open
  const handleSearchOpen = async () => {
    setIsSearchOpen(true);
    setIsLoading(true);
    try {
      // Ensure we have an API key
      const key = apiKey || (await getFmpApiKey());
      if (!key) {
        throw new Error("Could not retrieve market data API key");
      }

      // Load initial market data
      const results = await searchStocks("", key);
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: "No Data Available",
          description: "Could not load initial market data. Please try searching for a specific stock.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error loading initial market data:", error);
      setIsSearchError(true);
      toast({
        title: "Market Data Unavailable",
        description: "Could not connect to market data service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Retry connecting to the FMP API
  const handleRetryConnection = () => {
    setRetryCount(prev => prev + 1);
    setIsConnecting(true);
    toast({
      title: "Reconnecting to Market Data",
      description: "Attempting to connect to live market data...",
      variant: "default"
    });
  };

  // Select asset and close dialog
  const handleSelectAsset = (asset: Asset) => {
    onAssetSelect(asset.symbol);
    setSelectedAssetDetails(asset);
    setIsSearchOpen(false);
  };
  return <Card className="p-6 mb-10 border">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Target Asset</h2>
        
        {isConnecting ? <div className="flex items-center gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-muted-foreground">Connecting to market data...</span>
          </div> : null}
      </div>
      
      <div className="mb-6 relative">
        {isConnecting ? <Button variant="outline" className="w-full justify-start text-left font-normal h-10" disabled>
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
            Connecting to market data...
          </Button> : <Button variant="outline" className="w-full justify-start text-left font-normal h-10" onClick={handleSearchOpen}>
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {selectedAsset ? `${selectedAsset} - ${selectedAssetDetails?.name || ''}` : "Search for a stock..."}
          </Button>}
        
        <CommandDialog open={isSearchOpen} onOpenChange={open => {
        setIsSearchOpen(open);
        if (!open) {
          setTimeout(() => {
            setSearchQuery("");
            setIsSearchError(false);
          }, 100);
        }
      }}>
          <DialogTitle>
            Search Stocks
          </DialogTitle>
          
          <CommandInput placeholder="Type to search for stocks..." value={searchQuery} onValueChange={setSearchQuery} autoFocus={true} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div> : searchQuery.trim() === "" ? <p className="p-4 text-center text-sm text-muted-foreground">
                  Type to search for stocks
                </p> : <p className="p-4 text-center text-sm text-muted-foreground">
                  No stocks found
                </p>}
            </CommandEmpty>
            
            {searchResults.length > 0 && <CommandGroup heading={searchQuery ? "Search Results" : "Popular Stocks"}>
                {searchResults.map(asset => <CommandItem key={asset.symbol} value={`${asset.symbol} ${asset.name}`} onSelect={() => handleSelectAsset(asset)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {asset.name}
                      </span>
                    </div>
                  </CommandItem>)}
              </CommandGroup>}
          </CommandList>
        </CommandDialog>
      </div>
      
      {isSearchError && <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm flex items-start gap-2">
          <div>
            <p className="text-amber-800 dark:text-amber-300 font-medium">Market data unavailable</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Unable to connect to market data service. Please check your connection and try again.
            </p>
            <Button variant="outline" size="sm" className="mt-2 h-7 text-xs border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900" onClick={handleRetryConnection} disabled={isConnecting}>
              {isConnecting ? <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Connecting...
                </> : <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Connection
                </>}
            </Button>
          </div>
        </div>}
    </Card>;
};