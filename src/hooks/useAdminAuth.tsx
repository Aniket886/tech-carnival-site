import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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
  const checking = useRef(false);

  const checkRole = useCallback(async (u: User | null) => {
    if (checking.current) return;
    checking.current = true;

    setUser(u);
    if (!u) {
      setIsAdmin(false);
      setLoading(false);
      checking.current = false;
      return;
    }

    try {
      // Small delay to ensure the auth token is propagated to the client
      await new Promise(r => setTimeout(r, 300));

      // Re-fetch session to ensure token is current
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        checking.current = false;
        return;
      }

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      console.log("has_role result:", data, "error:", error);
      setIsAdmin(!!data);
    } catch (err) {
      console.error("checkRole error:", err);
      setIsAdmin(false);
    }

    setLoading(false);
    checking.current = false;
  }, []);

  useEffect(() => {
    // 1. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      console.log("Auth state changed:", _ev, session?.user?.email);
      checkRole(session?.user ?? null);
    });

    // 2. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [checkRole]);

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
