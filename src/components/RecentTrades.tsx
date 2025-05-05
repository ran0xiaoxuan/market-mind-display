
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "./FilterBar";

// Sample trades data
const allTrades = [
  {
    id: "T-1234",
    strategy: "RSI Strategy",
    type: "buy",
    asset: "AAPL",
    entry: "$175.23",
    exit: "$178.45",
    profit: "+1.8%",
    date: "2025-05-04"
  },
  {
    id: "T-1235",
    strategy: "Ichimoku Cloud",
    type: "sell",
    asset: "MSFT",
    entry: "$402.18",
    exit: "$398.62",
    profit: "+0.9%",
    date: "2025-05-03"
  },
  {
    id: "T-1236",
    strategy: "Moving Average Crossover",
    type: "sell",
    asset: "TSLA",
    entry: "$165.23",
    exit: "$152.30",
    profit: "-7.8%",
    date: "2025-05-02"
  },
  {
    id: "T-1237",
    strategy: "Bollinger Bands",
    type: "buy",
    asset: "AMZN",
    entry: "$184.70",
    exit: "$189.30",
    profit: "+2.5%",
    date: "2025-05-01"
  },
  {
    id: "T-1238",
    strategy: "MACD Strategy",
    type: "buy",
    asset: "NVDA",
    entry: "$924.63",
    exit: "$930.25",
    profit: "+0.6%",
    date: "2025-04-30"
  }
];

export function RecentTrades() {
  const [filteredTrades, setFilteredTrades] = useState(allTrades);

  const handleFilterChange = ({
    search,
    sortBy,
    timeframe
  }: {
    search: string;
    sortBy: string;
    timeframe: string;
  }) => {
    let result = [...allTrades];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        trade =>
          trade.strategy.toLowerCase().includes(searchLower) ||
          trade.asset.toLowerCase().includes(searchLower) ||
          trade.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply timeframe filter
    if (timeframe !== "all") {
      const now = new Date();
      let cutoffDate = new Date();
      
      if (timeframe === "day") {
        cutoffDate.setDate(now.getDate() - 1);
      } else if (timeframe === "week") {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (timeframe === "month") {
        cutoffDate.setMonth(now.getMonth() - 1);
      }
      
      result = result.filter(trade => new Date(trade.date) >= cutoffDate);
    }

    // Apply sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === "return-high") {
      result.sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit));
    } else if (sortBy === "return-low") {
      result.sort((a, b) => parseFloat(a.profit) - parseFloat(b.profit));
    }

    setFilteredTrades(result);
  };

  return (
    <Card>
      <div className="p-6 pb-3">
        <h3 className="text-lg font-semibold mb-2">Recent Trades</h3>
        <p className="text-sm text-muted-foreground mb-4">History of recent trading activity</p>
        
        <FilterBar 
          onFilterChange={handleFilterChange} 
          className="mb-4"
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Removed ID column */}
              <TableHead>Strategy</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Exit</TableHead>
              <TableHead>Profit/Loss</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((trade) => (
              <TableRow key={trade.id}>
                {/* Removed TableCell for ID */}
                <TableCell>{trade.strategy}</TableCell>
                <TableCell>
                  <Badge variant={trade.type === "buy" ? "outline" : "secondary"}>{trade.type}</Badge>
                </TableCell>
                <TableCell>{trade.asset}</TableCell>
                <TableCell>{trade.entry}</TableCell>
                <TableCell>{trade.exit}</TableCell>
                <TableCell className={`${trade.profit.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.profit}
                </TableCell>
                <TableCell>{trade.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

