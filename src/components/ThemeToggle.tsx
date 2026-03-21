import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ className, label }: { className?: string, label?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="outline"
      size={label ? "sm" : "icon"}
      onClick={toggle}
      className={`gap-1.5 ${className}`}
      title={theme === "dark" ? "Açık mod" : "Koyu mod"}
    >
      {theme === "dark" ? (
        <Sun className={label ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : (
        <Moon className={label ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {label && <span>{label}</span>}
    </Button>
  );
}
