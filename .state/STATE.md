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
- **APIs:** receipts CRUD, next-number, reset-number, settings, email autocomplete, cron reminders, customers, payments (Stripe), webhooks
- **Payments:** Stripe integration — create-intent, webhooks, pay/[id] public page, payment-status tracking
- **i18n:** Language toggle (Swedish/English) via `src/lib/i18n.tsx`
- **Email:** Resend integration with HTML receipts + PDF attachment (`src/lib/email.ts`)
- **PDF:** jsPDF receipt generation, 80mm receipt-width, branded (`src/lib/pdf.ts`)
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

Migrations applied: 001_initial.sql, 002 (brand_color + price_list), 003 (customer_name, phone, drop_off_date), 004 (payment fields), 005 (customers table)

## Credentials (in .env.local)
- Supabase URL: wyjrvreamreiogdxaalo.supabase.co
- Keys configured (anon + service_role)
- NEXTAUTH_SECRET set

## Deployment
- **Live demo:** https://east-nuc.taild3a3d0.ts.net:8443/
- Docker container on east-nuc at `/home/east/kemkvitto/`
- Tailscale Funnel port 8443 → localhost:3000
- NEXTAUTH_URL on east-nuc: `https://east-nuc.taild3a3d0.ts.net:8443`
- **Canonical source:** `/shared/eastSync/miniprojects/kemkvitto/` (this machine)
- Redeploy: `rsync -avz --exclude node_modules --exclude .next --exclude .env.local kemkvitto-app/ east-nuc:/home/east/kemkvitto/ && ssh east-nuc "cd /home/east/kemkvitto && docker compose up -d --build"`

## Known Issues / Next Steps
- Dev server: `npm run dev` in kemkvitto-app/
- Middleware deprecation warning (Next.js 16 wants "proxy" instead of "middleware")
- Email sending via Resend is built (falls back to console log without RESEND_API_KEY)
- PDF receipt generation via jsPDF is built (80mm receipt-width, branded)
- Reminder cron needs external scheduler (Vercel Cron or similar)
- No tests yet
- Receipt PDF generation built (`src/lib/pdf.ts`), used as email attachment
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
      pay/[id]/page.tsx                # Public payment page
      api/
        auth/[...nextauth]/route.ts     # NextAuth
        auth/register/route.ts          # Registration
        receipts/route.ts               # POST create receipt
        receipts/list/route.ts          # GET receipt list
        receipts/next-number/route.ts   # GET next receipt number + settings
        receipts/reset-number/route.ts  # POST reset sequence
        receipts/autocomplete/route.ts  # GET email autocomplete
        receipts/[id]/email/route.ts    # POST set customer email
        receipts/[id]/payment-status/route.ts # GET payment status
        customers/route.ts              # GET customer search
        payments/create-intent/route.ts # POST Stripe payment intent
        pay/[id]/info/route.ts          # GET public receipt info
        webhooks/stripe/route.ts        # POST Stripe webhooks
        cron/reminders/route.ts         # GET trigger reminders
        settings/route.ts               # GET/PUT washer settings
      layout.tsx
    lib/
      supabase.ts
      email.ts
      auth.ts
      i18n.tsx
      pdf.ts
      stripe.ts
    components/
      GarmentGrid.tsx                   # Tap-tile garment grid (4-col)
      TreatmentModeBar.tsx              # Binary Bet/Ej Bet toggle
      OrderSummary.tsx                  # Right panel itemized list + moms
      DateStepper.tsx                   # Date with +/- stepper buttons
      CustomerSearch.tsx                # Autocomplete name/phone/email
      LanguageToggle.tsx                # SV/EN toggle
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
    migrations/004_payment_fields.sql
    migrations/005_customers_table.sql
  public/
    kemkvitto-logo.jpeg
```

## Reference Materials
- `A simple app for increased service level in retail dry cleaning.docx` — full product spec/vision
- WhatsApp images — paper receipt pad (YUREE) and kemkvitto logo variations
- Key insight from doc: no customer names in DB for GDPR (email only) — but we added optional name/phone fields per user request
