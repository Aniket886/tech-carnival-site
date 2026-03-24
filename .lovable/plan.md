

## Plan: Subtle Owner Badge Glow

### Change to `src/components/AdminLayout.tsx`

Replace the Owner badge styling (around line 161) — remove `animate-pulse` (too aggressive), use a steady soft glow instead:

```tsx
<Badge className="bg-amber-500/15 text-amber-300 border-amber-400/40 text-[10px] shadow-[0_0_6px_rgba(251,191,36,0.3)]">
  Owner
</Badge>
```

Changes: removed `animate-pulse`, reduced shadow intensity from `0.4` to `0.3`, reduced spread from `8px` to `6px`, toned down background opacity from `/20` to `/15`. Result is a steady, subtle golden glow without pulsing.

Single line change in one file.

