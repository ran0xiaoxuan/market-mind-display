import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { StrategyCard } from "@/components/StrategyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getStrategies, Strategy } from "@/services/strategyService";
import { toast } from "sonner";
import { ArrowUp, ArrowDown } from "lucide-react";
type SortOption = 'name' | 'created' | 'updated' | 'total_return';
type SortDirection = 'asc' | 'desc';
const Strategies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const data = await getStrategies();
        setStrategies(data);
      } catch (error) {
        console.error("Error fetching strategies:", error);
        toast.error("Failed to load strategies");
      } finally {
        setLoading(false);
      }
    };
    fetchStrategies();
  }, []);

  // Filter and sort strategies
  const filteredAndSortedStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) || strategy.description && strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || statusFilter === "active" && strategy.isActive || statusFilter === "inactive" && !strategy.isActive;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated':
        comparison = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
        break;
      case 'total_return':
        // For now, we'll use a placeholder return value since totalReturn isn't in the Strategy type
        // This can be updated when the Strategy type includes totalReturn or performance data
        const aReturn = Math.random() * 100; // Placeholder
        const bReturn = Math.random() * 100; // Placeholder
        comparison = aReturn - bReturn;
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold">Strategies</h1>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Link to="/ai-strategy">
                <Button className="bg-black text-white hover:bg-black/90">Create New Strategy</Button>
              </Link>
            </div>
          </div>
          
          <div className="mb-6 flex flex-col lg:flex-row justify-between gap-4">
            <div className="w-full lg:w-2/5">
              <Input placeholder="Search strategies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-3/5 lg:justify-end">
              <div className="w-full sm:w-auto min-w-[140px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-auto min-w-[160px]">
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="total_return">Total Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" size="icon" onClick={toggleSortDirection} className="w-full sm:w-auto" title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}>
                {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {loading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />)}
            </div> : filteredAndSortedStrategies.length > 0 ? <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  Showing {filteredAndSortedStrategies.length} strategies
                  {statusFilter !== "all" && ` (${statusFilter})`}
                </span>
                
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredAndSortedStrategies.map(strategy => <StrategyCard key={strategy.id} name={strategy.name} description={strategy.description || "No description provided"} updatedAt={new Date(strategy.updatedAt || Date.now())} asset={strategy.targetAsset || "Unknown"} status={strategy.isActive ? "active" : "inactive"} id={strategy.id} />)}
              </div>
            </div> : <div className="text-center py-12">
              <p className="text-muted-foreground">No strategies found.</p>
            </div>}
        </div>
      </main>
    </div>;
};
export default Strategies;