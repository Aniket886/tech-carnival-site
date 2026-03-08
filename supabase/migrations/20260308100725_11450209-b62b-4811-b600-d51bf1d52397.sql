ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS utr_number text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS amount_paid text;