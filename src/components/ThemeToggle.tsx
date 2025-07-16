
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface ThemeToggleProps {
  onSelect?: () => void;
}

export function ThemeToggle({ onSelect }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme()

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    onSelect?.()
  }

  return (
    <>
      <DropdownMenuItem 
        onClick={() => handleThemeChange("light")}
        className={`flex items-center ${theme === "light" ? "bg-accent" : ""}`}
      >
        <Sun className="mr-2 h-4 w-4" />
        <span>Light</span>
        {theme === "light" && <span className="ml-auto text-xs">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => handleThemeChange("dark")}
        className={`flex items-center ${theme === "dark" ? "bg-accent" : ""}`}
      >
        <Moon className="mr-2 h-4 w-4" />
        <span>Dark</span>
        {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => handleThemeChange("system")}
        className={`flex items-center ${theme === "system" ? "bg-accent" : ""}`}
      >
        <Monitor className="mr-2 h-4 w-4" />
        <span>System</span>
        {theme === "system" && <span className="ml-auto text-xs">✓</span>}
      </DropdownMenuItem>
    </>
  )
}
