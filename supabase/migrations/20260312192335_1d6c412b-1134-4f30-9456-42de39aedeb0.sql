
-- Trigger function: sync events → section_cards
CREATE OR REPLACE FUNCTION public.sync_event_cards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.section_cards (section_key, card_key, card_name, display_order, is_visible)
    VALUES ('events', 'event_' || NEW.id, NEW.name, 0, NEW.is_active)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.section_cards
    SET card_name = NEW.name,
        is_visible = NEW.is_active,
        updated_at = now()
    WHERE section_key = 'events' AND card_key = 'event_' || NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.section_cards
    WHERE section_key = 'events' AND card_key = 'event_' || OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach trigger
CREATE TRIGGER sync_event_to_section_cards
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_event_cards();

-- Backfill existing events
INSERT INTO public.section_cards (section_key, card_key, card_name, display_order, is_visible)
SELECT 'events', 'event_' || e.id, e.name, 0, e.is_active
FROM public.events e
WHERE NOT EXISTS (
  SELECT 1 FROM public.section_cards sc
  WHERE sc.section_key = 'events' AND sc.card_key = 'event_' || e.id
);

-- Clean up orphaned event cards
DELETE FROM public.section_cards
WHERE section_key = 'events'
AND card_key LIKE 'event_%'
AND card_key NOT IN (SELECT 'event_' || id FROM public.events);
