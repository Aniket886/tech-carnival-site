
-- Fix admin_sessions: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can insert own sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admins can update own sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Owners can manage all admin_sessions" ON public.admin_sessions;

CREATE POLICY "Admins can insert own sessions"
  ON public.admin_sessions FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update own sessions"
  ON public.admin_sessions FOR UPDATE TO authenticated
  USING ((user_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all sessions"
  ON public.admin_sessions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any session"
  ON public.admin_sessions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix admin_login_logs: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage admin_login_logs" ON public.admin_login_logs;
DROP POLICY IF EXISTS "Authenticated users can insert own login logs" ON public.admin_login_logs;

CREATE POLICY "Admins can read admin_login_logs"
  ON public.admin_login_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert own login logs"
  ON public.admin_login_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
