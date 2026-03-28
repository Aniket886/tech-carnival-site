import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";
import { useIsMobile } from "@/hooks/use-mobile";
import useEmblaCarousel from "embla-carousel-react";

interface GalleryItem {
  id: string;
  image_url: string;
  caption: string | null;
  category: string;
}

const ITEMS_PER_PAGE = 8;

/* ── Mobile Carousel ── */
const MobileCarousel = ({
  items,
  onSelect,
}: {
  items: GalleryItem[];
  onSelect: (item: GalleryItem) => void;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSlideChange = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSlideChange);
    return () => { emblaApi.off("select", onSlideChange); };
  }, [emblaApi, onSlideChange]);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-[0_0_85%] min-w-0 px-1.5"
            >
              <div
                className="relative rounded-xl overflow-hidden border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => onSelect(item)}
              >
                <img
                  src={item.image_url}
                  alt={item.caption || "Gallery image"}
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget.closest('.flex-\\[0_0_85\\%\\]') as HTMLElement)?.style.setProperty('display', 'none'); }}
                />
                {item.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-3 pt-6">
                    <p className="text-xs text-foreground font-medium">{item.caption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 flex-wrap max-w-[280px] mx-auto">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`rounded-full transition-all duration-300 min-w-[10px] min-h-[10px] ${
                i === selectedIndex
                  ? "w-6 h-2.5 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                  : "w-2.5 h-2.5 bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Swipeable Lightbox ── */
const SwipeableLightbox = ({
  items,
  selectedIndex,
  onClose,
}: {
  items: GalleryItem[];
  selectedIndex: number;
  onClose: () => void;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: selectedIndex,
  });
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden" ref={emblaRef}>
          <div className="flex h-full items-center">
            {items.map((item) => (
              <div key={item.id} className="flex-[0_0_100%] min-w-0 px-4 flex items-center justify-center">
                <div className="relative">
                  <img
                    src={item.image_url}
                    alt={item.caption || "Gallery image"}
                    className="max-w-full max-h-[80vh] object-contain rounded-xl border border-border"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {item.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/80 to-transparent p-4 rounded-b-xl">
                      <p className="text-sm text-foreground">{item.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Desktop nav arrows */}
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors min-w-[48px] min-h-[48px] items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors min-w-[48px] min-h-[48px] items-center justify-center"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <button
        onClick={async () => {
          const item = items[currentIndex];
          try {
            const res = await fetch(item.image_url);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = (item.caption || "gallery-image") + "." + (item.image_url.split(".").pop() || "jpg");
            a.click();
            URL.revokeObjectURL(a.href);
          } catch {}
        }}
        className="absolute top-4 right-16 p-3 rounded-full bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
      >
        <Download size={20} />
      </button>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-full bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
      >
        <X size={20} />
      </button>
    </motion.div>
  );
};

/* ── Main Gallery Section ── */
const GallerySection = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { isSectionVisible } = useSiteVisibility();
  const isMobile = useIsMobile();

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
            Event <span className="text-foreground">Moments</span>
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
                className={`px-5 py-2.5 min-h-[44px] rounded-full text-xs font-medium uppercase tracking-wider border transition-all ${
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

        {/* Mobile: Swipeable Carousel / Desktop: Masonry Grid */}
        {isMobile ? (
          <MobileCarousel
            items={filtered}
            onSelect={(item) => setSelectedImgIndex(filtered.indexOf(item))}
          />
        ) : (
          <>
            <motion.div
              layout
              className="columns-2 md:columns-3 lg:columns-3 gap-4 space-y-4"
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
                    onClick={() => setSelectedImgIndex(filtered.indexOf(item))}
                  >
                    <div className="relative rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--neon-blue)/0.08)]">
                      <img
                        src={item.image_url}
                        alt={item.caption || "Gallery image"}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget.closest('.break-inside-avoid') as HTMLElement)?.style.setProperty('display', 'none'); }}
                      />
                      {/* Download button - bottom right on hover */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(item.image_url);
                            const blob = await res.blob();
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = (item.caption || "gallery-image") + "." + (item.image_url.split(".").pop() || "jpg");
                            a.click();
                            URL.revokeObjectURL(a.href);
                          } catch {}
                        }}
                        className="absolute bottom-2 right-2 p-2 rounded-lg bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:bg-background/90 z-10"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
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
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[44px] min-h-[44px] rounded-lg text-sm font-medium border transition-all flex items-center justify-center ${
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
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImgIndex !== null && (
          <SwipeableLightbox
            items={filtered}
            selectedIndex={selectedImgIndex}
            onClose={() => setSelectedImgIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;
