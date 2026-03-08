
-- Allow all admins to read admin_sessions (not just owners)
DROP POLICY IF EXISTS "Admins can read own sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.admin_sessions;

CREATE POLICY "Admins can read all sessions"
ON public.admin_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow owners to delete/update any session (for kick)
DROP POLICY IF EXISTS "Owners can manage all admin_sessions" ON public.admin_sessions;
CREATE POLICY "Owners can manage all admin_sessions"
ON public.admin_sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.is_owner = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.is_owner = true
  )
);
