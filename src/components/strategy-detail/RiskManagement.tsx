
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RiskManagementProps {
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    singleBuyVolume: string;
    maxBuyVolume: string;
  };
}

export const RiskManagement = ({ riskManagement }: RiskManagementProps) => {
  // Provide default values for missing or empty risk management data
  const getRiskManagementValue = (value: string | null | undefined, defaultValue: string = "Not set") => {
    return value && value.trim() !== "" ? value : defaultValue;
  };

  // More robust validation - only show error if riskManagement object is completely missing
  if (!riskManagement) {
    return (
      <Card className="p-6">
        <div className="mb-2">
          <h2 className="text-xl font-semibold">Risk Management</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to load risk management data. Please try again later.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // Remove the % symbol if it's present at the end of the string
  const formatPercentage = (value: string) => {
    if (!value || value === "Not set") return value;
    return value.endsWith('%') ? value : `${value}%`;
  };

  // Get values with defaults
  const stopLoss = getRiskManagementValue(riskManagement.stopLoss, "5%");
  const takeProfit = getRiskManagementValue(riskManagement.takeProfit, "10%");
  const singleBuyVolume = getRiskManagementValue(riskManagement.singleBuyVolume, "$1,000");
  const maxBuyVolume = getRiskManagementValue(riskManagement.maxBuyVolume, "$5,000");

  return (
    <Card className="p-6">
      <div className="mb-2">
        <h2 className="text-xl font-semibold">Risk Management</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Parameters to control risk exposure and trading volume
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Stop Loss</p>
            <p className="font-medium text-red-500">{formatPercentage(stopLoss)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Take Profit</p>
            <p className="font-medium text-green-500">{formatPercentage(takeProfit)}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Single Buy Volume</p>
            <p className="font-medium">{singleBuyVolume.startsWith('$') ? singleBuyVolume : formatCurrency(singleBuyVolume)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Buy Volume</p>
            <p className="font-medium">{maxBuyVolume.startsWith('$') ? maxBuyVolume : formatCurrency(maxBuyVolume)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
