import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2, Check } from "lucide-react";
import { Application, ApplicationStatus, STATUS_LABELS } from "@/types/application";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

interface ApplicationBoardProps {
  applications: Application[];
  onAdd: () => void;
  onView: (app: Application) => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onCompleteDate?: (app: Application) => void;
}

const COLUMNS: ApplicationStatus[] = [
  "kabul",
  "ik_mulakati",
  "online_degerlendirme",
  "basvuruldu",
  "reddedildi"
];

export default function ApplicationBoard({ applications, onView, onEdit, onDelete, onCompleteDate }: ApplicationBoardProps) {
  const getDomain = (url: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 h-full snap-x">
      {COLUMNS.map((status) => {
        const columnApps = applications.filter((app) => app.status === status && !app.is_archived);
        
        return (
          <div key={status} className="flex-shrink-0 w-[300px] bg-muted/30 rounded-xl border border-border flex flex-col snap-center max-h-[70vh]">
            {/* Column Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-card rounded-t-xl">
              <div className="flex items-center gap-2">
                <StatusBadge status={status as ApplicationStatus} className="bg-transparent border-none px-1" />
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground">
                  {columnApps.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              <AnimatePresence>
                {columnApps.map((app) => (
                  <motion.div
                    layoutId={`card-${app.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={app.id}
                    onClick={() => onView(app)}
                    className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                          <div className="relative shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-muted border border-border overflow-hidden">
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
                          <div>
                            <h4 className="font-medium text-sm text-foreground leading-tight truncate max-w-[180px]">{app.institution_name}</h4>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{app.program_name}</p>
                          </div>
                       </div>
                       
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(app); }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Düzenle</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(app.id); }} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Sil</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
                        <span className="flex items-center gap-1.5 font-medium group/date">
                         {app.important_date ? (
                            <>
                                {format(new Date(app.important_date), "d MMM" + (format(new Date(app.important_date), "HH:mm") !== "00:00" ? " HH:mm" : ""), { locale: tr })}
                                {(new Date(app.important_date).getTime() - Date.now() < 24 * 60 * 60 * 1000 * 3) && (new Date(app.important_date).getTime() > Date.now()) && (
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                    </span>
                                )}
                                {onCompleteDate && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-full border-success/30 text-success hover:bg-success/10 hover:border-success/50 opacity-0 group-hover/date:opacity-100 transition-all shadow-sm ml-1"
                                    onClick={(e) => { e.stopPropagation(); onCompleteDate(app); }}
                                    title="Tamamlandı"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                            </>
                         ) : "—"}
                       </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {columnApps.length === 0 && (
                <div className="h-[80px] rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground/50">
                  Boş
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
