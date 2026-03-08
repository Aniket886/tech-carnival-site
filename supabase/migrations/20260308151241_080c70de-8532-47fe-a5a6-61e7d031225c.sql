
-- Allow anyone to insert colleges (for user-submitted colleges from registration)
CREATE POLICY "Anyone can submit a college"
ON public.colleges FOR INSERT
WITH CHECK (
  source = 'user_submitted' AND approval_status = 'pending'
);
