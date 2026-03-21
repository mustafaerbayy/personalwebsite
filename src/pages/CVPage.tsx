import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Pencil, Save, X, Globe, LogIn } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCVContentBoth, type CVData } from "@/hooks/useCVContent";
import { toast } from "sonner";
import { HeroSection, ExperienceSection, EducationSection, SkillsSection, ContactSection } from "@/components/cv/CVSections";
import { EditModeView } from "@/components/cv/CVEditMode";

const sectionLabels = {
  en: { about: "About", experience: "Experience", education: "Education", skills: "Skills", contact: "Get in Touch", langToggle: "TR" },
  tr: { about: "Hakkımda", experience: "Deneyim", education: "Eğitim", skills: "Yetenekler", contact: "İletişime Geç", langToggle: "EN" },
};

export default function CVPage() {
  const [lang, setLang] = useState<"en" | "tr">("en");
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enData, trData, isLoading, saveBoth, isSaving } = useCVContentBoth();

  const [draftEn, setDraftEn] = useState<CVData>(enData);
  const [draftTr, setDraftTr] = useState<CVData>(trData);
  const [skillInput, setSkillInput] = useState("");
  const labels = sectionLabels[lang];

  useEffect(() => { setDraftEn(enData); }, [enData]);
  useEffect(() => { setDraftTr(trData); }, [trData]);

  const handleSave = () => {
    if (!user) return;
    const shared = { name: draftEn.name, email: draftEn.email, linkedinUrl: draftEn.linkedinUrl, skills: [...draftEn.skills] };
    const finalTr = { ...draftTr, ...shared };
    const finalEn = { ...draftEn };
    saveBoth(
      { enData: finalEn, trData: finalTr, userId: user.id },
      {
        onSuccess: () => { setEditMode(false); toast.success("Kaydedildi / Saved"); },
        onError: () => toast.error("Kaydetme başarısız"),
      }
    );
  };

  const handleCancel = () => { setDraftEn(enData); setDraftTr(trData); setEditMode(false); };
  const updateEn = (partial: Partial<CVData>) => setDraftEn((p) => ({ ...p, ...partial }));
  const updateTr = (partial: Partial<CVData>) => setDraftTr((p) => ({ ...p, ...partial }));

  const t = lang === "en" ? enData : trData;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-hero-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Floating nav */}
      <header className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {user && !editMode && (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="gap-1.5 rounded-full border-border bg-card/80 text-xs backdrop-blur-md shadow-lg">
            <Pencil className="h-3.5 w-3.5" />{lang === "en" ? "Edit" : "Düzenle"}
          </Button>
        )}
        {editMode && (
          <>
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5 rounded-full border-border bg-card/80 text-xs text-muted-foreground backdrop-blur-md shadow-lg">
              <X className="h-3.5 w-3.5" />{lang === "en" ? "Cancel" : "İptal"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 rounded-full text-xs shadow-lg">
              <Save className="h-3.5 w-3.5" />{isSaving ? "..." : lang === "en" ? "Save" : "Kaydet"}
            </Button>
          </>
        )}
        {user && (
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5 rounded-full border-border bg-card/80 text-xs backdrop-blur-md shadow-lg">
            <LayoutDashboard className="h-3.5 w-3.5" />
          </Button>
        )}
        {!user && (
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5 rounded-full border-border bg-card/80 text-xs backdrop-blur-md shadow-lg">
            <LogIn className="h-3.5 w-3.5" />
          </Button>
        )}
        <ThemeToggle className="rounded-full border-border bg-card/80 backdrop-blur-md shadow-lg h-9 w-9" />
        <Button variant="outline" size="sm" onClick={() => setLang(lang === "en" ? "tr" : "en")} className="gap-1.5 rounded-full border-border bg-card/80 text-xs backdrop-blur-md shadow-lg">
          <Globe className="h-3.5 w-3.5" />{labels.langToggle}
        </Button>
      </header>

      {editMode ? (
        <EditModeView
          draftEn={draftEn}
          draftTr={draftTr}
          updateEn={updateEn}
          updateTr={updateTr}
          skillInput={skillInput}
          setSkillInput={setSkillInput}
        />
      ) : (
        <>
          <HeroSection data={t} />
          <ExperienceSection data={t} label={labels.experience} />
          <EducationSection data={t} label={labels.education} />
          <SkillsSection data={t} label={labels.skills} />
          <ContactSection data={t} label={labels.contact} />
          {/* Footer */}
          <footer className="border-t border-hero-border bg-hero py-10">
            <p className="text-center text-xs text-hero-muted/50 tracking-widest uppercase">
              © {new Date().getFullYear()} {t.name}
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
