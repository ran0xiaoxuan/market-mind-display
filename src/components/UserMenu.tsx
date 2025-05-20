
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/Badge";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const handleClose = () => setOpen(false);
  
  const handleLogout = async () => {
    try {
      await signOut();
      handleClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Extract display name, username and email from user
  const displayName = user?.user_metadata?.display_name;
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || "User";
  const email = user?.email || "user@example.com";
  const isPro = user?.user_metadata?.is_pro === true;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-2 flex items-center justify-center">
          <UserRound size={18} className="text-primary" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4 border-b">
          <p className="font-medium">{displayName || username}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <div className="mt-2">
            <Badge variant={isPro ? 'pro' : 'free'}>
              {isPro ? 'Pro' : 'Free'}
            </Badge>
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
            onClick={handleLogout} 
            className="w-full justify-start px-4 py-2 h-auto text-red-500 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
