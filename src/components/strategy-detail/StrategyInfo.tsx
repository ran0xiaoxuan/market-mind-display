import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
interface StrategyInfoProps {
  strategy: any;
  isActive: boolean;
  onStatusChange: (checked: boolean) => void;
}
export const StrategyInfo = ({
  strategy,
  isActive,
  onStatusChange
}: StrategyInfoProps) => {
  return <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Strategy Information</h2>
      
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-medium">Strategy Introduction</h3>
        <p className="text-muted-foreground">{strategy.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="font-medium">{strategy.createdDate}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Updated</p>
          <p className="font-medium">{strategy.lastUpdated}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Market</p>
          <p className="font-medium">{strategy.market}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Timeframe</p>
          <p className="font-medium">{strategy.timeframe}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Target Asset</p>
          <p className="font-medium">{strategy.targetAsset}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="flex items-center gap-2">
            <Switch id="strategy-status" checked={isActive} onCheckedChange={onStatusChange} />
          </div>
        </div>
      </div>
    </Card>;
};