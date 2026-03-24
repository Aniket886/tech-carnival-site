

## Plan: Show Phone Number Below Leader Email in Admin Drafts

### Change to `src/pages/admin/AdminDrafts.tsx`

In the Leader table cell (around line 335-337), add `draft.leader_phone` as a third line below the email:

```tsx
<TableCell>
  <div className="text-sm font-medium">{draft.leader_name}</div>
  <div className="text-xs text-muted-foreground">{draft.leader_email}</div>
  <div className="text-xs text-muted-foreground">{draft.leader_phone}</div>
</TableCell>
```

Single file change, ~1 line addition.

