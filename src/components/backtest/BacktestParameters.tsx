import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ParametersProps {
  parameters: {
    [key: string]: string | number;
  };
  onParametersChange?: (params: any) => void;
}

export function BacktestParameters({ parameters, onParametersChange }: ParametersProps) {
  const [riskParams, setRiskParams] = useState({
    stopLoss: 5,
    takeProfit: 10,
    singleBuyVolume: 1000,
    maxBuyVolume: 5000
  });

  const handleRiskParamChange = (field: string, value: number) => {
    const newParams = { ...riskParams, [field]: value };
    setRiskParams(newParams);
    
    if (onParametersChange) {
      onParametersChange({
        ...parameters,
        ...newParams
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Time Period and Initial Capital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Time Period</h4>
          <div className="flex items-center gap-2 mb-1">
            <p>From: {parameters["Start Date"]}</p>
          </div>
          <div className="flex items-center gap-2">
            <p>To: {parameters["End Date"]}</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Initial Capital</h4>
          <div className="flex items-center gap-2">
            <p>${parameters["Initial Capital"]?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Risk Management Parameters */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Risk Management Parameters</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Configure risk management settings for this backtest
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="stopLoss">Stop Loss (%)</Label>
              <Input
                id="stopLoss"
                type="number"
                min="0"
                step="0.1"
                value={riskParams.stopLoss}
                onChange={(e) => handleRiskParamChange('stopLoss', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="takeProfit">Take Profit (%)</Label>
              <Input
                id="takeProfit"
                type="number"
                min="0"
                step="0.1"
                value={riskParams.takeProfit}
                onChange={(e) => handleRiskParamChange('takeProfit', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="singleBuyVolume">Single Buy Volume ($)</Label>
              <Input
                id="singleBuyVolume"
                type="number"
                min="0"
                step="100"
                value={riskParams.singleBuyVolume}
                onChange={(e) => handleRiskParamChange('singleBuyVolume', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxBuyVolume">Max Buy Volume ($)</Label>
              <Input
                id="maxBuyVolume"
                type="number"
                min="0"
                step="100"
                value={riskParams.maxBuyVolume}
                onChange={(e) => handleRiskParamChange('maxBuyVolume', parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
