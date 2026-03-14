import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  link_url: string | null;
  link_label: string | null;
}

const typeConfig: Record<string, { bg: string; border: string; icon: typeof Info; iconColor: string }> = {
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Info, iconColor: "text-blue-400" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle, iconColor: "text-amber-400" },
  urgent: { bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertCircle, iconColor: "text-red-400" },
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAnnouncements = () => {
      supabase.from("announcements").select("id,title,message,type,link_url,link_label")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setAnnouncements(data as unknown as Announcement[]);
        });
    };
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => fetchAnnouncements())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] space-y-0">
      <AnimatePresence>
        {visible.map(a => {
          const cfg = typeConfig[a.type] || typeConfig.info;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`${cfg.bg} border-b ${cfg.border} backdrop-blur-md`}
            >
              <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
                <Icon size={18} className={cfg.iconColor + " shrink-0"} />
                <p className="text-sm text-foreground flex-1">
                  <span className="font-semibold">{a.title}</span>
                  <span className="mx-1.5 text-muted-foreground">—</span>
                  <span className="text-muted-foreground">{a.message}</span>
                </p>
                {a.link_url && (
                  <a href={a.link_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                    {a.link_label || "Learn more"} <ExternalLink size={12} />
                  </a>
                )}
                <button onClick={() => setDismissed(s => new Set(s).add(a.id))}
                  className="text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-full p-1 shrink-0 transition-colors">
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;
