
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function AppearanceSettings() {
  const [showVolume, setShowVolume] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);
  
  const handleSavePreferences = () => {
    // TODO: Implement save logic for appearance preferences
    console.log("Appearance preferences saved");
  };
  
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-medium mb-2">Chart Preferences</h2>
        <p className="text-sm text-muted-foreground mb-6">Customize how charts are displayed</p>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-volume" className="font-medium">Show Volume</Label>
                <p className="text-sm text-muted-foreground">Display volume bars below price charts</p>
              </div>
              <Switch 
                id="show-volume" 
                checked={showVolume} 
                onCheckedChange={setShowVolume} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-grid-lines" className="font-medium">Grid Lines</Label>
                <p className="text-sm text-muted-foreground">Show horizontal grid lines on charts</p>
              </div>
              <Switch 
                id="show-grid-lines" 
                checked={showGridLines} 
                onCheckedChange={setShowGridLines} 
              />
            </div>
            
            <div className="pt-2">
              <Label htmlFor="chart-style" className="font-medium mb-2 block">Chart Style</Label>
              <Select defaultValue="candles">
                <SelectTrigger id="chart-style" className="w-full">
                  <SelectValue placeholder="Select chart style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candles">Candlesticks</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="ohlc">OHLC</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6">
          <Button onClick={handleSavePreferences}>Save Preferences</Button>
        </div>
      </div>
    </div>
  );
}
