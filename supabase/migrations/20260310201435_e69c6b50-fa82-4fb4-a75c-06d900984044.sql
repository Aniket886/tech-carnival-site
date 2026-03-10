
-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link_url text,
  link_label text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active announcements" ON public.announcements
  FOR SELECT TO public
  USING (is_active = true AND now() >= starts_at AND (expires_at IS NULL OR now() <= expires_at));

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Gallery items table
CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  uploaded_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible gallery items" ON public.gallery_items
  FOR SELECT TO public
  USING (is_visible = true);

CREATE POLICY "Admins can manage gallery items" ON public.gallery_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Gallery images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', true);

CREATE POLICY "Anyone can read gallery images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'gallery-images');

CREATE POLICY "Admins can upload gallery images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gallery images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'gallery-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Email sends tracking table
CREATE TABLE public.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  template_id text,
  recipient_count integer NOT NULL DEFAULT 0,
  filters jsonb DEFAULT '{}'::jsonb,
  sent_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email sends" ON public.email_sends
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
