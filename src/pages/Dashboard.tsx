import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import ApplicationList from "@/components/ApplicationList";
import ApplicationBoard from "@/components/ApplicationBoard";
import CalendarView from "@/components/CalendarView";
import ApplicationDrawer from "@/components/ApplicationDrawer";
import ApplicationDetailsDialog from "@/components/ApplicationDetailsDialog";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import { Application } from "@/types/application";
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
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { user, profile, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!drawerOpen && !detailsOpen) {
      setSearchQuery("");
    }
  }, [drawerOpen, detailsOpen]);

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
      label: "Toplam",
      value: totalApps,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      label: "Aktif",
      value: activeApps,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Kabul",
      value: acceptedApps,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Ret",
      value: rejectedApps,
      icon: XCircle,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
  ];

  const navItems = [
    { id: "list" as const, label: "Liste", icon: LayoutDashboard },
    { id: "board" as const, label: "Pano", icon: Kanban },
    { id: "calendar" as const, label: "Takvim", icon: Calendar },
  ];

  const userName = profile?.full_name?.split(" ")[0] || "Kullanıcı";

  return (
    <div className="min-h-screen bg-background">
      {/* Top header - simplified for mobile */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-3 sm:px-6">
          {/* Left: Logo + greeting */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm shadow-primary/25">
              <span className="text-xs font-bold text-primary-foreground">BT</span>
            </div>
            {isMobile ? (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground leading-none">Merhaba 👋</span>
                <span className="text-sm font-semibold text-foreground leading-tight">{userName}</span>
              </div>
            ) : (
              <span className="font-display font-semibold text-foreground">
                Başvuru Takip
              </span>
            )}
          </div>

          {/* Center: View switcher (desktop only) */}
          {!isMobile && (
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all gap-1.5",
                    activeView === item.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Button
              onClick={handleTestEmail}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Durum Raporu Gönder"
            >
              <Mail className="h-4 w-4" />
            </Button>
            {!isMobile && (
              <Button onClick={handleAdd} size="sm" className="gap-1.5 h-9 px-3 shadow-sm shadow-primary/20">
                <Plus className="h-3.5 w-3.5" />
                <span>Yeni Başvuru</span>
              </Button>
            )}
            <ThemeToggle className="h-8 w-8" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setProfileOpen(true)}
              title="Hesap Ayarları"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={signOut}
                title="Çıkış Yap"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className={cn(
        "max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6",
        isMobile && "pb-24" // Space for bottom nav
      )}>
        {/* Compact inline stats for mobile */}
        {isMobile ? (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {stats.map((stat, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                key={stat.label}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 shrink-0 bg-card",
                  stat.borderColor
                )}
              >
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground leading-none">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{stat.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Desktop stats cards */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                key={stat.label}
                className={cn(
                  "rounded-xl border bg-card p-4 flex items-center gap-3 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden group",
                  stat.borderColor
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border backdrop-blur-sm relative z-10",
                    stat.bgColor,
                    stat.borderColor,
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
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        ) : activeView === "list" ? (
          <ApplicationList
            applications={applications}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCompleteDate={handleCompleteDate}
            showFilters={true}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all min-w-[60px]",
                  activeView === item.id
                    ? "text-primary"
                    : "text-muted-foreground active:scale-95"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-xl transition-all",
                  activeView === item.id && "bg-primary/10"
                )}>
                  <item.icon className={cn("h-5 w-5", activeView === item.id && "text-primary")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  activeView === item.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            ))}

            {/* FAB-style add button in bottom nav */}
            <button
              onClick={handleAdd}
              className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[60px]"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 -mt-2">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-primary">Ekle</span>
            </button>

            {/* Profile/Logout */}
            <button
              onClick={signOut}
              className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[60px] text-muted-foreground active:scale-95"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-xl">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Çıkış</span>
            </button>
          </div>
        </nav>
      )}

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

      <ProfileEditDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
