
-- Create a public storage bucket for sponsor logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Admins can upload sponsor logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sponsor-logos');

-- Allow authenticated users to update/delete
CREATE POLICY "Admins can update sponsor logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sponsor-logos');

CREATE POLICY "Admins can delete sponsor logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sponsor-logos');

-- Allow public read access
CREATE POLICY "Public can view sponsor logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sponsor-logos');
