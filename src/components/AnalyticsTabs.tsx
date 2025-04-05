
import { cn } from "@/lib/utils";

type AnalyticsTabsProps = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function AnalyticsTabs({ tabs, activeTab, onTabChange }: AnalyticsTabsProps) {
  return (
    <div className="flex flex-wrap gap-4 border-b pb-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "text-sm font-medium transition-colors",
            activeTab === tab
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
