
import { User, BarChart2 } from "lucide-react";

type SettingsTab = "account" | "trading";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export function SettingsTabs({ activeTab, setActiveTab }: SettingsTabsProps) {
  const tabs = [
    { id: "account" as const, label: "Account", icon: <User className="h-4 w-4" /> },
    { id: "trading" as const, label: "Trading", icon: <BarChart2 className="h-4 w-4" /> },
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
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
