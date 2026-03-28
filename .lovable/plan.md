

## Plan: Add Download Button to Lightbox View

### What
Add a download button in the lightbox (fullscreen image viewer) so users can download the currently viewed image. The button will sit next to the close (X) button in the top-right area.

### Change to `src/components/home/GallerySection.tsx`

In the `SwipeableLightbox` component, add a download button next to the close button (around line 140-145):

- Track `currentIndex` via Embla's `select` event so we know which image is active
- Add a `Download` button positioned at `top-4 right-16` (left of the X button)
- On click, fetch the current image as blob and trigger download

```tsx
// Add state + effect inside SwipeableLightbox
const [currentIndex, setCurrentIndex] = useState(selectedIndex);
useEffect(() => {
  if (!emblaApi) return;
  const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
  emblaApi.on("select", onSelect);
  return () => { emblaApi.off("select", onSelect); };
}, [emblaApi]);

// Download button next to close button
<button
  onClick={async () => {
    const item = items[currentIndex];
    const res = await fetch(item.image_url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (item.caption || "gallery-image") + "." + (item.image_url.split(".").pop() || "jpg");
    a.click();
    URL.revokeObjectURL(a.href);
  }}
  className="absolute top-4 right-16 p-3 rounded-full bg-background/80 border border-border text-muted-foreground hover:text-foreground transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
>
  <Download size={20} />
</button>
```

### Files changed
- `src/components/home/GallerySection.tsx` — add download button + index tracking in SwipeableLightbox

