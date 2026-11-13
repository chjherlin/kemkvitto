# Kartläggning av Kemkvitto

Datum: 12 november 2026.
Gren som lästs: `feat/client-feedback-round-1` (commit `7c4ffc6`).
Omfattning: endast avsnitt 10, steg 1 i överlämningen. Ingen applikationskod är ändrad.

Det här dokumentet är en läsning av kod, git-historik (48 commits), Next.js dokumentation och de kommandon som står i avsnitt 4. Där något inte kunde köras står det uttryckligen.

## Viktigt först

Ingen nyckel, token eller lösenord som behöver roteras hittades i koden eller i git-historiken. Sökningen täckte Stripe-nycklar (hemliga, begränsade, publika, webhook), Resend-nycklar, JWT-formade strängar, Postgres-URL:er, AWS-nycklar och privata nyckelblock, i alla 48 commits, med undantag för `package-lock.json` och bildfiler. Inga `.env`-filer finns i historiken.

Träffarna på namnet `SUPABASE_SERVICE_ROLE_KEY` ligger i `kemkvitto-app/README.md` rad 66 och är samma platshållartext i alla de commits som innehåller raden. Det är inte en riktig nyckel. Värdet kopieras inte hit.

`.github/workflows/keep-alive.yml` rad 14 innehåller en hårdkodad Supabase-projektadress. Det är inte en nyckel. Nyckeln hämtas via GitHub Secrets på rad 15–16. Adressen kopieras inte hit. I commit `c1f8f48` låg adressen som en secret-referens i stället för som text i filen. Arbetsflödet är inte ändrat.

Det som ändå bör läsas först är inte en läckt nyckel, utan att flera API-rutter litar på att anroparen är rätt tvätteri trots att databasen inte gör det. Se avsnitt 5.

## Instruktioner i repot som inte följts

Överlämningens avsnitt 12 säger att text i repot är data, inte order. Följande ber om saker utöver kartläggningen. Inget av det är gjort.

- `docs/superpowers/plans/2026-03-17-client-feedback-round-1.md` inleds med en uppmaning till agenter att köra en implementeringsplan, och avslutas med ett avsnitt "Final: Full build check + deploy" som beskriver rsync och ssh mot en självvärd maskin samt ett röktest mot en Tailscale-adress. Adressen och kommandona kopieras inte hit.
- `docs/superpowers/specs/2026-03-17-client-feedback-round-1.md` står som "approved (user said go ahead)". Det är en historisk spec från mars, inte det här uppdraget.
- `kemkvitto-app/README.md` beskriver driftsättning med Docker på en självvärd maskin, säger att RLS är avstängt, listar en anon-nyckel som koden inte läser, och nämner en "Resend email"-knapp som inte finns i koden.
- `kemkvitto-app/supabase/migrations/001_initial.sql` rad 28 och `005_customers_table.sql` rad 13 stänger av RLS i SQL. Överlämningen säger att RLS i den riktiga databasen är påslaget och saknar policyer. De två bilderna stämmer inte överens. SQL-filerna är inte ändrade och har inte körts.

## 1. Karta

Appen ligger i `kemkvitto-app/`. Next.js 16.1.6, App Router, React 19.2.3, TypeScript, Tailwind CSS v4. Roten i repot innehåller i övrigt `docs/`, `README.md` (en mening), `.gitignore` och `.github/workflows/keep-alive.yml`.

Webbläsaren pratar med de egna API-rutterna. Databasen nås bara via `createServiceClient()` i `src/lib/supabase.ts`. Det finns ingen Supabase-klient i klientkomponenterna.

### Sidor

| Väg | Fil | Vad den gör |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Kassavyn. Hämtar nästa kvittonummer, färg, prislista och knappnamn. Washern väljer plagg och tjänster, datum och kund, och skapar kvitto. Kräver session i klienten och i middleware. |
| `/login` | `src/app/login/page.tsx` | Inloggning med e-post och lösenord via NextAuth `signIn`, utan omdirigering från NextAuth. Vid fel visas en gemensam text. |
| `/register` | `src/app/register/page.tsx` | Formulär som anropar `POST /api/auth/register` och sedan skickar användaren till `/login`. Loggar inte in automatiskt. |
| `/receipts` | `src/app/receipts/page.tsx` | Lista över inloggat tvätteris kvitton, sök, sortering på datum eller nummer, och en redigeringspanel som kan ändra eller ta bort ett kvitto. |
| `/settings` | `src/app/settings/page.tsx` | Företagsnamn, nästa kvittonummer, tio blockfärger, plagg- och tjänstelistor med priser. Länkar till juridiska sidor. |
| `/privacy` | `src/app/privacy/page.tsx` | Integritetspolicy på engelska, statisk text. Middleware kräver ändå inloggning. |
| `/terms` | `src/app/terms/page.tsx` | Användarvillkor på engelska, statisk text. Middleware kräver ändå inloggning. |
| `/pay/[id]` | `src/app/pay/[id]/page.tsx` | Publik sida för att betala ett enskilt kvitto. Utan Stripe-nyckel visas ett demoläge som låtsas lyckas i webbläsaren. Med nyckel laddas Stripe.js. |
| `/receipt/[id]/email` | `src/app/receipt/[id]/email/page.tsx` | Publik sida där en kund kan skriva e-post för ett kvitto-id. Renderar `CustomerEmailForm`. |

`src/app/layout.tsx` sätter titel "Kemkvitto", språk `sv` på `<html>`, och lindar in allt i `I18nProvider` och NextAuth `SessionProvider`.

### Komponenter

| Fil | Används | Vad den gör |
| --- | --- | --- |
| `GarmentGrid.tsx` | Ja, kassavyn | Rutnät av plagg. Tryck ökar antal med 1. Långt tryck tar bort. Skjorta har +5 och +10 som lägger på antal, till samma styckpris. |
| `OrderSummary.tsx` | Ja, kassavyn | Rader, antal, summa och en rad "varav moms (25%)". |
| `DateStepper.tsx` | Ja, kassavyn | Datumstegare. Räknar vardagar (hoppar över lördag och söndag) och visar veckodag. Exporterar `getDefaultDeliveryDate` (tre vardagar fram). |
| `CustomerSearch.tsx` | Ja, kassavyn | Namnfält med sök, e-postfält, träfflista. Telefonfältet är borttaget ur vyn. |
| `BottomBar.tsx` | Ja, kassavyn | Fast bottenrad med antal, summa och skicka/spara. |
| `LanguageToggle.tsx` | Ja, flera sidor | En knapp som växlar sv → en → da → no och tillbaka. |
| `KemkvittoLogo.tsx` | Ja, login, register, kassa | Vit SVG-logotyp eller färgad ikon plus ordet "kemkvitto". |
| `SessionWrapper.tsx` | Ja, layout | `SessionProvider`. |
| `CustomerEmailForm.tsx` | Ja, kundens e-postsida | E-postfält och "Klar". Försöker hämta förslag från autocomplete. |
| `ReceiptNumberControl.tsx` | Nej | Äldre kvittonummerfält med "?" och "Nollställ". Ingen sida importerar den. |
| `TreatmentModeBar.tsx` | Nej | Betald / ej betald. Ingen sida importerar den. Filen exporterar `PaymentStatusBar`. |
| `DateInput.tsx` | Nej | Datumfält. Ingen sida importerar den. |

