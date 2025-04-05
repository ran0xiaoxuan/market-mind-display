
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar, ChevronDown, Filter, RotateCw } from "lucide-react";

type PeriodSelectorProps = {
  period: string;
  onPeriodChange: (period: string) => void;
};

const periods = [
  "Last Week",
  "Last Month",
  "Last Quarter",
  "Last Year",
  "Year to Date",
  "Custom"
];

export function PeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {period}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0">
          <div className="flex flex-col">
            {periods.map((p) => (
              <Button
                key={p}
                variant="ghost"
                className="justify-start rounded-none"
                onClick={() => onPeriodChange(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon">
        <Filter className="h-4 w-4" />
      </Button>
      
      <Button variant="outline" size="icon">
        <RotateCw className="h-4 w-4" />
      </Button>
      
      <Button variant="outline" className="ml-2">
        Export
      </Button>
    </div>
  );
}
