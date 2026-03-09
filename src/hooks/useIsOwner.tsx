import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/**
 * Returns true if the currently logged-in admin user is the owner.
 * Used to gate destructive operations (delete, reset) to the owner only.
 */
export const useIsOwner = () => {
  const { user } = useAdminAuth();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) { setIsOwner(false); return; }
    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("is_owner")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsOwner(data?.is_owner ?? false);
    };
    check();
  }, [user]);

  return isOwner;
};