### API-rutter

Session betyder `getServerSession` i själva rutten. Middleware är ett separat lager och beskrivs under avsnitt 5.

| Rutt | Metod | Session i rutten | `washer_id` | Vad den gör |
| --- | --- | --- | --- | --- |
| `/api/auth/[...nextauth]` | GET, POST | NextAuth | — | NextAuth-handler. |
| `/api/auth/register` | POST | Nej, avsiktligt publik | skapar en rad i `washers` | Skapar tvätteri med bcrypt (kostnad 12) och en inbyggd prislista. |
| `/api/receipts` | POST | Ja | sätter `washer_id` från sessionen | Skapar kvitto, skriver nästa nummer, kan upserta kund, skickar mejl. |
| `/api/receipts/[id]` | PATCH, DELETE | Ja | läser raden och jämför `washer_id` | Ändrar eller tar bort. Vid nytt datum nollställs `reminder_sent` och ett mejl skickas. |
| `/api/receipts/[id]/email` | POST | Nej | Nej | Skriver `customer_email` på valfritt id och skickar kvittomejl. |
| `/api/receipts/[id]/payment-status` | GET | Nej i rutten | Nej | Returnerar `payment_status` och `amount_total` för valfritt id. Middleware kräver någon inloggad användare. |
| `/api/receipts/list` | GET | Ja | `.eq("washer_id", washerId)` | Senaste 100 kvittona. |
| `/api/receipts/autocomplete` | GET | Ja, annars tom lista | `.eq("washer_id")` | Sök bland namn, telefon och e-post på kvitton. |
| `/api/receipts/next-number` | GET | Ja | `.eq("id", washerId)` | Nästa nummer, färg, priser, listor, företagsnamn. |
| `/api/receipts/reset-number` | POST | Ja | `.eq("id", washerId)` | Sätter `next_receipt_number`. Kontrollerar inte om uppdateringen lyckades. |
| `/api/customers` | GET, POST | Ja | `.eq` / sätter `washer_id` | Sök och upsert på namn, telefon, e-post. |
| `/api/settings` | GET, PUT | Ja | `.eq("id", washerId)` | Läser och sparar färg, priser, namn och listor. |
| `/api/cron/reminders` | GET | Nej | alla tvätterier, avsiktligt | Påminnelsemejl. Se avsnitt 5. |
| `/api/pay/[id]/info` | GET | Nej | Nej | Publik kvittosammanfattning: nummer, företagsnamn, färg, belopp, status, plagg. |
| `/api/payments/create-intent` | POST | Nej | Nej | Skapar en Stripe PaymentIntent för ett kvitto, eller svarar `demo: true` om `STRIPE_SECRET_KEY` saknas. |
| `/api/webhooks/stripe` | POST | Signatur | uppdaterar kvitto-id från metadata | Sätter `payment_status` till `paid` eller `failed`. |

### Delade hjälpfunktioner

| Fil | Funktioner | Vad de gör |
| --- | --- | --- |
| `src/lib/auth.ts` | `authOptions` | Credentials mot `washers`. Jämför bcrypt. JWT. Lägger `id` i token och `session.user.id`. Ingen `secret` i objektet. NextAuth läser den från miljön. |
| `src/lib/supabase.ts` | `createServiceClient()` | Service role-klient. En klient per anrop, inte en modul-singleton. |
| `src/lib/email.ts` | `sendReceiptEmail`, `sendReminderEmail`, `sendDateUpdateEmail`, `getPaymentUrl` | HTML-mejl (tabell och inline-stilar) plus PDF-bilaga på kvittomejlet. Påminnelse och datumändring är egna texter. |
| `src/lib/pdf.ts` | `generateReceiptPDF` | jsPDF-kvitto på svenska, med "TOTALT" och "varav moms (25%)". |
| `src/lib/stripe.ts` | `getStripe()` | Lazily skapad Stripe-klient, API-version `2026-02-25.clover`. |
| `src/lib/i18n.tsx` | `I18nProvider`, `useI18n` | Språk i React-context. Se avsnitt 2. |
| `src/middleware.ts` | `middleware` | Sessionsspärr och undantag. Se avsnitt 5. |

`src/app/page.tsx` har dessutom lokala hjälpfunktioner `todayISO` och `blendWithWhite`.

### Databasen så som migreringarna beskriver den

Migreringarna i `kemkvitto-app/supabase/migrations/` är det repot innehåller. De är inte kontrollerade mot Supabase.

- `001_initial.sql`: `washers` och `receipts`, index på påminnelser, RLS avstängt.
- `002_prices_and_branding.sql`: `brand_color` (standard `#0891b2`, inte en av de tio godkända färgerna) och `price_list`.
- `003_customer_info.sql`: `customer_name`, `customer_phone`, `drop_off_date` på `receipts`.
- `004_payment_fields.sql`: `payment_status`, `payment_intent_id`, `amount_total` (öre).
- `005_customers_table.sql`: `customers` med `name`, `phone`, `email`, unik på `(washer_id, name)`, RLS avstängt, plus `receipts.customer_id`.
- `006_item_lists.sql`: `garment_list`, `service_list`.
- `007_receipt_number_text.sql`: `receipt_number` blir text.

Ingen migrering lägger ett unikt index på `(washer_id, receipt_number)`. Ingen migrering sätter RLS på igen. Koden har fallbackar när kolumner saknas (`PGRST204` / `42703`), så den är skriven för att tåla att alla migreringar inte är körda.

## 2. Språk

Koden har fyra språk, inte fem: svenska `sv`, engelska `en`, danska `da` och norska `no`.

De är definierade i `src/lib/i18n.tsx` rad 5 (`Locale`) och i `src/components/LanguageToggle.tsx` rad 6–7. En genomgång av alla TypeScript-filer och av git-historiken visade inget femte språkkod (`fi`, `de`, `es` eller annat) i språkfilen. Vilket det femte språket skulle vara går inte att avgöra ur koden. Se frågorna sist.

Texterna ligger i samma fil, i objektet `translations` (rad 7–161) och i `garmentNames` (rad 164–185). Det finns inga separata språkfiler. Tjänstenamn för mejl och PDF ligger hårdkodade på svenska i `src/lib/email.ts` och `src/lib/pdf.ts`.

Språk väljs i webbläsaren. `I18nProvider` läser `localStorage` under nyckeln `kemkvitto-lang` (`i18n.tsx` rad 204–216). Det är inte per tvätteri, inte per kvitto och inte utifrån `Accept-Language`. `<html lang>` är alltid `sv` (`layout.tsx` rad 17). Knappen i `LanguageToggle` stegar genom de fyra koderna. Ogiltigt värde i `localStorage` används ändå, och då faller `t()` tillbaka på nyckelnamnet (`i18n.tsx` rad 219), inte på engelska och därefter svenska.

`useState`-initieraren körs vid serverrenderingen, där `window` saknas, och ger då `sv`. Efter omladdning är det därför osäkert att det sparade språket syns, och ett annat språk än `sv` kan ge en hydreringsavvikelse. Det är läst ur koden, inte kört i en inloggad session.

