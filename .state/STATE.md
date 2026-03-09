# State

## Current Focus
Demo-ready kemkvitto app — digital receipt system for retail dry cleaners.

## What Exists
Working Next.js 14 app in `kemkvitto-app/` with:
- **Auth:** NextAuth credentials provider, login/register, JWT sessions, middleware
- **Main receipt form:** POS terminal two-panel layout (garment tap tiles + order summary), binary Bet/Ej Bet treatment mode bar, per-item treatment override, receipt number in header, date stepper with +3 business days default, customer autocomplete search, bottom bar with totals + submit
- **Customer email screen:** `/receipt/[id]/email` — branded, autocomplete from past customers
- **Receipt list:** `/receipts` — sorted by date/number, today's pickups highlighted
- **Settings:** `/settings` — brand color picker (11 colors), price list per garment, business name
- **APIs:** receipts CRUD, next-number, reset-number, settings, email autocomplete, cron reminders
- **Email:** Console log stub in `src/lib/email.ts`
- **Branding:** KemkvittoLogo component (SVG receipt+checkmark icon + Syne font), brand-color theming throughout
- **Design system:** Syne + Figtree + JetBrains Mono fonts, warm stone palette, CSS variables, animations

## Tech Stack
- Next.js 16.1.6 (App Router, Turbopack)
- Supabase (Postgres) — hosted at wyjrvreamreiogdxaalo.supabase.co
- NextAuth.js 4 with credentials
- Tailwind CSS 4
- TypeScript

## DB Schema
Tables: `washers` (id, email, password_hash, business_name, next_receipt_number, brand_color, price_list, created_at), `receipts` (id, washer_id, receipt_number, garments jsonb, delivery_date, drop_off_date, customer_email, customer_name, customer_phone, comment, reminder_sent, created_at)

Migrations applied: 001_initial.sql, 002 (brand_color + price_list columns), 003 (customer_name, customer_phone, drop_off_date columns)

## Credentials (in .env.local)
- Supabase URL: wyjrvreamreiogdxaalo.supabase.co
- Keys configured (anon + service_role)
- NEXTAUTH_SECRET set

## Deployment
- **Live demo:** https://east-nuc.taild3a3d0.ts.net:8443/
- Docker container on east-nuc at `/home/east/kemkvitto/`
- Tailscale Funnel port 8443 → localhost:3000
- NEXTAUTH_URL on east-nuc: `https://east-nuc.taild3a3d0.ts.net:8443`
- Redeploy: `rsync -avz --exclude node_modules --exclude .next --exclude .env.local kemkvitto-app/ east-nuc:/home/east/kemkvitto/ && ssh east-nuc "cd /home/east/kemkvitto && docker compose up -d --build"`

## Known Issues / Next Steps
- Dev server: `npm run dev` in kemkvitto-app/
- Middleware deprecation warning (Next.js 16 wants "proxy" instead of "middleware")
- Email is console stub — needs real sending (Resend/SendGrid)
- Reminder cron needs external scheduler (Vercel Cron or similar)
- No tests yet
- Receipt PDF/view for customers not built
- Receipt color matching paper pad (11 colors from doc) partially done in settings
- Customer email autocomplete works but untested with real data
- The doc mentions: delay notification, receipt search by email, 500-receipt limit, email subject with washer name, security cert — all not yet implemented

## File Structure
```
kemkvitto-app/
  src/
    app/
      page.tsx                          # Main receipt form
      login/page.tsx                    # Login
      register/page.tsx                 # Register
      receipts/page.tsx                 # Receipt list
      settings/page.tsx                 # Washer settings
      receipt/[id]/email/page.tsx       # Customer email input
      api/
        auth/[...nextauth]/route.ts     # NextAuth
        auth/register/route.ts          # Registration
        receipts/route.ts               # POST create receipt
        receipts/list/route.ts          # GET receipt list
        receipts/next-number/route.ts   # GET next receipt number + settings
        receipts/reset-number/route.ts  # POST reset sequence
        receipts/autocomplete/route.ts  # GET email autocomplete
        receipts/[id]/email/route.ts    # POST set customer email
        cron/reminders/route.ts         # GET trigger reminders
        settings/route.ts               # GET/PUT washer settings
      layout.tsx
    lib/
      supabase.ts
      email.ts
      auth.ts
    components/
      GarmentGrid.tsx                   # Tap-tile garment grid (4-col)
      TreatmentModeBar.tsx              # Binary Bet/Ej Bet toggle
      OrderSummary.tsx                  # Right panel itemized list + moms
      DateStepper.tsx                   # Date with +/- stepper buttons
      CustomerSearch.tsx                # Autocomplete name/phone/email
      BottomBar.tsx                     # Fixed bottom bar with totals + submit
      ReceiptNumberControl.tsx          # (legacy, receipt # now in header)
      CustomerEmailForm.tsx
      DateInput.tsx                     # (legacy, replaced by DateStepper)
      KemkvittoLogo.tsx
      SessionWrapper.tsx
    middleware.ts
  supabase/
    migrations/001_initial.sql
    migrations/002_prices_and_branding.sql
    migrations/003_customer_info.sql
  public/
    kemkvitto-logo.jpeg
```

## Reference Materials
- `A simple app for increased service level in retail dry cleaning.docx` — full product spec/vision
- WhatsApp images — paper receipt pad (YUREE) and kemkvitto logo variations
- Key insight from doc: no customer names in DB for GDPR (email only) — but we added optional name/phone fields per user request
