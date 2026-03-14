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

const SWIPE_THRESHOLD = 100;

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

  const dismiss = (id: string) => setDismissed(s => new Set(s).add(id));

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] space-y-0 overflow-hidden">
      <AnimatePresence>
        {visible.map(a => {
          const cfg = typeConfig[a.type] || typeConfig.info;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1, x: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(_e, info) => {
                if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
                  dismiss(a.id);
                }
              }}
              className={`${cfg.bg} border-b ${cfg.border} backdrop-blur-md cursor-grab active:cursor-grabbing touch-pan-y`}
            >
              <div className="flex items-center py-2 px-2 select-none">
                {/* Close button pinned left */}
                <button onClick={() => dismiss(a.id)}
                  className="text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-full p-1 shrink-0 transition-colors mr-2 z-10">
                  <X size={18} strokeWidth={2.5} />
                </button>

                {/* Marquee scrolling content - seamless loop */}
                <div className="flex-1 overflow-hidden relative">
                  <div className="inline-flex animate-marquee-announcement whitespace-nowrap">
                    {[...Array(2)].map((_, i) => (
                      <span key={i} className="inline-flex items-center gap-3 text-sm shrink-0 px-8">
                        <Icon size={16} className={cfg.iconColor} />
                        <span className="font-semibold text-foreground">{a.title}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-muted-foreground">{a.message}</span>
                        {a.link_url && (
                          <a href={a.link_url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline inline-flex items-center gap-1 ml-1">
                            {a.link_label || "Learn more"} <ExternalLink size={12} />
                          </a>
                        )}
                        <span className="text-muted-foreground/30 mx-4">✦</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;
