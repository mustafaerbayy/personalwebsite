import { useState, useEffect } from "react";
import { X, Plus, Upload, FileText, Download, Trash2, Eye, Pencil, ExternalLink, Archive, ArchiveRestore, Clock, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { Application, ApplicationStatus, REMIND_BEFORE_OPTIONS, ApplicationFile } from "@/types/application";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ApplicationDrawerProps {
  open: boolean;
  onClose: () => void;
  application?: Application | null;
  onSave: (data: any) => any;
  onDelete?: (id: string) => void;
  onArchive?: (app: Application) => void;
  isReadOnly?: boolean;
  onEdit?: () => void;
}

export default function ApplicationDrawer({
  open,
  onClose,
  application,
  onSave,
  onDelete,
  onArchive,
  isReadOnly = false,
  onEdit,
}: ApplicationDrawerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { categories } = useCategories();
  const [formData, setFormData] = useState({
    institution_name: "",
    program_name: "",
    department_names: [] as string[],
    status: (application?.status || categories?.[0]?.key || "basvur") as ApplicationStatus,
    notes: "",
    website_url: "",
    important_date: null as Date | null,
    important_date_label: "",
    applied_date: null as Date | null,
  });
  const [newDeptName, setNewDeptName] = useState("");
  const [files, setFiles] = useState<ApplicationFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reminders, setReminders] = useState<string[]>([]);
  const [importantTime, setImportantTime] = useState("");

  useEffect(() => {
    if (application) {
      setFormData({
        institution_name: application.institution_name,
        program_name: application.program_name,
        department_names: (application as any).department_names || [],
        status: application.status as ApplicationStatus,
        notes: application.notes || "",
        website_url: application.website_url || "",
        important_date: application.important_date ? new Date(application.important_date) : null,
        important_date_label: application.important_date_label || "",
        applied_date: (application as any).applied_date ? new Date((application as any).applied_date) : null,
      });
      if (application.important_date) {
        setImportantTime(format(new Date(application.important_date), "HH:mm"));
      } else {
        setImportantTime("");
      }
      loadFiles(application.id);
      loadReminders(application.id);
    } else {
      setFormData({
        institution_name: "",
        program_name: "",
        department_names: [],
        status: (categories?.[0]?.key || "basvur") as ApplicationStatus,
        notes: "",
        website_url: "",
        important_date: null,
        important_date_label: "",
        applied_date: new Date(),
      });
      setImportantTime("");
      setFiles([]);
      setPendingFiles([]);
      setReminders(REMIND_BEFORE_OPTIONS.map(opt => opt.value));
    }
  }, [application, open]);

  const loadFiles = async (appId: string) => {
    const { data } = await supabase
      .from("application_files")
      .select("*")
      .eq("application_id", appId);
    setFiles(data || []);
  };

  const loadReminders = async (appId: string) => {
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("application_id", appId);
    setReminders(data?.map((r) => r.remind_before) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const savedApp = await onSave({
        ...(application ? { id: application.id } : {}),
        institution_name: formData.institution_name,
        program_name: formData.program_name,
        department_names: formData.department_names,
        status: formData.status,
        notes: formData.notes || null,
        website_url: formData.website_url || null,
        important_date: formData.important_date ? (() => {
          const d = new Date(formData.important_date);
          if (importantTime) {
            const [h, m] = importantTime.split(":").map(Number);
            d.setHours(h, m, 0, 0);
          }
          return d.toISOString();
        })() : null,
        important_date_label: formData.important_date_label || null,
        applied_date: formData.applied_date?.toISOString() || null,
      });

      const appId = application ? application.id : (savedApp?.id || null);

      if (appId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const sanitizedFileName = file.name
            .normalize("NFD")
            .replace(/[\\u0300-\\u036f]/g, "")
            .replace(/[^a-zA-Z0-9.-]/g, "_");
            
          const filePath = `${user!.id}/${appId}/${Date.now()}_${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage
            .from("application-files")
            .upload(filePath, file);

          if (!uploadError) {
            await supabase.from("application_files").insert({
              application_id: appId,
              user_id: user!.id,
              file_name: file.name,
              file_path: filePath,
              file_type: file.type,
              file_size: file.size,
            });
          }
        }
      }

      if (appId && formData.important_date) {
        saveReminders(appId, formData.important_date);
      }
      
      if (!application) {
        setFormData({
          institution_name: "",
          program_name: "",
          department_names: [],
          status: (categories?.[0]?.key || "basvur") as ApplicationStatus,
          notes: "",
          website_url: "",
          important_date: null,
          important_date_label: "",
          applied_date: new Date(),
        });
        setFiles([]);
        setPendingFiles([]);
        setReminders(REMIND_BEFORE_OPTIONS.map(opt => opt.value));
        setNewDeptName("");
      }

      onClose();
    } catch (error) {
      toast.error("İşlem sırasında bir hata oluştu");
    } finally {
      setUploading(false);
    }
  };

  const saveReminders = async (appId: string, importantDate: Date) => {
    await supabase.from("reminders").delete().eq("application_id", appId);

    const reminderOffsets: Record<string, number> = {
      "1_week": 7 * 24 * 60 * 60 * 1000,
      "3_days": 3 * 24 * 60 * 60 * 1000,
      "2_days": 2 * 24 * 60 * 60 * 1000,
      "1_day": 1 * 24 * 60 * 60 * 1000,
      "12_hours": 12 * 60 * 60 * 1000,
      "4_hours": 4 * 60 * 60 * 1000,
    };

    const now = new Date();
    const inserts = reminders
      .map((r) => {
        const remindAt = new Date(importantDate.getTime() - reminderOffsets[r]);
        if (remindAt <= now) return null;
        return {
          application_id: appId,
          user_id: user!.id,
          remind_before: r,
          remind_at: remindAt.toISOString(),
        };
      })
      .filter(Boolean);

    if (inserts.length > 0) {
      await supabase.from("reminders").insert(inserts as any);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (files.length + pendingFiles.length >= 4) {
      toast.error("Maksimum 4 dosya yüklenebilir");
      return;
    }

    const file = e.target.files[0];
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Sadece PDF ve Word dosyaları yüklenebilir");
      return;
    }

    if (!application) {
      setPendingFiles((prev) => [...prev, file]);
      toast.success("Dosya eklendi (Başvuruyu oluşturduktan sonra kaydedilecek)");
      return;
    }

    setUploading(true);
    
    // Replace non-ascii and unsafe characters from file name
    const sanitizedFileName = file.name
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "") // Remove diacritics
      .replace(/[^a-zA-Z0-9.-]/g, "_");  // Replace invalid characters with underscore
      
    const filePath = `${user!.id}/${application.id}/${Date.now()}_${sanitizedFileName}`;
    const { error: uploadError } = await supabase.storage
      .from("application-files")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Dosya yüklenemedi");
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("application_files").insert({
      application_id: application.id,
      user_id: user!.id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    });

    if (dbError) {
      toast.error("Dosya kaydedilemedi");
    } else {
      toast.success("Dosya yüklendi");
      loadFiles(application.id);
    }
    setUploading(false);
  };

  const handleDeleteFile = async (file: ApplicationFile) => {
    await supabase.storage.from("application-files").remove([file.file_path]);
    await supabase.from("application_files").delete().eq("id", file.id);
    toast.success("Dosya silindi");
    if (application) loadFiles(application.id);
  };

  const handlePreviewFile = async (file: ApplicationFile) => {
    const { data, error } = await supabase.storage
      .from("application-files")
      .createSignedUrl(file.file_path, 3600);
    if (error || !data?.signedUrl) {
      toast.error("Dosya önizleme linki oluşturulamadı");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDownloadFile = async (file: ApplicationFile) => {
    const { data } = await supabase.storage.from("application-files").download(file.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const addDepartment = () => {
    const name = newDeptName.trim();
    if (name && !formData.department_names.includes(name)) {
      setFormData((prev) => ({
        ...prev,
        department_names: [...prev.department_names, name],
      }));
      setNewDeptName("");
    }
  };

  const removeDepartment = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      department_names: prev.department_names.filter((d) => d !== name),
    }));
  };

  const toggleReminder = (value: string) => {
    setReminders((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm cursor-pointer transition-opacity" onClick={onClose} />
      <div className="relative w-full sm:max-w-md md:max-w-lg h-[100dvh] bg-card shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 flex flex-col sm:h-screen">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 py-4">
          <h2 className="font-display font-semibold text-lg text-foreground">
            {application ? "Başvuru Düzenle" : "Yeni Başvuru"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth-touch">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Durum</Label>
              {isReadOnly ? (
                <div className="py-2">
                  <StatusBadge status={formData.status} />
                </div>
              ) : (
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as ApplicationStatus })}
                >
                  <SelectTrigger className="h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key} className="py-2.5 sm:py-1.5">{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Kurum Adı</Label>
              {isReadOnly ? (
                <p className="text-foreground font-medium py-1">{formData.institution_name}</p>
              ) : (
                <Input
                  className="h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  placeholder="Şirket veya Kurum Adı"
                  required
                />
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Program Adı</Label>
              {isReadOnly ? (
                <p className="text-foreground py-1">{formData.program_name}</p>
              ) : (
                <Input
                  className="h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                  placeholder="Program veya Pozisyon"
                  required
                />
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Başvurulan Departmanlar</Label>
              <div className="space-y-3">
                {formData.department_names.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.department_names.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[13px] font-medium text-primary"
                      >
                        {name}
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeDepartment(name)}
                            className="text-primary/70 hover:text-primary transition-colors bg-primary/10 rounded-full p-0.5"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : isReadOnly ? (
                  <p className="text-muted-foreground text-sm italic py-1 bg-muted/30 p-3 rounded-lg border border-dashed border-border/50 text-center">Departman eklenmemiş</p>
                ) : null}
                {!isReadOnly && (
                  <div className="flex gap-2 relative">
                    <Input
                      placeholder="Departman adı ekle..."
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDepartment(); } }}
                      className="flex-1 h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm pr-12"
                    />
                    <Button type="button" size="icon" onClick={addDepartment} className="absolute right-1 top-1 bottom-1 h-10 w-10 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Web Sitesi</Label>
              {isReadOnly ? (
                formData.website_url ? (
                  <a
                    href={formData.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1.5 py-2 px-3 bg-primary/5 rounded-lg border border-primary/10 text-sm font-medium w-fit"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {formData.website_url}
                  </a>
                ) : (
                  <p className="text-muted-foreground text-sm italic py-1">Eklenmemiş</p>
                )
              ) : (
                <Input
                  type="url"
                  className="h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Başvuru Tarihi</Label>
              {isReadOnly ? (
                <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg border border-border text-sm text-foreground font-medium w-fit">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {formData.applied_date ? format(formData.applied_date, "dd MMMM yyyy", { locale: tr }) : "Tarih seçilmemiş"}
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm",
                        !formData.applied_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {formData.applied_date
                        ? format(formData.applied_date, "dd MMMM yyyy", { locale: tr })
                        : "Tarih seç"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.applied_date || undefined}
                      onSelect={(d) => setFormData({ ...formData, applied_date: d || null })}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Önemli Tarih</Label>
                {isReadOnly ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg border border-border text-sm text-foreground font-medium w-fit">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      {formData.important_date ? format(formData.important_date, "dd MMMM yyyy", { locale: tr }) : "Seçilmemiş"}
                    </div>
                    {importantTime && formData.important_date && (
                      <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg border border-border text-sm text-foreground font-medium w-fit">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        Saat: {importantTime}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm",
                            !formData.important_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          {formData.important_date
                            ? format(formData.important_date, "dd/MM/yyyy")
                            : "Tarih seç"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.important_date || undefined}
                          onSelect={(d) => {
                            if (d) {
                              setFormData((prev) => ({
                                ...prev,
                                important_date: d,
                                important_date_label: prev.important_date_label || "Sınav",
                              }));
                              if (!importantTime) setImportantTime("23:59");
                              if (reminders.length === 0) {
                                setReminders(REMIND_BEFORE_OPTIONS.map(opt => opt.value));
                              }
                            } else {
                              setFormData((prev) => ({ ...prev, important_date: null }));
                              setImportantTime("");
                            }
                          }}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {formData.important_date && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                          type="time"
                          value={importantTime}
                          onChange={(e) => setImportantTime(e.target.value)}
                          className="h-12 bg-muted/50 focus:bg-background text-base sm:text-sm flex-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tarih Açıklaması</Label>
                {isReadOnly ? (
                  <p className="py-2 px-3 bg-muted/30 rounded-lg border border-border/50 text-foreground text-sm font-medium">
                    {formData.important_date_label || "Açıklama yok"}
                  </p>
                ) : (
                  <Input
                    className="h-12 bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm"
                    value={formData.important_date_label}
                    onChange={(e) => setFormData({ ...formData, important_date_label: e.target.value })}
                    placeholder="ör. Mülakat, Sınav"
                  />
                )}
              </div>
            </div>

            {formData.important_date && (
              <div className="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <Label className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                  <Clock className="h-4 w-4" /> Hatırlatıcılar
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {REMIND_BEFORE_OPTIONS.map((opt) => (
                    <label key={opt.value} className={cn(
                      "flex items-center gap-2.5 text-sm p-2 rounded-lg border transition-colors",
                      reminders.includes(opt.value) ? "bg-primary/10 border-primary/30 text-primary font-medium" : "bg-card border-border hover:bg-muted",
                      isReadOnly && "opacity-80 pointer-events-none"
                    )}>
                      <Checkbox
                        className="h-5 w-5"
                        checked={reminders.includes(opt.value)}
                        onCheckedChange={() => !isReadOnly && toggleReminder(opt.value)}
                        disabled={isReadOnly}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Notlar</Label>
              {isReadOnly ? (
                <div className="bg-muted/50 p-4 rounded-xl border border-border min-h-[80px] whitespace-pre-wrap text-sm text-foreground">
                  {formData.notes || <span className="text-muted-foreground italic">Not bulunmuyor.</span>}
                </div>
              ) : (
                <Textarea
                  className="bg-muted/50 focus:bg-background transition-colors text-base sm:text-sm rounded-xl resize-none p-4"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Ek notlar, görüşme detayları..."
                />
              )}
            </div>

            <div className="space-y-3 pb-6">
              <Label className="text-sm font-semibold flex items-center justify-between">
                <span>Dosyalar</span>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground">{files.length + pendingFiles.length}/4</span>
              </Label>
              
              <div className="space-y-2.5">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{file.file_type.split('/')[1]}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handlePreviewFile(file)} title="Önizle">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleDownloadFile(file)} title="İndir">
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isReadOnly && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteFile(file)} title="Sil">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {pendingFiles.map((file, index) => (
                  <div key={`pending-${index}`} className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3 bg-muted/20">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-muted-foreground">{file.name}</p>
                      <p className="text-xs text-primary font-medium">Kaydedilecek</p>
                    </div>
                    {!isReadOnly && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))} title="Sil">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {!isReadOnly && (files.length + pendingFiles.length) < 4 && (
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-border/60 p-6 hover:bg-muted/30 hover:border-border transition-colors group">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                      {uploading ? "Yükleniyor..." : "Dosya Yüklemek İçin Tıklayın"}
                    </span>
                    <span className="text-xs text-muted-foreground/60">PDF veya Word (Maks 4 dosya)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
                {isReadOnly && (files.length + pendingFiles.length) === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Dosya Eklenmemiş</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-xl border-t border-border p-4 sm:p-6 safe-area-bottom shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            {!isReadOnly ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold shadow-lg shadow-primary/20" disabled={uploading}>
                    {uploading ? "Kaydediliyor..." : application ? "Değişiklikleri Kaydet" : "Başvuruyu Oluştur"}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 h-12 sm:h-10 text-base sm:text-sm bg-card" onClick={onClose}>
                    İptal
                  </Button>
                </div>

                {application && (onArchive || onDelete) && (
                  <div className="flex gap-3">
                    {onArchive && (
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn("flex-1 h-11 text-sm bg-muted/50 hover:bg-muted font-medium gap-2", application.is_archived && "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10")}
                        onClick={() => {
                          onArchive(application);
                          onClose();
                        }}
                      >
                        {application.is_archived ? (
                          <><ArchiveRestore className="h-4 w-4" /> Çıkar</>
                        ) : (
                          <><Archive className="h-4 w-4" /> Arşivle</>
                        )}
                      </Button>
                    )}

                    {onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 h-11 text-sm bg-destructive/5 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium gap-2"
                        onClick={() => {
                          onDelete(application.id);
                          onClose();
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Sil
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button type="button" variant="secondary" className="w-full h-12 sm:h-10 text-base sm:text-sm font-medium" onClick={onClose}>
                Kapat
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
