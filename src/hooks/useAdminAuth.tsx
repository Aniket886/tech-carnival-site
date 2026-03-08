import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AdminAuthCtx {
  user: User | null;
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  sessionId: string | null;
  timeoutMinutes: number;
  loginAndCheckRole: (email: string, password: string) => Promise<string | null>;
  signOut: (reason?: string) => Promise<void>;
}

const Ctx = createContext<AdminAuthCtx>({
  user: null,
  isAdmin: false,
  isOwner: false,
  loading: true,
  sessionId: null,
  timeoutMinutes: 15,
  loginAndCheckRole: async () => null,
  signOut: async () => {},
});

export const useAdminAuth = () => useContext(Ctx);

async function fetchAdminInfo(userId: string): Promise<{ isAdmin: boolean; isOwner: boolean }> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role, is_owner")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) return { isAdmin: false, isOwner: false };
  return { isAdmin: true, isOwner: !!data.is_owner };
}

async function fetchTimeout(): Promise<number> {
  const { data } = await supabase
    .from("admin_settings")
    .select("setting_value")
    .eq("setting_key", "session_timeout")
    .maybeSingle();
  return data ? parseInt(data.setting_value, 10) || 15 : 15;
}

async function createSession(user: User, isOwner: boolean): Promise<string | null> {
  let ip: string | null = null;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const json = await res.json();
    ip = json.ip;
  } catch {}

  const { data, error } = await supabase
    .from("admin_sessions")
    .insert({
      user_id: user.id,
      email: user.email || "",
      role: isOwner ? "owner" : "admin",
      ip_address: ip,
      user_agent: navigator.userAgent,
    } as any)
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create session:", error);
    return null;
  }
  return (data as any)?.id || null;
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);

  // On mount, check existing session
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const info = await fetchAdminInfo(session.user.id);
        const timeout = await fetchTimeout();
        if (cancelled) return;
        setUser(session.user);
        setIsAdmin(info.isAdmin);
        setIsOwner(info.isOwner);
        setTimeoutMinutes(timeout);
        // Don't auto-create a session on page refresh — the session was already created on login
        // We re-find any active session
        const { data: existingSession } = await supabase
          .from("admin_sessions")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("is_active", true)
          .order("login_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && existingSession) {
          setSessionId((existingSession as any).id);
        }
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

  const loginAndCheckRole = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;

    const info = await fetchAdminInfo(data.user.id);
    if (!info.isAdmin) {
      await supabase.auth.signOut();
      return "Access denied — admin privileges required.";
    }

    // Check if deactivated (is_active check on user_roles — we use the absence of a role)
    // The role exists if they're active, so this is already covered

    const timeout = await fetchTimeout();
    const sid = await createSession(data.user, info.isOwner);

    setUser(data.user);
    setIsAdmin(true);
    setIsOwner(info.isOwner);
    setTimeoutMinutes(timeout);
    setSessionId(sid);
    return null;
  }, []);

  const signOut = useCallback(async (reason?: string) => {
    if (sessionId) {
      await supabase
        .from("admin_sessions")
        .update({
          is_active: false,
          logged_out_at: new Date().toISOString(),
          logout_reason: reason || "manual",
        } as any)
        .eq("id", sessionId);
    }
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsOwner(false);
    setSessionId(null);
  }, [sessionId]);

  return (
    <Ctx.Provider value={{ user, isAdmin, isOwner, loading, sessionId, timeoutMinutes, loginAndCheckRole, signOut }}>
      {children}
    </Ctx.Provider>
  );
};
