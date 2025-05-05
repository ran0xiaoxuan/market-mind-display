
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  onFilterChange: (filters: { search: string; sortBy: string; timeframe: string }) => void;
  className?: string;
}

export function FilterBar({ onFilterChange, className }: FilterBarProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [timeframe, setTimeframe] = useState("all");
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    onFilterChange({ search: newSearch, sortBy, timeframe });
  };
  
  const handleSortChange = (value: string) => {
    setSortBy(value);
    onFilterChange({ search, sortBy: value, timeframe });
  };
  
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    onFilterChange({ search, sortBy, timeframe: value });
  };
  
  return (
    <div className={`flex flex-col gap-2 md:flex-row md:items-center md:justify-between ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search strategies..."
          value={search}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="return-high">Highest return</SelectItem>
            <SelectItem value="return-low">Lowest return</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={timeframe} onValueChange={handleTimeframeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="day">Last 24 hours</SelectItem>
            <SelectItem value="week">Last week</SelectItem>
            <SelectItem value="month">Last month</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon" className="hidden md:flex">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
