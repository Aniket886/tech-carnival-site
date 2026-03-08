DROP POLICY IF EXISTS "Admins can manage admin_login_logs" ON public.admin_login_logs;

CREATE POLICY "Admins can manage admin_login_logs"
ON public.admin_login_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));