
-- Create admin_login_logs table for session tracking
CREATE TABLE IF NOT EXISTS public.admin_login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  action_type text NOT NULL DEFAULT 'login',
  logged_in_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_login_logs"
  ON public.admin_login_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create visibility_log table for page manager activity
CREATE TABLE IF NOT EXISTS public.visibility_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_key text NOT NULL,
  target_name text NOT NULL,
  changed_from boolean NOT NULL DEFAULT true,
  changed_to boolean NOT NULL DEFAULT false,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visibility_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage visibility_log"
  ON public.visibility_log FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add is_owner column to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;
