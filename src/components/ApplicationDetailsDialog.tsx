import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  X,
  Pencil,
  ExternalLink,
  CalendarIcon,
  FileText,
  Eye,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import {
  Application,
  REMIND_BEFORE_OPTIONS,
  ApplicationFile
} from "@/types/application";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface ApplicationDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  application: Application | null;
  onEdit: (app: Application) => void;
}

export default function ApplicationDetailsDialog({
  open,
  onClose,
  application,
  onEdit,
}: ApplicationDetailsDialogProps) {
  const [files, setFiles] = useState<ApplicationFile[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    if (application && open) {
      loadFiles(application.id);
      loadReminders(application.id);
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

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-display font-bold">Başvuru Detayları</DialogTitle>
          <div className="flex items-center gap-2 mr-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(application);
              }}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Düzenle
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Kurum</Label>
              <p className="text-lg font-semibold text-foreground leading-tight">
                {application.institution_name}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Program</Label>
              <p className="text-base text-foreground font-medium">
                {application.program_name}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Durum</Label>
              <div className="pt-0.5">
                <StatusBadge status={application.status} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Başvurulan Departmanlar</Label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {application.department_names && application.department_names.length > 0 ? (
                  application.department_names.map((name: string) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">Departman eklenmemiş</p>
                )}
              </div>
            </div>

            {application.website_url && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Web Sitesi</Label>
                <a
                  href={application.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1.5 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ziyaret Et
                </a>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Başvuru Tarihi</Label>
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {application.applied_date
                    ? format(new Date(application.applied_date), "dd MMMM yyyy", { locale: tr })
                    : "—"}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Önemli Tarih</Label>
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {application.important_date
                    ? format(new Date(application.important_date), "dd MMMM yyyy", { locale: tr })
                    : "—"}
                </div>
              </div>
            </div>

            {application.important_date_label && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Tarih Açıklaması</Label>
                <p className="text-sm text-foreground font-medium">
                  {application.important_date_label}
                </p>
              </div>
            )}

            {reminders.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Hatırlatıcılar</Label>
                <div className="grid grid-cols-2 gap-2">
                  {REMIND_BEFORE_OPTIONS.map((opt) => reminders.includes(opt.value) && (
                    <div key={opt.value} className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-muted-foreground">Notlar</Label>
              <div className="bg-muted/50 p-3 rounded-lg border border-border text-sm whitespace-pre-wrap min-h-[80px]">
                {application.notes || "Henüz not eklenmemiş."}
              </div>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-8 space-y-3">
            <Label className="text-muted-foreground">Ekli Dosyalar</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 bg-card hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-[11px] text-muted-foreground uppercase">{file.file_type.split('/')[1]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreviewFile(file)} title="Önizle">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadFile(file)} title="İndir">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t flex justify-end">
          <Button onClick={onClose} variant="secondary">Kapat</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
