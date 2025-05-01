
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface StrategyCardProps {
  name: string;
  description: string;
  updatedAt: Date; // Changed from days to actual date
  asset: string;
  status: "active" | "inactive";
  id?: string; // Add id for linking to strategy details page
}

export function StrategyCard({
  name,
  description,
  updatedAt,
  asset,
  status,
  id
}: StrategyCardProps) {
  // Format the time distance with more precise units
  const formatTimeAgo = (date: Date) => {
    const timeAgo = formatDistanceToNow(date, { addSuffix: false });
    return timeAgo;
  };

  return (
    <Card className="overflow-hidden relative flex flex-col h-full">
      <div className="p-8 pb-20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-xl">{name}</h3>
          {status === "active" ? (
            <Badge variant="outline" className="bg-muted">Active</Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">Inactive</Badge>
          )}
        </div>
        
        <p className="text-muted-foreground mb-4 line-clamp-2 overflow-hidden text-ellipsis my-[15px] text-base">
          {description}
        </p>
        
        <div className="absolute bottom-14 left-8 right-8 grid grid-cols-2 gap-2 my-0">
          <div>
            <p className="text-muted-foreground text-xs py-0 my-0">Last Updated</p>
            <p className="text-sm font-medium">{formatTimeAgo(updatedAt)} ago</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Target Asset</p>
            <p className="text-sm font-medium">{asset || "Unknown"}</p>
          </div>
        </div>
        
        <Link 
          to={id ? `/strategy/${id}` : "/"} 
          className="text-sm inline-flex items-center hover:underline absolute bottom-8 left-8 py-0"
        >
          View Details <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
