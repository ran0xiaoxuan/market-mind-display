
import { NotificationSettings } from "./NotificationSettings";
import { TestNotificationButton } from "../TestNotificationButton";

export function TradingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Trading Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your trading preferences and notification settings.
        </p>
      </div>
      
      <NotificationSettings />
      <TestNotificationButton />
    </div>
  );
}
