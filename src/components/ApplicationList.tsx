import { useState, useMemo } from "react";
import { ExternalLink, Pencil, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Application, ApplicationStatus, STATUS_LABELS } from "@/types/application";
import { cn } from "@/lib/utils";

interface ApplicationListProps {
  applications: Application[];
  onAdd: () => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  showFilters?: boolean;
}

type SortKey = "institution_name" | "status" | "important_date" | "created_at";
type SortDir = "asc" | "desc";

export default function ApplicationList({ 
  applications, 
  onAdd, 
  onEdit, 
  onDelete,
  showFilters = true 
}: ApplicationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
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

    // Smart sorting: Tier system
    const now = new Date();
    const todayEnd = endOfDay(now).getTime();

    function getTier(app: Application): number {
      if (app.status === "kabul") return 1;
      if (app.status === "reddedildi") return 4;
      // Active status: check important_date
      if (app.important_date) {
        const dateEnd = endOfDay(new Date(app.important_date)).getTime();
        if (dateEnd >= now.getTime()) return 2; // today or future
      }
      return 3; // no date or past date
    }

    result.sort((a, b) => {
      const tierA = getTier(a);
      const tierB = getTier(b);
      if (tierA !== tierB) return tierA - tierB;

      // Within same tier
      if (tierA === 1) {
        // Kabul: most recent first
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (tierA === 2) {
        // Upcoming dates: closest first
        return new Date(a.important_date!).getTime() - new Date(b.important_date!).getTime();
      }
      if (tierA === 4) {
        // Rejected: most recent first
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      // Tier 3: by created_at desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
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
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Departmanlar
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
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/40" />
                    <p>Henüz başvuru yok</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => onEdit(app)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{app.institution_name}</span>
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
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{app.program_name}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(app as any).department_names?.map((name: string) => (
                        <span key={name} className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {name}
                        </span>
                      ))}
                      {(!(app as any).department_names || (app as any).department_names.length === 0) && (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-sm">
                    {app.important_date
                      ? format(new Date(app.important_date), "d MMM yyyy", { locale: tr })
                      : "—"}
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p>Henüz başvuru yok</p>
            </div>
          </div>
        ) : (
          filtered.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer active:bg-muted/30 transition-colors"
              onClick={() => onEdit(app)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{app.institution_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{app.program_name}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="flex flex-wrap gap-1">
                {(app as any).department_names?.map((name: string) => (
                  <span key={name} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {name}
                  </span>
                ))}
              </div>

              <div className="flex items-center pt-2 border-t border-border">
                {app.website_url ? (
                  <a
                    href={app.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-primary p-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <div className="w-8" /> // Spacer for alignment
                )}

                <div className="flex-1 text-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    {app.important_date
                      ? format(new Date(app.important_date), "d MMMM", { locale: tr })
                      : ""}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); onEdit(app); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
