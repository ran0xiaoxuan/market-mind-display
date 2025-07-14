
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Trade {
  id?: string | number;
  date: string;
  type: string;
  signal: string;
  price: string;
  contracts: number;
  profit: string | null;
  profitPercentage?: string | null;
  strategyName?: string;
  targetAsset?: string;
  strategyId?: string;
}

interface TradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  title?: string;
}

export const TradeHistoryModal = ({ 
  isOpen, 
  onClose, 
  trades, 
  title = "Trade History"
}: TradeHistoryModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(trades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = trades.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when modal opens or trades change
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setCurrentPage(1);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <TradeHistoryTable trades={currentTrades} enableRowClick={true} />
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, trades.length)} of {trades.length} signals
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => goToPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
