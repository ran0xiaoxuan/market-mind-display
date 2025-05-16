
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Strategy } from "@/services/strategyService";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";

interface StrategySelectProps {
  selectedStrategy: string;
  strategies: Strategy[];
  isLoading: boolean;
  onSelectStrategy: (strategyId: string) => void;
  disabled?: boolean;
}

export function StrategySelect({
  selectedStrategy,
  strategies,
  isLoading,
  onSelectStrategy,
  disabled = false,
}: StrategySelectProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>(strategies);

  // Filter strategies based on search query
  useEffect(() => {
    if (isSearchOpen && searchQuery) {
      const filtered = strategies.filter(
        strategy => 
          strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (strategy.description && strategy.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStrategies(filtered);
    } else {
      setFilteredStrategies(strategies);
    }
  }, [searchQuery, strategies, isSearchOpen]);

  // Find the selected strategy for display
  const selectedStrategyObj = strategies.find(s => s.id === selectedStrategy);

  const handleStrategySelect = (strategyId: string) => {
    onSelectStrategy(strategyId);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      <label htmlFor="strategy" className="text-sm font-medium">
        Strategy
      </label>
      
      <Button 
        variant="outline" 
        className="w-full justify-start text-left font-normal h-10 bg-background"
        onClick={() => setIsSearchOpen(true)}
        disabled={disabled}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        {selectedStrategyObj ? selectedStrategyObj.name : isLoading ? "Loading strategies..." : "Select a strategy"}
      </Button>
      
      <CommandDialog 
        open={isSearchOpen} 
        onOpenChange={(open) => {
          setIsSearchOpen(open);
          if (!open) {
            setSearchQuery("");
          }
        }}
      >
        <DialogTitle className="sr-only">
          Search Strategies
        </DialogTitle>
        <CommandInput 
          placeholder="Search strategies..." 
          value={searchQuery} 
          onValueChange={setSearchQuery}
          autoFocus={true}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? "No strategies found" : "Type to search"}
              </p>
            )}
          </CommandEmpty>
          
          {filteredStrategies.length > 0 && (
            <CommandGroup heading="Strategies">
              {filteredStrategies.map((strategy) => (
                <CommandItem 
                  key={strategy.id} 
                  value={`${strategy.name} ${strategy.description || ''}`}
                  onSelect={() => handleStrategySelect(strategy.id)}
                >
                  <div className="flex flex-col">
                    <span>{strategy.name}</span>
                    {strategy.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {strategy.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
