
import { useState } from "react";
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

const Strategies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Mock strategies data
  const strategies = [
    {
      name: "Moving Average Crossover",
      description: "A strategy that generates signals based on when a faster moving average crosses a slower moving average.",
      performance: "+8.2%",
      days: 2,
      asset: "AAPL",
      status: "active"
    },
    {
      name: "RSI Strategy",
      description: "Uses the Relative Strength Index to identify overbought and oversold conditions in the market.",
      performance: "+12.5%",
      days: 3,
      asset: "MSFT",
      status: "active"
    },
    {
      name: "Bollinger Bands",
      description: "Uses Bollinger Bands to identify volatility and potential reversal points in the market.",
      performance: "+5.7%",
      days: 5,
      asset: "BTC",
      status: "active"
    },
    {
      name: "MACD Strategy",
      description: "Uses the Moving Average Convergence Divergence indicator to identify trend changes and momentum.",
      performance: "-2.3%",
      days: 7,
      asset: "GOOGL",
      status: "inactive"
    },
    {
      name: "Fibonacci Retracement",
      description: "Uses Fibonacci retracement levels to identify potential support and resistance levels.",
      performance: "+3.8%",
      days: 4,
      asset: "AMZN",
      status: "active"
    },
    {
      name: "Ichimoku Cloud",
      description: "Uses the Ichimoku Cloud to identify trend direction, momentum, and potential support/resistance levels.",
      performance: "+7.1%",
      days: 6,
      asset: "ETH",
      status: "active"
    }
  ];

  // Filter strategies based on search term and status filter
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || strategy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Trading Strategies</h1>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredStrategies.map((strategy, index) => (
              <StrategyCard
                key={index}
                name={strategy.name}
                description={strategy.description}
                performance={strategy.performance}
                days={strategy.days}
                asset={strategy.asset}
                status={strategy.status as "active" | "inactive"}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Strategies;
