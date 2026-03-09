# Project: Kemkvitto

## Stack
- Next.js 16 + React 19 + TypeScript 5
- Supabase (DB + auth)
- NextAuth for session management
- Tailwind CSS 4
- Docker deployment

## Commands (run from kemkvitto-app/)
- Dev: `npm run dev`
- Build: `npm run build`
- Docker: `docker compose up`
- Deploy: `rsync -avz --exclude node_modules --exclude .next --exclude .env.local kemkvitto-app/ east-nuc:/home/east/kemkvitto/ && ssh east-nuc "cd /home/east/kemkvitto && docker compose up -d --build"`

## Architecture (all paths relative to kemkvitto-app/)
- `src/app/` — app router pages + API routes
- `src/components/` — UI components
- `src/lib/` — auth, email, i18n, pdf, stripe, Supabase client
- `src/middleware.ts` — auth middleware
- `supabase/migrations/` — DB schema

## Constraints
- Swedish business context — UI labels and receipt content in Swedish
- .env.local has secrets — NEVER commit or log
