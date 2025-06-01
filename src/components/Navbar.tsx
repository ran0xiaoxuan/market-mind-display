import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Logo />
            </div>
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    location.pathname === "/dashboard"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/strategies"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    location.pathname.startsWith("/strategies")
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                  }`}
                >
                  Strategies
                </Link>
                <Link
                  to="/recommendations"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    location.pathname === "/recommendations"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                  }`}
                >
                  Recommendations
                </Link>
                <Link
                  to="/backtest"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    location.pathname.startsWith("/backtest")
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                  }`}
                >
                  Backtest
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
            <div className="sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-expanded="false"
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Open main menu</span>
                {/* Heroicon name: outline/bars-3 */}
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                {/* Heroicon name: outline/x-mark */}
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sm:hidden">
        <div className={`${isMenuOpen ? 'block' : 'hidden'} space-y-1 px-2 pb-3 pt-2`}>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
              <Link
                to="/strategies"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={closeMobileMenu}
              >
                Strategies
              </Link>
              <Link
                to="/recommendations"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={closeMobileMenu}
              >
                Recommendations
              </Link>
              <Link
                to="/backtest"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={closeMobileMenu}
              >
                Backtest
              </Link>
              <Link
                to="/settings"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={closeMobileMenu}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  closeMobileMenu();
                }}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full text-left"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={closeMobileMenu}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={closeMobileMenu}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
