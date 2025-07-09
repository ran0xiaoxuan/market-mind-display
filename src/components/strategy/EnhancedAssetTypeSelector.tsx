
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, RefreshCw, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { debounce } from "lodash";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  searchEnhancedAssets, 
  getEnhancedFmpApiKey, 
  validateAssetDataFreshness,
  clearAssetSearchCache,
  getCacheStats,
  EnhancedAsset,
  SearchMetadata
} from "@/services/enhancedAssetApiService";

interface EnhancedAssetTypeSelectorProps {
  selectedAsset: string;
  onAssetSelect: (symbol: string) => void;
}

export const EnhancedAssetTypeSelector = ({
  selectedAsset,
  onAssetSelect
}: EnhancedAssetTypeSelectorProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EnhancedAsset[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<EnhancedAsset | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Initialize connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setConnectionStatus('connecting');
        const key = await getEnhancedFmpApiKey();
        
        if (key) {
          setConnectionStatus('connected');
          toast.success("Enhanced market data connected");
        } else {
          setConnectionStatus('failed');
          toast.error("Market data service unavailable");
        }
      } catch (error) {
        console.error("Enhanced API connection failed:", error);
        setConnectionStatus('failed');
        toast.error("Failed to connect to market data");
      }
    };

    initializeConnection();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_asset_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load recent searches:", error);
      }
    }
  }, []);

  // Enhanced search with debounce
  const searchAssets = useCallback(debounce(async (query: string) => {
    if (connectionStatus !== 'connected') return;

    setIsLoading(true);
    
    try {
      if (query.trim().length > 0) {
        const { assets, metadata } = await searchEnhancedAssets(query);
        setSearchResults(assets);
        setSearchMetadata(metadata);

        if (assets.length === 0 && query.trim().length > 2) {
          toast.info(`No assets found matching "${query}"`);
        }
      } else {
        setSearchResults([]);
        setSearchMetadata(null);
      }
    } catch (error) {
      console.error("Enhanced search failed:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, 400), [connectionStatus]);

  // Trigger search when query changes
  useEffect(() => {
    if (isSearchOpen && connectionStatus === 'connected') {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets, connectionStatus]);

  // Save recent search
  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_asset_searches', JSON.stringify(updated));
  };

  // Handle asset selection
  const handleSelectAsset = (asset: EnhancedAsset) => {
    onAssetSelect(asset.symbol);
    setSelectedAssetDetails(asset);
    setIsSearchOpen(false);
    saveRecentSearch(asset.symbol);
  };

  // Handle search open
  const handleSearchOpen = () => {
    if (connectionStatus !== 'connected') {
      toast.error("Market data service not available");
      return;
    }
    setIsSearchOpen(true);
  };

  // Clear cache and refresh
  const handleRefreshCache = () => {
    clearAssetSearchCache();
    toast.success("Search cache cleared");
  };

  // Get cache statistics for debugging
  const cacheStats = getCacheStats();

  return (
    <Card className="p-6 mb-10 border">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Enhanced Target Asset</h2>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          {connectionStatus === 'connecting' && (
            <div className="flex items-center gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">Connecting...</span>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1 text-xs">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Enhanced data connected</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefreshCache}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          )}

          {connectionStatus === 'failed' && (
            <div className="flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-600">Connection failed</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6 relative">
        <Button 
          variant="outline" 
          className="w-full justify-start text-left font-normal h-10" 
          onClick={handleSearchOpen}
          disabled={connectionStatus !== 'connected'}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {selectedAsset ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="font-medium">{selectedAsset}</span>
              {selectedAssetDetails && (
                <>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {selectedAssetDetails.name}
                  </span>
                  {selectedAssetDetails.exchange && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedAssetDetails.exchange}
                    </Badge>
                  )}
                </>
              )}
            </div>
          ) : (
            "Search for enhanced asset data..."
          )}
        </Button>
        
        <CommandDialog 
          open={isSearchOpen} 
          onOpenChange={(open) => {
            setIsSearchOpen(open);
            if (!open) {
              setTimeout(() => {
                setSearchQuery("");
                setSearchMetadata(null);
              }, 100);
            }
          }}
        >
          <DialogTitle className="mx-[20px] my-[20px]">
            Enhanced Asset Search
          </DialogTitle>
          <DialogDescription className="mx-[20px] mb-[10px] text-sm text-muted-foreground">
            Search with enhanced ranking and real-time validation
          </DialogDescription>
          
          <CommandInput 
            placeholder="Type to search for assets..." 
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
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>Start typing to search assets</p>
                  {recentSearches.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs mb-1">Recent searches:</p>
                      <div className="flex flex-wrap gap-1">
                        {recentSearches.map(search => (
                          <Badge 
                            key={search} 
                            variant="outline" 
                            className="cursor-pointer text-xs"
                            onClick={() => setSearchQuery(search)}
                          >
                            {search}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No assets found
                </p>
              )}
            </CommandEmpty>
            
            {searchResults.length > 0 && (
              <CommandGroup heading="Search Results">
                {searchResults.map((asset) => (
                  <CommandItem 
                    key={asset.symbol} 
                    value={`${asset.symbol} ${asset.name}`} 
                    onSelect={() => handleSelectAsset(asset)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.symbol}</span>
                        {asset.exchange && (
                          <Badge variant="secondary" className="text-xs">
                            {asset.exchange}
                          </Badge>
                        )}
                        {asset.marketCap && asset.marketCap > 1000000000 && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {asset.name}
                      </span>
                      {asset.sector && (
                        <span className="text-xs text-muted-foreground">
                          {asset.sector}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {validateAssetDataFreshness(asset) && (
                        <Clock className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          
          {searchMetadata && (
            <div className="border-t p-3 text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>
                  {searchMetadata.resultCount} results in {searchMetadata.searchTime.toFixed(0)}ms
                </span>
                <span>
                  API: {searchMetadata.apiResponseTime.toFixed(0)}ms
                </span>
              </div>
            </div>
          )}
        </CommandDialog>
      </div>
      
      {connectionStatus === 'failed' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm">
          <p className="text-amber-800 dark:text-amber-300 font-medium">Enhanced market data unavailable</p>
          <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
            Please check your connection and try again. Cache stats: {cacheStats.cacheSize} entries.
          </p>
        </div>
      )}
    </Card>
  );
};