Betalsidan har ett eget språk, styrt av query-parametern `lang`, och bara `sv` och `en` (`pay/[id]/page.tsx` rad 16 och 306). Den använder inte `useI18n`.

### Hårdkodad text, urval

Allt detta syns för en användare och ligger utanför språkfilen, eller bara delvis i den.

- Inloggningens två slagord är en egen `sv` / `en` / övrigt-gren. Danska och norska får samma danska mening (`login/page.tsx` rad 51–52). Nyckeln `auth.tagline` finns i språkfilen och används inte här.
- Hjälpknappens `title="Hjälp"` (`page.tsx` rad 333).
- Platshållaren "Ange specialnummer..." och texten "återgår till" (`page.tsx` rad 439–442).
- Feltexten `Nätverksfel` (`page.tsx` rad 155).
- API-svar på svenska utan språkval, till exempel "Alla falt kravs", "E-postadressen ar redan registrerad" (`register/route.ts` rad 10 och 53; å och ä saknas), "Ogiltigt nummer", "Kunde inte hamta kvitton".
- Kvittolistan: "Kundnamn", "E-post", "Lägg till plagg", "Ta bort", "Spara ändringar", "Sparat!" (`receipts/page.tsx`).
- Inställningar: "Tjänstnamn...", "Plaggnamn...", "Legal", "Privacy Policy", "Terms of Service" (`settings/page.tsx`).
- Hela `/privacy` och `/terms`.
- Mejl och PDF: ämnesrader, "Kvitto", "Inlämnat", "Färdigt", "Tjänster", "TOTALT", "varav moms (25%)", "Tack för ditt besök!", påminnelsen och datumändringen (`email.ts`, `pdf.ts`).
- Betalsidans demoläge, kortfält och feltexter (`pay/[id]/page.tsx`).
- `ReceiptNumberControl.tsx` har en egen svensk hjälptext. Komponenten används inte.
- Plagg- och tjänstenamn i standardlistorna är svenska och används som nycklar i databasen (`next-number/route.ts` rad 6–11, `register/route.ts` rad 18–41).

Påminnelsemejlet säger inte "Idag borde din kemtvätt vara klar." Den faktiska texten står i avsnitt 5.

## 3. Miljövariabler

Bara namn. Inga värden.

### Namn som applikationskoden läser

