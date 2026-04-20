import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/application";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  applications: Application[];
  onSelectApp: (app: Application) => void;
}

export default function CalendarView({ applications, onSelectApp }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { getCategory } = useCategories();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const appsByDate = useMemo(() => {
    const map: Record<string, Application[]> = {};
    applications.forEach((app) => {
      if (app.important_date && !app.is_archived) {
        const key = format(new Date(app.important_date), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(app);
      }
    });
    return map;
  }, [applications]);

  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-foreground">Takvim</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: tr })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Bugün
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-xs font-semibold text-muted-foreground text-center border-b border-border bg-muted/50">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayApps = appsByDate[key] || [];
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[100px] border-b border-r border-border p-1.5",
                  !isCurrentMonth && "bg-muted/30"
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-1",
                  isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center",
                  !isToday && !isCurrentMonth && "text-muted-foreground",
                  !isToday && isCurrentMonth && "text-foreground"
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayApps.slice(0, 3).map((app) => {
                    const cat = getCategory(app.status);
                    return (
                      <button
                        key={app.id}
                        onClick={() => onSelectApp(app)}
                        className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate transition-opacity hover:opacity-80"
                        style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                      >
                        {app.institution_name}
                      </button>
                    );
                  })}
                  {dayApps.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1.5">
                      +{dayApps.length - 3} daha
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
