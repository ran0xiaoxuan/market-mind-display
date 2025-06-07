
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { BacktestProgress } from "@/hooks/useBacktestProgress";

interface BacktestProgressIndicatorProps {
  progress: BacktestProgress | null;
  isRunning: boolean;
  onCancel?: () => void;
}

export const BacktestProgressIndicator = ({ 
  progress, 
  isRunning, 
  onCancel 
}: BacktestProgressIndicatorProps) => {
  if (!isRunning || !progress) return null;

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStageIcon(progress.stage)}
              <span className="font-medium text-sm">{progress.message}</span>
            </div>
            {onCancel && progress.stage !== 'complete' && progress.stage !== 'error' && (
              <button
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancel
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            <Progress 
              value={progress.progress} 
              className="h-2"
              style={{
                '--progress-background': getStageColor(progress.stage)
              } as React.CSSProperties}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress: {Math.round(progress.progress)}%</span>
              <span className="capitalize">{progress.stage}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
