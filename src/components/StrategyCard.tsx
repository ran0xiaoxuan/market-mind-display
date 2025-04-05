
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface StrategyCardProps {
  name: string;
  description: string;
  performance: string;
  days: number;
  asset: string;
  status: "active" | "inactive";
}

export function StrategyCard({ name, description, performance, days, asset, status }: StrategyCardProps) {
  // Convert strategy name to kebab case for URL
  const strategySlug = name.toLowerCase().replace(/ /g, "-");
  
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg">{name}</h3>
          {status === "active" ? (
            <Badge variant="outline" className="bg-muted">Active</Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">Inactive</Badge>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Performance</p>
            <p className={`text-sm font-medium ${
              performance.startsWith("+") ? "text-green-500" : "text-red-500"
            }`}>{performance}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium">{days} days ago</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Target Asset</p>
            <p className="text-sm font-medium">{asset}</p>
          </div>
        </div>
        
        <Link to={`/strategy/${strategySlug}`} className="text-sm inline-flex items-center hover:underline">
          View Details <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
