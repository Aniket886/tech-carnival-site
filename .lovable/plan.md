

## Plan: Accept All File Types + Convert HEIC to JPEG for Display

### Problem
1. The file input has `accept="image/*"` which excludes HEIC/HEIF on some browsers
2. HEIC files uploaded successfully to storage but browsers can't render them natively — they show as broken images

### Solution

**File: `src/pages/admin/AdminGallery.tsx`**

1. **Remove `accept` restriction** on the file input — change `accept="image/*"` to `accept="*/*"` (or remove the attribute entirely) so all file types including `.heic`, `.heif`, `.webp`, etc. are selectable

2. **Convert HEIC/HEIF to JPEG before upload** using the `heic2any` library:
   - Install `heic2any` package
   - Before uploading, check if file extension is `.heic` or `.heif`
   - If so, convert to JPEG blob using `heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 })`
   - Upload the converted `.jpg` file instead
   - This ensures the stored image is browser-renderable

3. **Handle existing broken HEIC images** — add an `onError` fallback on `<img>` tags to show a placeholder icon when an image fails to load

### Technical detail

```typescript
import heic2any from "heic2any";

// In handleUpload, before upload:
let uploadFile: File | Blob = file;
let finalExt = ext?.toLowerCase() || "jpg";

if (["heic", "heif"].includes(finalExt)) {
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  uploadFile = converted as Blob;
  finalExt = "jpg";
}

const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${finalExt}`;
await supabase.storage.from("gallery-images").upload(path, uploadFile, {
  contentType: finalExt === "jpg" ? "image/jpeg" : file.type
});
```

### Files changed
- `src/pages/admin/AdminGallery.tsx` — update upload handler + file input accept attribute
- `package.json` — add `heic2any` dependency

