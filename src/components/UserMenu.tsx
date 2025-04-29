
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { LogOut, Moon, Settings, Sun, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const handleClose = () => setOpen(false);
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Extract username and email from user
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || "User";
  const email = user?.email || "user@example.com";
  
  // Get first letter of username for avatar fallback
  const initialsForAvatar = username.charAt(0).toUpperCase();
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url || DEFAULT_AVATAR_URL} alt={username} />
            <AvatarFallback className="bg-primary text-primary-foreground">{initialsForAvatar}</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4 border-b">
          <p className="font-medium">{username}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="mt-2">
            <span className="px-2 py-1 text-xs bg-secondary rounded-full">Free</span>
          </div>
        </div>
        
        <div className="py-2">
          <Link to="/settings" onClick={handleClose}>
            <Button variant="ghost" className="w-full justify-start px-4 py-2 h-auto">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start px-4 py-2 h-auto"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full justify-start px-4 py-2 h-auto text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
