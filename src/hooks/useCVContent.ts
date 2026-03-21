import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CVExperience {
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface CVEducation {
  degree: string;
  school: string;
  period: string;
}

export interface CVData {
  name: string;
  title: string;
  location: string;
  summary: string;
  experience: CVExperience[];
  education: CVEducation[];
  skills: string[];
  contactNote: string;
  email: string;
  linkedinUrl: string;
}

export const defaultContent: Record<"en" | "tr", CVData> = {
  en: {
    name: "Muhammed Erbay",
    title: "Software Engineer",
    location: "Turkey",
    summary: "Passionate software engineer with experience in building modern web applications.",
    experience: [
      { role: "Software Engineer", company: "Company Name", period: "2023 – Present", description: "Developed and maintained full-stack web applications." },
    ],
    education: [
      { degree: "B.Sc. Computer Engineering", school: "University Name", period: "2017 – 2021" },
    ],
    skills: ["TypeScript", "React", "Node.js", "Python", "SQL", "Git"],
    contactNote: "Feel free to reach out via email or LinkedIn.",
    email: "your.email@example.com",
    linkedinUrl: "https://www.linkedin.com/in/merbay/",
  },
  tr: {
    name: "Muhammed Erbay",
    title: "Yazılım Mühendisi",
    location: "Türkiye",
    summary: "Modern web uygulamaları geliştirme deneyimine sahip, tutkulu bir yazılım mühendisi.",
    experience: [
      { role: "Yazılım Mühendisi", company: "Şirket Adı", period: "2023 – Günümüz", description: "Full-stack web uygulamaları geliştirdi ve sürdürdü." },
    ],
    education: [
      { degree: "Bilgisayar Mühendisliği Lisans", school: "Üniversite Adı", period: "2017 – 2021" },
    ],
    skills: ["TypeScript", "React", "Node.js", "Python", "SQL", "Git"],
    contactNote: "E-posta veya LinkedIn üzerinden benimle iletişime geçebilirsiniz.",
    email: "your.email@example.com",
    linkedinUrl: "https://www.linkedin.com/in/merbay/",
  },
};

async function upsertCVContent(userId: string, lang: string, cvData: CVData) {
  const jsonData = JSON.parse(JSON.stringify(cvData));
  const { data: existing } = await supabase
    .from("cv_content")
    .select("id")
    .eq("user_id", userId)
    .eq("lang", lang)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cv_content")
      .update({ data: jsonData, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("cv_content")
      .insert([{ user_id: userId, lang, data: jsonData }]);
    if (error) throw error;
  }
}

export function useCVContentBoth() {
  const queryClient = useQueryClient();

  const enQuery = useQuery({
    queryKey: ["cv-content", "en"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cv_content")
        .select("*")
        .eq("lang", "en")
        .maybeSingle();
      if (error) throw error;
      if (data) return data.data as unknown as CVData;
      return defaultContent.en;
    },
  });

  const trQuery = useQuery({
    queryKey: ["cv-content", "tr"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cv_content")
        .select("*")
        .eq("lang", "tr")
        .maybeSingle();
      if (error) throw error;
      if (data) return data.data as unknown as CVData;
      return defaultContent.tr;
    },
  });

  const saveBothMutation = useMutation({
    mutationFn: async ({ enData, trData, userId }: { enData: CVData; trData: CVData; userId: string }) => {
      await Promise.all([
        upsertCVContent(userId, "en", enData),
        upsertCVContent(userId, "tr", trData),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cv-content"] });
    },
  });

  return {
    enData: enQuery.data ?? defaultContent.en,
    trData: trQuery.data ?? defaultContent.tr,
    isLoading: enQuery.isLoading || trQuery.isLoading,
    saveBoth: saveBothMutation.mutate,
    isSaving: saveBothMutation.isPending,
  };
}
