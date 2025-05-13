
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "../ui/button";

interface StrategyDetailNavProps {
  strategyId: string;
  strategyName: string | null;
}

export function StrategyDetailNav({ strategyId, strategyName }: StrategyDetailNavProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Define navigation items for the strategy section
  const navItems = [
    { name: "Overview", href: `/strategy/${strategyId}` },
    { name: "Backtest History", href: `/backtest-history?strategyId=${strategyId}` },
    { name: "Edit History", href: `/edit-history/${strategyId}` },
  ];

  return (
    <div className="border-b mb-6">
      {/* Breadcrumb */}
      <div className="container py-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/strategies">Strategies</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{strategyName || "Strategy Details"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab navigation */}
      <div className="container flex overflow-auto">
        {navItems.map((item) => {
          // Determine if this nav item matches the current route
          const isActive = 
            item.name === "Overview" 
              ? pathname === `/strategy/${strategyId}`
              : location.pathname.includes(item.href.split('?')[0]);
          
          return (
            <Link key={item.name} to={item.href} className="mr-4">
              <Button 
                variant={isActive ? "default" : "ghost"} 
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4",
                  isActive && "border-primary bg-transparent text-primary hover:bg-transparent"
                )}
              >
                {item.name}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