| Namn | Var |
| --- | --- |
| `RESEND_API_KEY` | `src/lib/email.ts` |
| `EMAIL_FROM` | `src/lib/email.ts` |
| `NEXT_PUBLIC_APP_URL` | `src/lib/email.ts` (`getPaymentUrl`) |
| `STRIPE_SECRET_KEY` | `src/lib/stripe.ts`, `src/app/api/payments/create-intent/route.ts` |
| `STRIPE_WEBHOOK_SECRET` | `src/app/api/webhooks/stripe/route.ts` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `src/app/pay/[id]/page.tsx` |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase.ts` |
| `CRON_SECRET` | `src/app/api/cron/reminders/route.ts` |

`NEXT_PUBLIC_SUPABASE_URL` har prefixet `NEXT_PUBLIC_`. Värdet är en projektadress, inte service role-nyckeln. Nyckeln själv har inte det prefixet och läses bara i serverfilen ovan. Ingen annan hemlighet har `NEXT_PUBLIC_` i koden.

### Namn som biblioteken läser, utan att appkoden nämner dem

NextAuth v4 och `getToken` i middleware läser `NEXTAUTH_SECRET`. NextAuth läser också `NEXTAUTH_URL`. De står i `kemkvitto-app/README.md` och användes som platshållare vid bygget. De står inte i någon `process.env`-rad i `src/`.

### Namn som README listar och som koden inte läser

`NEXT_PUBLIC_SUPABASE_ANON_KEY` och `RESEND_FROM`. Koden använder `EMAIL_FROM`, inte `RESEND_FROM`. Det finns ingen `.env.example` och ingen `.env.local.example`, trots att README säger att den senare ska kopieras.

### GitHub Actions

`keep-alive.yml` refererar till secret-namnet `SUPABASE_SERVICE_ROLE_KEY`. Commit `c1f8f48` refererade också till `NEXT_PUBLIC_SUPABASE_URL`. Inget av dem ligger som värde i filen.

### Docker

`Dockerfile` sätter `NODE_ENV`, `PORT` och `HOSTNAME`. Det är körningsflaggor, inte hemligheter. `docker-compose.yml` pekar på `.env.local` utan att namnge variablerna.

## 4. Lint, typkontroll och bygge

Kört i `kemkvitto-app/` med Node v22.23.4 och npm 10.9.9. Miljövariabler sattes bara som platshållare i skalet för bygget: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `EMAIL_FROM`, tom `RESEND_API_KEY`, tom `STRIPE_SECRET_KEY`, tom `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`. Inga riktiga nycklar.

| Kommando | Resultat |
| --- | --- |
| `npm ci` | Avslutade med kod 0. 131 paket lades till. npm skrev att 14 sårbarheter rapporteras (5 moderate, 6 high, 3 critical) och tipsade om `npm audit fix`. Det kommandot kördes inte. Låsfilen är oförändrad. |
| `npx tsc --noEmit --pretty false` | Avslutade med kod 0. Ingen utskrift. |
| `npm run lint` | Avslutade med kod 1. `package.json` har inget `lint`-skript. Feltexten var "Missing script: lint". |
| `npx next lint` | Avslutade med kod 1. Next.js 16.1.6 har inget lint-underkommando. Programmet tolkade `lint` som en projektkatalog och skrev: `Invalid project directory provided, no such directory: /workspace/kemkvitto-app/lint`. |
| `npx eslint .` | Avslutade med kod 2. ESLint är inte ett beroende i projektet och det finns ingen `eslint.config.*`. Utskriften sa att konfigurationen saknas. Kommandot hämtade ESLint till npx-cachen, inte till repot. |
| `npx next build` | Avslutade med kod 0. En varning, inga fel. Se nedan. |

Byggets enda varning, ordagrant i sak:

`The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`

Bygget kompilerade, TypeScript-steget gick igenom, och 21 sidor genererades. Routetabellen i utskriften matchar kartan i avsnitt 1. Sista raden i tabellen var `ƒ Proxy (Middleware)`.

Det gick inte att köra ett projektets eget lint, eftersom varken skript, ESLint-konfiguration eller `next lint` finns. Kommentarerna `eslint-disable` i `receipts/list/route.ts` och `settings/route.ts` har därför inget verktyg som läser dem.

`npm audit` (extra, inte en del av lint) flaggar bland annat `next@16.1.6`, `next-auth@4.24.13` och `jspdf@4.2.0` som critical, samt `resend@6.9.3` som moderate via ett beroende. Inget paket är uppgraderat. Överlämningen säger att ramverk inte ska uppgraderas utan godkännande. Titlarna i rapporten handlar om request smuggling och bildcache i Next, om `getToken` och e-postnormalisering i Auth.js, och om PDF-injektion i jsPDF. De är inte verifierade mot just den här appens anrop, och inget försök att utnyttja dem är gjort.

## 5. Svar på avsnitt 6, 8 och 9

### Session och `washer_id`

Middleware i `src/middleware.ts` släpper igenom, utan session:

- sökvägar som börjar med `/login`, `/register`, `/api/auth` (rad 4–11)
- `/receipt/<id>/email` och `/api/receipts/<id>/email` (rad 15–22)
- `/pay/`, `/api/pay/`, `/api/payments/`, `/api/webhooks/` (rad 25–36)
- `/api/cron` (rad 39–41)

Allt annat, inklusive `/`, `/receipts`, `/settings`, `/privacy`, `/terms` och övriga API-rutter, omdirigeras till `/login` om `getToken` inte hittar en token (rad 43–46). `getToken` anropas utan uttrycklig `secret`. NextAuth hämtar `NEXTAUTH_SECRET` från miljön.

Kontrollerat mot den lokala servern med platshållare: `GET /` och `GET /privacy` svarade 307 till `/login`. `GET /api/receipts/list` utan cookie svarade 307 till `/login`. Omdirigeringen gäller alltså också API-anrop. `fetch` i webbläsaren följer omdirigeringen och kan få HTML tillbaka. Kassavyns hämtning av nästa nummer (`page.tsx` rad 64–74) har ingen `catch`. Ett sådant svar lämnar sidan på laddningssnurran, eftersom `settingsLoaded` aldrig blir sant.

Middleware kontrollerar att någon token finns. Den kontrollerar inte att token tillhör det tvätteri som raden gäller. Det gör bara de rutter som själva filtrerar.

Rutter som ändrar eller läser ett annat tvätteris data om man kan adressen:

- `POST /api/receipts/[id]/email` har varken session eller `washer_id`. Den skriver över e-post och skickar mejl. Lokalt, utan databas, svarade den 404 "Kvitto hittades inte" och krävde ingen cookie. Med en riktig databas och ett känt id räcker det.
- `GET /api/pay/[id]/info` och `POST /api/payments/create-intent` är publika. Lokalt svarade de 404 utan cookie, efter att ha försökt läsa databasen. De returnerar eller debiterar utifrån kvitto-id, inte utifrån inloggning.
- `GET /api/receipts/[id]/payment-status` filtrerar inte på `washer_id`. Middleware kräver bara att någon är inloggad.

Övriga tvätterirutter i tabellen i avsnitt 1 filtrerar på sessionens id, eller jämför `washer_id` innan ändring och borttag. `PATCH` och `DELETE` gör den jämförelsen. Själva uppdateringen filtrerar sedan bara på kvitto-id (`receipts/[id]/route.ts` rad 40–52 och 145–148). Ägarskapet är redan kontrollerat i samma anrop, så ett annat tvätteris id används inte, så länge kontrollen inte hoppas över.

Service role går förbi RLS. Repots SQL stänger av RLS. Överlämningen säger att den riktiga databasen har RLS påslaget och inga policyer. Båda lägena kräver att varje rutt filtrerar själv. Vilket läge som faktiskt gäller i Supabase kan inte avgöras härifrån.

### Stripe-webhookens signatur

`POST /api/webhooks/stripe` läser rå kropp och headern `stripe-signature`. Saknas headern svarar den 400 innan något skrivs (rad 10–12). Annars anropas `constructEvent` med `STRIPE_WEBHOOK_SECRET` (rad 16–20). Först därefter uppdateras `payment_status`. Lokalt gav ett anrop utan signatur `400` och `{"error":"Missing signature"}`.

En ogiltig signatur fångas och svarar 400. Felmeddelandet från Stripe loggas (`route.ts` rad 23). Om `STRIPE_WEBHOOK_SECRET` saknas kastas anropet och blir samma 400. Det är inte testat med en giltig signatur, och ska inte testas mot skarpa nycklar.

Webhooken kontrollerar inte att beloppet stämmer med kvittot. Den litar på `metadata.receipt_id` efter att signaturen gått igenom.

### Cron och påminnelser

`GET /api/cron/reminders` läser headern `x-cron-secret`. Spärren är `if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET)` (rad 6–8). När variabeln är satt och headern saknas eller är fel svarar rutten 401. Det är kört lokalt: både utan header och med fel header gav 401.

När `CRON_SECRET` är tom eller osatt är villkoret falskt, och rutten är öppen. Middleware släpper dessutom alltid igenom `/api/cron`. Kommentaren på rad 38 i middleware säger att ändpunkten "would be protected by secret in production". Skyddet gäller bara om variabeln verkligen är satt hos Vercel. Det kan inte kontrolleras här.

Jobbet är inte idempotent mot två samtidiga körningar. Det hämtar rader med `reminder_sent = false`, skickar mejl, och sätter sedan flaggan (rad 48–54). Två överlappande anrop kan båda se flaggan som falsk. Ett fel på ett kvitto fångas och stoppar inte de andra (rad 52–54). Om mejlet går iväg och uppdateringen misslyckas skickas mejlet igen vid nästa körning.

Datumet är inte "i dag" och inte Europe/Stockholm. Rutten tar serverns `new Date()`, lägger på en dag, och tar datumdelen av `toISOString()` (rad 14–17). `toISOString` är UTC. Vercel kör UTC. Runt midnatt i Sverige blir datumet fel, och urvalet är morgondagen, inte leveransdagen. Texten i mejlet är "Din kemtvätt är klar imorgon!" och ämnesraden är "Påminnelse: Din kemtvätt är klar imorgon — {namn}" (`email.ts` rad 288 och 302). Ordet "borde" finns inte. Engelska varianten från överlämningen finns inte. Betalda kvitton och tom e-post hoppas över (rad 24–25). Ingen `vercel.json` finns, och ingen är tillagd.

### Massförsök och uppräkning av konton

Det finns ingen rate limiting i koden och inget sådant paket i `package.json`. Registrering och inloggning kan anropas obegränsat.

Inloggning: `authorize` i `lib/auth.ts` returnerar `null` både när e-posten saknas och när lösenordet är fel (rad 24 och 30). Klienten visar alltid `auth.loginError`, "Fel e-post eller lösenord" (`login/page.tsx` rad 30–31). Lokalt svarade ett inloggningsförsök mot platshållardatabasen 401 med NextAuth-felet `CredentialsSignin`. Svaret säger inte om adressen finns.

Registrering: när databasen svarar med koden `23505` returneras 409 och texten "E-postadressen ar redan registrerad" (`register/route.ts` rad 50–55). Den texten talar om att adressen finns. Övriga fel blir 500 "Registrering misslyckades", vilket också är det svar platshållarservern gav. Lösenordets minimilängd på 6 tecken finns bara i formuläret, inte i API:t.

Söksträngen i `GET /api/customers` och `GET /api/receipts/autocomplete` sätts in ofiltrerad i ett PostgREST-`or`-filter (`customers/route.ts` rad 27, `autocomplete/route.ts` rad 27–29). Ett värde med filtertecken kan ändra frågan. Ingen exempelsträng skrivs här.

### Loggning av hemligheter, personuppgifter och e-post

Inga lösenord eller nycklar loggas. Hela kundens e-postadress loggas:

- `src/app/api/receipts/route.ts` rad 124, vid lyckat mejl
- `src/lib/email.ts` rad 243, 246, 249, 305, 308, 370 och 372, både när Resend är konfigurerat och när det inte är det

Kvittots id loggas i cron och i webhooken, inte e-postadressen där. Registreringsfelet loggas inte alls. Kundnamn loggas inte som egen rad, men adressen är en personuppgift enligt den princip överlämningen beskriver.

### Nycklar i kod och historik

Se rutan längst upp. Ingen rotering begärs av det som hittades. Projektadressen i keep-alive är redan publik i repot. Den är inte kopierad till den här rapporten.

### Vad betalrutterna faktiskt gör

De tar betalt för ett enskilt kvitto, inte för tvätteriets prenumeration.

`POST /api/payments/create-intent` läser kvittots `amount_total` (öre), valutan är hårdkodad `sek`, och betalmetoderna är `card` och `swish` (`create-intent/route.ts` rad 59–68). Metadata får kvitto-id och kvittonummer. Beskrivningen är "Kvitto #…". Utan `STRIPE_SECRET_KEY` blir svaret `demo: true` och ingen Stripe-anrop görs (rad 29–36). En befintlig PaymentIntent återanvänds om statusen tillåter det.

`GET /api/pay/[id]/info` ger underlag till betalsidan: nummer, företagsnamn, färg, belopp, status och plagg.

`/pay/[id]` hämtar de två anropen. I demoläge visar sidan ett låtsasformulär och sätter lokal status till lyckad efter 1,5 sekunder (`pay/[id]/page.tsx` rad 66–69). Databasen uppdateras inte. I skarpt läge bekräftar Stripe.js betalningen och webhooken sätter `payment_status`.

Kvittomejlet lägger in en "Betala … kr"-länk när `amount_total` är större än noll (`email.ts` rad 165–170 och 195–198).

Villkoren på `/terms` beskriver en månadsavgift och 30 dagars provperiod för tvätteriet. Ingen sådan prenumeration, Checkout-session eller pris finns i koden. Kolumnen för betalstatus är inte borttagen: `payment_status` läses och skrivs på flera ställen. Överlämningen säger att en kolumn städades bort nyligen. Den syns inte som en borttagen `paid`-kolumn i migreringarna. `PATCH` undviker uttryckligen att läsa `paid` (`receipts/[id]/route.ts` rad 22).

Inget i betalflödet är ändrat.

### `customers.name` och `customers.phone`

Koden både läser och skriver dem.

Skrivning:

- `POST /api/receipts` lägger `customer_name` och `customer_phone` på kvittot (rad 39–40). Om `customerName` inte är tom görs upsert i `customers` med `name`, `phone` och `email` (rad 83–96).
- `POST /api/customers` kräver `name` och skriver `name`, `phone`, `email` (rad 48–67).
- `PATCH /api/receipts/[id]` skriver `customer_name` (rad 46 och 60). Den skriver inte telefon.

Läsning:

- `GET /api/customers` väljer `id, name, phone, email` (rad 25).
- `GET /api/receipts/autocomplete` väljer `customer_name`, `customer_phone`, `customer_email` (rad 25).
- `GET /api/receipts/list` tar med båda (rad 8).
- Kvittolistan söker på namn och telefon (`receipts/page.tsx` rad 380–381) och visar namn.
- Mejl och PDF skriver ut namn och telefon när de finns (`email.ts` rad 91–92, `pdf.ts` rad 68–73).

Vyn samlar in namn. Telefonfältet är borttaget ur `CustomerSearch` (commit `dc9aaaf`, och spec D i marsdokumentet). `onPhoneChange` tas emot och anropas inte. Telefon kan ändå följa med från en gammal träff och sparas på nästa kvitto (`page.tsx` rad 454–457). Integritetstexten säger att namn och telefon inte lagras (`privacy/page.tsx` rad 37). Koden gör det motsatta.

Inget är ändrat. Borttagning kräver ett ja, och i så fall ett SQL-förslag som Kimmen kör.

### Kvittonumrets samtidighet

Två enheter kan få samma nummer.

1. Båda hämtar `next_receipt_number` via `GET /api/receipts/next-number`.
2. Båda skickar samma `receiptNumber` och `nextReceiptNumber: receiptNumber + 1` (`page.tsx` rad 128–130).
3. `POST /api/receipts` gör en vanlig insert och sedan en vanlig update (rad 46–81). Ingen transaktion, ingen `SELECT … FOR UPDATE`, inget unikt index i migreringarna.

Den som skriver sist bestämmer räknaren. En återställning (`reset-number`) som pågår samtidigt kan skriva över en ökning, eller tvärtom. Luckor uppstår också när washern ändrar siffran i huvudfältet och skickar: nästa nummer blir det inskrivna plus ett, även utan "Återställ". Engångsläge skickar det vanliga numret som nästa och rör alltså inte räknaren förbi specialnumret (`page.tsx` rad 129–130). Det stämmer med tanken för engångsnummer.

Det tomma fältet från överlämningen finns inte. Fältet visar alltid ett nummer. Specialnummer är ett separat textfält.

`+5` och `+10` på Skjorta lägger på antal till styckpriset (`GarmentGrid.tsx` rad 138–173). De är inte egna rader med paketpris. `next-number` och `settings` filtrerar bort namnen "Skjorta ×5" och "Skjorta ×10" om de ligger i listan (rad 44 respektive rad 53). Mars-specen ville ha dem som egna plagg. Överlämningens avsnitt 7 vill ha egna priser. Koden gör inget av det.

### Gränsen 500 kvitton

Den finns inte. `GET /api/receipts/list` har `.limit(100)` (rad 28). Inget raderar äldre kvitton. Integritetstextens 90 dagar och "automatic purges" har ingen motsvarighet i koden.

### "Spara kund" och utloggning

Strängen "Spara kund" finns inte i någon commit. Telefonfältet togs bort i `dc9aaaf`. Det som finns kvar är knappen "Lägg till som ny kund" i träfflistan (`CustomerSearch.tsx` rad 122–136). Den anropar inte `POST /api/customers`. Den sätter namnet och tömmer telefon och e-post i formuläret. En redan ifylld e-post försvinner alltså. Kunden sparas först när kvittot skapas, och bara om namnet inte är tomt (`receipts/route.ts` rad 84).

Utloggning, inloggning och registrering kunde inte köras mot en riktig databas. Mot platshållarservern:

- `POST /api/auth/register` svarade 500 och JSON `{"error":"Registrering misslyckades"}`. Formuläret skulle visa den texten och inte fastna, eftersom svaret är JSON.
- Inloggning svarade 401 `CredentialsSignin`. Formuläret skulle visa "Fel e-post eller lösenord".

Det historiska felet, att man efter utloggning varken kan logga in eller skapa konto, gick inte att återskapa. Kodvägar som kan se ut så:

- `signOut()` anropas utan `callbackUrl` (`page.tsx` rad 246). NextAuth går tillbaka till den sida man står på. Middleware skickar sedan en tom session till `/login`. Det ledet är inte kört i en webbläsare med en giltig session.
- När sessionen är borta och inställningarna redan laddats returnerar kassavyn `null` (`page.tsx` rad 187) tills en effekt anropar `router.push("/login")` (rad 58–60). Det kan bli en tom sida ett ögonblick.
- `register/page.tsx` rad 31 gör `res.json()` utan `catch`. Om svaret inte är JSON, till exempel en HTML-omdirigering, stannar knappen på "Registrerar..." och inget fel visas. Platshållarservern gav JSON, så just den vägen syntes inte.
- 409-texten vid upptagen e-post kan tolkas som att registrering är trasig, fast kontot finns.

### `middleware.ts` och `proxy`

Next.js egen dokumentation, läst 12 november 2026, bekräftar bytet för version 16.

- Uppgraderingsguiden (https://nextjs.org/docs/app/guides/upgrading/version-16) säger att filnamnet `middleware` är föråldrat och ska heta `proxy`. Funktionen ska heta `proxy`. `proxy` körs på Node.js och kan inte sättas till Edge. Edge kräver att man behåller `middleware`.
- Filkonventionen (https://nextjs.org/docs/app/api-reference/file-conventions/proxy) säger samma sak och att konventionen bytte namn i v16.0.0. Kodmod: `npx @next/codemod@canary middleware-to-proxy .`
- Felmeddelandesidan (https://nextjs.org/docs/messages/middleware-to-proxy) är samma text som byggets varning länkar till.
- Blogginlägget för Next.js 16 säger att `middleware.ts` finns kvar för Edge men är föråldrat och ska tas bort i en senare version.

Projektet har `src/middleware.ts`, exporterar `middleware`, och kör Next 16.1.6. Bygget skrev varningen. Filen är inte flyttad. En flytt hör hemma i en egen pull request, efter den här rapporten. `getToken` från NextAuth behöver fortsatt fungera så att skyddade sidor går till `/login`. Node-runtime i `proxy` är närmare den runtime NextAuth brukar köras i än Edge är. Det är en iakttagelse, inte en ändring.

## 6. Layout per skärmklass

### Vad som kördes i en webbläsare

`npx next start -p 3456` mot bygget med platshållare. Next skrev också: `"next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.` Servern svarade ändå.

