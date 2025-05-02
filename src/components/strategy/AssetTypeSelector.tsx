import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { debounce } from "lodash";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getFmpApiKey, searchStocks, searchCryptocurrencies, Asset } from "@/services/assetApiService";
import { popularStocks, popularCryptocurrencies } from "@/data/assetData";
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
  const [popularAssets, setPopularAssets] = useState<Asset[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<Asset | null>(null);
  const [isSearchError, setIsSearchError] = useState(false);

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

  // Initialize popular assets with both stocks and cryptocurrencies
  useEffect(() => {
    setPopularAssets([...popularStocks, ...popularCryptocurrencies]);
  }, []);

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
  const searchAssets = useCallback(debounce(async (query: string) => {
    // Allow empty queries to show popular results
    if (!query) {
      setSearchResults(popularAssets);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setIsSearchError(false);
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

      // Search both stocks and crypto and combine results
      const stockResults = await searchStocks(query, apiKey || "");
      const cryptoResults = await searchCryptocurrencies(query, apiKey || "");
      const combinedResults = [...stockResults, ...cryptoResults];
      setSearchResults(combinedResults);
      if (combinedResults.length === 0 && query.length > 0 && !isSearchError) {
        toast({
          title: "No Results Found",
          description: `No assets found matching "${query}"`
        });
      }
    } catch (error) {
      console.error(`Error searching assets:`, error);
      if (isSearchError) {
        // Skip showing another error toast if we already showed one
        return;
      }
      setIsSearchError(true);

      // Attempt to get a fresh API key and retry
      try {
        const newKey = await getFmpApiKey();
        if (newKey && newKey !== apiKey) {
          setApiKey(newKey);

          // Retry the search with the new key
          const retryStockResults = await searchStocks(query, newKey);
          const retryCryptoResults = await searchCryptocurrencies(query, newKey);
          const retryCombinedResults = [...retryStockResults, ...retryCryptoResults];
          setSearchResults(retryCombinedResults);
          if (retryCombinedResults.length === 0 && query.length > 0) {
            toast({
              title: "No Results Found",
              description: `No assets found matching "${query}"`
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
  }, 300), [apiKey, popularAssets, isSearchError]);

  // Reset search error state when query changes
  useEffect(() => {
    setIsSearchError(false);
  }, [searchQuery]);

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
  return <Card className="p-6 mb-10 border">
      <h2 className="text-xl font-semibold mb-2">Select Asset</h2>
      <p className="text-sm text-muted-foreground mb-4">Choose the asset you want to trade</p>
      
      <div className="mb-6 relative">
        <label htmlFor="asset-select" className="block text-sm font-medium mb-2">
          Select an asset (stocks or cryptocurrencies)
        </label>

        <Button variant="outline" className="w-full justify-start text-left font-normal h-10" onClick={handleSearchOpen}>
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {selectedAsset ? `${selectedAsset} - ${selectedAssetDetails?.name || ''}` : "Search for stocks or cryptocurrencies..."}
        </Button>
        
        <CommandDialog open={isSearchOpen} onOpenChange={open => {
        setIsSearchOpen(open);
        if (!open) {
          // Clear the search query when closing the dialog
          setTimeout(() => {
            setSearchQuery("");
            setIsSearchError(false);
          }, 100);
        }
      }}>
          <DialogTitle className="sr-only">
            Search Assets
          </DialogTitle>
          <CommandInput placeholder="Search for stocks or cryptocurrencies..." value={searchQuery} onValueChange={setSearchQuery} autoFocus={true} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div> : <p className="p-4 text-center text-sm text-muted-foreground">
                  No assets found.
                </p>}
            </CommandEmpty>
            <CommandGroup heading="Search Results">
              {searchResults.map(asset => <CommandItem key={asset.symbol} value={`${asset.symbol} ${asset.name}`} onSelect={() => handleSelectAsset(asset)}>
                  <div className="flex flex-col">
                    <span>{asset.symbol}</span>
                    <span className="text-xs text-muted-foreground">{asset.name}</span>
                  </div>
                </CommandItem>)}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
      
      
    </Card>;
};