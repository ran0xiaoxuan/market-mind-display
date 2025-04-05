
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { StrategyCard } from "@/components/StrategyCard";
import { PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const Strategies = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Trading Strategies</h1>
              <p className="text-muted-foreground mt-1">
                Create, manage, and backtest your algorithmic trading strategies
              </p>
            </div>
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Create Strategy
            </Button>
          </div>
          
          <div className="mb-6 max-w-md">
            <Input 
              placeholder="Search strategies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StrategyCard
              name="Moving Average Crossover"
              description="A strategy that generates signals based on when a faster moving average crosses a slower moving average."
              performance="+8.2%"
              days={2}
              asset="AAPL"
              status="active"
            />
            <StrategyCard
              name="RSI Strategy"
              description="Uses the Relative Strength Index to identify overbought and oversold conditions in the market."
              performance="+12.5%"
              days={3}
              asset="MSFT"
              status="active"
            />
            <StrategyCard
              name="Bollinger Bands"
              description="Uses Bollinger Bands to identify volatility and potential reversal points in the market."
              performance="+5.7%"
              days={5}
              asset="BTC"
              status="active"
            />
            <StrategyCard
              name="MACD Strategy"
              description="Uses the Moving Average Convergence Divergence indicator to identify trend changes and momentum."
              performance="-2.3%"
              days={7}
              asset="GOOGL"
              status="inactive"
            />
            <StrategyCard
              name="Fibonacci Retracement"
              description="Uses Fibonacci retracement levels to identify potential support and resistance levels."
              performance="+3.8%"
              days={4}
              asset="AMZN"
              status="active"
            />
            <StrategyCard
              name="Ichimoku Cloud"
              description="Uses the Ichimoku Cloud to identify trend direction, momentum, and potential support/resistance levels."
              performance="+7.1%"
              days={6}
              asset="ETH"
              status="active"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Strategies;
