

## Plan: Fix Emoji Encoding in WhatsApp Message

### Problem
The emoji characters in the WhatsApp confirmation message got corrupted during file encoding, showing as `�` replacement characters instead of actual emojis.

### Fix in `src/pages/admin/AdminRegistrations.tsx`

Replace the literal emoji characters with their Unicode escape sequences so they survive any encoding issues. Update line 23 to use escaped Unicode codepoints:

```tsx
const msg = "Hey there! \ud83d\udc4b\n\n\ud83c\udf89 *Registration Confirmed \u2013 Tech Carnival 2K26!* \ud83c\udf89\n\nWe\u2019re thrilled to have you on board! \ud83d\ude4c Your registration has been successfully confirmed and we can\u2019t wait to see you at the event! \ud83d\ude80\n\n\ud83d\udccc *Event:* Tech Carnival 2K26\n\n\u2705 *Status:* Confirmed\n\nGet ready for an amazing experience filled with exciting events, competitions, and a whole lot of fun! \ud83d\udcbb\u26a1\ud83c\udfc6\n\nStay tuned for further updates and details. \ud83d\udcf2\n\nSee you there! \ud83d\ude04\ud83d\udd25\n\n\u2014 Core Team, Tech Carnival 2K26 \ud83c\udf8a";
```

This ensures emojis render correctly regardless of file encoding. Single file, single line change.

### Files changed
- `src/pages/admin/AdminRegistrations.tsx` — line 23

