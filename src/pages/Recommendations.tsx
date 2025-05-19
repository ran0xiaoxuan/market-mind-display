
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
import { Strategy } from "@/services/strategyService";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Trash, Star } from "lucide-react";

// Extend Strategy type to include additional fields for recommendations
interface OfficialStrategy extends Strategy {
  is_official: boolean;
  rating?: number;
  applied_count?: number;
}

const Recommendations = () => {
  const [strategies, setStrategies] = useState<OfficialStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { session } = useAuth();
  const [newStrategy, setNewStrategy] = useState({
    name: "",
    description: "",
    targetAsset: "",
    timeframe: "1d",
  });
  
  const isAdmin = session?.user?.email === "ran0xiaoxuan@gmail.com";
  
  // Fetch official strategies
  const fetchOfficialStrategies = async () => {
    try {
      setLoading(true);
      // Assuming we're using the same table but with an is_official flag
      // In a real implementation, you might want a separate table
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('is_official', true);
        
      if (error) throw error;
      
      setStrategies(data as OfficialStrategy[]);
    } catch (error) {
      console.error("Error fetching official strategies:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };
  
  // Apply a strategy to user's own strategies
  const applyStrategy = async (strategy: OfficialStrategy) => {
    try {
      if (!session?.user?.id) {
        toast.error("You must be logged in to apply a strategy");
        return;
      }
      
      // Create a copy of the strategy for the user
      const newUserStrategy = {
        name: `${strategy.name} (from recommendations)`,
        description: strategy.description,
        targetAsset: strategy.targetAsset,
        timeframe: strategy.timeframe,
        isActive: true,
        user_id: session.user.id,
        // Copy other relevant fields
      };
      
      const { data, error } = await supabase
        .from('strategies')
        .insert(newUserStrategy)
        .select();
        
      if (error) throw error;
      
      // Update the applied count for the official strategy
      await supabase
        .from('strategies')
        .update({ applied_count: (strategy.applied_count || 0) + 1 })
        .eq('id', strategy.id);
        
      toast.success("Strategy added to your collection");
      
      // Refetch to update counts
      fetchOfficialStrategies();
      
    } catch (error) {
      console.error("Error applying strategy:", error);
      toast.error("Failed to apply strategy");
    }
  };
  
  // Delete an official strategy (admin only)
  const deleteStrategy = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Strategy deleted");
      fetchOfficialStrategies();
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast.error("Failed to delete strategy");
    }
  };
  
  // Add a new official strategy (admin only)
  const addOfficialStrategy = async () => {
    if (!isAdmin) return;
    
    try {
      if (!newStrategy.name || !newStrategy.targetAsset) {
        toast.error("Name and asset are required");
        return;
      }
      
      const { error } = await supabase
        .from('strategies')
        .insert({
          name: newStrategy.name,
          description: newStrategy.description,
          targetAsset: newStrategy.targetAsset,
          timeframe: newStrategy.timeframe,
          is_official: true,
          user_id: session?.user?.id,
          applied_count: 0,
          rating: 0,
          isActive: true
        });
        
      if (error) throw error;
      
      toast.success("Official strategy added");
      setShowUploadDialog(false);
      setNewStrategy({
        name: "",
        description: "",
        targetAsset: "",
        timeframe: "1d",
      });
      fetchOfficialStrategies();
    } catch (error) {
      console.error("Error adding strategy:", error);
      toast.error("Failed to add strategy");
    }
  };
  
  // Filter strategies based on search and asset filter
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = 
      strategy.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      strategy.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAsset = 
      assetFilter === "all" || 
      strategy.targetAsset?.toLowerCase() === assetFilter.toLowerCase();
    
    return matchesSearch && matchesAsset;
  });
  
  // Get unique assets for filter dropdown
  const uniqueAssets = [...new Set(strategies.map(s => s.targetAsset).filter(Boolean))];
  
  useEffect(() => {
    fetchOfficialStrategies();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold">Official Recommendations</h1>
            {isAdmin && (
              <Button 
                className="mt-4 sm:mt-0" 
                onClick={() => setShowUploadDialog(true)}
              >
                Add Official Strategy
              </Button>
            )}
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <div className="w-full sm:w-2/3">
              <Input 
                placeholder="Search recommendations..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-1/4">
              <Select value={assetFilter} onValueChange={setAssetFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {uniqueAssets.map(asset => (
                    <SelectItem key={asset} value={asset || ""}>
                      {asset}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="h-64 animate-pulse">
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
                </Card>
              ))}
            </div>
          ) : filteredStrategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map(strategy => (
                <Card key={strategy.id} className="flex flex-col h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{strategy.name}</CardTitle>
                        <CardDescription>
                          {strategy.targetAsset || "Unknown asset"} • {strategy.timeframe || "Unknown timeframe"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                          <span className="text-sm font-medium">{strategy.rating || 0}</span>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {strategy.applied_count || 0} applied
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {strategy.description || "No description provided"}
                    </p>
                    
                    {strategy.updatedAt && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Updated {formatDistanceToNow(new Date(strategy.updatedAt), { addSuffix: true })}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => applyStrategy(strategy)}
                    >
                      Apply Strategy
                    </Button>
                    
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteStrategy(strategy.id)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No recommendations match your criteria</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Admin dialog to add new official strategy */}
      {isAdmin && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
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
                <Input
                  id="name"
                  value={newStrategy.name}
                  onChange={e => setNewStrategy({...newStrategy, name: e.target.value})}
                  placeholder="Enter strategy name"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="asset" className="text-sm font-medium">
                  Target Asset
                </label>
                <Input
                  id="asset"
                  value={newStrategy.targetAsset}
                  onChange={e => setNewStrategy({...newStrategy, targetAsset: e.target.value})}
                  placeholder="e.g., BTC/USD, SPY, AAPL"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="timeframe" className="text-sm font-medium">
                  Timeframe
                </label>
                <Select 
                  value={newStrategy.timeframe} 
                  onValueChange={value => setNewStrategy({...newStrategy, timeframe: value})}
                >
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
                <Textarea
                  id="description"
                  value={newStrategy.description}
                  onChange={e => setNewStrategy({...newStrategy, description: e.target.value})}
                  placeholder="Enter strategy description"
                  rows={3}
                />
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
        </Dialog>
      )}
    </div>
  );
};

export default Recommendations;
