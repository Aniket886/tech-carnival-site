
CREATE TABLE public.guide_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guide_videos ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view guide videos"
  ON public.guide_videos FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin insert/update/delete
CREATE POLICY "Admins can manage guide videos"
  ON public.guide_videos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing video URL if any
INSERT INTO public.guide_videos (title, url, display_order)
SELECT 'How to Register', setting_value, 0
FROM public.admin_settings
WHERE setting_key = 'how_to_register_video_url' AND setting_value != '';
