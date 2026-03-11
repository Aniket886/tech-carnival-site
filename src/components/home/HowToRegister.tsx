import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { num: "01", title: "Browse Events", desc: "Explore all technical, gaming & cultural events." },
  { num: "02", title: "Pick Your Event", desc: "Click on any event card and read the details." },
  { num: "03", title: "Fill the Form", desc: "Enter your team details and college info." },
  { num: "04", title: "Pay & Submit", desc: "Complete payment and submit your registration." },
];

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const HowToRegister = () => {
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "how_to_register_video_url")
        .maybeSingle();
      if (data?.setting_value) setVideoUrl(data.setting_value);
    };
    fetch();
  }, []);

  const videoId = extractYouTubeId(videoUrl);

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

          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {videoId ? (
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg shadow-primary/5">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                    title="How to Register"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-2xl border border-dashed border-border bg-card/30 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Play size={24} className="text-primary ml-1" />
                </div>
                <p className="text-sm text-muted-foreground">Video tutorial coming soon</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowToRegister;
