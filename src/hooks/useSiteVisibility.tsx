import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SECTION_KEYS = [
  "hero", "sponsors", "about", "how_to_register", "events", "schedule",
  "leaderboard", "gallery", "faq", "contact", "organizing_committee", "core_team", "footer",
];

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

function applyDefaults(
  setSections: React.Dispatch<React.SetStateAction<Map<string, boolean>>>,
  setOrderedSectionKeys: React.Dispatch<React.SetStateAction<string[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const map = new Map<string, boolean>();
  DEFAULT_SECTION_KEYS.forEach((k) => map.set(k, true));
  setSections(map);
  setOrderedSectionKeys(DEFAULT_SECTION_KEYS);
  setLoading(false);
}

export const SiteVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [sections, setSections] = useState<Map<string, boolean>>(new Map());
  const [cards, setCards] = useState<Map<string, boolean>>(new Map());
  const [orderedSectionKeys, setOrderedSectionKeys] = useState<string[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  // Timeout fallback: stop loading after 5 seconds even if DB is slow
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fetchedRef.current) {
        applyDefaults(setSections, setOrderedSectionKeys, setLoading);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [{ data: secs }, { data: crds }] = await Promise.all([
        supabase.from("site_sections").select("section_key, is_visible, display_order").order("display_order"),
        supabase.from("section_cards").select("section_key, card_key, is_visible"),
      ]);

      if (secs && secs.length > 0) {
        fetchedRef.current = true;
        const sorted = (secs as SectionVisibility[]).sort((a, b) => a.display_order - b.display_order);
        const map = new Map<string, boolean>();
        sorted.forEach((s) => map.set(s.section_key, s.is_visible));
        setSections(map);
        setOrderedSectionKeys(sorted.map((s) => s.section_key));
        const allHidden = sorted
          .filter((s) => s.section_key !== "footer")
          .every((s) => !s.is_visible);
        setMaintenanceMode(allHidden && secs.length > 1);
      } else {
        applyDefaults(setSections, setOrderedSectionKeys, setLoading);
      }
      if (crds) {
        const map = new Map<string, boolean>();
        (crds as CardVisibility[]).forEach((c) => map.set(`${c.section_key}:${c.card_key}`, c.is_visible));
        setCards(map);
      }
      setLoading(false);
    } catch (err) {
      console.warn("Failed to fetch site visibility, using defaults", err);
      applyDefaults(setSections, setOrderedSectionKeys, setLoading);
    }
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
    <SiteVisibilityContext.Provider value={{ sections, cards, orderedSectionKeys, maintenanceMode, loading, isSectionVisible, isCardVisible }}>
      {children}
    </SiteVisibilityContext.Provider>
  );
};