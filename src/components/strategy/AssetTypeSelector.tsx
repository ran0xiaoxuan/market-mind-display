
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { debounce } from "lodash";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getFmpApiKey, searchStocks, Asset } from "@/services/assetApiService";
import { popularStocks, searchLocalAssets } from "@/data/assetData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [isShowingPopular, setIsShowingPopular] = useState(false);
  const [apiKeyRetries, setApiKeyRetries] = useState(0);

  // Fetch API key on component mount with retry logic
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        console.log(`Attempting to fetch API key (attempt ${apiKeyRetries + 1})`);
        const key = await getFmpApiKey();
        
        if (key) {
          setApiKey(key);
          setIsConnectionError(false);
          console.log("API key retrieved successfully");
        } else {
          console.error("API key not found");
          
          // Only show connection error toast after a couple retries
          if (apiKeyRetries >= 1) {
            setIsConnectionError(true);
            toast({
              title: "Using Local Stock Data",
              description: "Connection to stock API unavailable. Using local data instead.",
            });
          } else {
            // Retry after a delay (only retry once)
            if (apiKeyRetries < 2) {
              setTimeout(() => {
                setApiKeyRetries(prev => prev + 1);
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        setIsConnectionError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, [apiKeyRetries]);

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
      if (isSearchOpen) {
        // Show popular stocks when search is empty
        setSearchResults(popularStocks);
        setIsShowingPopular(true);
      } else {
        setSearchResults([]);
      }
      setIsLoading(false);
      return;
    }
    
    setIsShowingPopular(false);
    setIsLoading(true);
    setIsSearchError(false);
    
    try {
      // If connection error, directly use local assets
      if (isConnectionError) {
        const localResults = searchLocalAssets(query);
        setSearchResults(localResults);
        setIsLoading(false);
        return;
      }
      
      // If no API key, try to fetch it
      if (!apiKey) {
        try {
          const key = await getFmpApiKey();
          if (key) {
            setApiKey(key);
          } else {
            throw new Error("No API key available");
          }
        } catch (error) {
          console.error("Error fetching API key:", error);
          setIsConnectionError(true);
          const localResults = searchLocalAssets(query);
          setSearchResults(localResults);
          setIsLoading(false);
          return;
        }
      }

      // Search stocks
      const stockResults = await searchStocks(query, apiKey || "");
      setSearchResults(stockResults);
      if (stockResults.length === 0 && query.length > 0 && !isSearchError) {
        toast({
          title: "No Results Found",
          description: `No stocks found matching "${query}"`
        });
      }
    } catch (error) {
      console.error(`Error searching stocks:`, error);
      if (isSearchError) {
        // Skip showing another error toast if we already showed one
        return;
      }
      
      setIsSearchError(true);
      setIsConnectionError(true);

      // Use local fallback data
      const localResults = searchLocalAssets(query);
      setSearchResults(localResults);
      
      toast({
        title: "Using Local Data",
        description: "Using local stock database due to connection issues",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  }, 300), [apiKey, isSearchError, isConnectionError, isSearchOpen]);

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
    setSearchQuery("");
    // Show popular stocks immediately when opening
    setSearchResults(popularStocks);
    setIsShowingPopular(true);
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
        
        {isConnectionError && (
          <Alert variant="default" className="mt-3 bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription className="text-sm">
              Using local stock database. Some stocks may not be available.
            </AlertDescription>
          </Alert>
        )}
        
        <CommandDialog 
          open={isSearchOpen} 
          onOpenChange={open => {
            setIsSearchOpen(open);
            if (!open) {
              // Clear the search query when closing the dialog
              setTimeout(() => {
                setSearchQuery("");
                setIsSearchError(false);
              }, 100);
            }
          }}
        >
          <DialogTitle>Search Stocks</DialogTitle>
          <DialogDescription>Search for stocks by name or ticker symbol</DialogDescription>
          <CommandInput 
            placeholder="Type to search for stocks..." 
            value={searchQuery} 
            onValueChange={setSearchQuery} 
            autoFocus={true} 
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div> 
              : searchQuery.trim() === "" ? 
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Type to search for stocks
                </p> 
              : 
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No stocks found
                </p>
              }
            </CommandEmpty>
            
            {searchResults.length > 0 && (
              <CommandGroup heading={isShowingPopular ? "Popular Stocks" : "Search Results"}>
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
    </Card>
  );
};
