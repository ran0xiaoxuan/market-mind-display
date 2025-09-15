
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SettingsTabs } from "@/components/SettingsTabs";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { TradingSettings } from "@/components/settings/TradingSettings";
import { ContactUs } from "@/components/settings/ContactUs";
import { Discounts } from "@/components/settings/Discounts";

type SettingsTab = "account" | "trading" | "contact" | "discounts";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-6 px-4 md:px-8 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-8">Settings</h1>

          <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="mt-10 min-h-[600px]">
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "trading" && <TradingSettings />}
            {activeTab === "discounts" && <Discounts />}
            {activeTab === "contact" && <ContactUs />}
          </div>
        </div>
      </main>
    </div>
  );
}
