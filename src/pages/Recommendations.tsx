
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Trash, Star, Eye, Info, BookOpen, Shield, ListOrdered } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskManagement } from "@/components/strategy-detail/RiskManagement";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
}

const Recommendations = () => {
  const [strategies, setStrategies] = useState<RecommendedStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<RecommendedStrategy | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const {
    session
  } = useAuth();
  const [newStrategy, setNewStrategy] = useState({
    name: "",
    description: "",
    targetAsset: "",
    timeframe: "1d"
  });

  // Admin check - only this email can add/delete official recommendations
  const isAdmin = session?.user?.email === "ran0xiaoxuan@gmail.com";

  // Fetch recommended strategies from our new recommendations table
  const fetchRecommendedStrategies = async () => {
    try {
      setLoading(true);
      
      // Get strategies from the recommended_strategies table joined with actual strategy details
      const { data: recommendedStrategies, error } = await supabase
        .from('strategies')
        .select(`
          *,
          recommended_strategies:recommended_strategies(*)
        `)
        .not('recommended_strategies', 'is', null);
      
      if (error) {
        console.error("Error fetching recommended strategies:", error);
        throw error;
      }

      // Filter to only include items that actually have recommendations
      const validRecommendations = recommendedStrategies?.filter(
        strategy => strategy.recommended_strategies && strategy.recommended_strategies.length > 0
      ) || [];

      // Map to the format expected by the UI
      const processedStrategies = validRecommendations.map(strategy => ({
        ...strategy,
        is_official: strategy.recommended_strategies?.[0]?.is_official || false
      }));
      
      setStrategies(processedStrategies as RecommendedStrategy[]);
      
    } catch (error) {
      console.error("Error fetching recommended strategies:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  // Apply a strategy to user's own strategies
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
      const { data: recommendedData, error: findError } = await supabase
        .from('recommended_strategies')
        .select('id')
        .eq('strategy_id', id)
        .single();
      
      if (findError) throw findError;
      
      if (recommendedData) {
        // Delete from recommendations table
        const { error: deleteError } = await supabase
          .from('recommended_strategies')
          .delete()
          .eq('id', recommendedData.id);
        
        if (deleteError) throw deleteError;
      }
      
      toast.success("Strategy removed from recommendations");
      fetchRecommendedStrategies();
    } catch (error) {
      console.error("Error deleting recommended strategy:", error);
      toast.error("Failed to delete recommendation");
    }
  };

  // Add a new recommended strategy (admin only)
  const addOfficialStrategy = async () => {
    if (!isAdmin) return;
    try {
      if (!newStrategy.name || !newStrategy.targetAsset) {
        toast.error("Name and asset are required");
        return;
      }
      
      // First create the strategy
      const { data: strategyData, error: strategyError } = await supabase
        .from('strategies')
        .insert({
          name: newStrategy.name,
          description: newStrategy.description,
          target_asset: newStrategy.targetAsset,
          timeframe: newStrategy.timeframe,
          user_id: session?.user?.id,
          is_active: true
        })
        .select()
        .single();
      
      if (strategyError) throw strategyError;
      
      // Then add it to recommendations
      const { error: recommendError } = await supabase
        .from('recommended_strategies')
        .insert({
          strategy_id: strategyData.id,
          recommended_by: session?.user?.id,
          is_official: true
        });
      
      if (recommendError) throw recommendError;

      toast.success("Official strategy added");
      setShowUploadDialog(false);
      setNewStrategy({
        name: "",
        description: "",
        targetAsset: "",
        timeframe: "1d"
      });
      fetchRecommendedStrategies();
    } catch (error) {
      console.error("Error adding strategy:", error);
      toast.error("Failed to add strategy");
    }
  };

  // Show strategy details in dialog
  const showStrategyDetails = (strategy: RecommendedStrategy) => {
    setSelectedStrategy(strategy);
    setShowDetailsDialog(true);
    setActiveTab("overview");
  };

  // Filter strategies based on search and asset filter
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = 
      strategy.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      strategy.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsset = assetFilter === "all" || strategy.target_asset?.toLowerCase() === assetFilter.toLowerCase();
    return matchesSearch && matchesAsset;
  });

  // Get unique assets for filter dropdown
  const uniqueAssets = [...new Set(strategies.map(s => s.target_asset).filter(Boolean))];
  
  useEffect(() => {
    fetchRecommendedStrategies();
  }, []);

  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold">Recommendations</h1>
            {isAdmin && <Button className="mt-4 sm:mt-0" onClick={() => setShowUploadDialog(true)}>
                Add Official Strategy
              </Button>}
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <div className="w-full sm:w-2/3">
              <Input placeholder="Search recommendations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            <div className="w-full sm:w-1/4">
              <Select value={assetFilter} onValueChange={setAssetFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {uniqueAssets.map(asset => <SelectItem key={asset} value={asset || ""}>
                      {asset}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
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
            </div> : filteredStrategies.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map(strategy => <Card key={strategy.id} className="flex flex-col h-full hover:border-primary hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-white to-slate-50" onClick={() => showStrategyDetails(strategy)}>
                  <CardHeader className="pb-2 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-slate-800">{strategy.name}</CardTitle>
                        <div className="flex items-center mt-1 space-x-2">
                          
                          {strategy.target_asset && <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {strategy.target_asset}
                            </Badge>}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                          <span className="text-sm font-medium">{strategy.rating || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4">
                    <div className="flex flex-col h-full">
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {strategy.description || "No description provided"}
                      </p>
                      
                      
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between border-t">
                    
                    <div className="flex">
                      
                      {isAdmin && <Button variant="ghost" size="sm" className="p-0 h-8 w-8 text-destructive" onClick={e => {
                  e.stopPropagation();
                  deleteStrategy(strategy.id);
                }}>
                          <Trash className="h-4 w-4" />
                        </Button>}
                    </div>
                  </CardFooter>
                </Card>)}
            </div> : <div className="text-center py-12">
              <p className="text-muted-foreground">No recommendations match your criteria</p>
            </div>}
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
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Status:</dt>
                            <dd>
                              <Badge variant={selectedStrategy?.is_active ? "default" : "secondary"}>
                                {selectedStrategy?.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </dd>
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
      
      {/* Admin dialog to add new official strategy */}
      {isAdmin && <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Official Strategy</DialogTitle>
              <DialogDescription>
                Create a new official strategy recommendation that will be visible to all users.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Strategy Name
                </label>
                <Input id="name" value={newStrategy.name} onChange={e => setNewStrategy({
              ...newStrategy,
              name: e.target.value
            })} placeholder="Enter strategy name" />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="asset" className="text-sm font-medium">
                  Target Asset
                </label>
                <Input id="asset" value={newStrategy.targetAsset} onChange={e => setNewStrategy({
              ...newStrategy,
              targetAsset: e.target.value
            })} placeholder="e.g., BTC/USD, SPY, AAPL" />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="timeframe" className="text-sm font-medium">
                  Timeframe
                </label>
                <Select value={newStrategy.timeframe} onValueChange={value => setNewStrategy({
              ...newStrategy,
              timeframe: value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea id="description" value={newStrategy.description} onChange={e => setNewStrategy({
              ...newStrategy,
              description: e.target.value
            })} placeholder="Enter strategy description" rows={3} />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addOfficialStrategy}>
                Add Strategy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
    </div>;
};
export default Recommendations;

