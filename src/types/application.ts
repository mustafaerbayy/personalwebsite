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

export const REMIND_BEFORE_OPTIONS = [
  { value: "1_week", label: "1 Hafta" },
  { value: "3_days", label: "3 Gün" },
  { value: "2_days", label: "2 Gün" },
  { value: "1_day", label: "1 Gün" },
  { value: "12_hours", label: "12 Saat" },
  { value: "4_hours", label: "4 Saat" },
] as const;
