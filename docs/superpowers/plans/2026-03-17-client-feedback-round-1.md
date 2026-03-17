# Client Feedback Round 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement seven UX improvements from client mockup feedback: sticky header, receipt# control polish, phone field removal, 5×/10× shirt tiles, settings CRUD for garment/service lists, and login page tagline.

**Architecture:** Dynamic garment/service lists are stored as `garment_list` and `service_list` JSONB columns on the `washers` table (new migration). The `next-number` API becomes the single boot call — returning brand color, price list, and item lists together. The settings page grows from a read-only price editor to a full CRUD interface for items. Everything else is UI-only changes.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase Postgres, React 19. No test framework — verify via `npx next build` from `kemkvitto-app/` and manual browser check.

**Spec:** `docs/superpowers/specs/2026-03-17-client-feedback-round-1.md`

---

## Setup: Create feature branch

- [ ] **Create and switch to feature branch**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git checkout -b feat/client-feedback-round-1
```

---

## Chunk 1: DB + API layer

### Task 1: DB migration — add garment_list and service_list columns

**Files:**
- Create: `kemkvitto-app/supabase/migrations/006_item_lists.sql`

- [ ] **Step 1: Write the migration**

Create `kemkvitto-app/supabase/migrations/006_item_lists.sql`:

```sql
ALTER TABLE washers ADD COLUMN IF NOT EXISTS garment_list jsonb;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS service_list jsonb;
```

- [ ] **Step 2: Apply to Supabase**

Run in Supabase SQL editor (or `psql`):
```sql
ALTER TABLE washers ADD COLUMN IF NOT EXISTS garment_list jsonb;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS service_list jsonb;
```

Expected: no error, columns appear in `washers` table.

- [ ] **Step 3: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/supabase/migrations/006_item_lists.sql
git commit -m "chore: migration 006 — add garment_list and service_list to washers"
```

---

### Task 2: Update `GET /api/settings` and `PUT /api/settings`

**File:** `kemkvitto-app/src/app/api/settings/route.ts`

Default garment list (same as existing `ALL_GARMENTS` in settings page, plus the two new shirt tiles):
```
Rock, Kostym, Kavaj, Byxor, Kappa, Dräkt, Jacka, Kjol,
Poplin, Matta, Klänning, Blus, Skjorta, Skjorta ×5, Skjorta ×10,
Mocka, Slips, Jumper, Gardin, Vittvätt
```

Default service list:
```
Pressning, Stärkning, Vikning, Express
```

- [ ] **Step 1: Update GET to return garmentList and serviceList**

Replace the GET handler's return statement. Add constants at top of file:

```typescript
const DEFAULT_GARMENTS = [
  "Rock", "Kostym", "Kavaj", "Byxor", "Kappa", "Dräkt", "Jacka", "Kjol",
  "Poplin", "Matta", "Klänning", "Blus", "Skjorta", "Skjorta ×5", "Skjorta ×10",
  "Mocka", "Slips", "Jumper", "Gardin", "Vittvätt",
];
const DEFAULT_SERVICES = ["Pressning", "Stärkning", "Vikning", "Express"];
```

Update the `select` to include the new columns:
```typescript
const { data, error } = await supabase
  .from("washers")
  .select("brand_color, price_list, business_name, garment_list, service_list")
  .eq("id", washerId)
  .single();
```

Update the return:
```typescript
return NextResponse.json({
  brandColor: data.brand_color,
  priceList: data.price_list,
  businessName: data.business_name,
  garmentList: (data.garment_list as string[] | null) ?? DEFAULT_GARMENTS,
  serviceList: (data.service_list as string[] | null) ?? DEFAULT_SERVICES,
});
```

- [ ] **Step 2: Update PUT to accept garmentList and serviceList**

```typescript
const { brandColor, priceList, businessName, garmentList, serviceList } = await request.json();

const { error } = await supabase
  .from("washers")
  .update({
    brand_color: brandColor,
    price_list: priceList,
    business_name: businessName,
    garment_list: garmentList ?? null,
    service_list: serviceList ?? null,
  })
  .eq("id", washerId);
```

- [ ] **Step 3: Verify build**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build 2>&1 | tail -20
```

Expected: no TypeScript errors in this file.

- [ ] **Step 4: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/app/api/settings/route.ts
git commit -m "feat: settings API exposes and accepts garmentList + serviceList"
```

---

### Task 3: Update `GET /api/receipts/next-number` to also return item lists

**File:** `kemkvitto-app/src/app/api/receipts/next-number/route.ts`

