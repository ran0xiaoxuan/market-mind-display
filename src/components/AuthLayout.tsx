
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { ModeToggle } from "./ModeToggle";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b flex items-center justify-between">
        <Logo />
        <ModeToggle />
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