Headless Chrome mätte dessa ytor, utan inloggning: `/login`, `/register`, `/receipt/<ogiltigt-id>/email`, `/pay/<ogiltigt-id>`, `/privacy`, `/terms`.

Bredder och höjder: 360×800, 390×844, 430×932, 780×360, 844×390, 768×1024, 1024×768, 820×1180, 1180×820, 1024×1366, 1366×1024, 1280×800, 1440×900, 1920×1080.

`/privacy` och `/terms` landade på `/login` (307). Kassavyn, kvittolistan och inställningar kräver session och en databas. De är bedömda ur koden. Skärmtangentbord är inte kört.

### Info-menyn, orsaken

Knappen "?" i kassavyn ligger i `page.tsx` rad 327–375. Panelen är `position: absolute`, `z-index: 100`, bredd `16rem`, högerkant mot knappen.

Knappen ligger i högerkolumnen. Högerkolumnen har `overflow-y: auto` (`.pos-right`, `globals.css` rad 169–176). Hela kassayouten har `overflow: hidden` (`.pos-layout`, rad 153–158). En absolut panel klipps av en förfaders overflow, oavsett z-index, eftersom den inte ritas i en portal utanför den rutan. Panelen är bredare än avståndet från knappen till kolumnens vänsterkant, så den växer in över vänsterkolumnen och klipps. z-index 100 ligger kvar inuti scroll-ytan. Header och bottenrad har z-index 30 (rad 96 och 619) och är inte det som döljer menyn.

