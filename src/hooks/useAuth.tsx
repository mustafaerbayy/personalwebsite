import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  needsPasswordReset: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string, type: "signup" | "recovery" | "email_change") => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearPasswordReset: () => void;
  sendDeleteCode: () => Promise<void>;
  deleteAccount: (code: string) => Promise<void>;
  checkDeletedEmail: (email: string) => Promise<{ blocked: boolean; hoursLeft?: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setNeedsPasswordReset(true);
      }
      if (session?.user) {
        // Defer the profile fetch to avoid Supabase auth deadlock
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || "" },
      },
    });
    if (error) throw error;
  };

  const verifyOtp = async (email: string, token: string, type: "signup" | "recovery" | "email_change") => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setNeedsPasswordReset(false);
  };

  const clearPasswordReset = () => {
    setNeedsPasswordReset(false);
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error("Oturum açık değil");

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id);

    if (error) throw error;
    await fetchProfile(user.id);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const sendDeleteCode = async () => {
    const { data, error } = await supabase.functions.invoke("send-delete-code");
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  };

  const deleteAccount = async (code: string) => {
    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: { code },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    // After deletion, sign out locally
    await supabase.auth.signOut();
  };

  const checkDeletedEmail = async (email: string): Promise<{ blocked: boolean; hoursLeft?: number }> => {
    const { data, error } = await supabase.rpc("check_deleted_email", { check_email: email });
    if (error || !data || data.length === 0) {
      return { blocked: false };
    }
    const row = data[0];
    if (row.is_blocked) {
      // Parse interval string to get hours
      const remaining = row.cooldown_remaining || "";
      const hourMatch = remaining.match(/(\d+):(\d+):(\d+)/);
      let hoursLeft = 24;
      if (hourMatch) {
        hoursLeft = parseInt(hourMatch[1]) + (parseInt(hourMatch[2]) > 0 ? 1 : 0);
      }
      return { blocked: true, hoursLeft };
    }
    return { blocked: false };
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      needsPasswordReset,
      signIn,
      signUp,
      signOut,
      verifyOtp,
      resetPassword,
      updatePassword,
      updateProfile,
      updateEmail,
      refreshProfile,
      clearPasswordReset,
      sendDeleteCode,
      deleteAccount,
      checkDeletedEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
