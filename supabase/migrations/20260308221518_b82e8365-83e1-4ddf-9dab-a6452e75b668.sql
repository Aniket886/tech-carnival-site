
-- Add unique constraint on setting_key for upsert to work
ALTER TABLE public.admin_settings ADD CONSTRAINT admin_settings_setting_key_unique UNIQUE (setting_key);

-- Drop the owner-only policy
DROP POLICY IF EXISTS "Owner can manage admin_settings" ON public.admin_settings;

-- Allow all admins to manage admin_settings
CREATE POLICY "Admins can manage admin_settings"
ON public.admin_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