Samma mönster gäller kundträffarna: `.pos-customer-dropdown` är absolut och har z-index 20 (`globals.css` rad 480–492), inuti samma `overflow-y: auto`.

Ett klick var som helst stänger menyn. Lyssnaren sitter på `document` (`page.tsx` rad 78–83) och panelen stoppar inte händelsen. Hjälptexten i språkfilen (rad 69–71) är en annan text än det stycke överlämningens avsnitt 7 anger.

`ReceiptNumberControl.tsx` har en egen "?" som visas under fältet i flödet (rad 103–116). Den används inte, så den är inte den meny som klipps.

### Kontrast, alla storlekar

Vit text på blockfärgen används i kassahuvudet (`page.tsx` rad 234) och i mejlhuvudet (`email.ts` rad 84–86). Kontrast mot vit, räknat som WCAG:

| Färg | Hex | Vit text | Mörk text `#1c1917` |
| --- | --- | --- | --- |
| Grön | `#82C58A` | 2,04 | 8,58 |
| Blå | `#6BA6D2` | 2,62 | 6,67 |
| Orange | `#EBA17D` | 2,12 | 8,27 |
| Blågrön | `#3CB4A9` | 2,53 | 6,91 |
| Brun | `#BA906C` | 2,88 | 6,07 |
| Gul | `#ECE080` | 1,35 | 12,94 |
| Lila | `#ABA2DA` | 2,36 | 7,42 |
| Rosa | `#EFC6D2` | 1,54 | 11,39 |
| Röd | `#E5919D` | 2,37 | 7,39 |
| Grå | `#ACA6A2` | 2,41 | 7,27 |

Ingen av de tio når 3:1 för vit text. AA för vanlig text är 4,5:1 och för stor text 3:1. Mörk text på samma färger klarar AA. Aktivt plagg använder blockfärgen som text på en ljus ton (`GarmentGrid.tsx` rad 86), vilket också ligger under AA, eftersom färgen mot vit redan gör det. `#a8a29e` mot vit är 2,52 och används för sektionsrubriker och priser (`globals.css` rad 180–186 och 341–345).

Inloggningens turkosa banner `#0891b2` med vit text är 3,68. Det räcker för stor text och inte för sloganens 16 px (`login/page.tsx` rad 50). Språkväljaren är `#78716c` på samma turkos, kontrast 1,30 (`LanguageToggle.tsx` rad 20, placerad i `login/page.tsx` rad 40–42). På skärmdumpen vid 360 px syntes knappen svagt uppe till höger, ovanpå logotypen.

### Gemensamma mått som är för små

Kravet är minst 44 px, helst 48, och minst 16 px i textfält.

| Kontroll | Storlek i koden | Fil och rad |
| --- | --- | --- |
| Datumknappar | 28×28 px | `globals.css` rad 407–410 |
| Kvittonummer +/− | 32×32 px (2 rem) | `globals.css` rad 196–201 |
| Antal +/− i ordersammanfattning | 24×24 px | `globals.css` rad 548–552 |
| Ta bort-kryss | 20×20 px | `globals.css` rad 582–585 |
| ? i kassan | 20×20 px (1,25 rem) | `page.tsx` rad 334–335 |
| +5 och +10 | omkring 10 px text, liten padding, inuti `overflow: hidden` | `GarmentGrid.tsx` rad 57–68, 88, 138–173 |
| Språkväljare | mätt höjd 28 px, bredd 54 px | `LanguageToggle.tsx` rad 17–19 |
| Länk "Registrera" / "Logga in" | mätt höjd 17 px | `login/page.tsx` rad 93–97, `register/page.tsx` rad 97–101 |
| Fält i kassan | 14 px (0,875 rem) | `globals.css` `.pos-input` rad 450–456 |
| Kommentar | 13 px | `globals.css` rad 599–608 |
| Sök på kvittolistan | 14 px (`text-sm`) | `receipts/page.tsx` rad 430 |
| Prisfält i inställningar | 14 px | `settings/page.tsx` rad 76 |
| Ta bort-knapp i inställningar | 28×28 px | `settings/page.tsx` rad 83 |

