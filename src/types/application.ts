import { Database } from "@/integrations/supabase/types";

export type ApplicationStatus = string;

export type ApplicationCategory = Database["public"]["Tables"]["application_categories"]["Row"];

export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];

export type Department = Database["public"]["Tables"]["departments"]["Row"];

export type ApplicationFile = Database["public"]["Tables"]["application_files"]["Row"];

export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

export const DEFAULT_CATEGORIES = [
  { key: "basvur", label: "Başvur", color: "#3b82f6", order_index: 0 }, // blue-500
  { key: "basvuruldu", label: "Başvuruldu", color: "#f97316", order_index: 1 }, // orange-500
  { key: "online_degerlendirme", label: "Ön Aşama Sınavı", color: "#8b5cf6", order_index: 2 }, // violet-500
  { key: "ik_mulakati", label: "İK Mülakatı", color: "#ec4899", order_index: 3 }, // pink-500
  { key: "kabul", label: "Kabul", color: "#10b981", order_index: 4 }, // emerald-500
  { key: "reddedildi", label: "Reddedildi", color: "#f43f5e", order_index: 5 }, // rose-500
];

export const STATUS_LABELS: Record<string, string> = DEFAULT_CATEGORIES.reduce((acc, cat) => ({...acc, [cat.key]: cat.label}), {});

export const REMIND_BEFORE_OPTIONS = [
  { value: "1_week", label: "1 Hafta" },
  { value: "3_days", label: "3 Gün" },
  { value: "2_days", label: "2 Gün" },
  { value: "1_day", label: "1 Gün" },
  { value: "12_hours", label: "12 Saat" },
  { value: "4_hours", label: "4 Saat" },
] as const;
