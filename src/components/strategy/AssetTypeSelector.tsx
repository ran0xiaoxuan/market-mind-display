
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, RefreshCw, Clock } from "lucide-react";
import { debounce } from "lodash";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getFmpApiKey, searchStocks, validateFmpApiKey, Asset } from "@/services/assetApiService";

interface AssetTypeSelectorProps {
  selectedAsset: string;
  onAssetSelect: (symbol: string) => void;
}

interface MarketStatus {
  isOpen: boolean;
  nextOpen?: string;
  marketHours?: {
    open: string;
    close: string;
  };
  lastUpdated: string;
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
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [hasShownConnectionToast, setHasShownConnectionToast] = useState(false);
  
  // Market status state
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [isMarketStatusLoading, setIsMarketStatusLoading] = useState(false);

  // Enhanced market status fetch with better error handling
  const fetchMarketStatus = useCallback(async () => {
    if (!apiKey || connectionStatus !== 'connected') return;

    setIsMarketStatusLoading(true);
    try {
      console.log("Fetching enhanced market status...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/market-hours?apikey=${apiKey}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'TradingApp/1.0'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Market status API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Enhanced market status processing
        if (data && typeof data === 'object') {
          const now = new Date();
          const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
          const dayOfWeek = estTime.getDay();
          const hour = estTime.getHours();
          const minute = estTime.getMinutes();
          
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          const timeInMinutes = hour * 60 + minute;
          const marketOpenMinutes = 9 * 60 + 30;
          const marketCloseMinutes = 16 * 60;
          const isMarketHours = timeInMinutes >= marketOpenMinutes && timeInMinutes < marketCloseMinutes;
          
          const isOpen = isWeekday && isMarketHours;
          
          // Calculate next market open with better formatting
          let nextOpen = '';
          if (!isOpen) {
            const nextMarketDay = new Date(estTime);
            if (!isWeekday || timeInMinutes >= marketCloseMinutes) {
              do {
                nextMarketDay.setDate(nextMarketDay.getDate() + 1);
              } while (nextMarketDay.getDay() === 0 || nextMarketDay.getDay() === 6);
            }
            nextMarketDay.setHours(9, 30, 0, 0);
            
            const isToday = nextMarketDay.toDateString() === estTime.toDateString();
            const isTomorrow = nextMarketDay.toDateString() === new Date(estTime.getTime() + 24 * 60 * 60 * 1000).toDateString();
            
            let dayText = '';
            if (isToday) dayText = 'Today';
            else if (isTomorrow) dayText = 'Tomorrow';
            else dayText = nextMarketDay.toLocaleDateString('en-US', { weekday: 'long' });
            
            const timeText = nextMarketDay.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              timeZoneName: 'short',
              timeZone: 'America/New_York'
            });
            
            nextOpen = `${dayText} at ${timeText}`;
          }
          
          setMarketStatus({
            isOpen,
            nextOpen: isOpen ? undefined : nextOpen,
            marketHours: {
              open: '9:30 AM ET',
              close: '4:00 PM ET'
            },
            lastUpdated: new Date().toISOString()
          });
          
          console.log(`Enhanced market status - Open: ${isOpen}, Next: ${nextOpen}`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error("Enhanced market status fetch failed:", error);
      // Fallback to basic calculation
      const now = new Date();
      const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const dayOfWeek = estTime.getDay();
      const hour = estTime.getHours();
      const minute = estTime.getMinutes();
      
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const timeInMinutes = hour * 60 + minute;
      const marketOpenMinutes = 9 * 60 + 30;
      const marketCloseMinutes = 16 * 60;
      const isOpen = isWeekday && timeInMinutes >= marketOpenMinutes && timeInMinutes < marketCloseMinutes;
      
      setMarketStatus({
        isOpen,
        marketHours: {
          open: '9:30 AM ET',
          close: '4:00 PM ET'
        },
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setIsMarketStatusLoading(false);
    }
  }, [apiKey, connectionStatus]);

  // Enhanced search with better error handling and validation
  const searchAssets = useCallback(debounce(async (query: string) => {
    if (connectionStatus !== 'connected' || !apiKey) {
      console.log("Cannot search: API not connected");
      return;
    }

    setIsLoading(true);
    setIsSearchError(false);
    
    try {
      if (query.trim().length > 0) {
        console.log(`[AssetAPI] Enhanced search for: "${query}"`);
        const startTime = performance.now();
        
        const results = await searchStocks(query, apiKey);
        
        const searchTime = performance.now() - startTime;
        console.log(`[AssetAPI] Search completed in ${searchTime.toFixed(2)}ms`);
        
        // Enhanced result validation
        const validatedResults = results.filter(asset => 
          asset.symbol && 
          asset.name && 
          asset.symbol.length <= 10 &&
          !asset.symbol.includes('.')
        );
        
        setSearchResults(validatedResults);

        if (validatedResults.length === 0 && query.trim().length > 2) {
          toast.info(`No stocks found matching "${query}"`, {
            description: "Try a different search term or check the spelling"
          });
        } else if (validatedResults.length > 0) {
          toast.success(`Found ${validatedResults.length} matching assets`, {
            description: `Search completed in ${searchTime.toFixed(0)}ms`
          });
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Enhanced search failed:", error);
      setIsSearchError(true);
      
      // More specific error handling
      if (error.message?.includes("timeout")) {
        toast.error("Search timed out", {
          description: "The search took too long. Please try again."
        });
      } else if (error.message?.includes("401") || error.message?.includes("403")) {
        toast.error("API access denied", {
          description: "There may be an issue with the market data service."
        });
      } else {
        toast.error("Search failed", {
          description: "Please check your connection and try again."
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, 400), [apiKey, connectionStatus]);

  // Initialize market status and set up periodic updates
  useEffect(() => {
    if (connectionStatus === 'connected' && apiKey) {
      fetchMarketStatus();
      
      // Update market status every 2 minutes
      const interval = setInterval(fetchMarketStatus, 120000);
      
      return () => clearInterval(interval);
    }
  }, [fetchMarketStatus, connectionStatus, apiKey]);

  // Single connection attempt with better error handling
  useEffect(() => {
    let isCancelled = false;

    const initializeConnection = async () => {
      if (connectionStatus === 'connected') return;

      try {
        setIsConnecting(true);
        setConnectionStatus('connecting');
        console.log("Initializing FMP API connection...");

        // Fetch API key with timeout
        const key = await getFmpApiKey();
        if (isCancelled) return;
        
        if (!key) {
          throw new Error("Could not retrieve market data API key");
        }

        setApiKey(key);
        console.log("API key retrieved, validating...");

        // Validate with longer timeout and retry logic
        const isValid = await validateFmpApiKey(key);
        if (isCancelled) return;

        if (isValid) {
          setConnectionStatus('connected');
          if (!hasShownConnectionToast) {
            toast.success("Market data connected successfully");
            setHasShownConnectionToast(true);
          }
          console.log("FMP API connection successful");
        } else {
          throw new Error("API key validation failed");
        }
      } catch (error) {
        if (isCancelled) return;
        
        console.error("FMP API connection failed:", error);
        setConnectionStatus('failed');
        
        if (!hasShownConnectionToast) {
          toast.error("Market data service unavailable", {
            description: "Please check your connection and try again"
          });
          setHasShownConnectionToast(true);
        }
      } finally {
        if (!isCancelled) {
          setIsConnecting(false);
        }
      }
    };

    initializeConnection();

    return () => {
      isCancelled = true;
    };
  }, [connectionStatus, hasShownConnectionToast]);

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

    // If we have a valid connection, try to fetch asset details
    if (connectionStatus === 'connected' && apiKey) {
      searchStocks(selectedAsset, apiKey).then(results => {
        const match = results.find(asset => asset.symbol === selectedAsset);
        if (match) {
          setSelectedAssetDetails(match);
        }
      }).catch(error => {
        console.error("Error fetching asset details:", error);
      });
    }
  }, [selectedAsset, searchResults, apiKey, connectionStatus]);

  // Reset search error state when query changes
  useEffect(() => {
    setIsSearchError(false);
  }, [searchQuery]);

  // Trigger search when query changes
  useEffect(() => {
    if (isSearchOpen && connectionStatus === 'connected') {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets, connectionStatus]);

  // Handle search dialog open
  const handleSearchOpen = async () => {
    if (connectionStatus !== 'connected') {
      toast.error("Market data service not available");
      return;
    }
    
    setIsSearchOpen(true);
    setIsLoading(!!searchQuery.trim().length);
    setSearchResults([]);
  };

  // Retry connection
  const handleRetryConnection = () => {
    setConnectionStatus('connecting');
    setHasShownConnectionToast(false);
    setIsConnecting(true);
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
        
        <div className="flex items-center gap-4">
          {/* Enhanced Market Status Display */}
          {marketStatus && (
            <div className="flex items-center gap-1 text-xs">
              {isMarketStatusLoading ? (
                <>
                  <Loader2 className="h-2 w-2 animate-spin" />
                  <span className="text-muted-foreground">Updating...</span>
                </>
              ) : (
                <>
                  <div className={`h-2 w-2 rounded-full ${marketStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-muted-foreground">
                    {marketStatus.isOpen ? 'US Market Open' : 'US Market Closed'}
                  </span>
                  {!marketStatus.isOpen && marketStatus.nextOpen && (
                    <div className="flex items-center gap-1 ml-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-muted-foreground">
                        Opens {marketStatus.nextOpen}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Enhanced Connection Status */}
          {isConnecting && (
            <div className="flex items-center gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">Connecting to enhanced data...</span>
            </div>
          )}

          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1 text-xs">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-muted-foreground">Enhanced market data connected</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6 relative">
        {connectionStatus === 'connecting' ? (
          <Button variant="outline" className="w-full justify-start text-left font-normal h-10" disabled>
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
            Connecting to enhanced market data...
          </Button>
        ) : connectionStatus === 'failed' ? (
          <Button variant="outline" className="w-full justify-start text-left font-normal h-10" disabled>
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            Enhanced market data unavailable
          </Button>
        ) : (
          <Button variant="outline" className="w-full justify-start text-left font-normal h-10" onClick={handleSearchOpen}>
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {selectedAsset ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedAsset}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-sm text-muted-foreground">
                  {selectedAssetDetails?.name || 'Loading details...'}
                </span>
              </div>
            ) : (
              "Search for stocks with enhanced data..."
            )}
          </Button>
        )}
        
        <CommandDialog open={isSearchOpen} onOpenChange={(open) => {
          setIsSearchOpen(open);
          if (!open) {
            setTimeout(() => {
              setSearchQuery("");
              setIsSearchError(false);
            }, 100);
          }
        }}>
          <DialogTitle className="mx-[20px] my-[20px]">Target Asset</DialogTitle>
          
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
                <p className="p-4 text-center text-sm text-muted-foreground">Results will be shown here.</p>
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No stocks found
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
      
      {connectionStatus === 'failed' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 text-sm flex items-start gap-2">
          <div>
            <p className="text-amber-800 dark:text-amber-300 font-medium">Enhanced market data unavailable</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Unable to connect to enhanced market data service. Falling back to basic search if available.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 h-7 text-xs border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900" 
              onClick={handleRetryConnection} 
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Enhanced Connection
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
