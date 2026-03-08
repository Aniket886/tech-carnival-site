import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const ACTIVITY_KEY = "admin_last_activity";
const LOGOUT_KEY = "admin_force_logout";
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes
const DEBOUNCE_MS = 1000;
const HEARTBEAT_MS = 60_000; // update last_active_at every 60s

interface Props {
  sessionId: string | null;
  timeoutMinutes: number;
}

export function useAdminSessionTimeout({ sessionId, timeoutMinutes }: Props) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timeoutMs = timeoutMinutes * 60 * 1000;

  const doLogout = useCallback(async (reason: string) => {
    // Mark session as inactive
    if (sessionId) {
      await supabase
        .from("admin_sessions")
        .update({
          is_active: false,
          logged_out_at: new Date().toISOString(),
          logout_reason: reason,
        } as any)
        .eq("id", sessionId);
    }
    await supabase.auth.signOut();
    localStorage.removeItem(ACTIVITY_KEY);
    localStorage.setItem(LOGOUT_KEY, Date.now().toString());
    sessionStorage.clear();
    // Prevent back button from showing cached page
    window.history.replaceState(null, "", "/admin");
    navigate("/admin", { replace: true, state: { expired: reason === "inactivity" ? "Session expired due to inactivity" : reason === "kicked_by_owner" ? "⛔ Your session was terminated by the Owner." : undefined } });
  }, [sessionId, navigate]);

  const resetTimer = useCallback(() => {
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    setShowWarning(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Set warning timer
    const warningAt = timeoutMs - WARNING_BEFORE_MS;
    if (warningAt > 0) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        setCountdown(Math.floor(WARNING_BEFORE_MS / 1000));
        countdownRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      }, warningAt);
    }

    // Set final logout timer
    timerRef.current = setTimeout(() => {
      doLogout("inactivity");
    }, timeoutMs);
  }, [timeoutMs, doLogout]);

  // Debounced activity handler
  const handleActivity = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      resetTimer();
    }, DEBOUNCE_MS);
  }, [resetTimer]);

  // Listen for activity events
  useEffect(() => {
    const events = ["mousemove", "click", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handleActivity, resetTimer]);

  // Multi-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY && e.newValue) {
        // Another tab was active, reset our timer
        resetTimer();
      }
      if (e.key === LOGOUT_KEY && e.newValue) {
        // Another tab logged out
        window.location.replace("/admin");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [resetTimer]);

  // Heartbeat: update last_active_at every 60s
  useEffect(() => {
    if (!sessionId) return;
    heartbeatRef.current = setInterval(async () => {
      await supabase
        .from("admin_sessions")
        .update({ last_active_at: new Date().toISOString() } as any)
        .eq("id", sessionId);
    }, HEARTBEAT_MS);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [sessionId]);

  // Listen for force_logout via realtime
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel("admin_session_kick")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          if (payload.new?.is_active === false && payload.new?.logout_reason === "kicked_by_owner") {
            doLogout("kicked_by_owner");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, doLogout]);

  const WarningDialog = () => (
    <AlertDialog open={showWarning} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in{" "}
            <span className="font-bold text-destructive">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
            </span>{" "}
            due to inactivity.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => doLogout("manual")}>
            Logout Now
          </Button>
          <Button onClick={() => { resetTimer(); setShowWarning(false); }}>
            Stay Logged In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { WarningDialog, doLogout };
}