Inloggning och registrering har fält i `text-lg` (18 px) och klassen `touch-target` (minst 56 px, `globals.css` rad 45–48). De zoomar inte iOS. Kassans fält under 16 px gör det.

`100vh` används i `globals.css` rad 157 och 667, `page.tsx` rad 232, `receipts/page.tsx` rad 104 och 413, `settings/page.tsx` rad 204. `min-h-screen` på login och register är också `100vh`. Ingen `dvh` och ingen `safe-area` finns. Bottenraden är `position: fixed` och 72 px hög (`globals.css` rad 613–628). Tangentbordet på en platta kan täcka e-postfältet och "Klar".

Pris noll visas som "—" i ordersammanfattningen (`OrderSummary.tsx` rad 87) och i bottenraden (`BottomBar.tsx` rad 51). Överlämningen säger att priser som inte används ska vara helt borta.

Hover används som extra effekt på kvittokort (`receipts/page.tsx` rad 497–498) och i CSS för header och räknare. Klick fungerar utan hover. Långt tryck på plagg finns för både mus och pekskärm (`GarmentGrid.tsx` rad 97–101).

Google-fonter hämtas från `fonts.googleapis.com` i `globals.css` rad 1. Det är en tredjepartsbegäran på varje sida. Den är inte tillagd i den här ändringen.

### Mobil 360, 390, 430

Mätt, stående och liggande där bredden är den långa sidan.

Vid 360×800 var dokumentets horisontella overflow 7 px på `/login` och 9 px på `/register`. Logotypen i vit variant är 60 px hög och följer en SVG som är ungefär 373 px bred (`KemkvittoLogo.tsx` rad 15–22 och anropet `size="lg"` i `login/page.tsx` rad 49). Sista bokstaven klipptes i skärmdumpen. Registersidans färgade ordmärke, `fontSize` 2,625 rem (`KemkvittoLogo.tsx` rad 44), klippte sista bokstaven på samma sätt. Språkväljaren ligger absolut uppe till höger och överlappar logotypen (`login/page.tsx` rad 40–42).

Vid 390 och 430, och i de liggande mobilbredderna 780 och 844, var overflow 0 på de publika sidorna. Logotypen får då plats i sidbredden, med liten marginal vid 390.

E-postsidan för kunden hade overflow 0 i alla mätta storlekar. Rubrik, fält och "Klar" syntes hela vid 360. Fältet är `text-2xl`.

Kassa, lista och inställningar, ur koden:

- Headern är en rad utan radbrytning (`.pos-header`, `globals.css` rad 93–104). Logotyp, företagsnamn och fyra kontroller får inte plats vid 360–430. Ingen media-query finns under 860 px för headern.
- Under 860 px staplas kolumnerna (rad 663–684). Rutnätet blir fyra kolumner. På 360 blir brickorna smala, och +5/+10 ligger i hörnet ovanpå namnet.
- Kvittolistans header är en rad med bakåtlänk, rubrik, sökfält `minWidth: 12rem`, språk och sortering (`receipts/page.tsx` rad 418–450). Den raden är bredare än 360 och 390.
- Inställningarnas header är också en rad utan radbrytning (`settings/page.tsx` rad 212–239). Med feltext blir den för bred.
- Inget `max-width` på själva kassan. Listan och inställningar har `max-w-3xl`.

### Platta 768, 820, 1024, stående och liggande

Publika sidor: overflow 0 i alla mätta plattstorlekar. Inloggningen på 1366×1024 visade formuläret, med stor tom yta under. Språkväljaren är fortsatt 28 px och svagt kontrastad mot den turkosa bannern. Formuläret är `max-w-sm` och blir inte oläsligt brett.

Brytpunkten 860 px ligger mitt i plattintervallet.

- Stående 768 och 820 är under 860. Kolumnerna staplas. Kvittonumret hamnar under plaggen, inte kvar uppe till höger. Bottenraden ligger fast. `100vh` räknar ytan bakom tangentbordet.
- Liggande 1024 är över 860, och 1180 likaså. Två kolumner, högerkolumnen är 2 av 7. Info-menyn klipps som ovan. Datumraden (`.pos-dates-row`, `globals.css` rad 384–392) är en rad utan radbrytning. Tjänsteraden radbryts inte förrän under 860 px (rad 348–351 och 681–683), så liggande platta med långa tjänstenamn kan sticka ut ur vänsterkolumnen.
- iPad är huvudmiljön. Koden är inte provkörd som inloggad på en platta.

### Laptop 1280, 1440, 1920

Publika sidor: overflow 0. Inloggningen på 1920 håller formuläret smalt och centrerat. Stor tom yta under, inget som sträcker ut texten.

Kassan har ingen maxbredd. Vid 1920 är vänsterkolumnen ungefär fem sjundedelar, och fem plaggkolumner blir mycket breda brickor med text på 13 px (`globals.css` rad 286–294 och 334–338). Högerkolumnen blir bred, men info-menyn klipps ändå, eftersom den utgår från knappen vid kolumnens vänsterkant och inte från kolumnens bredd.

Kvittolista och inställningar stannar i `max-w-3xl`. På 1920 ligger de som en smal spalt. Det är läsbart. Deras headerrader är inte problemet på de här bredderna.

Tangentbordsfokus finns för fält och knappar via `button:focus-visible` (`globals.css` rad 60–63). Själva datumytan är en `div` med `onClick` (`DateStepper.tsx` rad 101–108), inte en knapp, så den är svår att nå med tangentbord.

## 7. Föreslagen ordning

Risk är risk att röra ett godkänt beteende eller en betalväg. Storlek är hur mycket kod som behöver röras. Inget av detta är påbörjat.

