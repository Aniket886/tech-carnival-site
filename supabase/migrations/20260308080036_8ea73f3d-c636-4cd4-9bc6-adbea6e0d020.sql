
-- Site sections table
CREATE TABLE public.site_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  section_name text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_sections" ON public.site_sections
  FOR SELECT USING (true);

CREATE POLICY "Admins can update site_sections" ON public.site_sections
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site_sections" ON public.site_sections
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site_sections" ON public.site_sections
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Section cards table
CREATE TABLE public.section_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL REFERENCES public.site_sections(section_key) ON DELETE CASCADE,
  card_key text NOT NULL,
  card_name text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(section_key, card_key)
);

ALTER TABLE public.section_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read section_cards" ON public.section_cards
  FOR SELECT USING (true);

CREATE POLICY "Admins can update section_cards" ON public.section_cards
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert section_cards" ON public.section_cards
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete section_cards" ON public.section_cards
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.section_cards;
