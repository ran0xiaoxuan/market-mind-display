
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { PerformanceMetricsGrid } from "@/components/PerformanceMetricsGrid";

const AIStrategy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">AI Strategy</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Strategy Overview</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create and customize AI-powered trading strategies
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium mb-2">Current AI Model</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Model Type:</span>
                      <span className="text-sm">Advanced LSTM</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Confidence:</span>
                      <span className="text-sm text-green-600">High (87%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Updated:</span>
                      <span className="text-sm">2025-04-03</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium mb-2">Performance</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Win Rate:</span>
                      <span className="text-sm">72.5%</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Return:</span>
                      <span className="text-sm text-green-600">+18.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Sharpe Ratio:</span>
                      <span className="text-sm">1.92</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button>Create New Strategy</Button>
                <Button variant="outline">Edit Parameters</Button>
              </div>
            </Card>

            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>
              <TabsContent value="performance" className="mt-4">
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-2">AI Strategy Performance</h3>
                    <p className="text-sm text-muted-foreground mb-4">Historical performance and predictions</p>
                    <ChartPlaceholder title="AI strategy performance chart not available" />
                  </Card>
                  <PerformanceMetricsGrid />
                </div>
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Strategy Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium mb-3">Risk Level</h4>
                      <div className="flex gap-2">
                        {["Conservative", "Moderate", "Aggressive"].map((risk) => (
                          <Button 
                            key={risk}
                            variant={risk === "Moderate" ? "default" : "outline"}
                            size="sm"
                          >
                            {risk}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium mb-3">Time Horizon</h4>
                      <div className="flex gap-2">
                        {["Short-term", "Medium-term", "Long-term"].map((horizon) => (
                          <Button 
                            key={horizon}
                            variant={horizon === "Medium-term" ? "default" : "outline"}
                            size="sm"
                          >
                            {horizon}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium mb-3">Strategy Type</h4>
                      <div className="flex gap-2">
                        {["Trend Following", "Mean Reversion", "Hybrid"].map((type) => (
                          <Button 
                            key={type}
                            variant={type === "Hybrid" ? "default" : "outline"}
                            size="sm"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button>Save Settings</Button>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="logs" className="mt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Training Logs</h3>
                  <div className="bg-muted p-4 rounded-md h-[300px] overflow-y-auto font-mono text-xs">
                    <p>[2025-04-03 08:12:45] Starting AI model training...</p>
                    <p>[2025-04-03 08:12:50] Loading historical data: COMPLETE</p>
                    <p>[2025-04-03 08:13:10] Feature extraction: COMPLETE</p>
                    <p>[2025-04-03 08:14:25] Model initialization: COMPLETE</p>
                    <p>[2025-04-03 08:15:40] Training epoch 1/50: loss=0.0845</p>
                    <p>[2025-04-03 08:16:05] Training epoch 2/50: loss=0.0782</p>
                    <p>[2025-04-03 08:16:30] Training epoch 3/50: loss=0.0724</p>
                    <p className="text-green-500">[2025-04-03 09:45:12] Training complete - Model accuracy: 87.2%</p>
                    <p>[2025-04-03 09:45:30] Validation test: PASSED</p>
                    <p>[2025-04-03 09:46:15] Model saved and deployed</p>
                    <p className="text-blue-500">[2025-04-03 10:02:33] Generating trade signals...</p>
                    <p>[2025-04-03 10:03:45] Signal analysis complete</p>
                    <p className="text-green-500">[2025-04-03 10:04:10] Strategy ready</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Model Configuration</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <div className="bg-muted p-3 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs">Price Patterns</span>
                      <span className="text-xs text-green-600">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs">Sentiment Analysis</span>
                      <span className="text-xs text-green-600">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs">Volatility Modeling</span>
                      <span className="text-xs text-green-600">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs">Market Correlation</span>
                      <span className="text-xs text-muted-foreground">Disabled</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">Configure Features</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">API Connections</h3>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Data Provider</span>
                  <span className="bg-green-600/20 text-green-600 text-xs px-2 py-1 rounded-full">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Broker API</span>
                  <span className="bg-amber-600/20 text-amber-600 text-xs px-2 py-1 rounded-full">Pending</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Upgrade to Pro plan for additional API connections
              </p>
              <Button size="sm" variant="outline" className="w-full mt-4">Manage Connections</Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800">Increase Time Window</h4>
                  <p className="text-xs text-blue-600 mt-1">
                    Extending your analysis time window may improve prediction accuracy.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-green-800">Lower Risk Factor</h4>
                  <p className="text-xs text-green-600 mt-1">
                    Reducing position sizes could optimize your risk-adjusted returns.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIStrategy;
