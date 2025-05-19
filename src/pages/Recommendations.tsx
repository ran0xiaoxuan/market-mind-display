
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
import { Trash, Star, Eye } from "lucide-react";

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

  // Fetch recommended strategies - using a special user ID to mark official strategies
  const fetchRecommendedStrategies = async () => {
    try {
      setLoading(true);
      // For this implementation, we'll use a special admin user ID to mark official recommendations
      // In a real app, you might want to use a dedicated table or add a column to the strategies table
      const {
        data,
        error
      } = await supabase.from('strategies').select('*').eq('user_id', isAdmin ? session?.user?.id : 'admin-recommendations');
      if (error) throw error;

      // Now we can directly set the data as RecommendedStrategy[] since our interface matches the DB structure
      setStrategies(data as RecommendedStrategy[]);
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
        user_id: session.user.id
        // Copy other relevant fields
      };
      const {
        data,
        error
      } = await supabase.from('strategies').insert(newUserStrategy).select();
      if (error) throw error;

      // Instead of directly updating recommendation_count which might not exist in the schema,
      // we'll use a different approach - we'll track applications separately
      // Note: In a real application, you might want to add this column to your schema

      // For now, just update the local state to reflect the change
      setStrategies(prevStrategies => prevStrategies.map(s => s.id === strategy.id ? {
        ...s,
        recommendation_count: (s.recommendation_count || 0) + 1
      } : s));
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
      const {
        error
      } = await supabase.from('strategies').delete().eq('id', id);
      if (error) throw error;
      toast.success("Strategy deleted");
      fetchRecommendedStrategies();
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast.error("Failed to delete strategy");
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
      const {
        error
      } = await supabase.from('strategies').insert({
        name: newStrategy.name,
        description: newStrategy.description,
        target_asset: newStrategy.targetAsset,
        timeframe: newStrategy.timeframe,
        user_id: 'admin-recommendations',
        // Use a special ID to mark recommendations
        is_active: true
      });
      if (error) throw error;
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
  };

  // Filter strategies based on search and asset filter
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name?.toLowerCase().includes(searchTerm.toLowerCase()) || strategy.description?.toLowerCase().includes(searchTerm.toLowerCase());
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
              {filteredStrategies.map(strategy => <Card 
                  key={strategy.id} 
                  className="flex flex-col h-full hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  onClick={() => showStrategyDetails(strategy)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{strategy.name}</CardTitle>
                        <CardDescription>
                          {strategy.target_asset || "Unknown asset"} • {strategy.timeframe || "Unknown timeframe"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                          <span className="text-sm font-medium">{strategy.rating || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {strategy.description || "No description provided"}
                    </p>
                    
                    {strategy.updated_at && <p className="text-xs text-muted-foreground mt-4">
                        Updated {formatDistanceToNow(new Date(strategy.updated_at), {
                  addSuffix: true
                })}
                      </p>}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        applyStrategy(strategy);
                      }}
                    >
                      Apply Strategy
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        showStrategyDetails(strategy);
                      }}
                    >
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    
                    {isAdmin && <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStrategy(strategy.id);
                      }}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>}
                  </CardFooter>
                </Card>)}
            </div> : <div className="text-center py-12">
              <p className="text-muted-foreground">No recommendations match your criteria</p>
            </div>}
        </div>
      </main>
      
      {/* Strategy details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedStrategy?.name}</DialogTitle>
            <DialogDescription>
              {selectedStrategy?.target_asset} • {selectedStrategy?.timeframe}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-sm">{selectedStrategy?.description || "No description provided."}</p>
            </div>
            
            {selectedStrategy?.stop_loss && (
              <div>
                <h3 className="font-semibold mb-1">Stop Loss</h3>
                <p className="text-sm">{selectedStrategy.stop_loss}</p>
              </div>
            )}
            
            {selectedStrategy?.take_profit && (
              <div>
                <h3 className="font-semibold mb-1">Take Profit</h3>
                <p className="text-sm">{selectedStrategy.take_profit}</p>
              </div>
            )}
            
            {selectedStrategy?.single_buy_volume && (
              <div>
                <h3 className="font-semibold mb-1">Single Buy Volume</h3>
                <p className="text-sm">{selectedStrategy.single_buy_volume}</p>
              </div>
            )}
            
            {selectedStrategy?.max_buy_volume && (
              <div>
                <h3 className="font-semibold mb-1">Max Buy Volume</h3>
                <p className="text-sm">{selectedStrategy.max_buy_volume}</p>
              </div>
            )}
            
            {selectedStrategy?.updated_at && (
              <div>
                <h3 className="font-semibold mb-1">Last Updated</h3>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(selectedStrategy.updated_at), {
                    addSuffix: true
                  })}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedStrategy) {
                  applyStrategy(selectedStrategy);
                  setShowDetailsDialog(false);
                }
              }}
            >
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
