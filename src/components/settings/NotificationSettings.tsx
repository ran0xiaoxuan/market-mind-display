
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [strategyUpdates, setStrategyUpdates] = useState(true);
  const [performanceAlerts, setPerformanceAlerts] = useState(true);
  const [platformUpdates, setPlatformUpdates] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(true);
  
  const handleSave = () => {
    toast.success("Notification preferences saved successfully");
  };

  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Platform Notification Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">Choose how you want to be notified about platform events</p>
      
      <div className="space-y-8">
        <div className="pb-4 border-b">
          <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Strategy Updates</p>
                <p className="text-sm text-muted-foreground">Receive emails when your strategies are updated</p>
              </div>
              <Switch 
                checked={strategyUpdates}
                onCheckedChange={setStrategyUpdates}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Performance Alerts</p>
                <p className="text-sm text-muted-foreground">Receive emails about significant performance changes</p>
              </div>
              <Switch 
                checked={performanceAlerts}
                onCheckedChange={setPerformanceAlerts}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Platform Updates</p>
                <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
              </div>
              <Switch 
                checked={platformUpdates}
                onCheckedChange={setPlatformUpdates}
              />
            </div>
          </div>
        </div>
        
        <div className="pb-4 border-b">
          <h3 className="text-lg font-medium mb-4">Push Notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Alerts</p>
                <p className="text-sm text-muted-foreground">Receive notifications for price alerts</p>
              </div>
              <Switch 
                checked={priceAlerts}
                onCheckedChange={setPriceAlerts}
              />
            </div>
          </div>
        </div>
        
        <Button className="mt-4" onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
}
