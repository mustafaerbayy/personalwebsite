import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import ApplicationList from "@/components/ApplicationList";
import CalendarView from "@/components/CalendarView";
import ApplicationDrawer from "@/components/ApplicationDrawer";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import { Application, STATUS_LABELS } from "@/types/application";
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Plus,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    applications,
    departments,
    isLoading,
    createApplication,
    updateApplication,
    deleteApplication,
    createDepartment,
  } = useApplications();

  const [activeView, setActiveView] = useState<"list" | "calendar">("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const handleAdd = () => {
    setEditingApp(null);
    setIsReadOnly(false);
    setDrawerOpen(true);
  };

  const handleView = (app: Application) => {
    setEditingApp(app);
    setDetailsOpen(true);
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setIsReadOnly(false);
    setDrawerOpen(true);
  };

  const handleSave = async (data: any) => {
    if (data.id) {
      await updateApplication.mutateAsync(data);
      return data;
    } else {
      return await createApplication.mutateAsync(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu başvuruyu silmek istediğinize emin misiniz?")) {
      deleteApplication.mutate(id);
    }
  };

  // Stats
  const totalApps = applications.length;
  const activeApps = applications.filter(
    (a) => !["kabul", "reddedildi"].includes(a.status)
  ).length;
  const acceptedApps = applications.filter((a) => a.status === "kabul").length;
  const rejectedApps = applications.filter(
    (a) => a.status === "reddedildi"
  ).length;

  const stats = [
    {
      label: "Toplam Başvuru",
      value: totalApps,
      icon: Briefcase,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Aktif Süreç",
      value: activeApps,
      icon: Clock,
      color: "text-warning bg-warning/10",
    },
    {
      label: "Kabul",
      value: acceptedApps,
      icon: CheckCircle2,
      color: "text-success bg-success/10",
    },
    {
      label: "Ret",
      value: rejectedApps,
      icon: XCircle,
      color: "text-destructive bg-destructive/10",
    },
  ];

  const navItems = [
    { id: "list" as const, label: "Liste", icon: LayoutDashboard },
    { id: "calendar" as const, label: "Takvim", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">ME</span>
            </div>
            <span className="font-display font-semibold text-foreground hidden sm:inline">
              Mustafa Erbay
            </span>
          </div>

          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeView === item.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleAdd} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Yeni Başvuru</span>
            </Button>
            <ThemeToggle className="h-8 w-8" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={signOut}
              title="Çıkış Yap"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Mobile Toggle for Stats and Filters */}
        {isMobile && (
          <Button
            variant="outline"
            className="w-full flex items-center justify-between bg-card border-border shadow-sm h-11"
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">İstatistikler ve Filtreler</span>
            </div>
            {isStatsExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}

        <Collapsible open={!isMobile || isStatsExpanded}>
          <CollapsibleContent className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 transition-all hover:shadow-md"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      stat.color
                    )}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground leading-none">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Yükleniyor...
          </div>
        ) : activeView === "list" ? (
          <ApplicationList
            applications={applications}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showFilters={!isMobile || isStatsExpanded}
          />
        ) : (
          <CalendarView
            applications={applications}
            onSelectApp={handleView}
          />
        )}
      </main>

      <ApplicationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        application={editingApp}
        onSave={handleSave}
        onDelete={handleDelete}
        isReadOnly={isReadOnly}
        onEdit={() => setIsReadOnly(false)}
      />

      <ApplicationDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        application={editingApp}
        onEdit={handleEdit}
      />
    </div>
  );
}