The main POS page calls this on load. Returning item lists here avoids a second API call.

- [ ] **Step 1: Add the same defaults constant and update the select + return**

Add at top of file (same constants as Task 2 — copy them):
```typescript
const DEFAULT_GARMENTS = [
  "Rock", "Kostym", "Kavaj", "Byxor", "Kappa", "Dräkt", "Jacka", "Kjol",
  "Poplin", "Matta", "Klänning", "Blus", "Skjorta", "Skjorta ×5", "Skjorta ×10",
  "Mocka", "Slips", "Jumper", "Gardin", "Vittvätt",
];
const DEFAULT_SERVICES = ["Pressning", "Stärkning", "Vikning", "Express"];
```

Update the select:
```typescript
.select("next_receipt_number, brand_color, price_list, garment_list, service_list")
```

Update the return:
```typescript
return NextResponse.json({
  nextReceiptNumber: data?.next_receipt_number ?? 1,
  brandColor: (data as Record<string, unknown>)?.brand_color ?? "#0891b2",
  priceList: (data as Record<string, unknown>)?.price_list ?? {},
  garmentList: ((data as Record<string, unknown>)?.garment_list as string[] | null) ?? DEFAULT_GARMENTS,
  serviceList: ((data as Record<string, unknown>)?.service_list as string[] | null) ?? DEFAULT_SERVICES,
});
```

Keep the existing error fallback block. In the fallback path, `garment_list` and `service_list` will be `undefined` on `data` — the `?? DEFAULT_GARMENTS` / `?? DEFAULT_SERVICES` null-coalescing in the return statement handles this correctly, falling back to the defaults.

