
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Palette } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b flex justify-between items-center">
        <Logo />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Palette className="h-5 w-5" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ThemeToggle />
          </DropdownMenuContent>
        </DropdownMenu>
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
