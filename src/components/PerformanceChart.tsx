
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

type ChartType = "equity" | "returns" | "drawdown";

type PerformanceChartProps = {
  type?: ChartType;
};

type ChartPlaceholderProps = {
  title: string;
  description: string;
}

function ChartPlaceholder({ title, description }: ChartPlaceholderProps) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {description}
      </p>
    </div>
  );
}

const chartData: Record<ChartType, { title: string, description: string }> = {
  equity: {
    title: "Equity curve data not available",
    description: "This chart would display your portfolio value over time, showing the growth of your investments."
  },
  returns: {
    title: "Returns data not available",
    description: "This chart would display monthly or periodic returns, showing the performance in each time period."
  },
  drawdown: {
    title: "Drawdown data not available",
    description: "This chart would display periods of decline from previous peaks, helping you understand risk."
  }
};

export function PerformanceChart({ type }: PerformanceChartProps) {
  return (
    <Card className="pt-6">
      <Tabs defaultValue="equity" className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="equity" className="p-0 pt-4">
          <ChartPlaceholder {...chartData.equity} />
        </TabsContent>
        <TabsContent value="returns" className="p-0 pt-4">
          <ChartPlaceholder {...chartData.returns} />
        </TabsContent>
        <TabsContent value="drawdown" className="p-0 pt-4">
          <ChartPlaceholder {...chartData.drawdown} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
