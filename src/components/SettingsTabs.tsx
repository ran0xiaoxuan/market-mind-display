
import { User, Bell, Contact, TrendingUp } from "lucide-react";

type SettingsTab = "account" | "trading" | "live-trading" | "contact" | "discounts";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export function SettingsTabs({ activeTab, setActiveTab }: SettingsTabsProps) {
  const tabs = [
    { id: "account" as const, label: "Account" },
    { id: "trading" as const, label: "Notifications" },
    { id: "live-trading" as const, label: "Live Trading" },
    { id: "discounts" as const, label: "Discounts" },
    { id: "contact" as const, label: "Contact Us" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
            activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
