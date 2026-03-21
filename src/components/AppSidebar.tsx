import { LayoutDashboard, Calendar, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  activeView: "list" | "calendar";
  onViewChange: (view: "list" | "calendar") => void;
}

export default function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { signOut } = useAuth();

  const navItems = [
    { id: "list" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar" as const, label: "Takvim", icon: Calendar },
  ];

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">ME</span>
        </div>
        <span className="font-display font-semibold text-sm text-foreground">Mustafa Erbay</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeView === item.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-2">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
