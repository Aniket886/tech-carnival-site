import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const ACTIVITY_KEY = "admin_last_activity";
const LOGOUT_KEY = "admin_force_logout";
const CROSS_TAB_CHECK_INTERVAL = 30_000;
const DEBOUNCE_MS = 1_000;

const ACTIVITY_EVENTS = [
  "mousemove", "click", "keydown", "keypress",
  "scroll", "touchstart", "touchmove",
  "input", "change", "focus",
];

interface UseAdminSessionTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
}

export function useAdminSessionTimeout({
  timeoutMs = 600_000,
  warningMs = 480_000,
}: UseAdminSessionTimeoutOptions = {}) {
  const navigate = useNavigate();
  const { user, signOut } = useAdminAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const crossTabRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggingOut = useRef(false);

  const clearAllTimers = useCallback(() => {
    [timeoutRef, warningRef].forEach((r) => {
      if (r.current) { clearTimeout(r.current); r.current = null; }
    });
    [countdownRef, crossTabRef].forEach((r) => {
      if (r.current) { clearInterval(r.current as unknown as number); r.current = null; }
    });
  }, []);

  const performLogout = useCallback(async (reason = "inactivity") => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    clearAllTimers();
    setShowWarning(false);

    // Log session expiry
    if (user?.email) {
      await supabase.from("activity_log").insert({
        action: "session_expired",
        admin_email: user.email,
        reason,
      }).then(() => {});
    }

    // Signal other tabs
    localStorage.setItem(LOGOUT_KEY, Date.now().toString());
    localStorage.removeItem(ACTIVITY_KEY);

    await signOut();

    // Clear all supabase-related storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-")) localStorage.removeItem(key);
    });
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("sb-")) sessionStorage.removeItem(key);
    });

    // Replace history to prevent back-button access
    window.history.replaceState(null, "", "/admin");
    navigate("/admin", { replace: true, state: { sessionExpired: true } });
    isLoggingOut.current = false;
  }, [clearAllTimers, navigate, signOut, user?.email]);

  const startTimers = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);

    // Warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      const expireAt = Date.now() + (timeoutMs - warningMs);
      setRemainingSeconds(Math.ceil((timeoutMs - warningMs) / 1000));

      countdownRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((expireAt - Date.now()) / 1000));
        setRemainingSeconds(left);
        if (left <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current as unknown as number);
          performLogout();
        }
      }, 1000);
    }, warningMs);

    // Hard timeout
    timeoutRef.current = setTimeout(() => {
      performLogout();
    }, timeoutMs);
  }, [clearAllTimers, performLogout, timeoutMs, warningMs]);

  const recordActivity = useCallback(() => {
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    startTimers();

    // Refresh session on activity
    supabase.auth.refreshSession().catch(() => {});
  }, [startTimers]);

  const debouncedActivity = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(recordActivity, DEBOUNCE_MS);
  }, [recordActivity]);

  const stayLoggedIn = useCallback(() => {
    recordActivity();
  }, [recordActivity]);

  const logoutNow = useCallback(() => {
    performLogout("manual_during_warning");
  }, [performLogout]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    recordActivity();

    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, debouncedActivity, { passive: true });
    });

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOGOUT_KEY && e.newValue) {
        performLogout("cross_tab");
      }
      if (e.key === ACTIVITY_KEY && e.newValue) {
        startTimers(); // Another tab had activity
      }
    };
    window.addEventListener("storage", handleStorage);

    // Periodic cross-tab check
    crossTabRef.current = setInterval(() => {
      const last = localStorage.getItem(ACTIVITY_KEY);
      if (last && Date.now() - parseInt(last) > timeoutMs) {
        performLogout();
      }
    }, CROSS_TAB_CHECK_INTERVAL);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, debouncedActivity);
      });
      window.removeEventListener("storage", handleStorage);
      clearAllTimers();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user, debouncedActivity, recordActivity, performLogout, startTimers, clearAllTimers, timeoutMs]);

  // Verify session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin", { replace: true });
      }
    });
  }, [navigate]);

  return { showWarning, remainingSeconds, stayLoggedIn, logoutNow };
}
