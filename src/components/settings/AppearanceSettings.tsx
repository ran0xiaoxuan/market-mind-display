
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon, Check, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function AppearanceSettings() {
  const {
    theme,
    setTheme
  } = useTheme();
  const [showVolume, setShowVolume] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);

  const handleSavePreferences = () => {
    // TODO: Implement save logic for appearance preferences
    console.log("Appearance preferences saved");
  };

  return <div className="space-y-12">
      <div>
        <h2 className="text-xl font-medium mb-2">Theme</h2>
        <p className="text-sm text-muted-foreground mb-6">Customize the appearance of the application</p>
        
        <div>
          <p className="text-sm font-medium mb-2">Color Theme</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setTheme("light")} className={`flex flex-col items-center justify-center h-32 rounded-md border transition-colors ${theme === "light" ? "border-primary ring-2 ring-primary ring-offset-2" : "border-input hover:bg-accent"}`}>
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Sun className="size-5" />
              </div>
              <p className="font-medium">Light</p>
              {theme === "light" && <div className="absolute top-2 right-2">
                  <Check className="size-4 text-primary" />
                </div>}
            </button>
            
            <button onClick={() => setTheme("dark")} className={`flex flex-col items-center justify-center h-32 rounded-md border transition-colors ${theme === "dark" ? "border-primary ring-2 ring-primary ring-offset-2" : "border-input hover:bg-accent"}`}>
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Moon className="size-5" />
              </div>
              <p className="font-medium">Dark</p>
              {theme === "dark" && <div className="absolute top-2 right-2">
                  <Check className="size-4 text-primary" />
                </div>}
            </button>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handleSavePreferences}
        className="w-full mt-6"
      >
        <Save className="mr-2 h-4 w-4" />
        Save Preferences
      </Button>
    </div>;
}
