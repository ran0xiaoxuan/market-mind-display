
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Trash } from "lucide-react";
import { deleteStrategy } from "@/services/strategyService";
import { toast } from "sonner";
import { useState } from "react";

interface StrategyCardProps {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
  asset: string;
  status: "active" | "inactive";
  onDeleted?: () => void;
}

export function StrategyCard({
  id,
  name,
  description,
  updatedAt,
  asset,
  status,
  onDeleted
}: StrategyCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this strategy? This action cannot be undone and will remove all associated trading signals and data.")) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteStrategy(id);
      toast.success("Strategy deleted successfully");

      // Call the onDeleted callback to refresh the parent component
      if (onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete strategy");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link to={`/strategy/${id}`} className="block">
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl truncate pr-2">{name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground line-clamp-3">{description}</p>
        </CardContent>
        <CardFooter className="pt-0 mt-auto">
          <div className="flex items-center justify-between text-sm text-muted-foreground w-full">
            <span>Asset: {asset}</span>
            <span>Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
