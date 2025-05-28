
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface StrategyCardProps {
  name: string;
  description: string;
  updatedAt: Date;
  asset: string;
  status: "active" | "inactive";
  id?: string;
}

export function StrategyCard({
  name,
  description,
  updatedAt,
  asset,
  status,
  id
}: StrategyCardProps) {
  // Format the time distance with more precise units and capitalize if starts with "about"
  const formatTimeAgo = (date: Date) => {
    const timeAgo = formatDistanceToNow(date, { addSuffix: false });
    
    // Capitalize first letter if the string starts with "about"
    if (timeAgo.toLowerCase().startsWith('about')) {
      return timeAgo.charAt(0).toUpperCase() + timeAgo.slice(1);
    }
    
    return timeAgo;
  };

  return (
    <Link 
      to={id ? `/strategy/${id}` : "/"} 
      className="block h-full hover:no-underline"
    >
      <Card className="overflow-hidden relative flex flex-col h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <div className="p-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-xl">{name}</h3>
            {status === "active" ? (
              <Badge variant="outline" className="bg-muted">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">Inactive</Badge>
            )}
          </div>
          
          <p className="text-muted-foreground mb-6 line-clamp-2 overflow-hidden text-ellipsis text-base">
            {description}
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground text-xs">Last Updated</p>
              <p className="text-sm font-medium">{formatTimeAgo(updatedAt)} ago</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Target Asset</p>
              <p className="text-sm font-medium">{asset || "Unknown"}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
