
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface StrategyDescriptionProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  showValidation?: boolean;
}

export const StrategyDescription = ({
  description,
  onDescriptionChange,
  showValidation = false,
}: StrategyDescriptionProps) => {
  return (
    <Card className="p-6 mb-10 border">
      <h2 className="text-xl font-semibold mb-2">Describe Your Ideal Strategy</h2>
      <p className="text-sm text-muted-foreground mb-4">Tell us about your trading goals and specific requirements</p>
      
      <Textarea 
        placeholder="Describe your ideal trading strategy. For example, I want a momentum-based strategy using RSI and MACD indicators, with a medium risk tolerance. Focus on mid-term investment time zones, with a profit-loss ratio of 2:1."
        className="min-h-[120px]"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
    </Card>
  );
};
