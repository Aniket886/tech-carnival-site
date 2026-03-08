
-- Use validation triggers instead of CHECK constraints per guidelines

CREATE OR REPLACE FUNCTION public.validate_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF char_length(NEW.leader_name) < 2 OR char_length(NEW.leader_name) > 20 THEN
    RAISE EXCEPTION 'leader_name must be between 2 and 20 characters';
  END IF;
  IF char_length(NEW.leader_phone) != 10 OR NEW.leader_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'leader_phone must be a valid 10-digit Indian mobile number';
  END IF;
  IF char_length(NEW.leader_email) > 50 OR NEW.leader_email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'leader_email must be a valid email address (max 50 chars)';
  END IF;
  IF char_length(NEW.college_name) < 3 OR char_length(NEW.college_name) > 100 THEN
    RAISE EXCEPTION 'college_name must be between 3 and 100 characters';
  END IF;
  IF NEW.team_name IS NOT NULL AND (char_length(NEW.team_name) < 3 OR char_length(NEW.team_name) > 30) THEN
    RAISE EXCEPTION 'team_name must be between 3 and 30 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_registration
  BEFORE INSERT OR UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.validate_registration();