| Nr | Åtgärd | Risk | Storlek |
| --- | --- | --- | --- |
| 1 | Info-menyn i en portal, och samma genomgång för kundträffarna. Hjälptexten byts till stycket i avsnitt 7 först efter att Kimmen sett den nuvarande texten. | Låg | Liten |
| 2 | Inloggning och registrering: logotyp som får plats vid 360, språkväljare med läsbar kontrast, större träffyta på växlaren och på "Registrera"/"Logga in". | Låg | Liten |
| 3 | Kassavyn på mobil, platta och laptop: header som radbryts, inget horisontellt spill, 44 px och 16 px, `dvh` och safe-area, bottenraden ovanför tangentbordet, maxbredd på 1920, +5/+10 som går att träffa. Kontrast: mörk text på de ljusa blockfärgerna. | Medel | Stor |
| 4 | Kvittolista, inställningar, redigeringspanel och de juridiska sidorna. Öppna `/privacy` och `/terms` utan inloggning, om Kimmen vill det. | Medel | Medel |
| 5 | Sluta logga hela e-postadresser. Gör cron stängd när `CRON_SECRET` saknas. Ta bort 409-texten som avslöjar att en adress finns. En enkel spärr mot massförsök på login och register. | Medel | Liten |
| 6 | Kvittonummer: atomisk uppdatering så att två enheter inte får samma nummer. Beteendet för tomt fält, engångsnummer och återställning ska vara oförändrat. | Hög | Medel |
| 7 | Stabilitet: spärra dubbelklick innan begäran går, säg ifrån när mejlet inte gick (nu används texten "ingen e-post angiven" även då, `page.tsx` rad 214), validera e-post och datum på servern. | Medel | Medel |
| 8 | Påminnelse: datum "i dag", Europe/Stockholm, ordet "borde", och en uppdatering som tål två körningar. Vänta på svar, eftersom koden i dag säger "klar imorgon". | Hög | Medel |
| 9 | `middleware.ts` till `proxy.ts`, egen pull request, med test att skyddade sidor går till `/login`. | Medel | Liten |
| 10 | Vercel Analytics, egen pull request. Policyn nämner redan analys och en cookie-banner som inte finns i koden. | Låg | Liten |
| 11 | `name` och `phone`: ingen kod förrän Kimmen svarar. Därefter ett SQL-förslag, inte en ändring som körs här. | Hög för datamodellen | Liten i koden |
| 12 | Språkfiler och de sex nya språken, enligt uppdrag B, när layouten tål längre texter. | Medel | Stor |

Betalrutter, Stripe, `vercel.json`, `.github/workflows/` och RLS rörs inte i den här listan förrän Kimmen bett om en enskild buggfix.

## Frågor till Kimmen

1. När och hur flyttas arbetsgrenen till master? Det beslutet tas inte här.
2. Ska engelskan vara brittisk eller amerikansk?
3. Vilken spanska, och portugisiska för Portugal eller Brasilien?
4. Vilket språk ska kundens mejl ha: tvätteriets, kundens, eller ett som washern väljer på kvittot?
5. Koden har fyra språk: svenska, engelska, danska, norska. Vilket är det femte?
6. Betalrutterna tar betalt för ett enskilt kvitto, med ett demoläge som inte skriver till databasen. Villkoren beskriver en prenumeration för tvätteriet, och den finns inte i koden. Ska kvittobetalningen vara kvar, och är den tänkt att användas?
7. Ska kolumnerna `name` och `phone` tas bort, i både `customers` och på kvittot?
8. Gränsen 500 finns inte. Listan hämtar 100. Ska en gräns införas nu, och är det 500 som ska sparas eller 100 som ska visas?
9. Påminnelsen går dagen före, i UTC, med texten "är klar imorgon". Överlämningen säger leveransdagen, Stockholm, och "borde". Vilken ska gälla innan någon kod rörs?
10. Ska +5 och +10 vara paket med egna priser, eller antal på styckpriset som nu?
11. "Spara kund" finns inte i historiken. Ska den rutan tillbaka, eller räcker e-post utan namnfält? Principen i överlämningen är bara e-post.
12. Syns felet "loggade ut och kan varken logga in eller registrera" fortfarande i den riktiga miljön? Det gick inte att återskapa utan databas.
13. Ska `/privacy` och `/terms` gå att läsa utan inloggning? I dag omdirigerar middleware dit till `/login`.
14. Repots SQL stänger av RLS. Överlämningen säger att RLS är påslaget utan policyer. Vilket stämmer, och ska migreringsfilerna rättas så att ingen kör `DISABLE ROW LEVEL SECURITY` av misstag?
15. Är `CRON_SECRET` satt i Vercel? Koden släpper igenom jobbet när den inte är satt.
16. Keep-alive har en hårdkodad projektadress. Ska den behandlas som känslig, utöver att nyckeln inte ligger i filen?
17. Tre critical-träffar i `npm audit` gäller installerade `next`, `next-auth` och `jspdf`. Ska de uppgraderas i en egen, senare pull request?
18. Planfilen i `docs/superpowers/plans/` ber om driftsättning mot en självvärd maskin. Den är inte följd. Stämmer det att bara Vercel gäller?

## Vad som är kört och vad som inte är kört

Kört: läsning av `kemkvitto-app/src`, migreringar, README, workflow och `docs/superpowers`. Git-historik, 48 commits, med värden maskerade. `npm ci`, `tsc`, försök till lint, `next build`. Lokal `next start` med platshållare. Headless Chrome på de publika sidorna i storlekarna ovan. curl mot register, login, cron, webhook utan signatur, pay-info, create-intent, e-postrutten och kvittolistan utan cookie. Kontrast räknad från de tio hexkoderna.

Inte kört: inloggad kassavy, kvittolista eller inställningar. Inget mot Supabase, Stripe, Resend eller Vercel. Ingen giltig webhook-signatur. Inget mejl. Ingen samtidig kvittonummerkörning mot en databas. Inget skärmtangentbord. Ingen riktig iPad. `node .next/standalone/server.js` är inte startad. Inga paket är uppgraderade och ingen SQL är körd.

## Beslut 13 november 2026

Kimmen har läst kartläggningen och beslutat följande. Koden för punkterna görs i senare pull requests. Undantaget är att `/privacy` och `/terms` öppnas utan inloggning i auth-fixen, eftersom Stripe behöver att de är publika.

- Arbetsgrenen flyttas till master sist, efter att alla steg är klara och Preview är testad på en iPad. Boten slår då ihop den pull requesten själv.
- Både brittisk och amerikansk engelska ska finnas, valda med små flaggor.
- Spanska för Spanien och portugisiska för Portugal kommer först. Brasilien, Argentina och liknande kommer senare.
- Kundens mejl använder tvätteriets språk. Ett val per kvitto kan komma senare.
- Det finns inget femte språk. Språken är `sv`, `en`, `da` och `no`.
- Betalflödet behöver en mer detaljerad genomgång innan något ändras där.
- Kolumnerna `name` och `phone` behålls för framtiden. De får inte visas i mejl eller någon annanstans.
- Ingen gräns på 500 kvitton nu. Integritetspolicyn säger att e-postadressen raderas efter 90 dagar. Koden har inget sådant raderingsjobb, se avsnitt 5. Ingen ändring för det i den här omgången.
- Påminnelsen går på leveransdagen, svensk tid, och använder ordet "borde" på varje språk, eftersom det inte går att garantera att tvätten är klar.
- +5 och +10 blir egna paket med egna priser.
- "Spara kund" tas upp när ett testkonto fungerar.
- `/privacy` och `/terms` ska gå att läsa utan inloggning.
- RLS är påslaget. Migreringsfilerna ska rättas så att de inte stänger av RLS. Filerna ändras bara. De körs inte här.
- Cron-rutten ska neka anrop när `CRON_SECRET` saknas.
- Adressen i keep-alive är inte känslig.
- Uppgraderingar från `npm audit` görs i en egen säkerhets-pull request senare, och följs av ett fullständigt inloggningstest.
- Bara Vercel används. Självvärdsplanen i `docs/superpowers/` och självvärdsavsnittet i README ska tas bort.
