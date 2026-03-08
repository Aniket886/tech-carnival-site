-- Add is_read column to contacts
ALTER TABLE public.contacts ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Allow admins to update contacts (for marking read/unread)
CREATE POLICY "Admins can update contacts" ON public.contacts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete contacts
CREATE POLICY "Admins can delete contacts" ON public.contacts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete colleges
CREATE POLICY "Admins can delete colleges" ON public.colleges
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));