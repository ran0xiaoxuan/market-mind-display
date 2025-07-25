
import { formatCurrency } from "@/lib/utils";

interface RiskManagementProps {
  parameters: {
    [key: string]: string | number;
  };
}

export function BacktestRiskManagement({ parameters }: RiskManagementProps) {
  // Format values with proper symbols
  const formatPercentage = (value: string | number | undefined) => {
    if (value === undefined || value === '') return "0%";
    return typeof value === 'string' && value.endsWith('%') ? value : `${value}%`;
  };

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">Risk Management</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Stop Loss</p>
          <p className="font-medium text-red-500">{formatPercentage(parameters["Stop Loss"] || "-2.5")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Take Profit</p>
          <p className="font-medium text-green-500">{formatPercentage(parameters["Take Profit"] || "5.0")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Single Buy Volume</p>
          <p className="font-medium">{formatCurrency(parameters["Single Buy Volume"] || "1000")}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Max Buy Volume</p>
          <p className="font-medium">{formatCurrency(parameters["Max Buy Volume"] || "5000")}</p>
        </div>
      </div>
    </div>
  );
}
