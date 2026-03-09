# Decisions & Findings

## Index
| Date | Topic | Verdict |
|------|-------|---------|
| 2026-03-05 | Tech stack | Next.js 16 + Supabase + NextAuth + Tailwind |
| 2026-03-05 | Bet/Ej Bet | Treatment modifier toggle, not garment items |
| 2026-03-05 | Customer name | Added optional name/phone despite GDPR note in doc (user requested) |
| 2026-03-05 | RLS | Disabled for MVP — service_role key used server-side |
| 2026-03-05 | Date format | Custom DateInput component forces YYYY-MM-DD display |
| 2026-03-05 | 5/10 shirt buttons | Removed dedicated buttons, replaced with +5/+10 quick-add on every garment |
| 2026-03-05 | Brand colors | 11 preset colors in settings, themes entire UI including customer-facing screens |

## Details

### 2026-03-05 — Tech stack
Next.js 16 App Router, Supabase Postgres, NextAuth credentials, Tailwind 4, TypeScript. Chosen for fast iteration and Vercel deployment path.

### 2026-03-05 — Bet/Ej Bet
On the paper receipt pad, Bet (fläckbehandling) and Ej Bet are treatment options, not garment types. Implemented as a 3-way toggle (Bet / Ej Bet / not selected) above the garment grid. Bet price added to total.

### 2026-03-05 — Customer name
The original spec says "no names = No GDPR" but user requested customer name + phone fields. Added as optional fields on receipt form. Stored in receipts table.

### 2026-03-05 — RLS disabled
Supabase RLS disabled on both tables. Using anon key for client-side and service_role key for all server-side API routes. Must enable proper RLS policies before production.

### 2026-03-05 — Date format
Browser date inputs show locale-dependent format (mm/dd/yyyy on US systems). Created DateInput component with transparent native input + YYYY-MM-DD text overlay.

### 2026-03-05 — Quick-add buttons
Removed dedicated "5 Skjortor" / "10 Skjortor" buttons. Instead, every garment shows +5 and +10 quick-add buttons when selected. More flexible — works for any garment, not just shirts.
