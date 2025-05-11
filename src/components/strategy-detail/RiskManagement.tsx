
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RiskManagementProps {
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    singleBuyVolume: string;
    maxBuyVolume: string;
  };
}

export const RiskManagement = ({ riskManagement }: RiskManagementProps) => {
  // More robust validation to check if riskManagement data is valid
  const isValidData = riskManagement && 
    typeof riskManagement.stopLoss === 'string' && 
    typeof riskManagement.takeProfit === 'string' &&
    typeof riskManagement.singleBuyVolume === 'string' && 
    typeof riskManagement.maxBuyVolume === 'string';

  if (!isValidData) {
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
    return value.endsWith('%') ? value : `${value}%`;
  };

  // Format currency values - always display with $ prefix
  const formatCurrency = (value: string) => {
    if (!value) return "$0";
    
    // Remove any percentage signs if they exist
    const cleanValue = value.replace(/%/g, '').trim();
    
    // Check if the value already starts with $ symbol
    return cleanValue.startsWith('$') ? cleanValue : `$${cleanValue}`;
  };

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
            <p className="font-medium text-red-500">{formatPercentage(riskManagement.stopLoss)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Take Profit</p>
            <p className="font-medium text-green-500">{formatPercentage(riskManagement.takeProfit)}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Single Buy Volume</p>
            <p className="font-medium">{formatCurrency(riskManagement.singleBuyVolume)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Buy Volume</p>
            <p className="font-medium">{formatCurrency(riskManagement.maxBuyVolume)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
