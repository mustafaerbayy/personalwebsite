import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import ApplicationList from "@/components/ApplicationList";
import ApplicationBoard from "@/components/ApplicationBoard";
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
  Kanban,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const [activeView, setActiveView] = useState<"list" | "board" | "calendar">("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const handleTestEmail = async () => {
    try {
      toast.info("Hatırlatıcılar taranıyor...");
      const { data, error } = await supabase.functions.invoke("send-reminders", {
        body: { action: "manual_test" }
      });

      if (error) throw error;

      if (data?.message) {
        toast.info(data.message);
      } else if (data?.success) {
        toast.success(`E-postalar başarıyla yollandı! (${data.count} başvuru)`);
      }
      console.log("Reminders response:", data);
    } catch (error: any) {
      console.error("Test email error details:", error);
      let errorMessage = error.message || "Hatırlatıcı isteği başarısız oldu.";

      // Try to get specific error message from function response
      if (error.context && error.context.json && error.context.json.error) {
        errorMessage = error.context.json.error;
      }

      toast.error(`Hata: ${errorMessage}`);
    }
  };

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

  const handleArchive = async (app: Application) => {
    const isArchived = !app.is_archived;
    await updateApplication.mutateAsync({
      id: app.id,
      is_archived: isArchived,
      archived_at: isArchived ? new Date().toISOString() : null,
    } as any);
  };

  const handleCompleteDate = async (app: Application) => {
    if (!app.important_date) return;

    const historyItem = {
      date: app.important_date,
      label: app.important_date_label || "",
      status: app.status,
      completed_at: new Date().toISOString()
    };

    const currentHistory = Array.isArray(app.date_history) ? app.date_history : [];

    await updateApplication.mutateAsync({
      id: app.id,
      important_date: null,
      important_date_label: null,
      date_history: [...currentHistory, historyItem]
    } as any);
  };

  const handleRevertDate = async (app: Application, indexToRevert: number) => {
    if (!app.date_history || !Array.isArray(app.date_history)) return;
    if (indexToRevert < 0 || indexToRevert >= app.date_history.length) return;

    const historyList = [...app.date_history];
    const itemToRevert = historyList.splice(indexToRevert, 1)[0] as any;

    await updateApplication.mutateAsync({
      id: app.id,
      important_date: itemToRevert.date,
      important_date_label: itemToRevert.label,
      status: itemToRevert.status,
      date_history: historyList
    } as any);
  };

  // Stats
  const totalApps = applications.length;
  const activeApps = applications.filter(
    (a) => !["kabul", "reddedildi"].includes(a.status) && !a.is_archived
  ).length;
  const acceptedApps = applications.filter((a) => a.status === "kabul" && !a.is_archived).length;
  const rejectedApps = applications.filter(
    (a) => a.status === "reddedildi" && !a.is_archived
  ).length;

  const stats = [
    {
      label: "Toplam Başvuru",
      value: totalApps,
      icon: Briefcase,
      color: "text-primary bg-primary/10 border-primary/20",
      gradient: "from-primary/5 to-transparent",
    },
    {
      label: "Aktif Süreç",
      value: activeApps,
      icon: Clock,
      color: "text-warning bg-warning/10 border-warning/20",
      gradient: "from-warning/5 to-transparent",
    },
    {
      label: "Kabul",
      value: acceptedApps,
      icon: CheckCircle2,
      color: "text-success bg-success/10 border-success/20",
      gradient: "from-success/5 to-transparent",
    },
    {
      label: "Ret",
      value: rejectedApps,
      icon: XCircle,
      color: "text-destructive bg-destructive/10 border-destructive/20",
      gradient: "from-destructive/5 to-transparent",
    },
  ];

  const navItems = [
    { id: "list" as const, label: "Liste", icon: LayoutDashboard },
    { id: "board" as const, label: "Pano", icon: Kanban },
    { id: "calendar" as const, label: "Takvim", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-2 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-bold text-primary-foreground">ME</span>
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
                  "flex items-center rounded-md px-2 py-1.5 sm:px-3 text-sm font-medium transition-all sm:gap-1.5",
                  activeView === item.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button onClick={handleTestEmail} variant="outline" size="sm" className="sm:gap-1.5 flex text-primary hover:text-primary border-primary/20 hover:bg-primary/10 h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3">
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Durum Raporu Gönder</span>
            </Button>
            <Button onClick={handleAdd} size="sm" className="sm:gap-1.5 h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Yeni Başvuru</span>
            </Button>
            <ThemeToggle className="h-7 w-7 sm:h-8 sm:w-8" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
              onClick={signOut}
              title="Çıkış Yap"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
              {stats.map((stat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  key={stat.label}
                  className={cn(
                    "rounded-xl border border-border bg-card p-4 flex items-center gap-3 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden group",
                    `bg-gradient-to-br ${stat.gradient}`
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border backdrop-blur-sm relative z-10",
                      stat.color
                    )}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="relative z-10">
                    <motion.p
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 + 0.2, type: "spring" }}
                      className="text-2xl font-display font-bold text-foreground leading-none"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
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
            onCompleteDate={handleCompleteDate}
            showFilters={!isMobile || isStatsExpanded}
          />
        ) : activeView === "board" ? (
          <ApplicationBoard
            applications={applications}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCompleteDate={handleCompleteDate}
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
        onArchive={handleArchive}
        isReadOnly={isReadOnly}
        onEdit={() => setIsReadOnly(false)}
      />

      <ApplicationDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        application={editingApp}
        onEdit={handleEdit}
        onCompleteDate={handleCompleteDate}
        onRevertDate={handleRevertDate}
      />
    </div>
  );
}
