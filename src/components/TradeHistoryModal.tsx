
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TradeHistoryTable } from "@/components/strategy-detail/TradeHistoryTable";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <TradeHistoryTable trades={trades} />
      </DialogContent>
    </Dialog>
  );
};
