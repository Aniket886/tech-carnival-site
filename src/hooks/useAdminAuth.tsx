import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AdminAuthCtx {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginAndCheckRole: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AdminAuthCtx>({
  user: null,
  isAdmin: false,
  loading: true,
  loginAndCheckRole: async () => null,
  signOut: async () => {},
});

export const useAdminAuth = () => useContext(Ctx);

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin" as const,
  });
  if (error) {
    console.error("has_role error:", error);
    return false;
  }
  return !!data;
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount, check existing session
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const admin = await fetchIsAdmin(session.user.id);
        if (cancelled) return;
        setUser(session.user);
        setIsAdmin(admin);
      }
      setLoading(false);
    });

    // Listen for sign-out only
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Login: sign in, then check role, then update state
  const loginAndCheckRole = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;

    const admin = await fetchIsAdmin(data.user.id);
    if (!admin) {
      await supabase.auth.signOut();
      return "Access denied — admin privileges required.";
    }

    setUser(data.user);
    setIsAdmin(true);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, loginAndCheckRole, signOut }}>
      {children}
    </Ctx.Provider>
  );
};