- [ ] **Step 2: Verify build**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/app/api/receipts/next-number/route.ts
git commit -m "feat: next-number API returns garmentList and serviceList"
```

---

## Chunk 2: Component changes

### Task 4: Update GarmentGrid to accept a dynamic garmentList prop

**File:** `kemkvitto-app/src/components/GarmentGrid.tsx`

Currently uses a hardcoded `ALL_GARMENTS` constant at the top. Replace with a prop.

- [ ] **Step 1: Add garmentList to props interface and use it**

Remove the `ALL_GARMENTS` constant entirely. Update `GarmentGridProps`:

```typescript
interface GarmentGridProps {
  garments: Record<string, GarmentEntry>;
  onChange: (garments: Record<string, GarmentEntry>) => void;
  priceList: Record<string, number>;
  brandColor: string;
  garmentList: string[];  // NEW — replaces hardcoded ALL_GARMENTS
}
```

Update the function signature:
```typescript
export default function GarmentGrid({
  garments,
  onChange,
  priceList,
  brandColor,
  garmentList,
}: GarmentGridProps) {
```

In the return JSX, replace `{ALL_GARMENTS.map(...)` with `{garmentList.map(...)}` — everything else stays identical.

- [ ] **Step 2: Verify build (will fail until page.tsx passes the prop)**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build 2>&1 | grep -E "error|Error" | head -20
```

Expected: TypeScript error about missing `garmentList` prop in page.tsx — that's correct, we'll fix it next.

- [ ] **Step 3: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/components/GarmentGrid.tsx
git commit -m "feat: GarmentGrid accepts dynamic garmentList prop"
```

---

### Task 5: Remove phone field from CustomerSearch

**File:** `kemkvitto-app/src/components/CustomerSearch.tsx`

The client removed the phone option. Keep the props and internal state so callers don't break, but hide the phone `<input>` from the UI.

- [ ] **Step 1: Remove the phone input from the JSX**

In the `{/* Phone + Email */}` section, remove the phone `<input>` entirely. The email input stays. The section becomes:

```tsx
{/* Email */}
<div className="pos-customer-inputs">
  <input
    type="email"
    value={email}
    onChange={(e) => onEmailChange(e.target.value)}
    placeholder={t("customer.email")}
    className="pos-input"
    style={{ width: "100%" }}
  />
</div>
```

Keep all phone-related props (`phone`, `onPhoneChange`) in the interface — this keeps callers working without changes. The phone value is simply not editable from the UI anymore (it can still be populated from customer autocomplete results).

- [ ] **Step 2: Verify build**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/components/CustomerSearch.tsx
git commit -m "feat: remove phone input from CustomerSearch (client request)"
```

---

## Chunk 3: Main POS page

### Task 6: Sticky header + receipt# control updates + garmentList wiring

**File:** `kemkvitto-app/src/app/page.tsx`

Four changes in one file:
1. Sticky header
2. Load `garmentList` and `serviceList` from the boot API call
3. Pass `garmentList` to `GarmentGrid`
4. Receipt# control: rename "Specialnr" → "Engångsnummer", replace `↺` with "Återställ härifrån", add `?` tooltip

- [ ] **Step 1: Add garmentList + serviceList state**

After the existing state declarations near the top, add:
```typescript
const [garmentList, setGarmentList] = useState<string[]>([]);
const [serviceList, setServiceList] = useState<string[]>([]);
const [showReceiptHelp, setShowReceiptHelp] = useState(false);
```

- [ ] **Step 2: Load garmentList + serviceList from next-number API**

In the existing `useEffect` that calls `/api/receipts/next-number`, add:
```typescript
.then((data) => {
  setReceiptNumber(data.nextReceiptNumber);
  if (data.brandColor) setBrandColor(data.brandColor);
  if (data.priceList) setPriceList(data.priceList);
  if (data.garmentList) setGarmentList(data.garmentList);      // NEW
  if (data.serviceList) setServiceList(data.serviceList);      // NEW
});
```

- [ ] **Step 3: Make the header sticky**

Find the `<header className="pos-header">` element. Add `sticky top-0 z-50` to the className:
```tsx
<header className="pos-header sticky top-0 z-50">
```

**Note:** If `pos-header` has a `position` rule in the global CSS (e.g. `position: relative`) it may conflict with Tailwind's `sticky`. If the header doesn't stick, use an inline style override instead: `style={{ position: 'sticky', top: 0, zIndex: 50 }}`. Check `kemkvitto-app/src/app/globals.css` for `.pos-header` rules if needed.

- [ ] **Step 4: Pass garmentList to GarmentGrid**

Find `<GarmentGrid` and add the prop:
```tsx
<GarmentGrid
  garments={garments}
  onChange={setGarments}
  priceList={priceList}
  brandColor={brandColor}
  garmentList={garmentList}    // NEW
/>
```

- [ ] **Step 5: Update the receipt# control — rename button and replace ↺ with Återställ**

Find the receipt number section. Make these changes:

**Replace the `↺` button entirely.** The current `↺` does a GET to `/api/receipts/next-number` to re-read the counter from the DB. Delete it completely and replace it with "Återställ" — which does the opposite: a POST to `/api/receipts/reset-number` to *write* the currently displayed value back to the DB as the new sequence start.
```tsx
<button
  type="button"
  className="pos-counter-reset"
  onClick={async () => {
    await fetch("/api/receipts/reset-number", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextReceiptNumber: receiptNumber }),
    });
  }}
  title="Återställ sekvensen från detta nummer"
>Återställ</button>
```

**Rename Specialnr → Engångsnummer:**
```tsx
>Engångsnummer</button>
```

**Add the `?` help button** immediately after the Engångsnummer button, still inside `pos-counter-row`:
```tsx
<div className="relative">
  <button
    type="button"
    className="pos-counter-help"
    onClick={() => setShowReceiptHelp((p) => !p)}
    title="Hjälp"
  >?</button>
  {showReceiptHelp && (
    <div
      className="pos-receipt-help-popover"
      style={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 6px)",
        zIndex: 100,
        width: "16rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        fontSize: "0.8rem",
        color: "var(--text-muted)",
        lineHeight: 1.5,
      }}
    >
      Numret räknas upp automatiskt vid varje kvitto.
      <br /><br />
      <strong>Engångsnummer</strong> — använd ett specialnummer för ett enskilt kvitto utan att påverka sekvensen.
      <br /><br />
      <strong>Återställ</strong> — sätt nästa nummer i sekvensen till det värde som visas nu.
    </div>
  )}
</div>
```

Also add a click-outside handler to close the popover. In the JSX wrapping div (the outermost `<div style={{ background: ...}}>`) add an `onClick` that closes it when clicking outside:

Actually simpler — just add a `useEffect` that listens for clicks:
```typescript
useEffect(() => {
  if (!showReceiptHelp) return;
  function handler() { setShowReceiptHelp(false); }
  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}, [showReceiptHelp]);
```

And stop propagation on the `?` button click:
```tsx
onClick={(e) => { e.stopPropagation(); setShowReceiptHelp((p) => !p); }}
```

- [ ] **Step 6: Verify build is clean**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/app/page.tsx
git commit -m "feat: sticky header, receipt# controls update, garmentList wired to POS"
```

---

### Task 7 (moved to Chunk 5): Settings page CRUD — see below

---

## Chunk 4b: Add i18n keys needed by settings CRUD

### Task 8 (run BEFORE Task 7): Add translation keys to i18n

**File:** `kemkvitto-app/src/lib/i18n.tsx`

**Run this before Task 7** — the settings CRUD uses `t("settings.addGarment")` and `t("settings.addService")`, which are TypeScript-checked keys. They must exist in `translations` before Task 7's code will type-check.

- [ ] **Step 1: Add auth.tagline, settings.addGarment, settings.addService translation keys**

In the `translations` object, in the `// Login / Register` section, add after `"auth.loginSubtitle"`:
```typescript
"auth.tagline": {
  sv: "Papper och e-post, med påminnelse. Aldrig mer ett borttappat kvitto.",
  en: "Paper and e-mail, with reminder. Never again a lost receipt.",
  da: "Papir og e-mail, med påmindelse. Aldrig mere en tabt kvittering.",
  no: "Papir og e-post, med påminnelse. Aldri mer en mistet kvittering.",
},
```

In the `// Settings` section, add after `"settings.receiptNumberReset"`:
```typescript
"settings.addGarment": { sv: "Lägg till plagg", en: "Add garment", da: "Tilføj beklædning", no: "Legg til plagg" },
"settings.addService": { sv: "Lägg till tjänst", en: "Add service", da: "Tilføj tjeneste", no: "Legg til tjeneste" },
```

- [ ] **Step 2: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/lib/i18n.tsx
git commit -m "feat: add auth.tagline, settings.addGarment, settings.addService i18n keys"
```

---

## Chunk 5: Settings CRUD

### Task 7: Settings page — full CRUD for garment and service lists

**File:** `kemkvitto-app/src/app/settings/page.tsx`

This is the largest change. The static price grid becomes an editable list where items can be added, renamed, and deleted.

**Key design:**
- `garmentList: string[]` state — the ordered list of garment names
- `serviceList: string[]` state — the ordered list of service names
- `priceList: Record<string, number>` stays as-is
- Each row: text input for name + number input for price + delete button
- Renaming a garment: update the name in `garmentList` AND migrate the price — delete old key, add new key
- Add button: appends an empty string to the list; user types the name
- Delete: removes from list (price entry orphaned in DB but harmless)
- Save button: sends `{ brandColor, priceList, businessName, garmentList, serviceList }`

- [ ] **Step 1: Add garmentList + serviceList state**

Below the existing `priceList` state declaration:
```typescript
const [garmentList, setGarmentList] = useState<string[]>([]);
const [serviceList, setServiceList] = useState<string[]>([]);
```

- [ ] **Step 2: Load garmentList + serviceList from settings API**

In the existing `useEffect` that calls `/api/settings`:
```typescript
.then((data) => {
  setBrandColor(data.brandColor || "#82C58A");
  setPriceList(data.priceList || {});
  setBusinessName(data.businessName || "");
  setGarmentList(data.garmentList || []);    // NEW
  setServiceList(data.serviceList || []);    // NEW
  setLoading(false);
});
```

- [ ] **Step 3: Update handleSave to include the lists**

```typescript
body: JSON.stringify({ brandColor, priceList, businessName, garmentList, serviceList }),
```

- [ ] **Step 4: Add helper functions for item CRUD**

```typescript
function renameItem(
  list: string[],
  setList: (l: string[]) => void,
  idx: number,
  newName: string
) {
  const oldName = list[idx];
  const next = [...list];
  next[idx] = newName;
  setList(next);
  // Migrate price to new key
  if (oldName && oldName !== newName && priceList[oldName] !== undefined) {
    const nextPrices = { ...priceList, [newName]: priceList[oldName] };
    delete nextPrices[oldName];
    setPriceList(nextPrices);
  }
}

function removeItem(
  list: string[],
  setList: (l: string[]) => void,
  idx: number
) {
  setList(list.filter((_, i) => i !== idx));
}

function addItem(list: string[], setList: (l: string[]) => void) {
  setList([...list, ""]);
}
```

- [ ] **Step 5: Replace the static price list section with the new CRUD UI**

Remove the entire existing `{/* Price list */}` section and `{/* Service prices */}` section.

**CRITICAL placement:** `ItemListEditor` must be defined as a nested function **inside** the `SettingsPage` component body (before the `return` statement), NOT at module scope. It must close over `priceList`, `setPriceList`, `renameItem`, `removeItem`, `addItem`, and `setPrice` from the parent component. Placing it at module scope will result in TypeScript errors because those identifiers won't be in scope.

Define `ItemListEditor` inside `SettingsPage`, right before the `return (`:

```tsx
// Defined INSIDE SettingsPage component, before the return:
function ItemListEditor({
  title,
  list,
  setList,
  isService = false,
  addLabel,
}: {
  title: string;
  list: string[];
  setList: (l: string[]) => void;
  isService?: boolean;
  addLabel: string;
}) {
  return (
    <section>
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </h2>
      <div className="space-y-2">
        {list.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2"
            style={{ borderColor: "var(--border)" }}
          >
            <input
              type="text"
              value={item}
              onChange={(e) => renameItem(list, setList, idx, e.target.value)}
              placeholder={isService ? "Tjänstnamn..." : "Plaggnamn..."}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
              style={{ color: "var(--text)" }}
            />
            <input
              type="number"
              min={0}
              placeholder="—"
              value={item ? (priceList[item] || "") : ""}
              onChange={(e) => setPrice(item, e.target.value)}
              disabled={!item}
              className="w-20 rounded-lg border bg-gray-50 px-2 py-2 text-right text-sm font-medium"
              style={{ borderColor: "var(--border)" }}
            />
            <span className="text-xs" style={{ color: "var(--text-light)" }}>kr</span>
            <button
              type="button"
              onClick={() => removeItem(list, setList, idx)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-red-50 hover:text-red-500"
              style={{ color: "var(--text-light)" }}
              title="Ta bort"
            >×</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => addItem(list, setList)}
        className="mt-3 flex items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:border-current"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
        {addLabel}
      </button>
    </section>
  );
}
```

In the main `return (`, replace the two old sections with (using the i18n keys added in Task 8):
```tsx
<ItemListEditor
  title={t("settings.priceList")}
  list={garmentList}
  setList={setGarmentList}
  addLabel={t("settings.addGarment")}
/>
<ItemListEditor
  title={t("settings.servicePrices")}
  list={serviceList}
  setList={setServiceList}
  isService
  addLabel={t("settings.addService")}
/>
```

**Note:** Because `ItemListEditor` is nested inside `SettingsPage`, `t("settings.addGarment")` will work correctly — it uses the `t` function from `useI18n()` which is already called at the top of `SettingsPage`.

Also remove `ALL_GARMENTS` and `ALL_SERVICES` constants from the top of the file — they're no longer needed.

- [ ] **Step 6: Verify build**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 7: Commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/app/settings/page.tsx
git commit -m "feat: settings CRUD — add/rename/remove garments and services"
```

---

## Chunk 6: Login tagline

### Task 9: Display tagline on login page

**File:** `kemkvitto-app/src/app/login/page.tsx`

- [ ] **Step 1: Replace the login subtitle with the tagline**

Find this block:
```tsx
<div className="flex flex-col items-center gap-4">
  <KemkvittoLogo size="lg" />
  <p style={{ color: "var(--text-muted)" }}>
    {t("auth.loginSubtitle")}
  </p>
</div>
```

Replace with:
```tsx
<div className="flex flex-col items-center gap-4">
  <KemkvittoLogo size="lg" />
  <p
    className="text-center text-base font-medium"
    style={{ color: "var(--text-muted)", maxWidth: "22rem", lineHeight: 1.5 }}
  >
    {t("auth.tagline")}
  </p>
</div>
```

- [ ] **Step 2: Verify build**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 3: Final commit**

```bash
cd /shared/eastSync/miniprojects/kemkvitto
git add kemkvitto-app/src/app/login/page.tsx
git commit -m "feat: add tagline to login page"
```

---

## Final: Full build check + deploy

- [ ] **Full clean build**

```bash
cd /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app
npx next build
```

Expected: ✓ Compiled successfully, 0 errors.

- [ ] **Deploy to east-nuc**

```bash
rsync -avz --exclude node_modules --exclude .next --exclude .env.local \
  /shared/eastSync/miniprojects/kemkvitto/kemkvitto-app/ \
  east-nuc:/home/east/kemkvitto/ \
  && ssh east-nuc "cd /home/east/kemkvitto && docker compose up -d --build"
```

- [ ] **Manual smoke test on live URL**

Open https://east-nuc.taild3a3d0.ts.net:8443/ and verify:
1. Login page shows tagline instead of "Logga in på ditt konto"
2. POS header stays fixed when scrolling
3. Receipt# section shows "Engångsnummer" and "Återställ" buttons
4. "?" shows help popover
5. Garment grid includes "Skjorta ×5" and "Skjorta ×10" tiles
6. Customer section has no phone field
7. Settings page shows editable garment + service lists with add/remove
