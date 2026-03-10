import { supabase } from "@/integrations/supabase/client";

export const logActivity = async (action: string, reason?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("activity_log").insert({
    action,
    reason: reason || null,
    admin_email: user?.email || null,
  });
};
