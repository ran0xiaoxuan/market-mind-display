
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Hourglass, Timer, TrendingUp } from "lucide-react";
import { useState } from "react";

const AIStrategy = () => {
  const [assetType, setAssetType] = useState<"stocks" | "cryptocurrency">("stocks");
  const [riskLevel, setRiskLevel] = useState(50);
  const [timeHorizon, setTimeHorizon] = useState<"short" | "medium" | "long">("medium");
  const [strategyType, setStrategyType] = useState<string>("");
  
  const popularStocks = [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "GOOGL", name: "Google" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "META", name: "Meta" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "JPM", name: "JPMorgan Chase" }
  ];
  
  const popularCryptocurrencies = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "ADA", name: "Cardano" },
    { symbol: "DOT", name: "Polkadot" },
    { symbol: "XRP", name: "Ripple" },
    { symbol: "DOGE", name: "Dogecoin" },
    { symbol: "LINK", name: "Chainlink" }
  ];

  const strategyTypes = [
    { id: "single", label: "Single-indicator Strategy" },
    { id: "double", label: "Double-indicator Strategy" },
    { id: "multi", label: "Multi-indicator Strategy" }
  ];

  const handleStrategyTypeSelect = (strategyLabel: string) => {
    setStrategyType(strategyLabel);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
          <p className="text-muted-foreground">Select your asset type and describe your ideal trading strategy</p>
        </div>

        {/* Asset Type Selection */}
        <Card className="p-6 mb-10 border">
          <h2 className="text-xl font-semibold mb-2">Select Asset Type</h2>
          <p className="text-sm text-muted-foreground mb-4">Choose the type of asset you want to trade</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button 
              variant={assetType === "stocks" ? "default" : "outline"} 
              className="justify-center h-12"
              onClick={() => setAssetType("stocks")}
            >
              Stocks
            </Button>
            <Button 
              variant={assetType === "cryptocurrency" ? "default" : "outline"} 
              className="justify-center h-12"
              onClick={() => setAssetType("cryptocurrency")}
            >
              Cryptocurrency
            </Button>
          </div>
          
          <div className="mb-6">
            <label htmlFor="search-asset" className="block text-sm font-medium mb-2">
              {assetType === "stocks" ? "Search for a stock" : "Search for a cryptocurrency"}
            </label>
            <Input 
              id="search-asset" 
              placeholder={assetType === "stocks" ? "Search for a stock" : "Search for a cryptocurrency"} 
              className="w-full"
            />
          </div>
          
          {assetType === "stocks" ? (
            <div>
              <p className="text-sm font-medium mb-2">Popular Stocks</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {popularStocks.map((stock) => (
                  <Button key={stock.symbol} variant="outline" className="justify-center">
                    {stock.symbol}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-2">Popular Cryptocurrencies</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {popularCryptocurrencies.map((crypto) => (
                  <Button key={crypto.symbol} variant="outline" className="justify-center">
                    {crypto.symbol}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Strategy Parameters */}
        <Card className="p-6 mb-10 border">
          <h2 className="text-xl font-semibold mb-2">Strategy Parameters</h2>
          <p className="text-sm text-muted-foreground mb-6">Define your strategy preferences</p>
          
          <div className="mb-8">
            <h3 className="text-md font-medium mb-3">Risk Level</h3>
            <div className="mb-2">
              <Slider 
                value={[riskLevel]}
                onValueChange={(value) => setRiskLevel(value[0])}
                max={100}
                step={1}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Conservative</span>
              <span>Moderate</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-md font-medium mb-3">Time Horizon</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card 
                className={`p-4 cursor-pointer flex flex-col items-center ${timeHorizon === "short" ? "border-primary" : ""}`}
                onClick={() => setTimeHorizon("short")}
              >
                <Timer className="h-6 w-6 mb-2" />
                <span className="font-medium">Short-term</span>
                <span className="text-xs text-muted-foreground">Several times a day</span>
              </Card>
              <Card 
                className={`p-4 cursor-pointer flex flex-col items-center ${timeHorizon === "medium" ? "border-primary" : ""}`}
                onClick={() => setTimeHorizon("medium")}
              >
                <Clock className="h-6 w-6 mb-2" />
                <span className="font-medium">Medium-term</span>
                <span className="text-xs text-muted-foreground">Several times a week</span>
              </Card>
              <Card 
                className={`p-4 cursor-pointer flex flex-col items-center ${timeHorizon === "long" ? "border-primary" : ""}`}
                onClick={() => setTimeHorizon("long")}
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                <span className="font-medium">Long-term</span>
                <span className="text-xs text-muted-foreground">Several times a month</span>
              </Card>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium mb-3">Strategy Type</h3>
            <Input 
              id="strategy-type"
              value={strategyType}
              onChange={(e) => setStrategyType(e.target.value)}
              placeholder="Select a strategy type below" 
              className="w-full mb-4"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {strategyTypes.map((strategy) => (
                <Card
                  key={strategy.id}
                  className={`p-4 cursor-pointer flex flex-col items-center ${strategyType === strategy.label ? "border-primary" : ""}`}
                  onClick={() => handleStrategyTypeSelect(strategy.label)}
                >
                  <span className="font-medium">{strategy.label}</span>
                </Card>
              ))}
            </div>
          </div>
        </Card>
        
        {/* Strategy Description */}
        <Card className="p-6 mb-10 border">
          <h2 className="text-xl font-semibold mb-2">Describe Your Ideal Strategy</h2>
          <p className="text-sm text-muted-foreground mb-4">Tell us about your trading goals and any specific requirements</p>
          
          <Textarea 
            placeholder="Describe your ideal trading strategy. For example: I want a strategy that identifies oversold conditions and buys the dip with strict stop losses."
            className="min-h-[120px]"
          />
        </Card>

        <div className="flex justify-end">
          <Button className="w-full">
            Generate Strategy
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AIStrategy;
