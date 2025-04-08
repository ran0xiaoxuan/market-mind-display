
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { StrategyParameters } from "@/components/strategy/StrategyParameters";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";

const AIStrategy = () => {
  const [assetType, setAssetType] = useState<"stocks" | "cryptocurrency">("stocks");
  const [riskLevel, setRiskLevel] = useState(50);
  const [timeHorizon, setTimeHorizon] = useState<"short" | "medium" | "long">("medium");
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [strategyType, setStrategyType] = useState<string>("");
  const [strategyDescription, setStrategyDescription] = useState<string>("");

  const handleAssetTypeChange = (type: "stocks" | "cryptocurrency") => {
    setAssetType(type);
    setSelectedAsset(""); // Clear selection when changing asset type
  };

  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
  };

  const handleStrategyTypeSelect = (type: string) => {
    setStrategyType(type);
  };

  const handleGenerateStrategy = () => {
    // Logic for generating the strategy would go here
    console.log({
      assetType,
      selectedAsset,
      riskLevel,
      timeHorizon,
      strategyType,
      strategyDescription
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Strategy Generator</h1>
          <p className="text-muted-foreground">Select your asset type and describe your ideal trading strategy</p>
        </div>

        <AssetTypeSelector
          assetType={assetType}
          selectedAsset={selectedAsset}
          onAssetTypeChange={handleAssetTypeChange}
          onAssetSelect={handleAssetSelect}
        />

        <StrategyParameters
          riskLevel={riskLevel}
          timeHorizon={timeHorizon}
          strategyType={strategyType}
          onRiskLevelChange={setRiskLevel}
          onTimeHorizonChange={setTimeHorizon}
          onStrategyTypeChange={handleStrategyTypeSelect}
        />
        
        <StrategyDescription
          description={strategyDescription}
          onDescriptionChange={setStrategyDescription}
        />

        <div className="flex justify-end">
          <Button 
            className="w-full"
            onClick={handleGenerateStrategy}
          >
            Generate Strategy
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AIStrategy;
