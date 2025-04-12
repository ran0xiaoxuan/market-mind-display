
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, PlayIcon, Edit, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { History, LineChart, Trash2 } from "lucide-react";

interface StrategyHeaderProps {
  strategyId: string;
  strategyName: string;
}

export const StrategyHeader = ({ strategyId, strategyName }: StrategyHeaderProps) => {
  const { toast } = useToast();

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
                  toast({
                    title: "Backtest started",
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
                toast({
                  title: "Strategy copied",
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
                  onClick={() => {
                    toast({
                      title: "Delete strategy?",
                      description: "This action cannot be undone."
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Strategy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};
