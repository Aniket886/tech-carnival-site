
Goal: fix the WhatsApp prefilled text so emojis render exactly as requested (no `�`) on `/admin/registrations`.

Implementation plan (single file: `src/pages/admin/AdminRegistrations.tsx`):

1) Replace current message construction with an exact, deterministic message constant
- Move message text to a top-level `const WHATSAPP_CONFIRM_MESSAGE`.
- Match your exact copy, including:
  - `Hey there! 👋`
  - `🎉 *Registration Confirmed – Tech Carnival 2K26!* 🎉`
  - final line `— CoreTeam, Tech Carnival 2K26 🎊` (no space in CoreTeam).
- Build emoji characters via `String.fromCodePoint(...)` (or `\u{...}` code point escapes) instead of raw pasted emoji/surrogate pairs, to prevent encoding corruption in source control/editors.

2) Make URL generation fully robust for UTF-8 + line breaks
- Update `getWhatsAppConfirmUrl` to:
  - sanitize phone number to digits only.
  - normalize to `91` country code once.
  - build query via `URLSearchParams({ text: WHATSAPP_CONFIRM_MESSAGE })` instead of manual string concatenation.
- Use `https://api.whatsapp.com/send?phone=...&text=...` for maximum compatibility.

3) Keep existing UI placement, only change underlying text encoding reliability
- Keep WhatsApp action beside Phone as-is.
- Keep Email action behavior unchanged unless explicitly requested otherwise.
- No layout changes required.

4) Quick verification checklist after implementation
- Open `/admin/registrations`, expand a row, click WhatsApp icon.
- Confirm every emoji renders correctly in the prefilled message (no `�`).
- Confirm line breaks and markdown (`*bold*`) appear as intended.
- Confirm final signature is exactly `— CoreTeam, Tech Carnival 2K26 🎊`.

Why this will fix it:
- The current issue is character-encoding/mojibake in message composition. Using code-point-based emoji creation + `URLSearchParams` UTF-8 encoding removes editor/encoding ambiguity and ensures WhatsApp receives valid text bytes.
