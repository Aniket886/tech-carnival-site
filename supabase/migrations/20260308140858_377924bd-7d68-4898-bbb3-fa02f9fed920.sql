
CREATE OR REPLACE FUNCTION public.validate_contact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate name: 2-100 chars
  IF char_length(NEW.name) < 2 OR char_length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'name must be between 2 and 100 characters';
  END IF;

  -- Validate email
  IF char_length(NEW.email) > 255 OR NEW.email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  -- Validate phone if provided: must be 10-digit Indian mobile
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF NEW.phone !~ '^[6-9][0-9]{9}$' THEN
      RAISE EXCEPTION 'Phone must be a valid 10-digit Indian mobile number starting with 6-9';
    END IF;
  END IF;

  -- Validate message: 10-500 chars
  IF char_length(NEW.message) < 10 OR char_length(NEW.message) > 500 THEN
    RAISE EXCEPTION 'Message must be between 10 and 500 characters';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_contact_before_insert
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact();
