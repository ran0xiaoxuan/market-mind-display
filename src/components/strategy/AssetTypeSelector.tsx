
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, RefreshCw, WifiOff, Wifi, AlertCircle } from "lucide-react";
import { debounce } from "lodash";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getFmpApiKey, searchStocks, validateFmpApiKey, Asset } from "@/services/assetApiService";
import { popularStocks } from "@/data/assetData";

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
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isValidationInProgress, setIsValidationInProgress] = useState(false);

  // Fetch and validate API key on component mount and retry if needed
  useEffect(() => {
    const fetchAndValidateApiKey = async () => {
      try {
        setIsValidationInProgress(true);
        console.log("Fetching and validating FMP API key...");
        
        // First, fetch the API key
        const key = await getFmpApiKey();
        setApiKey(key);
        
        if (!key) {
          console.log("No API key retrieved");
          setIsApiAvailable(false);
          return;
        }
        
        // Then validate it with a test call
        console.log("Validating API key...");
        const isValid = await validateFmpApiKey(key);
        setIsApiAvailable(isValid);
        
        if (!isValid && retryCount < 2) {
          console.log("API key validation failed, will retry");
          // Don't increase retry count here, let the button handle it
        } else if (isValid) {
          toast({
            title: "Market Data Connected",
            description: "Successfully connected to live market data.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error("Error in API key validation:", error);
        setIsApiAvailable(false);
      } finally {
        setIsValidationInProgress(false);
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
    
    // Check if the asset is in the popular assets
    const assetFromPopular = popularStocks.find(asset => asset.symbol === selectedAsset);
    if (assetFromPopular) {
      setSelectedAssetDetails(assetFromPopular);
      return;
    }
    
    // If we reach here and still don't have details, try to fetch them
    if (apiKey && isApiAvailable) {
      searchStocks(selectedAsset, apiKey).then(results => {
        const match = results.find(asset => asset.symbol === selectedAsset);
        if (match) {
          setSelectedAssetDetails(match);
        }
      });
    }
  }, [selectedAsset, searchResults, apiKey, isApiAvailable]);

  // Search for assets with debounce
  const searchAssets = useCallback(debounce(async (query: string) => {
    setIsLoading(true);
    setIsSearchError(false);
    
    try {
      // Get fresh API key if needed
      const key = apiKey || await getFmpApiKey();
      
      // Fetch results from the API service
      const results = await searchStocks(query, key);
      setSearchResults(results);
      
      // Update API status based on success
      setIsApiAvailable(!!key);
      
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
      setIsApiAvailable(false);
      
      if (query.length > 0) {
        toast({
          title: "Search Failed",
          description: "Could not fetch live market data. Using local data instead.",
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
    if (isSearchOpen) {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets]);

  // Handle search dialog open
  const handleSearchOpen = () => {
    setIsSearchOpen(true);
    setIsLoading(true);
    
    // Load initial data (popular stocks or empty query search)
    searchStocks("", apiKey)
      .then(results => {
        setSearchResults(results);
        if (results.length === 0) {
          setSearchResults(popularStocks);
        }
      })
      .catch(() => {
        setSearchResults(popularStocks);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Retry connecting to the FMP API
  const handleRetryApiConnection = () => {
    setRetryCount(prev => prev + 1);
    setIsApiAvailable(null); // Set to null while checking
    
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

  return (
    <Card className="p-6 mb-10 border">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Target Asset</h2>
        
        {isApiAvailable !== null && (
          <div className="flex items-center gap-1 text-xs">
            {isApiAvailable ? (
              <span className="flex items-center text-green-600 gap-1">
                <Wifi className="h-3 w-3" />
                Live Market Data
              </span>
            ) : (
              <span className="flex items-center text-amber-600 gap-1">
                <WifiOff className="h-3 w-3" />
                Local Data 
              </span>
            )}
          </div>
        )}
      </div>
      
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
          <DialogDescription className="flex items-center gap-2">
            {isApiAvailable === null ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking market data availability...
              </span>
            ) : isApiAvailable ? (
              <span className="flex items-center text-green-600 gap-1">
                <Wifi className="h-3 w-3" />
                Using live market data
              </span>
            ) : (
              <span className="flex items-center text-amber-600 gap-1">
                <WifiOff className="h-3 w-3" />
                Using local data - live market data unavailable
              </span>
            )}
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
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {asset.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      </div>
      
      {isApiAvailable === false && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 dark:text-amber-300 font-medium">Market data unavailable</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Using local stock data. Connect to live market data for real-time information.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 h-7 text-xs border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900"
              onClick={handleRetryApiConnection}
              disabled={isValidationInProgress}
            >
              {isValidationInProgress ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Connection
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
