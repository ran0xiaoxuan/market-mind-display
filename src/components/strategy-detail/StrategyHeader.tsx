
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PlayIcon, Edit, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { History, LineChart, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteStrategy } from "@/services/strategyService";

interface StrategyHeaderProps {
  strategyId: string;
  strategyName: string;
}

export const StrategyHeader = ({
  strategyId,
  strategyName
}: StrategyHeaderProps) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteStrategy = async () => {
    if (!confirm("Are you sure you want to delete this strategy? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log("Deleting strategy with ID:", strategyId);
      await deleteStrategy(strategyId);
      toast.success("Strategy deleted", {
        description: "The strategy has been successfully deleted"
      });

      // Navigate to strategies page after successful deletion
      navigate('/strategies');
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast.error("Failed to delete strategy", {
        description: "An error occurred while trying to delete the strategy"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBacktestClick = () => {
    // Navigate to backtest page with strategy ID in URL search params
    navigate(`/backtest?strategyId=${strategyId}`);
    toast("Backtest preparation", {
      description: "Loading backtest page for this strategy..."
    });
  };

  return (
    <div className="mb-6">
      <Link to="/strategies" className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">{strategyName || "Strategy Details"}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-2.5 border border-input" 
            onClick={() => navigate(`/strategy/${strategyId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-9 px-2.5 border border-input" 
            onClick={handleBacktestClick}
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Backtest</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-2.5 border border-input text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDeleteStrategy}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{isDeleting ? "Deleting..." : "Delete"}</span>
          </Button>
            
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-2.5 border border-input">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/edit-history/${strategyId}`)}>
                <History className="h-4 w-4 mr-2" />
                Edit History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/backtest-history?strategyId=${strategyId}`)}>
                <LineChart className="h-4 w-4 mr-2" />
                Backtest History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
