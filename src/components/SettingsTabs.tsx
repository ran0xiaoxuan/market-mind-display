
import { User, Bell, Contact, Sparkles } from "lucide-react";

type SettingsTab = "account" | "trading" | "contact" | "ai";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export function SettingsTabs({ activeTab, setActiveTab }: SettingsTabsProps) {
  const tabs = [
    { id: "account" as const, label: "Account", icon: <User className="h-4 w-4" /> },
    { id: "trading" as const, label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "ai" as const, label: "AI Service", icon: <Sparkles className="h-4 w-4" /> },
    { id: "contact" as const, label: "Contact Us", icon: <Contact className="h-4 w-4" /> },
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
