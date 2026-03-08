
-- College scores table
CREATE TABLE public.college_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name text NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  category text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  position text DEFAULT 'participant',
  team_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.college_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read scores (public leaderboard)
CREATE POLICY "Anyone can read scores" ON public.college_scores
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert scores" ON public.college_scores
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update scores" ON public.college_scores
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scores" ON public.college_scores
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.college_scores;
