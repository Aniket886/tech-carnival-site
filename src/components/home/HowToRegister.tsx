import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Search, CreditCard, ClipboardCheck, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    num: "01",
    title: "Browse Events",
    desc: "Explore all technical, gaming & cultural events.",
    icon: Compass,
  },
  {
    num: "02",
    title: "Pick Your Event",
    desc: "Check the rule book and all necessary details in the event card.",
    icon: Search,
  },
  {
    num: "03",
    title: "Complete Payment",
    desc: 'Click the "Pay" button, complete your payment, and keep a screenshot for the next step.',
    icon: CreditCard,
  },
  {
    num: "04",
    title: "Register & Submit",
    desc: 'Click "Register", fill in your details (name & phone must match payment), enter UTR/TID, upload payment screenshot, and submit. You\'ll receive a confirmation email once verified by the organizers.',
    icon: ClipboardCheck,
  },
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
    <section id="how-to-register" className="py-24 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[100px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-secondary/[0.04] blur-[100px]" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary/70 mb-4"
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Step-by-step guide
          </motion.span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold gradient-text mb-5">
            How to Register
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            Follow these steps to secure your spot at Tech Carnival 2K26.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Steps - Timeline style */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Vertical connecting line */}
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-primary/40 via-secondary/30 to-transparent hidden sm:block" />

            <div className="space-y-6">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    className="group relative"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 * i }}
                  >
                    <div className="flex items-start gap-5">
                      {/* Step circle with icon */}
                      <div className="relative flex-shrink-0 z-10">
                        <motion.div
                          className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-500"
                          style={{
                            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))',
                            border: '1px solid hsl(var(--primary) / 0.25)',
                            boxShadow: `
                              0 4px 24px hsl(var(--primary) / 0.1),
                              inset 0 1px 1px rgba(255, 255, 255, 0.15),
                              inset 0 -1px 1px rgba(0, 0, 0, 0.1)
                            `,
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Icon size={18} className="text-primary" />
                        </motion.div>
                        {/* Step number badge */}
                        <span
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center backdrop-blur-md"
                          style={{
                            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.5))',
                            color: 'hsl(var(--primary-foreground))',
                            boxShadow: '0 2px 8px hsl(var(--primary) / 0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>

                      {/* Liquid glass content card */}
                      <div className="flex-1 pb-2">
                        <div
                          className="p-4 rounded-2xl backdrop-blur-xl group-hover:scale-[1.01] transition-all duration-500"
                          style={{
                            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02), hsl(var(--secondary) / 0.04))',
                            border: '1px solid hsl(var(--primary) / 0.15)',
                            boxShadow: `
                              0 8px 32px rgba(0, 0, 0, 0.12),
                              0 2px 8px rgba(0, 0, 0, 0.08),
                              inset 0 1px 1px rgba(255, 255, 255, 0.1),
                              inset 0 -1px 2px rgba(0, 0, 0, 0.05)
                            `,
                          }}
                        >
                          <h3 className="font-display font-semibold text-foreground text-sm sm:text-base mb-1.5">
                            {step.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Video Player with Pagination */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-5 lg:sticky lg:top-24"
          >
            {videoId ? (
              <div className="relative rounded-2xl overflow-hidden"
                style={{
                  border: '1px solid hsl(var(--primary) / 0.25)',
                  background: 'linear-gradient(145deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))',
                  boxShadow: `
                    8px 8px 18px rgba(0, 0, 0, 0.55),
                    -4px -4px 12px hsl(var(--primary) / 0.06),
                    inset 2px 2px 4px rgba(255, 255, 255, 0.08),
                    inset -2px -2px 4px rgba(0, 0, 0, 0.25)
                  `,
                  padding: '6px',
                }}
              >
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    key={videoId}
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                    title={currentVideo?.title || "How to Register"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: 0,
                      borderRadius: "0.75rem",
                    }}
                  />
                </div>
              </div>
            ) : videos.length === 0 ? (
              <div className="aspect-video rounded-2xl border border-dashed border-border/40 bg-card/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <motion.div
                  className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Play size={28} className="text-primary ml-1" />
                </motion.div>
                <p className="text-sm text-muted-foreground font-medium">
                  Video tutorial coming soon
                </p>
              </div>
            ) : null}

            {/* Pagination */}
            {videos.length > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentIndex === 0}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 active:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.15))',
                    border: '1px solid hsl(var(--primary) / 0.25)',
                    boxShadow: `
                      6px 6px 14px rgba(0, 0, 0, 0.5),
                      -3px -3px 10px hsl(var(--primary) / 0.06),
                      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
                      inset -2px -2px 4px rgba(0, 0, 0, 0.3)
                    `,
                    color: 'hsl(var(--primary))',
                    textShadow: '0 0 10px hsl(var(--primary) / 0.5)',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-2">
                  {videos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className="rounded-full transition-all duration-400"
                      style={{
                        width: i === currentIndex ? '2rem' : '0.5rem',
                        height: '0.5rem',
                        background: i === currentIndex
                          ? 'linear-gradient(145deg, hsl(var(--primary) / 0.8), hsl(var(--primary) / 0.5))'
                          : 'linear-gradient(145deg, hsl(var(--muted-foreground) / 0.25), hsl(var(--muted-foreground) / 0.1))',
                        boxShadow: i === currentIndex
                          ? 'inset 1px 1px 2px rgba(255,255,255,0.15), inset -1px -1px 2px rgba(0,0,0,0.3), 0 0 8px hsl(var(--primary) / 0.3)'
                          : 'inset 1px 1px 2px rgba(255,255,255,0.05), inset -1px -1px 2px rgba(0,0,0,0.3)',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(videos.length - 1, prev + 1)
                    )
                  }
                  disabled={currentIndex === videos.length - 1}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 active:translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(145deg, hsl(var(--primary) / 0.35), hsl(var(--primary) / 0.15))',
                    border: '1px solid hsl(var(--primary) / 0.25)',
                    boxShadow: `
                      6px 6px 14px rgba(0, 0, 0, 0.5),
                      -3px -3px 10px hsl(var(--primary) / 0.06),
                      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
                      inset -2px -2px 4px rgba(0, 0, 0, 0.3)
                    `,
                    color: 'hsl(var(--primary))',
                    textShadow: '0 0 10px hsl(var(--primary) / 0.5)',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Video title */}
            {currentVideo && (
              <p className="text-center text-xs text-muted-foreground/70 font-mono tracking-wide">
                {currentVideo.title}
                {videos.length > 1 &&
                  ` · ${currentIndex + 1} / ${videos.length}`}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowToRegister;
