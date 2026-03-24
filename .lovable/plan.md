

## Plan: Add Screenshot URLs to CSV Export

### Change to `src/pages/admin/AdminPayments.tsx`

Update the `exportCSV` function (line 186-207) to include a "Screenshot URL(s)" column:

- Add "Screenshot URL(s)" to the CSV headers array
- For each row, use `parseScreenshotUrls` to extract all screenshot URLs and join them with a semicolon separator (so multiple URLs fit in one cell)
- This ensures every exported record includes the direct links to payment screenshots

### Technical detail

```typescript
// In headers array, add "Screenshot URL(s)" after "Transaction ID"
const headers = ["S.No", "Name", "Team", "Event", "Amount", "UTR", "Transaction ID", "Screenshot URL(s)", "Status", "College", "Date"];

// In row mapping, add:
parseScreenshotUrls(r.payment_screenshot_url).join("; ") || ""
```

### File changed
- `src/pages/admin/AdminPayments.tsx` only

