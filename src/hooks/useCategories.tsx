import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { DEFAULT_CATEGORIES, ApplicationCategory } from "@/types/application";
import { toast } from "sonner";

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = DEFAULT_CATEGORIES, isLoading } = useQuery({
    queryKey: ["application_categories", user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_CATEGORIES;
      const { data, error } = await supabase
        .from("application_categories")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
      return DEFAULT_CATEGORIES;
    },
    enabled: !!user,
  });

  const saveCategories = useMutation({
    mutationFn: async (newCategories: Partial<ApplicationCategory>[]) => {
      if (!user) throw new Error("Giriş yapmalısınız");
      
      const inserts = newCategories.map((c, i) => ({
        user_id: user.id,
        key: c.key || `cat_${Date.now()}_${i}`,
        label: c.label || "Yeni Kategori",
        color: c.color || "#3b82f6",
        order_index: i,
      }));
      
      const { error: delError } = await supabase.from("application_categories").delete().eq("user_id", user.id);
      if (delError) throw delError;

      const { data, error } = await supabase.from("application_categories").insert(inserts).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application_categories"] });
      toast.success("Kategoriler başarıyla güncellendi");
    },
    onError: (err: any) => {
      toast.error(err.message || "Kategoriler güncellenemedi");
    }
  });

  type CType = typeof DEFAULT_CATEGORIES[0] | ApplicationCategory;

  const getCategory = (key: string): CType => {
    return categories.find((c: CType) => c.key === key) || { key, label: key, color: "#6b7280", order_index: 999 };
  };

  return { categories, isLoading, saveCategories, getCategory };
}
