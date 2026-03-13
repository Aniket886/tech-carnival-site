CREATE OR REPLACE FUNCTION public.trim_visibility_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.visibility_log
  WHERE id NOT IN (
    SELECT id FROM public.visibility_log
    ORDER BY changed_at DESC
    LIMIT 50
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trim_visibility_log_trigger
AFTER INSERT ON public.visibility_log
FOR EACH STATEMENT
EXECUTE FUNCTION public.trim_visibility_log();