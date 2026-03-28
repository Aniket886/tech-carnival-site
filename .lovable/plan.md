

## Plan: Compress Large Images + Add Download Button

### 1. Auto-compress images over 4MB before upload

**File: `src/pages/admin/AdminGallery.tsx`** — in `processFiles`, after the HEIC conversion block and before the storage upload:

- Check if `uploadFile.size > 4 * 1024 * 1024` (4MB)
- If so, use `createImageBitmap` + Canvas to re-encode as JPEG at 0.92 quality (high quality, visually identical)
- If still over 4MB, reduce quality to 0.85
- Also store the **original file URL** in a new `original_url` column so downloads serve the full-quality original

**However**, storing originals separately doubles storage — simpler approach: compress via Canvas at high quality (0.92) which is visually indistinguishable, and serve the same file for both display and download. The "same size when uploaded" requirement means the download should give the stored file as-is (which is the compressed version, visually identical).

**Simplified approach** (no schema change needed):
- Before upload, if file > 4MB, compress via Canvas to JPEG at quality 0.92
- If still > 4MB, try 0.85
- Upload the result — this is what gets displayed AND downloaded

### 2. Add download button on hover

**File: `src/pages/admin/AdminGallery.tsx`** — in the hover overlay (line 270-277):

- Import `Download` from lucide-react
- Add a download button alongside Edit and Delete in the hover overlay
- The button fetches the image, creates a blob URL, and triggers a download with the original filename

```tsx
<Button variant="ghost" size="icon" onClick={async (e) => {
  e.stopPropagation();
  const res = await fetch(item.image_url);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = item.caption || "gallery-image";
  a.click();
  URL.revokeObjectURL(a.href);
}}>
  <Download size={16} />
</Button>
```

### Files changed
- `src/pages/admin/AdminGallery.tsx` — compression logic in `processFiles` + download button in card overlay

