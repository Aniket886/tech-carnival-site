import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Score {
  id: string;
  college_name: string;
  event_id: string;
  event_name: string;
  category: string;
  points: number;
  position: string;
  team_name: string | null;
}

interface CollegeAggregate {
  name: string;
  total: number;
  eventCount: number;
}

const categories = [
  { key: "all", label: "🏆 Overall", accent: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300" },
  { key: "technical", label: "💻 Technical", accent: "border-blue-500/50 bg-blue-500/10 text-blue-300" },
  { key: "gaming", label: "🎮 Gaming", accent: "border-red-500/50 bg-red-500/10 text-red-300" },
  { key: "cultural", label: "🎭 Cultural", accent: "border-purple-500/50 bg-purple-500/10 text-purple-300" },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return "border-yellow-500/40 bg-yellow-500/10";
  if (rank === 2) return "border-gray-400/40 bg-gray-400/10";
  if (rank === 3) return "border-amber-700/40 bg-amber-700/10";
  return "border-border bg-card/30";
};

const rankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const Leaderboard = () => {
  const [scores, setScores] = useState<Score[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      const { data } = await supabase.from("college_scores").select("*");
      if (data) setScores(data);
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

  const filteredScores = useMemo(() => {
    if (activeTab === "all") return scores;
    return scores.filter((s) => s.category === activeTab);
  }, [scores, activeTab]);

  const leaderboard = useMemo((): CollegeAggregate[] => {
    const map = new Map<string, { total: number; events: Set<string> }>();
    filteredScores.forEach((s) => {
      const entry = map.get(s.college_name) || { total: 0, events: new Set<string>() };
      entry.total += s.points;
      entry.events.add(s.event_id);
      map.set(s.college_name, entry);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, total: v.total, eventCount: v.events.size }))
      .sort((a, b) => b.total - a.total);
  }, [filteredScores]);

  const maxPoints = leaderboard[0]?.total || 1;

  // Group events for accordion
  const eventGroups = useMemo(() => {
    const map = new Map<string, Score[]>();
    filteredScores.forEach((s) => {
      const list = map.get(s.event_name) || [];
      list.push(s);
      map.set(s.event_name, list);
    });
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      items: items.sort((a, b) => b.points - a.points),
    }));
  }, [filteredScores]);

  return (
    <section id="leaderboard" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            🏆 Live College Leaderboard
          </h2>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 gap-1.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            LIVE
          </Badge>
        </div>
        <p className="text-muted-foreground">Real-time rankings across all events — updated live!</p>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => { setActiveTab(cat.key); setExpandedEvent(null); }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
              activeTab === cat.key
                ? cat.accent + " shadow-lg"
                : "border-border bg-card/20 text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {leaderboard.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No scores recorded yet. Check back during the event!</p>
            </div>
          )}

          {leaderboard.map((college, i) => {
            const rank = i + 1;
            const pct = Math.round((college.total / maxPoints) * 100);
            return (
              <motion.div
                key={college.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`rounded-xl border p-4 transition-all ${rankStyle(rank)} ${
                  rank === 1 ? "ring-1 ring-yellow-500/30" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="text-2xl font-bold w-12 text-center shrink-0">
                    {rankIcon(rank)}
                  </div>

                  {/* College info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-lg truncate">{college.name}</p>
                      {rank === 1 && (
                        <span className="text-xs animate-pulse">✨</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {college.eventCount} event{college.eventCount !== 1 ? "s" : ""} participated
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          rank === 1
                            ? "bg-yellow-500"
                            : rank === 2
                            ? "bg-gray-400"
                            : rank === 3
                            ? "bg-amber-700"
                            : "bg-primary/60"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-foreground">{college.total}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Event-wise Breakdown Accordion */}
      {eventGroups.length > 0 && (
        <div className="mt-10 space-y-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">📊 Event-wise Breakdown</h3>
          {eventGroups.map((group) => (
            <div key={group.name} className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setExpandedEvent(expandedEvent === group.name ? null : group.name)}
                className="w-full flex items-center justify-between px-4 py-3 bg-card/30 hover:bg-muted/20 transition-colors text-left"
              >
                <span className="font-medium text-foreground">{group.name}</span>
                {expandedEvent === group.name ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <AnimatePresence>
                {expandedEvent === group.name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-border/50">
                      {group.items.map((item, j) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                          <span className="w-8 text-center text-muted-foreground font-medium">
                            {j === 0 ? "🏆" : `#${j + 1}`}
                          </span>
                          <span className="flex-1 text-foreground font-medium truncate">{item.college_name}</span>
                          {item.team_name && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">{item.team_name}</span>
                          )}
                          <Badge variant="outline" className="text-xs">{item.position}</Badge>
                          <span className="font-semibold text-foreground w-12 text-right">{item.points}</span>
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
    </section>
  );
};

export default Leaderboard;
