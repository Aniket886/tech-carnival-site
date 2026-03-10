INSERT INTO public.site_sections (section_key, section_name, description, is_visible, display_order)
VALUES ('gallery', 'Gallery', 'Photo gallery section on the homepage', true, 8)
ON CONFLICT (section_key) DO NOTHING;