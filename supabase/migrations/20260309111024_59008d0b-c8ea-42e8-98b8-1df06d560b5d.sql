
-- Schedule events table
CREATE TABLE public.schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji text NOT NULL DEFAULT '📌',
  name text NOT NULL,
  start_hour numeric NOT NULL,
  end_hour numeric NOT NULL,
  category text NOT NULL DEFAULT 'technical',
  venue text NOT NULL DEFAULT '',
  team_size text,
  day smallint NOT NULL DEFAULT 1,
  lane smallint NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedule_events" ON public.schedule_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read schedule_events" ON public.schedule_events
  FOR SELECT TO public
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_events;

-- Seed from existing hardcoded data
INSERT INTO public.schedule_events (emoji, name, start_hour, end_hour, category, venue, team_size, day, lane, display_order) VALUES
  ('🏁', 'Assemble', 8.75, 9, 'ceremony', 'Main Gate', NULL, 1, 0, 1),
  ('🎤', 'Inauguration + Flash Mob + Banner Drop', 9, 10, 'ceremony', 'Main Auditorium', NULL, 1, 0, 2),
  ('⚡', 'Hack Momentum (6hr Hackathon)', 10.5, 17.5, 'technical', 'Main Auditorium', '2-4', 1, 0, 3),
  ('🧠', 'Brain Quest (Mega Quiz)', 10.5, 13.5, 'technical', 'Seminar Hall A', '2', 1, 1, 4),
  ('📊', 'Pixel Perfect', 10.5, 13.5, 'technical', 'Exhibition Hall', '1-2', 1, 2, 5),
  ('🔍', 'Myth Busters', 10, 12, 'technical', 'Seminar Hall B', 'Solo', 1, 3, 6),
  ('🍽️', 'Lunch Break', 13.5, 14.5, 'break', 'Food Court', NULL, 1, 1, 7),
  ('🎯', 'Pitch Perfect', 14.5, 17, 'technical', 'Seminar Hall B', '1-2', 1, 2, 8),
  ('🎮', 'Battle Ground – Free Fire', 14.5, 17.5, 'gaming', 'Gaming Arena', '4 (squad)', 1, 1, 9),
  ('💃', 'Dance Mania (Group Dance)', 18, 20, 'cultural', 'Main Stage', '6-12', 1, 0, 10),
  ('🧭', 'Code Compass', 9, 11, 'technical', 'Computer Lab 1', 'Solo', 2, 0, 11),
  ('🎬', 'Scitopia (Skit Play)', 11.5, 14, 'cultural', 'Main Auditorium', '5-10', 2, 0, 12),
  ('🍽️', 'Lunch Break', 14, 15, 'break', 'Food Court', NULL, 2, 1, 13),
  ('🏆', 'Valedictory + Special Band Performance', 15.25, 18, 'ceremony', 'Main Auditorium', NULL, 2, 0, 14);
