import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  category: string;
}

const ITEMS_PER_PAGE = 12;

const GallerySection = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedImg, setSelectedImg] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { isSectionVisible } = useSiteVisibility();

  useEffect(() => {
    const fetchGallery = () => {
      supabase
        .from("gallery_items")
        .select("id,image_url,caption,category")
        .eq("is_visible", true)
        .order("display_order")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setItems(data as unknown as GalleryItem[]);
        });
    };
    fetchGallery();

    const channel = supabase
      .channel("gallery_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery_items" }, () => fetchGallery())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  if (!isSectionVisible("gallery") || !items.length) return null;

  const categories = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <section id="gallery" className="py-20 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-[hsl(var(--neon-purple))] opacity-[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[hsl(var(--neon-blue))] opacity-[0.04] blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4">
            <ImageIcon size={14} className="text-primary" />
            <span className="text-xs font-medium tracking-wider uppercase text-primary">Gallery</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Event <span className="text-gradient">Moments</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Relive the best moments from Tech Carnival
          </p>
        </motion.div>

        {/* Category Filter */}
        {categories.length > 2 && (
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider border transition-all ${
                  filter === cat
                    ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_12px_hsl(var(--neon-blue)/0.15)]"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Masonry Grid */}
        <motion.div
          layout
          className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {paginated.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="break-inside-avoid group cursor-pointer"
                onClick={() => setSelectedImg(item)}
              >
                <div className="relative rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--neon-blue)/0.08)]">
                  <img
                    src={item.image_url}
                    alt={item.caption || "Gallery image"}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-foreground font-medium">{item.caption}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium border transition-all ${
                  p === page
                    ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_10px_hsl(var(--neon-blue)/0.15)]"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImg(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-4xl max-h-[85vh] w-full"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={selectedImg.image_url}
                alt={selectedImg.caption || "Gallery image"}
                className="w-full h-full object-contain rounded-xl border border-border"
              />
              {selectedImg.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/80 to-transparent p-4 rounded-b-xl">
                  <p className="text-sm text-foreground">{selectedImg.caption}</p>
                </div>
              )}
              <button
                onClick={() => setSelectedImg(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;
