

## Plan: Auto-capture Abandoned Registration Drafts

### Problem
Currently, drafts are only saved when the user clicks "Next" on step 0 (line 285-287 in `RegistrationModal.tsx`). If a user fills all team leader details but closes the modal without clicking Next, no draft is captured.

### Solution
Add two draft-saving triggers in `RegistrationModal.tsx`:

**1. Auto-save on modal close (unmount/close)**
- In the `resetAndClose` function and the dialog's `onOpenChange`, check if the user has filled the core leader fields (name, email, phone, college) but hasn't completed registration (no `successData`). If so, call `saveDraftToDb()` before closing.
- Also handle the case where the user is on step 1 (payment) and closes without completing.

**2. Auto-save via useEffect cleanup**
- Add a `useEffect` that fires on component unmount (or when `isOpen` changes to false). If core leader fields are filled and registration wasn't completed, save the draft. This catches browser tab closes or navigation away.

**3. Keep existing behavior**
- The existing `saveDraftToDb()` call on "Next" click stays as-is.
- The `markDraftCompleted()` call on successful submission stays as-is.
- Only skip saving if `successData` exists (registration completed).

### Changes to `src/components/RegistrationModal.tsx`

1. Add a ref to track whether registration completed (`completedRef = useRef(false)`), set it to `true` when `successData` is set.

2. Add a ref to always have latest form data available in cleanup (`formRef`, `eventRef`).

3. Modify `resetAndClose`:
   - Before resetting form, check if leader fields are filled and not completed → save draft.

4. Add a `useEffect` with cleanup on `isOpen` becoming false:
   - If core leader fields (name, email, phone, college) are all filled and registration not completed → call `saveDraftToDb()`.

5. The draft status will be `"abandoned"` as before. The existing admin Abandoned Leads page already displays these.

### No database changes needed
The `registration_drafts` table and its schema already support this. The `upsert` with `onConflict: "event_id,leader_email"` ensures no duplicates.

