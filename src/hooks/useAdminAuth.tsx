import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AdminAuthCtx {
  user: User | null;
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  sessionId: string | null;
  loginAndCheckRole: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AdminAuthCtx>({
  user: null,
  isAdmin: false,
  isOwner: false,
  loading: true,
  sessionId: null,
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

async function fetchIsOwner(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("is_owner")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data?.is_owner ?? false;
}

async function createSession(userId: string, email: string): Promise<string | null> {
  const { data } = await supabase
    .from("admin_sessions")
    .insert({
      user_id: userId,
      email,
      is_active: true,
      user_agent: navigator.userAgent,
    })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function endSession(sessionId: string, reason: string) {
  await supabase
    .from("admin_sessions")
    .update({
      is_active: false,
      logged_out_at: new Date().toISOString(),
      logout_reason: reason,
    })
    .eq("id", sessionId);
}

async function logAction(userId: string, email: string, actionType: string) {
  await supabase
    .from("admin_login_logs")
    .insert({ user_id: userId, email, action_type: actionType });
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const [admin, owner] = await Promise.all([
          fetchIsAdmin(session.user.id),
          fetchIsOwner(session.user.id),
        ]);
        if (cancelled) return;
        setUser(session.user);
        setIsAdmin(admin);
        setIsOwner(owner);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAdmin(false);
        setIsOwner(false);
        setSessionId(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Heartbeat: update last_active_at every 60s
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      supabase
        .from("admin_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", sessionId)
        .then();
    }, 60_000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const loginAndCheckRole = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;

    const [admin, owner] = await Promise.all([
      fetchIsAdmin(data.user.id),
      fetchIsOwner(data.user.id),
    ]);

    if (!admin) {
      await supabase.auth.signOut();
      return "Access denied — admin privileges required.";
    }

    // Create session & log
    const sid = await createSession(data.user.id, email);
    await logAction(data.user.id, email, "login");

    setUser(data.user);
    setIsAdmin(true);
    setIsOwner(owner);
    setSessionId(sid);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    if (user && sessionId) {
      await Promise.all([
        endSession(sessionId, "manual_logout"),
        logAction(user.id, user.email ?? "", "logout"),
      ]);
    }
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsOwner(false);
    setSessionId(null);
  }, [user, sessionId]);

  return (
    <Ctx.Provider value={{ user, isAdmin, isOwner, loading, sessionId, loginAndCheckRole, signOut }}>
      {children}
    </Ctx.Provider>
  );
};
