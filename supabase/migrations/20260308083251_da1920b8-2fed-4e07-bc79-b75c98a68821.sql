
-- Bot contacts table for core team and event coordinators
CREATE TABLE public.bot_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL DEFAULT 'event_coordinator',
  name text NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  phone text NOT NULL,
  email text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bot_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bot_contacts" ON public.bot_contacts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bot_contacts" ON public.bot_contacts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bot FAQs table
CREATE TABLE public.bot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_pattern text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bot_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bot_faqs" ON public.bot_faqs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bot_faqs" ON public.bot_faqs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
