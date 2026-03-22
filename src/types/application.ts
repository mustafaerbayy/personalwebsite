import { Database } from "@/integrations/supabase/types";

export type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];

export type Department = Database["public"]["Tables"]["departments"]["Row"];

export type ApplicationFile = Database["public"]["Tables"]["application_files"]["Row"];

export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  basvuruldu: "Başvuruldu",
  online_degerlendirme: "Ön Aşama Sınavı",
  ik_mulakati: "İK Mülakatı",
  teknik_degerlendirme: "Teknik Değerlendirme",
  kabul: "Kabul",
  reddedildi: "Reddedildi",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  basvuruldu: "bg-orange-500/15 text-orange-500",
  online_degerlendirme: "bg-foreground/10 text-foreground",
  ik_mulakati: "bg-pink-500/15 text-pink-500",
  teknik_degerlendirme: "bg-sky-500/15 text-sky-500",
  kabul: "bg-success/15 text-success",
  reddedildi: "bg-destructive/15 text-destructive",
};

export const STATUS_STYLES: Record<ApplicationStatus, { wrapper: string; dot: string }> = {
  basvuruldu: {
    wrapper: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
    dot: "bg-orange-500",
  },
  online_degerlendirme: {
    wrapper: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
    dot: "bg-purple-500",
  },
  ik_mulakati: {
    wrapper: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20",
    dot: "bg-pink-500",
  },
  teknik_degerlendirme: {
    wrapper: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]",
    dot: "bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]",
  },
  kabul: {
    wrapper: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    dot: "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]",
  },
  reddedildi: {
    wrapper: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    dot: "bg-rose-500",
  },
};

export const REMIND_BEFORE_OPTIONS = [
  { value: "1_week", label: "1 Hafta" },
  { value: "3_days", label: "3 Gün" },
  { value: "2_days", label: "2 Gün" },
  { value: "1_day", label: "1 Gün" },
  { value: "12_hours", label: "12 Saat" },
  { value: "4_hours", label: "4 Saat" },
] as const;
