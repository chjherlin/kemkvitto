# Spec: Client Feedback Round 1

Date: 2026-03-17
Status: approved (user said "go ahead")

## Summary

Seven features from two rounds of client mockup feedback. Mix of UX polish, new receipt# controls, and a significant settings CRUD feature.

---

## Features

### A. Sticky header
The `pos-header` needs `position: sticky; top: 0; z-index: 50` so it stays visible while the POS scrolls. Currently it scrolls away.

### B. Receipt # control updates
Current UI has: `−` / input / `+` / `↺` (refresh) / `Specialnr` button.

Client wants:
- Rename `Specialnr` → `Engångsnummer` (one-time number, doesn't advance sequence — already implemented, just rename)
- Replace `↺` with `Återställ härifrån` button — calls `/api/receipts/reset-number` with the **current displayed value**, saving it to DB as the new sequence base. The sequence then continues from there.
- Add `?` button — small inline icon that shows a popover/tooltip explaining: "Kvittonumret räknas upp automatiskt. Engångsnummer används för specialfall utan att påverka sekvensen. Återställ sätt nästa nummer i sekvensen."

### C. 5× and 10× shirt tiles
Add `"Skjorta ×5"` and `"Skjorta ×10"` to the **default** garment list. Priced as flat values set in settings (not derived from "Skjorta" price). They appear as normal tiles in the grid. Washer sets the price in settings.

### D. Remove phone field
Remove the phone `<input>` from `CustomerSearch` component and from the right-panel customer section. Keep `customerPhone` state and DB field (non-destructive — just hide from UI).

### E. Settings: CRUD for garment and service items

**Data model:** Add two new columns to `washers` table:
- `garment_list jsonb` — `string[]` of garment names, null = use hardcoded defaults
- `service_list jsonb` — `string[]` of service names, null = use hardcoded defaults

`price_list` stays as `Record<string, number>` — unchanged.

**API changes:**
- `GET /api/settings` — returns `garmentList: string[]` and `serviceList: string[]` (merged with defaults if null)
- `PUT /api/settings` — accepts `garmentList` and `serviceList`
- `GET /api/receipts/next-number` — also returns `garmentList` and `serviceList` so the main POS loads everything in one call

**GarmentGrid:** Accept `garmentList: string[]` prop instead of using hardcoded `ALL_GARMENTS`.

**Settings page CRUD UI** (replaces the static read-only price list grid):
- Each row: item name (editable inline text field) + price input + delete button
- "Lägg till plagg" button — appends a new blank row to garment list
- "Lägg till tjänst" button — appends a new blank row to service list
- Reorder: not needed (add to end is fine)
- On Save: saves garmentList + serviceList + priceList together

### F. Tagline on login page
Below the KemkvittoLogo, replace or augment the subtitle:
- SV: `Papper och e-post, med påminnelse. Aldrig mer ett borttappat kvitto.`
- EN: `Paper and e-mail, with reminder. Never again a lost receipt.`

Add as new i18n key `"auth.tagline"`.

---

## Files to touch

| File | Change |
|------|--------|
| `supabase/migrations/006_item_lists.sql` | ADD COLUMN garment_list, service_list |
| `src/app/api/settings/route.ts` | expose + accept garmentList / serviceList |
| `src/app/api/receipts/next-number/route.ts` | also return garmentList / serviceList |
| `src/components/GarmentGrid.tsx` | accept garmentList prop, remove hardcoded list |
| `src/app/page.tsx` | sticky header, button renames, Återställ logic, ? tooltip, remove phone state/prop, pass garmentList |
| `src/components/CustomerSearch.tsx` | remove phone input |
| `src/app/settings/page.tsx` | full CRUD for garment + service lists |
| `src/lib/i18n.tsx` | add auth.tagline + settings.addGarment + settings.addService keys |
| `src/app/login/page.tsx` | add tagline below logo |

---

## Out of scope
- Reordering garment tiles (drag-and-drop)
- Per-item treatment override changes
- Payment / PDF / email changes
