
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteStrategy } from "@/services/strategyService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle case where strategyId might be undefined or invalid
  if (!strategyId || strategyId === 'undefined') {
    return (
      <div className="mb-6">
        <Link to="/strategies" className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Strategies
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">Invalid Strategy</h1>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteStrategy = async () => {
    try {
      setIsDeleting(true);
      console.log("Deleting strategy with ID:", strategyId);
      await deleteStrategy(strategyId);
      toast.success("Strategy deleted", {
        description: "Your strategy has been successfully deleted"
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
            size="sm" 
            className="h-9 px-2.5 border border-input text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{isDeleting ? "Deleting..." : "Delete"}</span>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{strategyName}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDeleteStrategy}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
