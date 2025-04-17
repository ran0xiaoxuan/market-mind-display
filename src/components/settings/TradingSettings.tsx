import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";
export function TradingSettings() {
  return <div className="space-y-12">
      <div>
        
        
        
        
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
    </div>;
}