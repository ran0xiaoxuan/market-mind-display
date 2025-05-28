import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, fetchPublicRecommendedStrategies } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Trash, Star, Eye, Info, BookOpen, Shield, ListOrdered, Check, Search, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { StrategySelect } from "@/components/backtest/StrategySelect";
import { Strategy } from "@/services/strategyService";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getStrategyApplyCounts, trackStrategyApplication } from "@/services/recommendationService";

// Define a recommended strategy type that matches Supabase's snake_case format
interface RecommendedStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  timeframe: string;
  target_asset: string | null;
  target_asset_name: string | null;
  created_at: string;
  updated_at: string;
  stop_loss: string | null;
  take_profit: string | null;
  single_buy_volume: string | null;
  max_buy_volume: string | null;
  recommendation_count?: number;
  rating?: number;
  is_public?: boolean;
  is_official?: boolean;
}

// Define an interface for the data structure returned by Supabase for joined queries
interface RecommendedStrategyRecord {
  id: string;
  strategy_id: string;
  recommended_by: string;
  is_official: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  strategies: {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    timeframe: string;
    target_asset: string | null;
    target_asset_name: string | null;
    created_at: string;
    updated_at: string;
    stop_loss: string | null;
    take_profit: string | null;
    single_buy_volume: string | null;
    max_buy_volume: string | null;
  };
}
type SortOption = 'name' | 'created' | 'updated' | 'apply_count';
type SortDirection = 'asc' | 'desc';
const Recommendations = () => {
  const [strategies, setStrategies] = useState<RecommendedStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("apply_count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<RecommendedStrategy | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [applyCounts, setApplyCounts] = useState<Map<string, number>>(new Map());
  const {
    session
  } = useAuth();

  // Admin check - only this specific email can add/delete official recommendations
  const isAdmin = session?.user?.email === "ran0xiaoxuan@gmail.com";

  // Strategy selection related states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStrategies, setUserStrategies] = useState<Strategy[]>([]);
  const [loadingUserStrategies, setLoadingUserStrategies] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [filteredUserStrategies, setFilteredUserStrategies] = useState<Strategy[]>([]);

  // Fetch the admin's personal strategies for selection
  const fetchUserStrategies = async () => {
    if (!isAdmin || !session?.user?.id) return;
    try {
      setLoadingUserStrategies(true);
      console.log("Fetching strategies for admin user:", session.user.id);
      const {
        data,
        error
      } = await supabase.from('strategies').select('*').eq('user_id', session.user.id);
      if (error) {
        console.error("Error fetching user strategies:", error);
        throw error;
      }
      console.log("Admin strategies fetched:", data);
      const strategiesData = data.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description || "",
        targetAsset: strategy.target_asset || "",
        targetAssetName: strategy.target_asset_name || "",
        isActive: strategy.is_active,
        timeframe: strategy.timeframe,
        createdAt: strategy.created_at,
        updatedAt: strategy.updated_at,
        userId: strategy.user_id,
        stopLoss: strategy.stop_loss || "",
        takeProfit: strategy.take_profit || "",
        singleBuyVolume: strategy.single_buy_volume || "",
        maxBuyVolume: strategy.max_buy_volume || ""
      }));
      setUserStrategies(strategiesData);
      setFilteredUserStrategies(strategiesData);
    } catch (error) {
      console.error("Error fetching user strategies:", error);
      toast.error("Failed to load your strategies");
    } finally {
      setLoadingUserStrategies(false);
    }
  };

  // Filter user strategies based on search query
  useEffect(() => {
    if (isSearchOpen && searchQuery && userStrategies.length > 0) {
      const filtered = userStrategies.filter(strategy => strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) || strategy.description && strategy.description.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredUserStrategies(filtered);
    } else {
      setFilteredUserStrategies(userStrategies);
    }
  }, [searchQuery, userStrategies, isSearchOpen]);

  // Fetch recommended strategies - UPDATED to use the new helper function
  const fetchRecommendedStrategies = async () => {
    try {
      setLoading(true);
      console.log("Starting to fetch recommended strategies...");

      // Use the helper function to fetch recommended strategies
      const collectedStrategies = await fetchPublicRecommendedStrategies();
      console.log("Collected strategies using helper function:", collectedStrategies);
      setStrategies(collectedStrategies);
    } catch (error) {
      console.error("Error in fetchRecommendedStrategies:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch apply counts for all strategies
  const fetchApplyCounts = async () => {
    try {
      const counts = await getStrategyApplyCounts();
      setApplyCounts(counts);
    } catch (error) {
      console.error("Error fetching apply counts:", error);
    }
  };

  // Apply a strategy to user's own strategies - Updated to track applications
  const applyStrategy = async (strategy: RecommendedStrategy) => {
    try {
      if (!session?.user?.id) {
        toast.error("You must be logged in to apply a strategy");
        return;
      }

      // Create a copy of the strategy for the user
      const newUserStrategy = {
        name: `${strategy.name} (from recommendations)`,
        description: strategy.description,
        target_asset: strategy.target_asset,
        timeframe: strategy.timeframe,
        is_active: true,
        user_id: session.user.id,
        stop_loss: strategy.stop_loss,
        take_profit: strategy.take_profit,
        single_buy_volume: strategy.single_buy_volume,
        max_buy_volume: strategy.max_buy_volume
      };
      const {
        data,
        error
      } = await supabase.from('strategies').insert(newUserStrategy).select();
      if (error) throw error;

      // Track the strategy application
      await trackStrategyApplication(strategy.id, session.user.id);

      // Refresh apply counts to show updated data
      await fetchApplyCounts();
      toast.success("Strategy added to your collection");
    } catch (error) {
      console.error("Error applying strategy:", error);
      toast.error("Failed to apply strategy");
    }
  };

  // Delete a recommended strategy (admin only)
  const deleteStrategy = async (id: string) => {
    if (!isAdmin) return;
    try {
      // First find the recommendation record
      const {
        data: recommendedData,
        error: findError
      } = await supabase.from('recommended_strategies').select('id').eq('strategy_id', id).single();
      if (findError) throw findError;
      if (recommendedData) {
        // Delete from recommendations table
        const {
          error: deleteError
        } = await supabase.from('recommended_strategies').delete().eq('id', recommendedData.id);
        if (deleteError) throw deleteError;
      }
      toast.success("Strategy removed from recommendations");
      fetchRecommendedStrategies();
    } catch (error) {
      console.error("Error deleting recommended strategy:", error);
      toast.error("Failed to delete recommendation");
    }
  };

  // Add a new recommended strategy (admin only) - Updated to use an existing strategy
  const addOfficialStrategy = async () => {
    if (!isAdmin || !session?.user?.id) return;
    try {
      console.log("Adding official strategy with ID:", selectedStrategyId);
      if (!selectedStrategyId) {
        toast.error("Please select a strategy");
        return;
      }

      // Check if the strategy is already in recommendations
      const {
        data: existingRec,
        error: checkError
      } = await supabase.from('recommended_strategies').select('*').eq('strategy_id', selectedStrategyId);
      if (checkError) {
        console.error("Error checking existing recommendation:", checkError);
        throw checkError;
      }
      if (existingRec && existingRec.length > 0) {
        toast.error("This strategy is already in recommendations");
        return;
      }

      // Add the selected strategy to recommendations as public and official
      const {
        data: insertData,
        error: recommendError
      } = await supabase.from('recommended_strategies').insert({
        strategy_id: selectedStrategyId,
        recommended_by: session.user.id,
        is_official: true,
        is_public: true
      }).select();
      if (recommendError) {
        console.error("Error inserting recommendation:", recommendError);
        throw recommendError;
      }
      console.log("Successfully added strategy to recommendations:", insertData);
      toast.success("Official strategy added to recommendations");
      setShowUploadDialog(false);
      setSelectedStrategyId("");
      fetchRecommendedStrategies(); // Refresh the list
    } catch (error) {
      console.error("Error adding strategy:", error);
      toast.error("Failed to add strategy");
    }
  };

  // Handle strategy selection from command dialog
  const handleStrategySelect = (strategyId: string) => {
    setSelectedStrategyId(strategyId);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Show strategy details in dialog
  const showStrategyDetails = (strategy: RecommendedStrategy) => {
    setSelectedStrategy(strategy);
    setShowDetailsDialog(true);
    setActiveTab("overview");
  };

  // Filter strategies based on search term only (removed asset filter)
  const filteredAndSortedStrategies = strategies.filter(strategy => strategy.name?.toLowerCase().includes(searchTerm.toLowerCase()) || strategy.description?.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'created':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'updated':
        comparison = new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime();
        break;
      case 'apply_count':
        const aCount = applyCounts.get(a.id) || 0;
        const bCount = applyCounts.get(b.id) || 0;
        comparison = aCount - bCount;
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Fetch recommended strategies - UPDATED to use the new helper function
  useEffect(() => {
    fetchRecommendedStrategies();
    fetchApplyCounts(); // Fetch apply counts on component mount
    if (isAdmin) {
      fetchUserStrategies();
    }
  }, [isAdmin, session?.user?.id]);
  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold">Recommendations</h1>
            {isAdmin && <Button className="mt-4 sm:mt-0" onClick={() => {
            fetchUserStrategies(); // Refresh strategies list when opening dialog
            setShowUploadDialog(true);
          }}>
                Add Official Strategy
              </Button>}
          </div>
          
          {/* Search and Sort Controls */}
          <div className="mb-6 flex flex-col lg:flex-row justify-between gap-4">
            <div className="w-full lg:w-2/5">
              <Input placeholder="Search recommendations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-3/5 lg:justify-end">
              <div className="w-full sm:w-auto min-w-[160px]">
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apply_count">Popularity</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" size="icon" onClick={toggleSortDirection} className="w-full sm:w-auto" title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}>
                {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Strategy cards */}
          {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse">
                  <div className="h-full flex flex-col">
                    <div className="h-10 bg-muted rounded-t-lg"></div>
                    <div className="flex-1 p-6">
                      <div className="h-6 w-3/4 bg-muted rounded mb-4"></div>
                      <div className="h-4 w-full bg-muted rounded mb-2"></div>
                      <div className="h-4 w-5/6 bg-muted rounded mb-2"></div>
                      <div className="h-4 w-4/6 bg-muted rounded"></div>
                    </div>
                    <div className="h-12 bg-muted rounded-b-lg"></div>
                  </div>
                </Card>)}
            </div> : <>
                {/* Results count and current sort display */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  
                  
                </div>

                {filteredAndSortedStrategies.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedStrategies.map(strategy => <Card key={strategy.id} className="flex flex-col h-80 hover:border-primary hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-slate-50" onClick={() => showStrategyDetails(strategy)}>
                      <CardHeader className="pb-3 border-b flex-shrink-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg text-slate-800 truncate">{strategy.name}</CardTitle>
                            <div className="flex items-center mt-2 space-x-2">
                              {strategy.target_asset && <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                  {strategy.target_asset}
                                </Badge>}
                              {strategy.is_official}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 pt-4 pb-2 min-h-0">
                        <div className="h-full flex flex-col">
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {strategy.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between border-t flex-shrink-0">
                        <div>
                          {/* Only admin can delete strategies */}
                          {isAdmin && <Button variant="ghost" size="sm" className="p-0 h-8 w-8 text-destructive" onClick={e => {
                    e.stopPropagation();
                    deleteStrategy(strategy.id);
                  }}>
                              <Trash className="h-4 w-4" />
                            </Button>}
                        </div>
                        {/* Apply count display with star icon */}
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                          <span className="text-sm font-medium">{applyCounts.get(strategy.id) || 0}</span>
                        </div>
                      </CardFooter>
                    </Card>)}
                </div> : <div className="text-center py-12">
                  <p className="text-muted-foreground">No recommendations match your criteria</p>
                </div>}
              </>}
        </div>
      </main>
      
      {/* Enhanced Strategy details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedStrategy?.name}</DialogTitle>
            <DialogDescription className="flex items-center space-x-2">
              {selectedStrategy?.target_asset && <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedStrategy.target_asset}
                </Badge>}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="flex items-center">
                Overview
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center">
                Risk Management
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center">
                Trading Rules
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[50vh] pr-4">
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-sm mt-2">{selectedStrategy?.description || "No description provided."}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold">Strategy Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <Card className="p-4">
                        <h4 className="font-medium">Key Metrics</h4>
                        <dl className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Asset:</dt>
                            <dd className="font-medium">{selectedStrategy?.target_asset || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Timeframe:</dt>
                            <dd className="font-medium">{selectedStrategy?.timeframe || "N/A"}</dd>
                          </div>
                          
                        </dl>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium">Risk Parameters</h4>
                        <dl className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Stop Loss:</dt>
                            <dd className="font-medium text-red-500">{selectedStrategy?.stop_loss || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Take Profit:</dt>
                            <dd className="font-medium text-green-500">{selectedStrategy?.take_profit || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Single Buy:</dt>
                            <dd className="font-medium">{selectedStrategy?.single_buy_volume || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Max Buy:</dt>
                            <dd className="font-medium">{selectedStrategy?.max_buy_volume || "N/A"}</dd>
                          </div>
                        </dl>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="risk" className="mt-0">
                {selectedStrategy && <RiskManagement riskManagement={{
                stopLoss: selectedStrategy.stop_loss || "0%",
                takeProfit: selectedStrategy.take_profit || "0%",
                singleBuyVolume: selectedStrategy.single_buy_volume || "0",
                maxBuyVolume: selectedStrategy.max_buy_volume || "0"
              }} />}
              </TabsContent>
              
              <TabsContent value="rules" className="mt-0">
                {selectedStrategy && <TradingRules entryRules={[]} exitRules={[]} editable={false} />}
                <div className="text-sm text-muted-foreground mt-4 p-4 bg-slate-50 rounded-md">
                  <p>This is a simplified view of the trading rules. Apply this strategy to your collection to see and customize the complete rule set.</p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter className="mt-4 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
            if (selectedStrategy) {
              applyStrategy(selectedStrategy);
              setShowDetailsDialog(false);
            }
          }}>
              Apply Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Admin dialog to select an existing strategy */}
      {isAdmin && <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Official Strategy</DialogTitle>
              <DialogDescription>
                Select one of your existing strategies to recommend to all users.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Strategy</label>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-10 bg-background" onClick={() => setIsSearchOpen(true)}>
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  {userStrategies.find(s => s.id === selectedStrategyId)?.name || "Select a strategy"}
                </Button>
              </div>

              {selectedStrategyId && <div className="bg-muted/50 p-3 rounded-md">
                  <h4 className="font-medium text-sm">Selected Strategy</h4>
                  <p className="text-sm mt-1">{userStrategies.find(s => s.id === selectedStrategyId)?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userStrategies.find(s => s.id === selectedStrategyId)?.description || "No description"}
                  </p>
                </div>}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addOfficialStrategy} disabled={!selectedStrategyId || loadingUserStrategies}>
                {loadingUserStrategies ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Add to Recommendations
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
        
      {/* Command dialog for strategy selection */}
      <CommandDialog open={isSearchOpen} onOpenChange={open => {
      setIsSearchOpen(open);
      if (!open) {
        setSearchQuery("");
      }
    }}>
        <CommandInput placeholder="Search your strategies..." value={searchQuery} onValueChange={setSearchQuery} autoFocus={true} />
        <CommandList>
          <CommandEmpty>
            {loadingUserStrategies ? <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div> : <p className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? "No strategies found" : "Type to search your strategies"}
              </p>}
          </CommandEmpty>
          
          {filteredUserStrategies.length > 0 && <CommandGroup heading="Your Strategies">
              {filteredUserStrategies.map(strategy => <CommandItem key={strategy.id} value={`${strategy.name} ${strategy.description || ''}`} onSelect={() => handleStrategySelect(strategy.id)}>
                  <div className="flex items-center">
                    {selectedStrategyId === strategy.id && <Check className="mr-2 h-4 w-4 text-primary" />}
                    <div className="flex flex-col">
                      <span>{strategy.name}</span>
                      {strategy.description && <span className="text-xs text-muted-foreground line-clamp-1">
                          {strategy.description}
                        </span>}
                    </div>
                  </div>
                </CommandItem>)}
            </CommandGroup>}
        </CommandList>
      </CommandDialog>

      {/* Enhanced Strategy details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedStrategy?.name}</DialogTitle>
            <DialogDescription className="flex items-center space-x-2">
              {selectedStrategy?.target_asset && <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedStrategy.target_asset}
                </Badge>}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="flex items-center">
                Overview
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center">
                Risk Management
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center">
                Trading Rules
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[50vh] pr-4">
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-sm mt-2">{selectedStrategy?.description || "No description provided."}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold">Strategy Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <Card className="p-4">
                        <h4 className="font-medium">Key Metrics</h4>
                        <dl className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Asset:</dt>
                            <dd className="font-medium">{selectedStrategy?.target_asset || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Timeframe:</dt>
                            <dd className="font-medium">{selectedStrategy?.timeframe || "N/A"}</dd>
                          </div>
                        </dl>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium">Risk Parameters</h4>
                        <dl className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Stop Loss:</dt>
                            <dd className="font-medium text-red-500">{selectedStrategy?.stop_loss || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Take Profit:</dt>
                            <dd className="font-medium text-green-500">{selectedStrategy?.take_profit || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Single Buy:</dt>
                            <dd className="font-medium">{selectedStrategy?.single_buy_volume || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Max Buy:</dt>
                            <dd className="font-medium">{selectedStrategy?.max_buy_volume || "N/A"}</dd>
                          </div>
                        </dl>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="risk" className="mt-0">
                {selectedStrategy && <RiskManagement riskManagement={{
                stopLoss: selectedStrategy.stop_loss || "0%",
                takeProfit: selectedStrategy.take_profit || "0%",
                singleBuyVolume: selectedStrategy.single_buy_volume || "0",
                maxBuyVolume: selectedStrategy.max_buy_volume || "0"
              }} />}
              </TabsContent>
              
              <TabsContent value="rules" className="mt-0">
                {selectedStrategy && <TradingRules entryRules={[]} exitRules={[]} editable={false} />}
                <div className="text-sm text-muted-foreground mt-4 p-4 bg-slate-50 rounded-md">
                  <p>This is a simplified view of the trading rules. Apply this strategy to your collection to see and customize the complete rule set.</p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter className="mt-4 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
            if (selectedStrategy) {
              applyStrategy(selectedStrategy);
              setShowDetailsDialog(false);
            }
          }}>
              Apply Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Recommendations;
