import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Papel = "admin" | "colaborador";

interface AuthValue {
  session: Session | null;
  loading: boolean;
  mustChangePassword: boolean;
  papel: Papel | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [papel, setPapel] = useState<Papel | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setPapel(null);
      return;
    }
    let cancelado = false;
    supabase
      .from("perfis")
      .select("papel")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelado) setPapel((data?.papel as Papel | undefined) ?? "colaborador");
      });
    return () => {
      cancelado = true;
    };
  }, [session?.user.id]);

  const signIn: AuthValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updatePassword: AuthValue["updatePassword"] = async (password) => {
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    return { error: error?.message ?? null };
  };

  const mustChangePassword = session?.user.user_metadata?.["must_change_password"] === true;

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        mustChangePassword,
        papel,
        isAdmin: papel === "admin",
        signIn,
        signOut,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
