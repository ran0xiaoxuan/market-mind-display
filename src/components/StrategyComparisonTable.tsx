import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

const strategies = [
  { 
    name: "RSI Strategy", 
    return: "+12.5%", 
    sharpe: "1.85",
    maxDrawdown: "-4.1%",
    winRate: "68%",
    profitFactor: "2.1"
  },
  { 
    name: "Ichimoku Cloud", 
    return: "+9.8%", 
    sharpe: "1.62",
    maxDrawdown: "-5.8%",
    winRate: "64%",
    profitFactor: "1.9"
  },
  { 
    name: "Moving Average Crossover", 
    return: "+8.2%", 
    sharpe: "1.40",
    maxDrawdown: "-5.2%",
    winRate: "62%",
    profitFactor: "1.8"
  },
  { 
    name: "Bollinger Bands", 
    return: "+5.7%", 
    sharpe: "1.20",
    maxDrawdown: "-6.3%",
    winRate: "58%",
    profitFactor: "1.6"
  },
  { 
    name: "MACD Strategy", 
    return: "+3.2%", 
    sharpe: "0.95",
    maxDrawdown: "-7.1%",
    winRate: "52%",
    profitFactor: "1.3"
  }
];

const getColorClass = (value: string, columns: string[] = ['return', 'maxDrawdown', 'sharpe', 'profitFactor']) => {
  if (columns.includes('return') || columns.includes('maxDrawdown')) {
    if (value.startsWith("+")) return "text-green-600";
    if (value.startsWith("-")) return "text-red-600";
  }
  if (columns.includes('sharpe') || columns.includes('profitFactor')) {
    return "text-black";
  }
  return "";
};

export function StrategyComparisonTable() {
  return (
    <Card>
      <div className="p-6 pb-0">
        <h3 className="text-lg font-semibold mb-2">Detailed Comparison</h3>
        <p className="text-sm text-muted-foreground mb-4">Side-by-side metrics comparison</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Strategy</TableHead>
            <TableHead>Return</TableHead>
            <TableHead>Sharpe</TableHead>
            <TableHead>Max DD</TableHead>
            <TableHead>Win Rate</TableHead>
            <TableHead>Profit Factor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {strategies.map((strategy) => (
            <TableRow key={strategy.name}>
              <TableCell>{strategy.name}</TableCell>
              <TableCell className={getColorClass(strategy.return, ['return'])}>{strategy.return}</TableCell>
              <TableCell className={getColorClass(strategy.sharpe, ['sharpe'])}>{strategy.sharpe}</TableCell>
              <TableCell className={getColorClass(strategy.maxDrawdown, ['maxDrawdown'])}>{strategy.maxDrawdown}</TableCell>
              <TableCell>{strategy.winRate}</TableCell>
              <TableCell className={getColorClass(strategy.profitFactor, ['profitFactor'])}>{strategy.profitFactor}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
