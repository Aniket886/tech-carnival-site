CREATE POLICY "Anyone can read drafts for upsert"
  ON public.registration_drafts
  FOR SELECT
  TO anon
  USING (true);