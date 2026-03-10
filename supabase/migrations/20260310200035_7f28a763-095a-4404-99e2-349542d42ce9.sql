
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  link_url text DEFAULT NULL,
  link_label text DEFAULT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible faqs"
  ON public.faqs FOR SELECT TO public
  USING (is_visible = true);

CREATE POLICY "Admins can manage faqs"
  ON public.faqs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed with existing hardcoded FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
  ('Who can participate?', 'Any college student with a valid ID can participate.', 1),
  ('Is there a registration fee?', 'Some events are free while others have a nominal fee. Check event details.', 2),
  ('Can I register for multiple events?', 'Yes! You can register for multiple events as long as they don''t have time conflicts.', 3),
  ('Will I get a certificate?', 'All participants will receive participation certificates. Winners get additional merit certificates.', 4),
  ('What should I bring?', 'Your college ID, laptop (for hackathon/coding events), and enthusiasm!', 5),
  ('How will I know my registration is confirmed?', 'You will receive a confirmation email after admin verification.', 6);
