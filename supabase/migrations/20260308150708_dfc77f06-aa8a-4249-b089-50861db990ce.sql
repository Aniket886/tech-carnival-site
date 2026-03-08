
-- Create admin_sessions table
CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  login_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  logged_out_at timestamptz,
  logout_reason text
);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Owner (is_owner=true in user_roles) can do everything
CREATE POLICY "Owners can manage all admin_sessions"
ON public.admin_sessions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_owner = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_owner = true
  )
);

-- Admins can SELECT their own sessions
CREATE POLICY "Admins can read own sessions"
ON public.admin_sessions FOR SELECT TO authenticated
USING (
  user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can INSERT their own sessions
CREATE POLICY "Admins can insert own sessions"
ON public.admin_sessions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can UPDATE their own sessions
CREATE POLICY "Admins can update own sessions"
ON public.admin_sessions FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role)
);

-- Enable realtime for admin_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_sessions;

-- Update admin_settings RLS: only owner can update
DROP POLICY IF EXISTS "Admins can manage admin_settings" ON public.admin_settings;

CREATE POLICY "Owner can manage admin_settings"
ON public.admin_settings FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_owner = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND is_owner = true
  )
);
