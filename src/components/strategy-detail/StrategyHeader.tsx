
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, PlayIcon, Edit, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { History, LineChart, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { deleteStrategy } from "@/services/strategyService";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

interface StrategyHeaderProps {
  strategyId: string;
  strategyName: string;
}

export const StrategyHeader = ({ strategyId, strategyName }: StrategyHeaderProps) => {
  const navigate = useNavigate();
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDeleteStrategy = async () => {
    if (!strategyId) return;
    
    try {
      setIsDeleting(true);
      
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
      setIsDeleting(false); // Reset loading state
      setDeleteSheetOpen(false); // Close the sheet
    }
  };

  return (
    <div className="mb-6">
      <Link to="/strategies" className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">{strategyName}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" defaultValue="overview">
            <Link to={`/strategy/${strategyId}/edit`}>
              <Button variant="outline" size="sm" className="h-9 px-2.5 border border-input">
                <Edit className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>
            
            <ToggleGroupItem value="backtest" aria-label="Run Backtest" asChild>
              <Button 
                variant="outline" 
                className="h-9 px-2.5 border border-input" 
                onClick={() => {
                  toast("Backtest started", {
                    description: "Running backtest for this strategy..."
                  });
                }}
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Backtest</span>
              </Button>
            </ToggleGroupItem>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-2.5 border border-input" 
              onClick={() => {
                toast("Strategy copied", {
                  description: "A copy of this strategy has been created"
                });
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-2.5 border border-input">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <Link to={`/strategy/${strategyId}/history`}>
                  <DropdownMenuItem>
                    <History className="h-4 w-4 mr-2" />
                    Edit History
                  </DropdownMenuItem>
                </Link>
                <Link to={`/strategy/${strategyId}/backtests`}>
                  <DropdownMenuItem>
                    <LineChart className="h-4 w-4 mr-2" />
                    Backtest History
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onClick={() => setDeleteSheetOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Strategy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ToggleGroup>
        </div>
      </div>
      
      {/* Delete Confirmation Sheet - New implementation */}
      <Sheet open={deleteSheetOpen} onOpenChange={setDeleteSheetOpen}>
        <SheetContent>
          <SheetHeader className="pb-4">
            <SheetTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Strategy
            </SheetTitle>
            <SheetDescription>
              This action cannot be undone. This will permanently delete the
              strategy "{strategyName}" and all its associated data including:
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                • All trading rules and conditions
              </li>
              <li className="flex items-center gap-2">
                • Risk management parameters
              </li>
              <li className="flex items-center gap-2">
                • Backtest history and results
              </li>
              <li className="flex items-center gap-2">
                • Performance metrics and statistics
              </li>
            </ul>
          </div>
          
          <SheetFooter className="flex flex-col gap-3 sm:flex-row pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteSheetOpen(false)}
              disabled={isDeleting}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteStrategy}
              disabled={isDeleting}
              className="sm:flex-1"
            >
              {isDeleting ? (
                <>
                  <span className="animate-pulse">Deleting...</span>
                </>
              ) : (
                <>
                  Permanently Delete
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
