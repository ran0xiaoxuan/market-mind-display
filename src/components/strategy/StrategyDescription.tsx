
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
      <p className="text-sm text-muted-foreground mb-4">
        Tell us about your trading goals and specific requirements. The more detail you provide, 
        the better the AI can generate a strategy tailored to your needs.
      </p>
      
      <Textarea 
        placeholder="Describe your ideal trading strategy in detail. For example: 'I want a momentum-based 5-min strategy using RSI and MACD indicators, with a medium risk tolerance.'"
        className="min-h-[150px]"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
      
      <div className="mt-3 text-xs text-muted-foreground">
        <p>💡 <strong>Pro tip:</strong> Be specific with indicators, timeframes and risk tolerance you want.</p>
      </div>

      {showValidation && description.trim().length < 20 && (
        <div className="mt-2 text-sm text-red-500">
          Please provide a more detailed description (at least 20 characters).
        </div>
      )}
    </Card>
  );
};
