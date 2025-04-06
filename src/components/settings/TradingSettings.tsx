
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock } from "lucide-react";

export function TradingSettings() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-medium mb-2">Trading Preferences</h2>
        <p className="text-sm text-muted-foreground mb-6">Configure your default trading settings</p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="risk-level" className="block text-sm font-medium mb-2">Default Risk Level</label>
            <Select defaultValue="moderate">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="time-horizon" className="block text-sm font-medium mb-2">Default Time Horizon</label>
            <Select defaultValue="medium">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time horizon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short-term (Days to weeks)</SelectItem>
                <SelectItem value="medium">Medium-term (Weeks to months)</SelectItem>
                <SelectItem value="long">Long-term (Months+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="strategy-type" className="block text-sm font-medium mb-2">Default Strategy Type</label>
            <Select defaultValue="technical">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select strategy type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Analysis</SelectItem>
                <SelectItem value="fundamental">Fundamental Analysis</SelectItem>
                <SelectItem value="algorithmic">Algorithmic</SelectItem>
                <SelectItem value="mixed">Mixed Approach</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button className="mt-4">Save Preferences</Button>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-medium mb-2">API Connections</h2>
        <p className="text-sm text-muted-foreground mb-6">Connect to trading platforms and data providers</p>
        
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Pro Plan Required</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Connecting to brokers and exchanges is available exclusively for Pro users.
              Upgrade your plan to access this feature.
            </p>
            <Button className="bg-amber-500 hover:bg-amber-600">Upgrade to Pro</Button>
          </div>
          
          <CardContent className="p-6 min-h-[150px]">
            {/* This content is intentionally hidden behind the overlay */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
