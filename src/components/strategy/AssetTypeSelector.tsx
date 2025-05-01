
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
  popularCryptocurrencies
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
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<Asset | null>(null);

  // Fetch API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        const key = await getFmpApiKey();
        
        if (key) {
          setApiKey(key);
          console.log("API key retrieved successfully");
        } else {
          console.error("API key not found");
          toast({
            title: "API Connection Issue",
            description: "Unable to connect to financial data service",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, []);

  // Update popular assets when assetType changes
  useEffect(() => {
    setPopularAssets(assetType === "stocks" ? popularStocks : popularCryptocurrencies);
  }, [assetType]);
  
  // Set selected asset details when selectedAsset changes
  useEffect(() => {
    if (selectedAsset) {
      // First check if the asset is in the popular assets
      const assetDetails = popularAssets.find(asset => asset.symbol === selectedAsset);
      
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
  }, [selectedAsset, popularAssets, searchResults]);

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
        // If no API key, try to fetch it
        if (!apiKey) {
          const key = await getFmpApiKey();
          if (key) {
            setApiKey(key);
          } else {
            throw new Error("No API key available");
          }
        }
        
        let results: Asset[] = [];
        
        if (assetType === "stocks") {
          results = await searchStocks(query, apiKey || "");
        } else {
          results = await searchCryptocurrencies(query, apiKey || "");
        }
        
        setSearchResults(results);
        
        if (results.length === 0 && query.length > 0) {
          toast({
            title: "No Results Found",
            description: `No ${assetType} found matching "${query}"`
          });
        }
      } catch (error) {
        console.error(`Error searching ${assetType}:`, error);
        
        // Attempt to get a fresh API key and retry
        try {
          const newKey = await getFmpApiKey();
          if (newKey && newKey !== apiKey) {
            setApiKey(newKey);
            
            // Retry the search with the new key
            let retryResults: Asset[] = [];
            if (assetType === "stocks") {
              retryResults = await searchStocks(query, newKey);
            } else {
              retryResults = await searchCryptocurrencies(query, newKey);
            }
            
            setSearchResults(retryResults);
            
            if (retryResults.length === 0 && query.length > 0) {
              toast({
                title: "No Results Found",
                description: `No ${assetType} found matching "${query}"`
              });
            }
          }
        } catch (retryError) {
          console.error("Retry search failed:", retryError);
          
          // Show error toast only if we have a query
          if (query.length > 0) {
            toast({
              title: "Search Failed",
              description: "Could not connect to financial data service",
              variant: "destructive"
            });
          }
          
          // As a fallback, set popular assets
          setSearchResults(popularAssets);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [assetType, apiKey, popularAssets]
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
    searchAssets(searchQuery);
  };

  // Select asset and close dialog
  const handleSelectAsset = (asset: Asset) => {
    onAssetSelect(asset.symbol);
    setSelectedAssetDetails(asset);
    setIsSearchOpen(false);
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
            ? `${selectedAsset} - ${selectedAssetDetails?.name || ''}`
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
              // Clear the search query when closing the dialog
              setTimeout(() => {
                setSearchQuery("");
              }, 100);
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
            autoFocus={true}
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
