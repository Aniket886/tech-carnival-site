import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AdminAuthCtx {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AdminAuthCtx>({
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const useAdminAuth = () => useContext(Ctx);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async (u: User | null) => {
    setUser(u);
    if (!u) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      resolve(session?.user ?? null);
    });

    // 2. Then check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolve(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [resolve]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};
