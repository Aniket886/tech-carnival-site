

## Plan: Add Admin/Owner Role Tags Near Logout Button

### What
Add role badges next to the Logout button in the sidebar — a green "Admin" badge for all admins, and a distinct glowing gold/amber "Owner" badge for the owner.

### Changes to `src/components/AdminLayout.tsx`

1. **Import** `useIsOwner` from `@/hooks/useIsOwner`
2. **Call** `const isOwner = useIsOwner()` in the component
3. **Update the logout area** (lines 165-169) to show role tags above or beside the logout button:

```tsx
<div className="p-3 border-t border-border space-y-2">
  <div className="flex items-center gap-2 px-2">
    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
      Admin
    </Badge>
    {isOwner && (
      <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/50 text-[10px] shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-pulse">
        Owner
      </Badge>
    )}
  </div>
  <Button variant="ghost" size="sm" className="w-full justify-start ..." onClick={handleLogout}>
    <LogOut size={18} className="mr-2" /> Logout
  </Button>
</div>
```

- **Admin tag**: Green background/text (`emerald-500`), subtle border
- **Owner tag**: Amber/gold with a glowing `box-shadow` and subtle `animate-pulse` to make it visually distinct and "glow"

### Files changed
- `src/components/AdminLayout.tsx` — single file, ~10 lines modified

