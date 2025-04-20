import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [strategyUpdates, setStrategyUpdates] = useState(true);
  const [performanceAlerts, setPerformanceAlerts] = useState(true);
  const [platformUpdates, setPlatformUpdates] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [tradingSignals, setTradingSignals] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  return <div>
      <h2 className="text-xl font-medium mb-4">Notification Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">Choose how you want to be notified</p>
      
      <div className="space-y-8">
        <div className="pb-4 border-b">
          <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
          
          <div className="space-y-4">
            
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Performance Alerts</p>
                <p className="text-sm text-muted-foreground">Receive emails about significant performance changes</p>
              </div>
              <Switch checked={performanceAlerts} onCheckedChange={setPerformanceAlerts} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Platform Updates</p>
                <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
              </div>
              <Switch checked={platformUpdates} onCheckedChange={setPlatformUpdates} />
            </div>
          </div>
        </div>
        
        <div className="pb-4 border-b">
          <h3 className="text-lg font-medium mb-4">Push Notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Trading Signals</p>
                <p className="text-sm text-muted-foreground">Receive notifications for new trading signals</p>
              </div>
              <Switch checked={tradingSignals} onCheckedChange={setTradingSignals} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">Receive notifications for price alerts</p>
              </div>
              <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
            </div>
          </div>
        </div>
        
        <Button className="mt-4">Save Preferences</Button>
      </div>
    </div>;
}