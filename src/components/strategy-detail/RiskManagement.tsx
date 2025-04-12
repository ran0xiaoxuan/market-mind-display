
import { Card } from "@/components/ui/card";

interface RiskManagementProps {
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    singleBuyVolume: string;
    maxBuyVolume: string;
  };
}

export const RiskManagement = ({ riskManagement }: RiskManagementProps) => {
  return (
    <Card className="p-6 mt-6">
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
            <p className="font-medium text-red-500">{riskManagement.stopLoss}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Take Profit</p>
            <p className="font-medium text-green-500">{riskManagement.takeProfit}%</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Single Buy Volume</p>
            <p className="font-medium">${riskManagement.singleBuyVolume}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Max Buy Volume</p>
            <p className="font-medium">${riskManagement.maxBuyVolume}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
