
-- Trigger function: sync faqs → section_cards
CREATE OR REPLACE FUNCTION public.sync_faq_cards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.section_cards (section_key, card_key, card_name, display_order, is_visible)
    VALUES ('faq', 'faq_' || NEW.id, NEW.question, NEW.display_order, NEW.is_visible)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.section_cards
    SET card_name = NEW.question,
        is_visible = NEW.is_visible,
        display_order = NEW.display_order,
        updated_at = now()
    WHERE section_key = 'faq' AND card_key = 'faq_' || NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.section_cards
    WHERE section_key = 'faq' AND card_key = 'faq_' || OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach trigger to faqs table
CREATE TRIGGER sync_faq_to_section_cards
AFTER INSERT OR UPDATE OR DELETE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION public.sync_faq_cards();

-- Backfill: sync any existing FAQs that are missing from section_cards
INSERT INTO public.section_cards (section_key, card_key, card_name, display_order, is_visible)
SELECT 'faq', 'faq_' || f.id, f.question, f.display_order, f.is_visible
FROM public.faqs f
WHERE NOT EXISTS (
  SELECT 1 FROM public.section_cards sc
  WHERE sc.section_key = 'faq' AND sc.card_key = 'faq_' || f.id
);

-- Clean up old faq cards that no longer match any FAQ
DELETE FROM public.section_cards
WHERE section_key = 'faq'
AND card_key NOT IN (SELECT 'faq_' || id FROM public.faqs);
