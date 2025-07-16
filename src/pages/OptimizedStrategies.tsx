import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { StrategyCard } from "@/components/StrategyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUp, ArrowDown } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useOptimizedStrategies } from "@/hooks/useOptimizedStrategies";

type SortOption = 'name' | 'created' | 'updated';
type SortDirection = 'asc' | 'desc';

const OptimizedStrategies = () => {
  usePageTitle("My Strategies - StratAIge");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: strategies = [], isLoading, error, refetch } = useOptimizedStrategies();

  const handleStrategyDeleted = () => {
    refetch();
  };

  // Memoized filtering and sorting to prevent unnecessary recalculations
  const filteredAndSortedStrategies = useMemo(() => {
    return strategies.filter(strategy => {
      const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (strategy.description && strategy.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && strategy.isActive) || 
        (statusFilter === "inactive" && !strategy.isActive);
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
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [strategies, searchTerm, statusFilter, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (error) {
    toast.error("Failed to load strategies");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold">Strategies</h1>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Link to="/manual-strategy">
                <Button variant="outline">
                  Create Manually
                </Button>
              </Link>
              <Link to="/ai-strategy">
                <Button className="bg-black text-white hover:bg-black/90">
                  Create with AI
                </Button>
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
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleSortDirection} 
                className="w-full sm:w-auto relative overflow-hidden group hover:bg-accent/50 transition-all duration-200 border-2" 
                title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
              >
                <div className="relative flex items-center justify-center">
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="h-4 w-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                  ) : (
                    <ArrowDown className="h-4 w-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:translate-y-0.5" />
                  )}
                </div>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          ) : filteredAndSortedStrategies.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  Showing {filteredAndSortedStrategies.length} strategies
                  {statusFilter !== "all" && ` (${statusFilter})`}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredAndSortedStrategies.map(strategy => (
                  <StrategyCard 
                    key={strategy.id} 
                    name={strategy.name} 
                    description={strategy.description || "No description provided"} 
                    updatedAt={new Date(strategy.updatedAt || Date.now())} 
                    asset={strategy.targetAsset || "Unknown"} 
                    status={strategy.isActive ? "active" : "inactive"} 
                    id={strategy.id}
                    onDeleted={handleStrategyDeleted}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No strategies found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OptimizedStrategies;
