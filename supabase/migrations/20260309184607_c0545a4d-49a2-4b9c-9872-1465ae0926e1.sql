
CREATE OR REPLACE FUNCTION public.check_registration_duplicate(
  _event_id uuid,
  _field text,
  _value text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registrations
    WHERE event_id = _event_id
      AND (
        (_field = 'leader_email' AND lower(leader_email) = lower(_value))
        OR (_field = 'leader_phone' AND leader_phone = _value)
      )
  )
$$;
