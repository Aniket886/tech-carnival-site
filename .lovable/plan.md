

## Plan: Add WhatsApp Redirect Button in Admin Registrations

### What
Add a WhatsApp icon button next to the Phone and Email fields in the expanded registration detail row, allowing admins to contact participants directly on WhatsApp with a pre-written confirmation message.

### Changes to `src/pages/admin/AdminRegistrations.tsx`

1. **Import** `MessageCircle` from `lucide-react` (add to existing import)

2. **Add a helper** for the WhatsApp confirmation message URL:
```tsx
const getWhatsAppConfirmUrl = (phone: string, name: string) => {
  const msg = `Hey there! 👋\n\n🎉 *Registration Confirmed – Tech Carnival 2K26!* 🎉\n\nWe're thrilled to have you on board! 🙌 Your registration has been successfully confirmed and we can't wait to see you at the event! 🚀\n\n📌 *Event:* Tech Carnival 2K26\n\n✅ *Status:* Confirmed\n\nGet ready for an amazing experience filled with exciting events, competitions, and a whole lot of fun! 💻⚡🏆\n\nStay tuned for further updates and details. 📲\n\nSee you there! 😄🔥\n\n— Core Team, Tech Carnival 2K26 🎊`;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
};
```

3. **Update the expanded detail section** (around lines 417-418) to add WhatsApp links next to Phone and Email:

- **Phone row** (~line 417): Add a green WhatsApp icon link after the phone number
- **Email row** (~line 418): Add a mailto link icon after the email

```tsx
<p>
  <span className="text-muted-foreground">Phone:</span>{" "}
  <span className="font-medium text-foreground">{r.leader_phone}</span>
  <a href={getWhatsAppConfirmUrl(r.leader_phone, r.leader_name)} target="_blank" rel="noopener noreferrer" className="inline-flex ml-2 text-emerald-500 hover:text-emerald-400">
    <MessageCircle size={14} />
  </a>
</p>
<p>
  <span className="text-muted-foreground">Email:</span>{" "}
  <span className="font-medium text-foreground">{r.leader_email}</span>
  <a href={`mailto:${r.leader_email}`} className="inline-flex ml-2 text-blue-500 hover:text-blue-400">
    <Mail size={14} />
  </a>
</p>
```

4. **Import** `Mail` from `lucide-react` as well.

### Files changed
- `src/pages/admin/AdminRegistrations.tsx` — add imports + helper function + icon links in expanded row

