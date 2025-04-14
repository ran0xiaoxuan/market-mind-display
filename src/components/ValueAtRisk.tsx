
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const varData = [
  { confidence: "95%", daily: 2.4, weekly: 5.1, monthly: 9.7 },
  { confidence: "97%", daily: 2.9, weekly: 6.3, monthly: 11.2 },
  { confidence: "99%", daily: 3.7, weekly: 7.8, monthly: 14.5 },
];

const stressTestData = [
  { scenario: "2008 Financial Crisis", impact: -18.5 },
  { scenario: "2020 Covid Crash", impact: -12.7 },
  { scenario: "2022 Rate Hike", impact: -8.9 },
  { scenario: "China Slowdown", impact: -5.4 },
  { scenario: "Supply Chain Disruption", impact: -4.1 },
];

export function ValueAtRisk() {
  const [confidenceLevel, setConfidenceLevel] = useState("95%");

  // Format the number as percentage
  const formatPercent = (value: number) => `${Math.abs(value)}%`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Value at Risk (VaR)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Maximum expected loss with selected confidence level
          </p>
          
          <div className="mb-4">
            <Select defaultValue={confidenceLevel} onValueChange={setConfidenceLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select confidence level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="95%">95% Confidence</SelectItem>
                <SelectItem value="97%">97% Confidence</SelectItem>
                <SelectItem value="99%">99% Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            {varData.filter(item => item.confidence === confidenceLevel).map((item) => (
              <div key={item.confidence}>
                <TabsContent value="daily" className="pt-4">
                  <div className="text-3xl font-bold text-red-500">{item.daily}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Expected maximum daily loss</p>
                </TabsContent>
                
                <TabsContent value="weekly" className="pt-4">
                  <div className="text-3xl font-bold text-red-500">{item.weekly}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Expected maximum weekly loss</p>
                </TabsContent>
                
                <TabsContent value="monthly" className="pt-4">
                  <div className="text-3xl font-bold text-red-500">{item.monthly}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Expected maximum monthly loss</p>
                </TabsContent>
              </div>
            ))}
          </Tabs>
        </Card>
        
        <Card className="p-6 col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-2">Stress Test Scenarios</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Simulated portfolio performance under historical stress scenarios
          </p>
          
          <div className="h-64">
            <ChartContainer 
              config={{
                negative: {
                  label: "Impact",
                  color: "#f43f5e"
                }
              }}
            >
              <BarChart 
                data={stressTestData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={formatPercent} />
                <YAxis type="category" dataKey="scenario" width={150} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, "Impact"]}
                  labelFormatter={(label) => `Scenario: ${label}`}
                />
                <Bar dataKey="impact" name="Impact" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                <Legend />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Risk Factor Exposure</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Current exposure to various risk factors
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-2">Market Risk</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Equity Beta</span>
              <span className="font-medium">0.85</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Interest Rate Sensitivity</span>
              <span className="font-medium">-0.32</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Liquidity Risk</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Daily Volume</span>
              <span className="font-medium">High</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">Liquidation Time</span>
              <span className="font-medium">1.3 days</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Volatility Exposure</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Implied Volatility</span>
              <span className="font-medium">18.7%</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">VIX Correlation</span>
              <span className="font-medium">0.43</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
