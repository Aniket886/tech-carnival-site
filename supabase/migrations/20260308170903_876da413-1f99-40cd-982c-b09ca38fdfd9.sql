
-- Allow owner to update any admin session (for kicking)
CREATE POLICY "Owner can update any session"
  ON public.admin_sessions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::app_role
      AND user_roles.is_owner = true
  ));
