import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import type { CVData, CVExperience, CVEducation } from "@/hooks/useCVContent";

interface EditSectionProps {
  draftEn: CVData;
  draftTr: CVData;
  updateEn: (p: Partial<CVData>) => void;
  updateTr: (p: Partial<CVData>) => void;
  skillInput: string;
  setSkillInput: (v: string) => void;
}

function DualLabel({ label }: { label: string }) {
  return <p className="text-xs font-medium text-muted-foreground">{label}</p>;
}

function LangBadge({ lang }: { lang: string }) {
  return <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{lang}</span>;
}

function LangInput({ lang, value, onChange, placeholder }: { lang: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <LangBadge lang={lang} />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );
}

export function EditModeView({ draftEn, draftTr, updateEn, updateTr, skillInput, setSkillInput }: EditSectionProps) {
  const updateExpEn = (i: number, f: keyof CVExperience, v: string) => {
    const u = [...draftEn.experience]; u[i] = { ...u[i], [f]: v }; updateEn({ experience: u });
  };
  const updateExpTr = (i: number, f: keyof CVExperience, v: string) => {
    const u = [...draftTr.experience]; u[i] = { ...u[i], [f]: v }; updateTr({ experience: u });
  };
  const addExperience = () => {
    updateEn({ experience: [...draftEn.experience, { role: "", company: "", period: "", description: "" }] });
    updateTr({ experience: [...draftTr.experience, { role: "", company: "", period: "", description: "" }] });
  };
  const removeExperience = (i: number) => {
    updateEn({ experience: draftEn.experience.filter((_, idx) => idx !== i) });
    updateTr({ experience: draftTr.experience.filter((_, idx) => idx !== i) });
  };

  const updateEduEn = (i: number, f: keyof CVEducation, v: string) => {
    const u = [...draftEn.education]; u[i] = { ...u[i], [f]: v }; updateEn({ education: u });
  };
  const updateEduTr = (i: number, f: keyof CVEducation, v: string) => {
    const u = [...draftTr.education]; u[i] = { ...u[i], [f]: v }; updateTr({ education: u });
  };
  const addEducation = () => {
    updateEn({ education: [...draftEn.education, { degree: "", school: "", period: "" }] });
    updateTr({ education: [...draftTr.education, { degree: "", school: "", period: "" }] });
  };
  const removeEducation = (i: number) => {
    updateEn({ education: draftEn.education.filter((_, idx) => idx !== i) });
    updateTr({ education: draftTr.education.filter((_, idx) => idx !== i) });
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const ns = [...draftEn.skills, skillInput.trim()];
      updateEn({ skills: ns }); updateTr({ skills: ns }); setSkillInput("");
    }
  };
  const removeSkill = (i: number) => {
    const ns = draftEn.skills.filter((_, idx) => idx !== i);
    updateEn({ skills: ns }); updateTr({ skills: ns });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-12">
      {/* Hero fields */}
      <Card><CardContent className="space-y-3 p-6">
        <h3 className="font-display text-sm font-semibold text-foreground">Hero / Tanıtım</h3>
        <DualLabel label="İsim / Name" />
        <Input value={draftEn.name} onChange={(e) => { updateEn({ name: e.target.value }); updateTr({ name: e.target.value }); }} placeholder="Name" className="font-display text-xl font-bold" />
        <DualLabel label="Ünvan / Title" />
        <div className="grid grid-cols-2 gap-3">
          <LangInput lang="EN" value={draftEn.title} onChange={(v) => updateEn({ title: v })} placeholder="Title" />
          <LangInput lang="TR" value={draftTr.title} onChange={(v) => updateTr({ title: v })} placeholder="Ünvan" />
        </div>
        <DualLabel label="Konum / Location" />
        <div className="grid grid-cols-2 gap-3">
          <LangInput lang="EN" value={draftEn.location} onChange={(v) => updateEn({ location: v })} placeholder="Location" />
          <LangInput lang="TR" value={draftTr.location} onChange={(v) => updateTr({ location: v })} placeholder="Konum" />
        </div>
        <DualLabel label="Özet / Summary" />
        <div className="grid grid-cols-2 gap-3">
          <div><LangBadge lang="EN" /><Textarea value={draftEn.summary} onChange={(e) => updateEn({ summary: e.target.value })} rows={4} className="mt-1" /></div>
          <div><LangBadge lang="TR" /><Textarea value={draftTr.summary} onChange={(e) => updateTr({ summary: e.target.value })} rows={4} className="mt-1" /></div>
        </div>
        <DualLabel label="LinkedIn / Email" />
        <Input value={draftEn.linkedinUrl} onChange={(e) => { updateEn({ linkedinUrl: e.target.value }); updateTr({ linkedinUrl: e.target.value }); }} placeholder="LinkedIn URL" />
        <Input value={draftEn.email} onChange={(e) => { updateEn({ email: e.target.value }); updateTr({ email: e.target.value }); }} placeholder="Email" />
      </CardContent></Card>

      {/* Experience */}
      <Card><CardContent className="space-y-4 p-6">
        <h3 className="font-display text-sm font-semibold text-foreground">Deneyim / Experience</h3>
        {draftEn.experience.map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => removeExperience(i)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <DualLabel label="Pozisyon / Role" />
            <div className="grid grid-cols-2 gap-3">
              <LangInput lang="EN" value={draftEn.experience[i]?.role ?? ""} onChange={(v) => updateExpEn(i, "role", v)} placeholder="Role" />
              <LangInput lang="TR" value={draftTr.experience[i]?.role ?? ""} onChange={(v) => updateExpTr(i, "role", v)} placeholder="Pozisyon" />
            </div>
            <DualLabel label="Şirket / Company" />
            <div className="grid grid-cols-2 gap-3">
              <LangInput lang="EN" value={draftEn.experience[i]?.company ?? ""} onChange={(v) => updateExpEn(i, "company", v)} placeholder="Company" />
              <LangInput lang="TR" value={draftTr.experience[i]?.company ?? ""} onChange={(v) => updateExpTr(i, "company", v)} placeholder="Şirket" />
            </div>
            <DualLabel label="Dönem / Period" />
            <div className="grid grid-cols-2 gap-3">
              <LangInput lang="EN" value={draftEn.experience[i]?.period ?? ""} onChange={(v) => updateExpEn(i, "period", v)} placeholder="Period" />
              <LangInput lang="TR" value={draftTr.experience[i]?.period ?? ""} onChange={(v) => updateExpTr(i, "period", v)} placeholder="Dönem" />
            </div>
            <DualLabel label="Açıklama / Description" />
            <div className="grid grid-cols-2 gap-3">
              <Textarea value={draftEn.experience[i]?.description ?? ""} onChange={(e) => updateExpEn(i, "description", e.target.value)} rows={2} placeholder="Description" />
              <Textarea value={draftTr.experience[i]?.description ?? ""} onChange={(e) => updateExpTr(i, "description", e.target.value)} rows={2} placeholder="Açıklama" />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addExperience} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />Deneyim Ekle / Add Experience
        </Button>
      </CardContent></Card>

      {/* Education */}
      <Card><CardContent className="space-y-4 p-6">
        <h3 className="font-display text-sm font-semibold text-foreground">Eğitim / Education</h3>
        {draftEn.education.map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => removeEducation(i)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <DualLabel label="Derece / Degree" />
            <div className="grid grid-cols-2 gap-3">
              <LangInput lang="EN" value={draftEn.education[i]?.degree ?? ""} onChange={(v) => updateEduEn(i, "degree", v)} placeholder="Degree" />
              <LangInput lang="TR" value={draftTr.education[i]?.degree ?? ""} onChange={(v) => updateEduTr(i, "degree", v)} placeholder="Derece" />
            </div>
            <DualLabel label="Okul / School" />
            <div className="grid grid-cols-2 gap-3">
              <LangInput lang="EN" value={draftEn.education[i]?.school ?? ""} onChange={(v) => updateEduEn(i, "school", v)} placeholder="School" />
              <LangInput lang="TR" value={draftTr.education[i]?.school ?? ""} onChange={(v) => updateEduTr(i, "school", v)} placeholder="Okul" />
            </div>
            <DualLabel label="Dönem / Period" />
            <div className="grid grid-cols-2 gap-3">
              <LangInput lang="EN" value={draftEn.education[i]?.period ?? ""} onChange={(v) => updateEduEn(i, "period", v)} placeholder="Period" />
              <LangInput lang="TR" value={draftTr.education[i]?.period ?? ""} onChange={(v) => updateEduTr(i, "period", v)} placeholder="Dönem" />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addEducation} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />Eğitim Ekle / Add Education
        </Button>
      </CardContent></Card>

      {/* Skills */}
      <Card><CardContent className="space-y-4 p-6">
        <h3 className="font-display text-sm font-semibold text-foreground">Yetenekler / Skills</h3>
        <div className="flex flex-wrap gap-2">
          {draftEn.skills.map((skill, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {skill}
              <button onClick={() => removeSkill(i)} className="ml-1 text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Yeni yetenek / New skill" className="w-48"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
          <Button variant="outline" size="sm" onClick={addSkill}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
      </CardContent></Card>

      {/* Contact */}
      <Card><CardContent className="space-y-3 p-6">
        <h3 className="font-display text-sm font-semibold text-foreground">İletişim / Contact</h3>
        <DualLabel label="İletişim Notu / Contact Note" />
        <div className="grid grid-cols-2 gap-3">
          <Textarea value={draftEn.contactNote} onChange={(e) => updateEn({ contactNote: e.target.value })} rows={2} placeholder="Contact note" />
          <Textarea value={draftTr.contactNote} onChange={(e) => updateTr({ contactNote: e.target.value })} rows={2} placeholder="İletişim notu" />
        </div>
      </CardContent></Card>
    </div>
  );
}
