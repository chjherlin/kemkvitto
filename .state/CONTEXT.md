# Project: Kemkvitto

## Purpose
Digital receipt web app for retail dry cleaners in Sweden. Replaces/augments paper receipt pads by sending receipt info to customer email and reminding them on pickup day.

## Scope & Constraints
- Demo-first: optimize for impressive washer-facing demo, not production scale
- Swedish language UI, YYYY-MM-DD dates
- iPad-optimized touch targets (56px+)
- No dark mode (counter/shop use case)

## Key Resources
- Supabase project: wyjrvreamreiogdxaalo.supabase.co
- Product spec: `A simple app for increased service level in retail dry cleaning.docx`
- Paper receipt reference: WhatsApp images in project root
- App code: `kemkvitto-app/`

## Danger List
- `.env.local` has real Supabase keys — never commit
- `middleware.ts` deprecated on Next.js 16 — may break on upgrade
- RLS disabled on Supabase tables — must enable before production
- `/receipt/[id]/email` is unauthenticated by design (customer-facing)

## Reading Guide

| Task area | Also read |
|-----------|-----------|
| Core flow | `src/app/page.tsx`, `src/components/GarmentGrid.tsx` |
| Auth | `src/lib/auth.ts`, `src/middleware.ts` |
| DB schema | `supabase/migrations/` |
| APIs | `src/app/api/` — all route.ts files |
| Product vision | `A simple app for increased service level in retail dry cleaning.docx` |
| Design system | `src/app/globals.css`, `src/components/KemkvittoLogo.tsx` |

## Maintenance Rules
- **New fact** → find its ONE canonical home per the Reading Guide
- **New gotcha** → Danger List ONLY if forgetting it causes wrong results
- **New decision** → append to DECISIONS.md + update index
- **New reference doc** → add Reading Guide entry in this file
- **Never duplicate** content between files. Reference, don't repeat.
