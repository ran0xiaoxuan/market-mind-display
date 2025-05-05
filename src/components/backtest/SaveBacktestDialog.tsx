
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SaveBacktestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  backtestResults: any;
  strategyId: string;
  backtestParameters: {
    startDate: Date | undefined;
    endDate: Date | undefined;
    initialCapital: string;
    positionSize: string;
  };
}

export function SaveBacktestDialog({ 
  isOpen, 
  onClose, 
  backtestResults, 
  strategyId,
  backtestParameters 
}: SaveBacktestDialogProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please provide a name for this backtest");
      return;
    }

    setIsSaving(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save backtest results");
        setIsSaving(false);
        return;
      }
      
      // Format backtest parameters
      const formattedBacktest = {
        strategy_id: strategyId,
        user_id: user.id,
        start_date: backtestParameters.startDate,
        end_date: backtestParameters.endDate,
        initial_capital: parseFloat(backtestParameters.initialCapital),
        name: name,
        notes: notes,
        // Metrics from results
        total_return: parseFloat(backtestResults.performanceMetrics[0].value.replace('%', '')),
        annualized_return: parseFloat(backtestResults.performanceMetrics[1].value.replace('%', '')),
        sharpe_ratio: parseFloat(backtestResults.performanceMetrics[2].value),
        max_drawdown: parseFloat(backtestResults.performanceMetrics[3].value.replace('%', '')),
        win_rate: parseFloat(backtestResults.performanceMetrics[4].value.replace('%', '')),
        total_trades: parseInt(backtestResults.tradeStatistics[0].value),
        winning_trades: parseInt(backtestResults.tradeStatistics[1].value),
        losing_trades: parseInt(backtestResults.tradeStatistics[2].value),
        avg_profit: parseFloat(backtestResults.tradeStatistics[3].value.replace('$', '')),
        avg_loss: parseFloat(backtestResults.tradeStatistics[4].value.replace('$', '').replace('-', '')) * -1
      };
      
      // Insert into backtests table
      const { data, error } = await supabase
        .from('backtests')
        .insert(formattedBacktest)
        .select();
        
      if (error) {
        throw error;
      }
      
      toast.success("Backtest results saved successfully");
      onClose();
      
    } catch (error) {
      console.error("Error saving backtest:", error);
      toast.error("Failed to save backtest results");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Backtest Results</DialogTitle>
          <DialogDescription>
            Save your backtest results to review or compare later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Backtest Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Moving Average Crossover Test"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this backtest"
            />
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Results
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
