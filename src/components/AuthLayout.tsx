
import { Link } from "react-router-dom";
import { Box3D } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <Box3D className="h-5 w-5" />
          <span className="font-bold">StratAlge</span>
        </Link>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-muted-foreground">
        © {currentYear} StratAlge. All rights reserved.
      </footer>
    </div>
  );
}
