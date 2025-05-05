
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { StrategyCard } from "@/components/StrategyCard";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { getStrategies, Strategy } from "@/services/strategyService";
import { toast } from "sonner";

const Strategies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Filter strategies based on search term and status filter
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = 
      strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (strategy.description && strategy.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && strategy.isActive) || 
      (statusFilter === "inactive" && !strategy.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold">Trading Strategies</h1>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Link to="/ai-strategy">
                <Button variant="outline" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Strategy
                </Button>
              </Link>
              <Link to="/manual-strategy">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Strategy
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <div className="w-full sm:w-2/3">
              <Input 
                placeholder="Search strategies..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-1/4 lg:w-1/5">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
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
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-lg border bg-card animate-pulse" />
              ))}
            </div>
          ) : filteredStrategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  name={strategy.name}
                  description={strategy.description || "No description provided"}
                  updatedAt={new Date(strategy.updatedAt || Date.now())}
                  asset={strategy.targetAsset || "Unknown"}
                  status={strategy.isActive ? "active" : "inactive"}
                  id={strategy.id}
                />
              ))}
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

export default Strategies;
