import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TIMEOUT = 10;

export function useSessionTimeoutSettings() {
  const [timeoutMinutes, setTimeoutMinutes] = useState(DEFAULT_TIMEOUT);

  useEffect(() => {
    supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "session_timeout_minutes")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) {
          setTimeoutMinutes(parseInt(data.setting_value) || DEFAULT_TIMEOUT);
        }
      });
  }, []);

  const warningMinutes = Math.max(timeoutMinutes - 2, Math.floor(timeoutMinutes * 0.8));

  return {
    timeoutMs: timeoutMinutes * 60 * 1000,
    warningMs: warningMinutes * 60 * 1000,
    timeoutMinutes,
  };
}
