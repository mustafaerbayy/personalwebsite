import { useState, useMemo } from "react";
import { ExternalLink, Pencil, Search, SlidersHorizontal, ArrowUpDown, MoreHorizontal, Trash2, Briefcase, Check, Archive, ChevronDown, ChevronRight } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/StatusBadge";
import { Application, ApplicationStatus, STATUS_LABELS } from "@/types/application";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ApplicationListProps {
  applications: Application[];
  onAdd: () => void;
  onView: (app: Application) => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onCompleteDate?: (app: Application) => void;
  showFilters?: boolean;
}

type SortKey = "institution_name" | "status" | "important_date" | "created_at";
type SortDir = "asc" | "desc";

export default function ApplicationList({
  applications,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onCompleteDate,
  showFilters = true
}: ApplicationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getDomain = (url: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  const { filtered, archivedApps } = useMemo(() => {
    let result = applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          app.institution_name.toLowerCase().includes(q) ||
          app.program_name.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const isActiveSearch = !!search;
    
    // archivedApps will be the subset of applications that have is_archived: true
    // regardless of the current status filter (stays archived and separate)
    const archiveList = applications.filter((a) => {
      const archived = a.is_archived === true;
      if (!archived) return false;
      if (search) return false; // In search mode, they go to the main results
      return true;
    });

    const activeList = result.filter(a => isActiveSearch ? true : (a.is_archived !== true));

    const now = new Date();
    function getStatusPriority(status: string): number {
      switch (status) {
        case "kabul": return 1;
        case "ik_mulakati": return 2;
        case "online_degerlendirme": return 3;
        case "basvuruldu": return 4;
        case "reddedildi": return 5;
        default: return 6;
      }
    }

    activeList.sort((a, b) => {
      const hasDateA = !!a.important_date;
      const hasDateB = !!b.important_date;

      if (hasDateA && !hasDateB) return -1;
      if (!hasDateA && hasDateB) return 1;

      if (hasDateA && hasDateB) {
        const diffA = Math.abs(new Date(a.important_date!).getTime() - now.getTime());
        const diffB = Math.abs(new Date(b.important_date!).getTime() - now.getTime());
        return diffA - diffB;
      }

      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    archiveList.sort((a, b) => {
      return new Date(b.archived_at || b.created_at).getTime() - new Date(a.archived_at || a.created_at).getTime();
    });

    return { filtered: activeList, archivedApps: archiveList };
  }, [applications, statusFilter, search, sortKey, sortDir]);


  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => toggleSort(field)}
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", sortKey === field && "text-primary")} />
    </button>
  );

  const renderDesktopRow = (app: Application) => (
    <tr
      key={app.id}
      className="hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => onView(app)}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-muted border border-border overflow-hidden">
            {getDomain(app.website_url) ? (
              <img 
                src={`https://logo.clearbit.com/${getDomain(app.website_url)}`} 
                alt={app.institution_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={cn("absolute inset-0 bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase", 
                            getDomain(app.website_url) ? "hidden" : "flex")}>
              {app.institution_name.substring(0, 2)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground flex items-center gap-2">
              {app.institution_name}
              {app.is_archived && <span title="Arşivlenmiş"><Archive className="h-3.5 w-3.5 text-muted-foreground" /></span>}
            </span>
            {app.website_url && (
              <a
                href={app.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-muted-foreground">{app.program_name}</td>

      <td className="px-4 py-3.5">
        <StatusBadge status={app.status as ApplicationStatus} />
      </td>
      <td className="px-4 py-3.5 text-muted-foreground text-sm">
        <div className="flex items-center gap-2 group/date">
          {app.important_date
            ? format(new Date(app.important_date), "d MMM yyyy" + (format(new Date(app.important_date), "HH:mm") !== "00:00" ? " HH:mm" : ""), { locale: tr })
            : "—"}
          {app.important_date && (new Date(app.important_date).getTime() - Date.now() < 24 * 60 * 60 * 1000 * 3) && (new Date(app.important_date).getTime() > Date.now()) && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
          )}
          {app.important_date && onCompleteDate && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-success/30 text-success hover:bg-success/10 hover:border-success/50 opacity-0 group-hover/date:opacity-100 transition-all shadow-sm ml-1"
              onClick={(e) => { e.stopPropagation(); onCompleteDate(app); }}
              title="Tamamlandı"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onEdit(app); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 border-border bg-card">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(app); }} className="gap-2">
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(app.id); }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );

  const renderMobileCard = (app: Application) => (
    <div
      key={app.id}
      className="group relative bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer pl-5"
      onClick={() => onView(app)}
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl",
        app.status === "basvuruldu" ? "bg-orange-500" :
        app.status === "online_degerlendirme" ? "bg-purple-500" :
        app.status === "ik_mulakati" ? "bg-pink-500" :
        app.status === "kabul" ? "bg-emerald-500" :
        "bg-rose-500"
      )} />
      
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate flex items-center gap-1.5">
              {app.institution_name}
              {app.is_archived && <span title="Arşivlenmiş"><Archive className="h-3 w-3 text-muted-foreground shrink-0" /></span>}
            </p>
            <p className="text-sm text-muted-foreground truncate">{app.program_name}</p>
          </div>
          <div className="flex items-center gap-1.5 self-start">
            <StatusBadge status={app.status as ApplicationStatus} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onEdit(app); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>



        <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
          {app.important_date && (new Date(app.important_date).getTime() > Date.now()) ? (
            <div className="flex flex-col text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1.5 rounded-md border border-orange-500/20">
              <span className="font-medium">
                {format(new Date(app.important_date), "dd MMM yyyy" + (format(new Date(app.important_date), "HH:mm") !== "00:00" ? " HH:mm" : ""), { locale: tr })}
              </span>
              <span className="text-[10px] opacity-80">{app.important_date_label || "Yaklaşan Tarih"}</span>
            </div>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex-1" /> {/* Spacer to replace the middle date area */}



          <div className="flex items-center gap-1">
            {app.important_date && onCompleteDate && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-success/30 text-success hover:bg-success/10 hover:border-success/50 transition-all shadow-sm"
                onClick={(e) => { e.stopPropagation(); onCompleteDate(app); }}
                title="Tamamlandı"
              >
                <Check className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kurum veya program ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-card">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Tüm durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3">
                <SortHeader label="Kurum" field="institution_name" />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Program
              </th>

              <th className="text-left px-4 py-3">
                <SortHeader label="Durum" field="status" />
              </th>
              <th className="text-left px-4 py-3">
                <SortHeader label="Tarih" field="important_date" />
              </th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-muted-foreground">
                  <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Briefcase className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">Henüz Başvuru Bulunamadı</h3>
                      <p className="text-sm max-w-[250px] mx-auto">Kariyer yolculuğunuza başlamak için hemen yeni bir başvuru ekleyin.</p>
                    </div>
                    <Button onClick={onAdd} className="mt-2 shadow-lg shadow-primary/20">
                      Başvuru Ekle
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(renderDesktopRow)
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-border rounded-xl bg-card">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground">Başvuru Bulunamadı</p>
              <Button onClick={onAdd} size="sm" variant="outline" className="mt-2">
                İlk Başvurunu Ekle
              </Button>
            </div>
          </div>
        ) : (
          filtered.map(renderMobileCard)
        )}
      </div>

      {/* Archived Applications Collapsible */}
      {archivedApps.length > 0 && (
        <Collapsible open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full mt-4 flex items-center justify-between p-4 bg-muted/40 border-y border-border rounded-md hover:bg-muted/60 transition-colors">
              <span className="flex items-center gap-2 font-medium">
                <Archive className="h-4 w-4 text-muted-foreground" />
                Arşivlenmiş Başvurular ({archivedApps.length})
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isArchiveOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Desktop Archived */}
            <div className="hidden md:block rounded-xl border border-border bg-card/60 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {archivedApps.map(renderDesktopRow)}
                </tbody>
              </table>
            </div>

            {/* Mobile Archived */}
            <div className="md:hidden space-y-3 opacity-80">
              {archivedApps.map(renderMobileCard)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

