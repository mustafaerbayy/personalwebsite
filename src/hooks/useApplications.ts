import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ApplicationInsert, ApplicationStatus } from "@/types/application";
import { toast } from "sonner";

export function useApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createApplication = useMutation({
    mutationFn: async (app: Omit<ApplicationInsert, "user_id">) => {
      const { data, error } = await supabase
        .from("applications")
        .insert({ ...app, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Başvuru oluşturuldu");
    },
    onError: () => toast.error("Başvuru oluşturulamadı"),
  });

  const updateApplication = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ApplicationInsert>) => {
      const { error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Başvuru güncellendi");
    },
    onError: () => toast.error("Başvuru güncellenemedi"),
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Başvuru silindi");
    },
    onError: () => toast.error("Başvuru silinemedi"),
  });

  const createDepartment = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("departments")
        .insert({ name, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Departman eklendi");
    },
    onError: () => toast.error("Departman eklenemedi"),
  });

  return {
    applications: applicationsQuery.data ?? [],
    departments: departmentsQuery.data ?? [],
    isLoading: applicationsQuery.isLoading,
    createApplication,
    updateApplication,
    deleteApplication,
    createDepartment,
  };
}
