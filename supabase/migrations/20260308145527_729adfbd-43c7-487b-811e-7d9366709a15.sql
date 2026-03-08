
ALTER TABLE public.colleges 
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS affiliated_university text,
  ADD COLUMN IF NOT EXISTS website_url text;
