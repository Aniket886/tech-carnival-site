
CREATE TABLE public.registration_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  event_name text NOT NULL DEFAULT '',
  leader_name text NOT NULL DEFAULT '',
  leader_email text NOT NULL DEFAULT '',
  leader_phone text NOT NULL DEFAULT '',
  college_name text NOT NULL DEFAULT '',
  semester text,
  team_name text,
  members jsonb,
  status text NOT NULL DEFAULT 'abandoned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert drafts"
ON public.registration_drafts FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update own drafts"
ON public.registration_drafts FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can manage drafts"
ON public.registration_drafts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.registration_drafts
ADD CONSTRAINT registration_drafts_event_email_unique UNIQUE (event_id, leader_email);

ALTER PUBLICATION supabase_realtime ADD TABLE public.registration_drafts;
