import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ModeToggle";
import { StrategyList } from "@/components/StrategyList";
import { TestStrategyGenerator } from "@/components/strategy/TestStrategyGenerator";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();

  const handleTestStrategyGeneration = () => {
    toast("Redirecting to AI Strategy page", {
      description: "You will now be redirected to test the strategy generator"
    });
    navigate("/ai-strategy");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-6 flex items-center justify-between border-b">
        <Link to="/" className="text-2xl font-bold">
          Trading Platform
        </Link>
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <Button asChild>
            <Link to="/auth/login">Login</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome!</CardTitle>
              <p className="text-muted-foreground">
                Explore algorithmic trading strategies.
              </p>
            </CardHeader>
            <CardContent>
              <p>
                This platform provides tools for creating, testing, and deploying
                algorithmic trading strategies.
              </p>
              <ul className="list-disc pl-5 mt-4">
                <li>
                  <Link to="/strategies" className="text-blue-500 hover:underline">
                    View All Strategies
                  </Link>
                </li>
                <li>
                  <Link to="/backtest" className="text-blue-500 hover:underline">
                    Backtest a Strategy
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="text-blue-500 hover:underline">
                    Analyze Performance
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <StrategyList />

          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <p className="text-muted-foreground">
                Track important market events.
              </p>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between rounded-md border p-4">
                <span className="text-sm font-medium">Today</span>
                <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
        <section className="mt-6">
          <TestStrategyGenerator onGenerateTest={handleTestStrategyGeneration} />
        </section>
      </main>
    </div>
  );
};

export default Index;
