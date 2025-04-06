
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SettingsTabs } from "@/components/SettingsTabs";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { TradingSettings } from "@/components/settings/TradingSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";

type SettingsTab = "account" | "notifications" | "trading" | "appearance";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-6 px-4 md:px-8 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Manage your account settings and preferences
          </p>

          <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="mt-10">
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "notifications" && <NotificationSettings />}
            {activeTab === "trading" && <TradingSettings />}
            {activeTab === "appearance" && <AppearanceSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}
