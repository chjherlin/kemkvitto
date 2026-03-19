# Kemkvitto

Digital receipt system for Swedish dry cleaners. Customers get a PDF receipt by email with a link to track when their clothes are ready and pay online.

Built by [Parallaxintel.xyz](https://parallaxintel.xyz).

---

## What it does

- **POS screen** — the dry cleaner logs what garments came in, sets a pickup date, and sends a receipt to the customer's email
- **Customer receipt page** — a public page (no login required) where the customer can see their receipt and pay
- **Settings** — the cleaner configures their business name, brand colour, and garment/service price list
- **Reminders** — a daily cron job emails customers the day before their pickup

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (Postgres) |
| Auth | NextAuth.js 4 (JWT, bcrypt) |
| Email | Resend |
| Payments | Stripe (SEK, Swish) |
| PDF | jsPDF |
| Styles | Tailwind CSS 4 |
| Deployment | Docker on a self-hosted box |

---

## Local setup

### 1. Prerequisites

- Node.js 20+
- A Supabase project
- A Resend account (for email)
- A Stripe account (for payments) — optional for basic use

### 2. Clone and install

```bash
git clone https://github.com/east69420/kemkvitto.git
cd kemkvitto/kemkvitto-app
npm install
```

### 3. Environment variables

Copy and fill in `.env.local`:

```bash
cp .env.local.example .env.local
```

Required variables:

```
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some-random-string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (email)
RESEND_API_KEY=re_...
RESEND_FROM=noreply@yourdomain.com

# Stripe (optional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Cron (protects the reminder endpoint)
CRON_SECRET=some-other-random-string
```

### 4. Database migrations

Run all migrations in order from `kemkvitto-app/supabase/migrations/`:

```
001_init.sql          — washers + receipts base schema
002_washer_settings.sql — brand_color, price_list
003_receipt_fields.sql  — customer_name, phone, drop_off_date
004_payments.sql        — payment_status, amount_total
005_customers.sql       — customers lookup table
006_item_lists.sql      — garment_list, service_list per washer
007_receipt_number_text.sql — receipt_number as TEXT (supports prefixes like "A-001")
```

You can run these in the Supabase SQL editor or with `psql`. There's no automated migration runner — apply them in order on a fresh project.

RLS is disabled (this is an internal system, auth is handled at the API layer).

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register a washer account at `/register`.

---

## Project structure

```
kemkvitto-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main POS screen (create receipts)
│   │   ├── receipts/page.tsx     # Receipt history list
│   │   ├── settings/page.tsx     # Business settings
│   │   ├── pay/[id]/page.tsx     # Public payment page (no auth)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── api/
│   │       ├── auth/             # NextAuth + register endpoint
│   │       ├── receipts/         # CRUD, list, email, payment status
│   │       ├── pay/              # Public payment info endpoint
│   │       ├── payments/         # Stripe intent creation
│   │       ├── webhooks/stripe/  # Stripe webhook handler
│   │       ├── settings/         # Washer settings GET/PUT
│   │       ├── customers/        # Customer autocomplete
│   │       └── cron/reminders/   # Daily reminder cron
│   ├── components/
│   │   ├── GarmentGrid.tsx       # Garment selection grid
│   │   ├── OrderSummary.tsx      # Right-panel order summary
│   │   ├── DateStepper.tsx       # Pickup date picker
│   │   ├── CustomerSearch.tsx    # Autocomplete search
│   │   ├── CustomerEmailForm.tsx # Email input with send button
│   │   ├── BottomBar.tsx         # Save/total bar at bottom
│   │   ├── TreatmentModeBar.tsx  # Bet/Ej Bet toggle
│   │   ├── KemkvittoLogo.tsx     # SVG logo component
│   │   └── LanguageToggle.tsx    # SV/EN toggle
│   └── lib/
│       ├── auth.ts               # NextAuth config (bcrypt, JWT)
│       ├── supabase.ts           # Supabase client (lazy init for Docker compat)
│       ├── email.ts              # Resend email functions + HTML templates
│       ├── pdf.ts                # jsPDF receipt generation
│       ├── i18n.ts               # Translations (sv/en)
│       └── stripe.ts             # Stripe client
├── supabase/migrations/          # SQL migrations (run in order)
├── Dockerfile
└── docker-compose.yml
```

### Data model

**washers** — one row per dry cleaner account
- `id`, `email`, `password_hash`, `business_name`
- `brand_color` — hex colour used in emails and UI
- `price_list` — JSONB: `{ "Kostym": 150, "Byxor": 80, ... }`
- `garment_list`, `service_list` — JSONB arrays, customisable per washer
- `next_receipt_number` — integer, auto-increments on each new receipt

**receipts** — one row per customer drop-off
- `garments` — JSONB: `{ "Kostym": { qty: 1, bet: true }, ... }`
- `payment_status` — `"pending" | "paid" | "failed" | "expired"`
- `receipt_number` — TEXT (supports `"A-001"` style prefixes)
- `reminder_sent` — boolean, set true after reminder email fires

---

## Deployment

The app runs in Docker on a self-hosted box (east-nuc), exposed via Tailscale Funnel.

### Deploy

From the project root (not inside `kemkvitto-app/`):

```bash
rsync -avz \
  --exclude node_modules \
  --exclude .next \
  --exclude .env.local \
  kemkvitto-app/ east-nuc:/home/east/kemkvitto/

ssh east-nuc "cd /home/east/kemkvitto && docker compose up -d --build"
```

The `.env.local` on the server is not overwritten by rsync — edit it directly on the server if env vars change.

### Docker notes

- `next.config.ts` uses `output: "standalone"` for Docker
- The Supabase client uses lazy initialisation (no module-level singleton) so the build doesn't fail if env vars aren't baked in at build time
- `NEXT_PUBLIC_*` vars are baked into the client bundle at build time — the Docker build must have access to `.env.local`

### Cron

Set up a daily cron (e.g. via crontab or a hosted cron service) to hit:

```
GET /api/cron/reminders
x-cron-secret: <CRON_SECRET>
```

This sends reminder emails for any receipts with a delivery date tomorrow that haven't been paid and haven't already received a reminder.

---

## Common operations

**Add a new garment type** — Settings page → add to the garment list → Save. Changes apply immediately to the POS.

**Reset the receipt counter** — Settings → Receipt Number section → enter new number → Set.

**Check if an email sent** — Resend dashboard shows all outbound emails with delivery status.

**A customer says they didn't get their receipt** — check the receipt in the receipts list, verify their email address, then use the "Resend email" button.

---

## Known constraints

- UI is in Swedish throughout (labels, receipt content, error messages)
- Payment is in SEK only
- RLS is disabled — auth is enforced at the API layer (every route checks session or a secret)
- The `services` column on receipts is optional and may not exist on all deployments — the API handles this with a fallback query
