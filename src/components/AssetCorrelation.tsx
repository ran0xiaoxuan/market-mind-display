
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

const correlationData = [
  { 
    asset: "S&P 500", 
    correlation: "0.75",
    beta: "0.68", 
    rSquared: "0.56"
  },
  { 
    asset: "Nasdaq", 
    correlation: "0.82",
    beta: "0.72", 
    rSquared: "0.67"
  },
  { 
    asset: "Dow Jones", 
    correlation: "0.65",
    beta: "0.58", 
    rSquared: "0.42"
  },
  { 
    asset: "Gold", 
    correlation: "-0.25",
    beta: "-0.18", 
    rSquared: "0.06"
  },
  { 
    asset: "Bitcoin", 
    correlation: "0.35",
    beta: "0.28", 
    rSquared: "0.12"
  }
];

export function AssetCorrelation() {
  return (
    <Card>
      <div className="p-6 pb-3">
        <h3 className="text-lg font-semibold mb-2">Asset Correlation</h3>
        <p className="text-sm text-muted-foreground">Correlation between portfolio and major assets</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Correlation</TableHead>
            <TableHead>Beta</TableHead>
            <TableHead>R-Squared</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {correlationData.map((row) => (
            <TableRow key={row.asset}>
              <TableCell>{row.asset}</TableCell>
              <TableCell>{row.correlation}</TableCell>
              <TableCell>{row.beta}</TableCell>
              <TableCell>{row.rSquared}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
