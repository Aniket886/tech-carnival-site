import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AdminAuthCtx {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginAndCheckRole: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Minutes remaining before auto-logout, null when inactive tracking is off */
  idleMinutesLeft: number | null;
  /** Whether the warning dialog should be shown */
  showIdleWarning: boolean;
  /** User dismissed warning / chose to stay */
  dismissIdleWarning: () => void;
}

const Ctx = createContext<AdminAuthCtx>({
  user: null,
  isAdmin: false,
  loading: true,
  loginAndCheckRole: async () => null,
  signOut: async () => {},
  idleMinutesLeft: null,
  showIdleWarning: false,
  dismissIdleWarning: () => {},
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

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
const WARNING_BEFORE_MS = 30_000; // show warning 30s before expiry

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(30);
  const [idleMinutesLeft, setIdleMinutesLeft] = useState<number | null>(null);
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const signedInRef = useRef(false);

  // Fetch session timeout setting
  const fetchTimeout = useCallback(async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "session_timeout")
      .maybeSingle();
    if (data) {
      setTimeoutMinutes(parseInt(data.setting_value, 10) || 30);
    }
  }, []);

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
        signedInRef.current = admin;
        if (admin) fetchTimeout();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAdmin(false);
        signedInRef.current = false;
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchTimeout]);

  // Track user activity
  useEffect(() => {
    const handler = () => {
      lastActivityRef.current = Date.now();
      // If warning is showing and user interacts, dismiss it
      setShowIdleWarning(false);
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handler));
    };
  }, []);

  // Idle check interval
  useEffect(() => {
    if (!isAdmin || !user) return;

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const remaining = timeoutMs - elapsed;

      if (remaining <= 0) {
        // Auto logout
        setShowIdleWarning(false);
        setIdleMinutesLeft(0);
        supabase.auth.signOut().then(() => {
          setUser(null);
          setIsAdmin(false);
          signedInRef.current = false;
        });
        return;
      }

      const minutesLeft = Math.ceil(remaining / 60000);
      setIdleMinutesLeft(minutesLeft);

      if (remaining <= WARNING_BEFORE_MS) {
        setShowIdleWarning(true);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isAdmin, user, timeoutMinutes]);

  // Re-fetch timeout when it might change (poll every 10s while admin)
  useEffect(() => {
    if (!isAdmin) return;
    const id = setInterval(fetchTimeout, 10_000);
    return () => clearInterval(id);
  }, [isAdmin, fetchTimeout]);

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
    signedInRef.current = true;
    lastActivityRef.current = Date.now();
    fetchTimeout();
    return null;
  }, [fetchTimeout]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    signedInRef.current = false;
  }, []);

  const dismissIdleWarning = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowIdleWarning(false);
  }, []);

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, loginAndCheckRole, signOut, idleMinutesLeft, showIdleWarning, dismissIdleWarning }}>
      {children}
    </Ctx.Provider>
  );
};
