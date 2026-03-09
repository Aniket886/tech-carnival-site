
-- Add payment_screenshot_url column to registrations
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_screenshot_url text;

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to payment-screenshots bucket
CREATE POLICY "Anyone can upload payment screenshots"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow anyone to read payment screenshots
CREATE POLICY "Anyone can read payment screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-screenshots');

-- Allow admins to delete payment screenshots
CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'));
