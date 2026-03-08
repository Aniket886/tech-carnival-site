import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown, ChevronUp, Search, Eye, EyeOff,
  RotateCcw, Construction, ExternalLink, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Section {
  id: string;
  section_key: string;
  section_name: string;
  is_visible: boolean;
  display_order: number;
  description: string | null;
  updated_at: string;
}

interface Card {
  id: string;
  section_key: string;
  card_key: string;
  card_name: string;
  is_visible: boolean;
  display_order: number;
}

interface LogEntry {
  id: string;
  action: string;
  admin_email: string | null;
  reason: string | null;
  created_at: string;
}

const sectionIcons: Record<string, string> = {
  hero: "🏠", about: "ℹ️", sponsors: "🤝", events: "📝",
  schedule: "📅", registration: "✍️", leaderboard: "🏆",
  faq: "❓", contact: "📧", footer: "📎",
};

const AdminPageManager = () => {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const fetchData = useCallback(async () => {
    const [{ data: s }, { data: c }, { data: l }] = await Promise.all([
      supabase.from("site_sections").select("*").order("display_order"),
      supabase.from("section_cards").select("*").order("display_order"),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (s) setSections(s);
    if (c) setCards(c);
    if (l) setLogs(l);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const logAction = async (action: string, reason: string) => {
    await supabase.from("activity_log").insert({
      action,
      admin_email: user?.email || null,
      reason,
    });
  };

  const toggleSection = async (section: Section) => {
    const newVal = !section.is_visible;
    const { error } = await supabase.from("site_sections").update({
      is_visible: newVal,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).eq("id", section.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, is_visible: newVal, updated_at: new Date().toISOString() } : s));
    await logAction("section_toggle", `${section.section_name}: ${section.is_visible ? "visible → hidden" : "hidden → visible"}`);
    toast({ title: `${section.section_name} ${newVal ? "shown" : "hidden"}` });
    fetchData();
  };

  const toggleCard = async (card: Card) => {
    const newVal = !card.is_visible;
    const { error } = await supabase.from("section_cards").update({
      is_visible: newVal,
      updated_at: new Date().toISOString(),
    }).eq("id", card.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, is_visible: newVal } : c));
    await logAction("card_toggle", `${card.card_name}: ${card.is_visible ? "visible → hidden" : "hidden → visible"}`);
    fetchData();
  };

  const bulkToggleCards = async (sectionKey: string, visible: boolean) => {
    await supabase.from("section_cards").update({ is_visible: visible, updated_at: new Date().toISOString() }).eq("section_key", sectionKey);
    setCards((prev) => prev.map((c) => c.section_key === sectionKey ? { ...c, is_visible: visible } : c));
    await logAction("bulk_toggle", `All cards in ${sectionKey}: ${visible ? "shown" : "hidden"}`);
    toast({ title: `All cards ${visible ? "shown" : "hidden"}` });
    fetchData();
  };

  const toggleMaintenanceMode = async () => {
    const anyVisible = sections.some((s) => s.section_key !== "footer" && s.is_visible);
    const newVal = anyVisible ? false : true; // If any visible, hide all; if all hidden, show all
    await supabase.from("site_sections").update({
      is_visible: newVal,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    }).neq("section_key", "footer");
    setSections((prev) => prev.map((s) => s.section_key === "footer" ? s : { ...s, is_visible: newVal }));
    await logAction("maintenance_mode", newVal ? "Maintenance mode OFF" : "Maintenance mode ON");
    toast({ title: newVal ? "Site is now live" : "Maintenance mode enabled" });
    fetchData();
  };

  const resetToDefault = async () => {
    await Promise.all([
      supabase.from("site_sections").update({ is_visible: true, updated_at: new Date().toISOString(), updated_by: user?.id || null }).neq("id", ""),
      supabase.from("section_cards").update({ is_visible: true, updated_at: new Date().toISOString() }).neq("id", ""),
    ]);
    await logAction("reset_defaults", "All sections and cards reset to visible");
    toast({ title: "All sections and cards reset to visible" });
    setShowResetDialog(false);
    fetchData();
  };

  const isMaintenanceOn = sections.length > 0 && sections.filter((s) => s.section_key !== "footer").every((s) => !s.is_visible);

  const getCardsForSection = (key: string) => {
    let filtered = cards.filter((c) => c.section_key === key);
    if (cardSearch) {
      const s = cardSearch.toLowerCase();
      filtered = filtered.filter((c) => c.card_name.toLowerCase().includes(s));
    }
    return filtered;
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Page Manager</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Preview Site
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowLogs(!showLogs)}
          >
            <Clock className="h-4 w-4" /> Activity Log
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 p-4 rounded-lg border border-border bg-card/30">
        <Button
          variant={isMaintenanceOn ? "destructive" : "outline"}
          size="sm"
          className="gap-2"
          onClick={toggleMaintenanceMode}
        >
          <Construction className="h-4 w-4" />
          {isMaintenanceOn ? "🔴 Maintenance ON — Click to go Live" : "Maintenance Mode"}
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowResetDialog(true)}>
          <RotateCcw className="h-4 w-4" /> Reset to Default
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => toggleSection(sections.find((s) => s.section_key === "registration")!)}
        >
          {sections.find((s) => s.section_key === "registration")?.is_visible
            ? "🔒 Close Registration"
            : "🔓 Open Registration"
          }
        </Button>
      </div>

      {/* Activity Log Panel */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-lg border border-border bg-card/30"
          >
            <div className="p-4 max-h-64 overflow-y-auto space-y-2">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Recent Activity</p>
              {logs.length === 0 && <p className="text-xs text-muted-foreground">No activity yet</p>}
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  <span className="text-foreground">{log.reason}</span>
                  {log.admin_email && (
                    <span className="text-muted-foreground ml-auto">— {log.admin_email}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Cards */}
      <div className="space-y-3">
        {sections.map((section) => {
          const sectionCards = getCardsForSection(section.section_key);
          const visibleCards = sectionCards.filter((c) => c.is_visible).length;
          const isExpanded = expandedKey === section.section_key;

          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-all duration-300 ${
                section.is_visible
                  ? "border-border bg-card/30"
                  : "border-destructive/20 bg-destructive/5 opacity-70"
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                <span className="text-2xl shrink-0">
                  {sectionIcons[section.section_key] || "📄"}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{section.section_name}</p>
                    <Badge
                      variant="outline"
                      className={section.is_visible
                        ? "bg-green-500/15 text-green-400 border-green-500/30 text-[10px]"
                        : "bg-red-500/15 text-red-400 border-red-500/30 text-[10px]"
                      }
                    >
                      {section.is_visible ? "✅ Visible" : "🚫 Hidden"}
                    </Badge>
                  </div>
                  {section.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    {sectionCards.length > 0 && (
                      <span>{visibleCards}/{sectionCards.length} cards visible</span>
                    )}
                    <span>Updated {new Date(section.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Switch
                  checked={section.is_visible}
                  onCheckedChange={() => toggleSection(section)}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-destructive/50"
                />

                {sectionCards.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setExpandedKey(isExpanded ? null : section.section_key)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              {/* Expanded cards */}
              <AnimatePresence>
                {isExpanded && sectionCards.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border/50"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[150px] max-w-xs">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Filter cards..."
                            value={cardSearch}
                            onChange={(e) => setCardSearch(e.target.value)}
                            className="pl-8 h-8 text-xs"
                          />
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => bulkToggleCards(section.section_key, true)}>
                          <Eye className="h-3 w-3" /> Show All
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => bulkToggleCards(section.section_key, false)}>
                          <EyeOff className="h-3 w-3" /> Hide All
                        </Button>
                      </div>

                      <div className="divide-y divide-border/30">
                        {sectionCards.map((card) => (
                          <div
                            key={card.id}
                            className={`flex items-center gap-3 py-2.5 transition-opacity ${
                              card.is_visible ? "" : "opacity-50"
                            }`}
                          >
                            <span className="text-sm text-foreground flex-1">{card.card_name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                card.is_visible
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {card.is_visible ? "Visible" : "Hidden"}
                            </Badge>
                            <Switch
                              checked={card.is_visible}
                              onCheckedChange={() => toggleCard(card)}
                              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-destructive/50 scale-90"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Visibility?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make all sections and cards visible. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetToDefault}>Reset to Default</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPageManager;
