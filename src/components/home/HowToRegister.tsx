import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { num: "01", title: "Browse Events", desc: "Explore all technical, gaming & cultural events." },
  { num: "02", title: "Pick Your Event", desc: "Click on any event card and read the details." },
  { num: "03", title: "Fill the Form", desc: "Enter your team details and college info." },
  { num: "04", title: "Pay & Submit", desc: "Complete payment and submit your registration." },
];

interface GuideVideo {
  id: string;
  title: string;
  url: string;
  display_order: number;
}

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const HowToRegister = () => {
  const [videos, setVideos] = useState<GuideVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("guide_videos")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setVideos(data);
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedFetch = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchVideos(), 500);
  }, []);

  useEffect(() => {
    fetchVideos();

    const channel = supabase
      .channel("guide_videos_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guide_videos" },
        () => debouncedFetch()
      )
      .subscribe();

    return () => {
      clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const currentVideo = videos[currentIndex];
  const videoId = currentVideo ? extractYouTubeId(currentVideo.url) : null;

  return (
    <section id="how-to-register" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-4">
            How to Register
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Follow these simple steps to register for your favorite events.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                <CheckCircle size={16} className="text-primary/40 flex-shrink-0 mt-1 ml-auto" />
              </motion.div>
            ))}
          </motion.div>

          {/* Video Player with Pagination */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {videoId ? (
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg shadow-primary/5">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    key={videoId}
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                    title={currentVideo?.title || "How to Register"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </div>
              </div>
            ) : videos.length === 0 ? (
              <div className="aspect-video rounded-2xl border border-dashed border-border bg-card/30 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Play size={24} className="text-primary ml-1" />
                </div>
                <p className="text-sm text-muted-foreground">Video tutorial coming soon</p>
              </div>
            ) : null}

            {/* Pagination */}
            {videos.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-lg border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1.5">
                  {videos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === currentIndex
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(videos.length - 1, prev + 1))}
                  disabled={currentIndex === videos.length - 1}
                  className="p-2 rounded-lg border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Video title */}
            {currentVideo && (
              <p className="text-center text-xs text-muted-foreground">
                {currentVideo.title}{videos.length > 1 && ` · ${currentIndex + 1} / ${videos.length}`}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowToRegister;
