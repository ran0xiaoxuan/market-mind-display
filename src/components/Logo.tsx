
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/1dfc06f9-436b-4a12-b1b4-1d71d36807db.png" 
        alt="StratAlge Logo" 
        className={sizeClasses[size]} 
      />
      <span className="font-bold">StratAlge</span>
    </Link>
  );
}
