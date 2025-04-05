
import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const AIStrategy = () => {
  // State for form fields
  const [riskLevel, setRiskLevel] = useState<string>("moderate");
  const [timeHorizon, setTimeHorizon] = useState<string>("medium-term");
  const [strategyType, setStrategyType] = useState<string>("technical-analysis");
  const [isPremiumEnabled, setIsPremiumEnabled] = useState<boolean>(false);

  // Handle form submission
  const handleSavePreferences = () => {
    toast.success("Strategy preferences saved successfully");
  };

  // Handle upgrade plan
  const handleUpgradeToPro = () => {
    toast.info("Upgrade request initiated. Redirecting to pricing page...");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6 container max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">AI Strategy</h1>
        </div>

        {/* Strategy Settings Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Strategy Settings</CardTitle>
            <CardDescription>Configure your AI trading strategy parameters</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="risk-level">Default Risk Level</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger id="risk-level" className="w-full">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-horizon">Default Time Horizon</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                <SelectTrigger id="time-horizon" className="w-full">
                  <SelectValue placeholder="Select time horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-term">Short-term (Days to weeks)</SelectItem>
                  <SelectItem value="medium-term">Medium-term (Weeks to months)</SelectItem>
                  <SelectItem value="long-term">Long-term (Months to years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy-type">Default Strategy Type</Label>
              <Select value={strategyType} onValueChange={setStrategyType}>
                <SelectTrigger id="strategy-type" className="w-full">
                  <SelectValue placeholder="Select strategy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical-analysis">Technical Analysis</SelectItem>
                  <SelectItem value="fundamental-analysis">Fundamental Analysis</SelectItem>
                  <SelectItem value="sentiment-analysis">Sentiment Analysis</SelectItem>
                  <SelectItem value="mixed-approach">Mixed Approach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSavePreferences} className="mt-4">Save Preferences</Button>
          </CardContent>
        </Card>

        {/* AI Connections Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">API Connections</CardTitle>
            <CardDescription>Connect to trading platforms and data providers</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-center flex-col p-8 border border-dashed rounded-md">
              <div className="flex flex-col items-center text-center mb-4">
                <Lock className="h-10 w-10 mb-2 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Pro Plan Required</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Connecting to brokers and exchanges is available exclusively for Pro users.
                  Upgrade your plan to access this feature.
                </p>
              </div>
              <Button variant="outline" onClick={handleUpgradeToPro} className="bg-amber-500 hover:bg-amber-600 text-white hover:text-white">
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">AI Model Configuration</CardTitle>
            <CardDescription>Select and configure AI models for your trading strategy</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="use-ai-predictions" 
                  checked={isPremiumEnabled}
                  onCheckedChange={() => setIsPremiumEnabled(!isPremiumEnabled)}
                  disabled={!isPremiumEnabled}
                />
                <div className="grid gap-1">
                  <Label htmlFor="use-ai-predictions">Enable AI prediction model (Pro feature)</Label>
                  <p className="text-sm text-muted-foreground">
                    Use advanced machine learning models to predict market movements
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="use-sentiment-analysis" disabled={!isPremiumEnabled} />
                <div className="grid gap-1">
                  <Label htmlFor="use-sentiment-analysis">Enable sentiment analysis (Pro feature)</Label>
                  <p className="text-sm text-muted-foreground">
                    Analyze social media and news sentiment to inform trading decisions
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="use-pattern-recognition" checked />
                <div className="grid gap-1">
                  <Label htmlFor="use-pattern-recognition">Enable pattern recognition</Label>
                  <p className="text-sm text-muted-foreground">
                    Detect common chart patterns to generate trading signals
                  </p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Label htmlFor="api-key">OpenAI API Key (Optional)</Label>
              <Input id="api-key" type="password" placeholder="Enter your API key" />
              <p className="text-xs text-muted-foreground mt-1">
                Provide your own API key to use custom AI models
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button onClick={handleSavePreferences} className="mr-2">Save Configuration</Button>
            <Button variant="outline">Reset to Default</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default AIStrategy;
