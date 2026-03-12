import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SectionVisibility {
  section_key: string;
  is_visible: boolean;
  display_order: number;
}

interface CardVisibility {
  section_key: string;
  card_key: string;
  is_visible: boolean;
}

interface SiteVisibilityCtx {
  sections: Map<string, boolean>;
  cards: Map<string, boolean>;
  orderedSectionKeys: string[];
  maintenanceMode: boolean;
  loading: boolean;
  isSectionVisible: (key: string) => boolean;
  isCardVisible: (sectionKey: string, cardKey: string) => boolean;
}

const SiteVisibilityContext = createContext<SiteVisibilityCtx>({
  sections: new Map(),
  cards: new Map(),
  orderedSectionKeys: [],
  maintenanceMode: false,
  loading: true,
  isSectionVisible: () => true,
  isCardVisible: () => true,
});

export const useSiteVisibility = () => useContext(SiteVisibilityContext);

export const SiteVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [sections, setSections] = useState<Map<string, boolean>>(new Map());
  const [cards, setCards] = useState<Map<string, boolean>>(new Map());
  const [orderedSectionKeys, setOrderedSectionKeys] = useState<string[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Timeout fallback: stop loading after 5 seconds even if DB is slow
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    const [{ data: secs }, { data: crds }] = await Promise.all([
      supabase.from("site_sections").select("section_key, is_visible"),
      supabase.from("section_cards").select("section_key, card_key, is_visible"),
    ]);

    if (secs) {
      const map = new Map<string, boolean>();
      (secs as SectionVisibility[]).forEach((s) => map.set(s.section_key, s.is_visible));
      setSections(map);
      // Check maintenance mode - all sections except footer hidden means maintenance
      const allHidden = (secs as SectionVisibility[])
        .filter((s) => s.section_key !== "footer")
        .every((s) => !s.is_visible);
      setMaintenanceMode(allHidden && secs.length > 1);
    }
    if (crds) {
      const map = new Map<string, boolean>();
      (crds as CardVisibility[]).forEach((c) => map.set(`${c.section_key}:${c.card_key}`, c.is_visible));
      setCards(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("site_visibility")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_sections" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "section_cards" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const isSectionVisible = useCallback((key: string) => sections.get(key) ?? true, [sections]);
  const isCardVisible = useCallback(
    (sectionKey: string, cardKey: string) => cards.get(`${sectionKey}:${cardKey}`) ?? true,
    [cards]
  );

  return (
    <SiteVisibilityContext.Provider value={{ sections, cards, maintenanceMode, loading, isSectionVisible, isCardVisible }}>
      {children}
    </SiteVisibilityContext.Provider>
  );
};
