
-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  section TEXT NOT NULL CHECK (section IN ('core_team', 'organizing_committee')),
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active team members"
ON public.team_members FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage team members"
ON public.team_members FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for team images
INSERT INTO storage.buckets (id, name, public) VALUES ('team-images', 'team-images', true);

-- Storage policies
CREATE POLICY "Anyone can view team images"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-images');

CREATE POLICY "Admins can upload team images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update team images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete team images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed existing organizing committee
INSERT INTO public.team_members (name, role, section, display_order) VALUES
('Dr. Shweta Marigoudar', 'Dean, FCIT', 'organizing_committee', 1),
('Prof. Rajashekhar G. C', 'Director, SCA, FCIT', 'organizing_committee', 2),
('Prof. Shamina Attar', 'Director, SCS, FCIT', 'organizing_committee', 3),
('Prof. Manjula K', 'Organizing Secretary', 'organizing_committee', 4),
('Prof. Sugandha M S', 'Program Co-ordinator', 'organizing_committee', 5);

-- Seed existing core team
INSERT INTO public.team_members (name, section, display_order) VALUES
('Adarsh Gouda D', 'core_team', 1),
('Aniket Tegginamath', 'core_team', 2),
('Bhanuprakash K S', 'core_team', 3),
('K Vishwasheetal', 'core_team', 4),
('Sonali Meharwade', 'core_team', 5);
