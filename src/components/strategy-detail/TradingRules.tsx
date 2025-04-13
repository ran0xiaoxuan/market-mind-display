import { Card } from "@/components/ui/card";
import { RuleGroup } from "./RuleGroup";
import { RuleGroupData } from "./types";
interface TradingRulesProps {
  entryRules: RuleGroupData[];
  exitRules: RuleGroupData[];
}
export const TradingRules = ({
  entryRules,
  exitRules
}: TradingRulesProps) => {
  return <Card className="p-6 mb-6">
      
      
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Entry Rules</h3>
        
        {entryRules.length > 0 && <>
            {/* AND Group */}
            <RuleGroup title="AND Group" color="blue" description="All conditions must be met." inequalities={entryRules[0].inequalities} />
            
            {/* OR Group */}
            {entryRules.length > 1 && <RuleGroup title="OR Group" color="amber" description={`At least one of ${entryRules[1].inequalities.length} conditions must be met.`} inequalities={entryRules[1].inequalities} />}
          </>}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Exit Rules</h3>
        
        {exitRules.length > 0 && <>
            {/* AND Group */}
            <RuleGroup title="AND Group" color="blue" description="All conditions must be met." inequalities={exitRules[0].inequalities} />
            
            {/* OR Group */}
            {exitRules.length > 1 && <RuleGroup title="OR Group" color="amber" description={`At least one of ${exitRules[1].inequalities.length} conditions must be met.`} inequalities={exitRules[1].inequalities} />}
          </>}
      </div>
    </Card>;
};