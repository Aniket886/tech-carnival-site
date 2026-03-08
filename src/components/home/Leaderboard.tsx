import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";

interface ScoreRow {
  id: string;
  college_name: string;
  event_id: string | null;
  event_name: string;
  category: string;
  points: number;
  position: string;
  team_name: string | null;
}

interface CollegeAgg {
  name: string;
  total: number;
  events: number;
}

const tabs = [
  { key: "overall", label: "🏆 Overall", btnClass: "btn-gold", ringColor: "ring-[hsl(45_90%_55%/0.5)]" },
  { key: "technical", label: "💻 Technical", btnClass: "btn-golden", ringColor: "ring-primary/50" },
  { key: "gaming", label: "🎮 Gaming", btnClass: "btn-red", ringColor: "ring-[hsl(0_80%_55%/0.5)]" },
  { key: "cultural", label: "🎭 Cultural", btnClass: "btn-purple", ringColor: "ring-[hsl(270_80%_60%/0.5)]" },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return "bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]";
  if (rank === 2) return "bg-gray-300/10 border-gray-400/40";
  if (rank === 3) return "bg-amber-700/10 border-amber-600/40";
  return "bg-muted/30 border-border/50";
};

const rankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const Leaderboard = () => {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [tab, setTab] = useState("overall");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      const { data } = await supabase
        .from("college_scores")
        .select("id, college_name, event_id, event_name, category, points, position, team_name")
        .order("points", { ascending: false });
      if (data) setScores(data as any);
    };
    fetchScores();

    const channel = supabase
      .channel("college_scores_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "college_scores" }, () => {
        fetchScores();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    if (tab === "overall") return scores;
    return scores.filter((s) => s.category === tab);
  }, [scores, tab]);

  const colleges = useMemo<CollegeAgg[]>(() => {
    const map = new Map<string, { total: number; events: Set<string> }>();
    filtered.forEach((s) => {
      if (!map.has(s.college_name)) map.set(s.college_name, { total: 0, events: new Set() });
      const entry = map.get(s.college_name)!;
      entry.total += s.points || 0;
      entry.events.add(s.event_name);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, total: v.total, events: v.events.size }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const maxPoints = colleges[0]?.total || 1;

  const eventNames = useMemo(() => {
    const names = new Set<string>();
    filtered.forEach((s) => names.add(s.event_name));
    return Array.from(names);
  }, [filtered]);

  const eventScores = useMemo(() => {
    if (!expandedEvent) return [];
    return filtered
      .filter((s) => s.event_name === expandedEvent)
      .sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [filtered, expandedEvent]);

  return (
    <section id="leaderboard" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text">
              🏆 Live College Leaderboard
            </h2>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-xs gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              LIVE
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real-time rankings across all events — updated live!
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setExpandedEvent(null); }}
              className={`${t.btnClass} h-10 px-5 text-sm font-semibold tracking-wider inline-flex items-center justify-center transition-all duration-300 ${
                tab === t.key ? `ring-2 ${t.ringColor}` : "opacity-70"
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="max-w-3xl mx-auto space-y-3"
          >
            {colleges.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center text-muted-foreground">
                <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                <p>No scores recorded yet. Check back during the event!</p>
              </div>
            ) : (
              colleges.map((c, i) => {
                const rank = i + 1;
                return (
                  <motion.div
                    key={c.name}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-xl border p-4 sm:p-5 flex items-center gap-4 transition-all ${rankStyle(rank)}`}
                  >
                    <div className="text-2xl font-display font-bold w-12 text-center shrink-0">
                      {rankIcon(rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold text-sm sm:text-base truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.events} event{c.events !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="hidden sm:block flex-1 max-w-[200px]">
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-gray-400" : rank === 3 ? "bg-amber-600" : "bg-primary"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(c.total / maxPoints) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-display font-bold ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-500" : "text-primary"}`}>
                        {c.total}
                      </p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {eventNames.length > 0 && (
          <div className="max-w-3xl mx-auto mt-8 space-y-2">
            <p className="text-xs text-muted-foreground font-medium mb-3">Event-wise Breakdown</p>
            {eventNames.map((evName) => (
              <div key={evName} className="glass rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedEvent(expandedEvent === evName ? null : evName)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium">{evName}</span>
                  {expandedEvent === evName ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {expandedEvent === evName && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 space-y-1.5">
                        {eventScores.map((s, j) => (
                          <div key={s.id} className="flex items-center gap-3 text-xs py-1.5 border-t border-border/30">
                            <span className="w-8 font-bold text-muted-foreground">{rankIcon(j + 1)}</span>
                            <span className="flex-1 text-foreground font-medium truncate">{s.college_name}</span>
                            {s.team_name && <span className="text-muted-foreground hidden sm:inline">{s.team_name}</span>}
                            <Badge variant="outline" className="text-[10px] capitalize">{s.position}</Badge>
                            <span className="font-bold text-primary w-10 text-right">{s.points}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Leaderboard;
