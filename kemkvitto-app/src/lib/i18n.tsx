"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "sv" | "en" | "da" | "no";

const translations = {
  // Header / nav
  "nav.newReceipt": { sv: "Nytt kvitto", en: "New receipt", da: "Ny kvittering", no: "Ny kvittering" },
  "nav.receipts": { sv: "Kvitton", en: "Receipts", da: "Kvitteringer", no: "Kvitteringer" },
  "nav.settings": { sv: "Inställningar", en: "Settings", da: "Indstillinger", no: "Innstillinger" },
  "nav.logout": { sv: "Logga ut", en: "Log out", da: "Log ud", no: "Logg ut" },
  "nav.receipt": { sv: "Kvitto", en: "Receipt", da: "Kvittering", no: "Kvittering" },
  "nav.tag": { sv: "Märke", en: "Tag", da: "Mærke", no: "Merke" },
  "nav.back": { sv: "← Tillbaka", en: "← Back", da: "← Tilbage", no: "← Tilbake" },
  "nav.productPage": { sv: "Produktsidan", en: "Product page", da: "Produktsiden", no: "Produktsiden" },
  "nav.menu": { sv: "Meny", en: "Menu", da: "Menu", no: "Meny" },
  "nav.language": { sv: "Språk", en: "Language", da: "Sprog", no: "Språk" },

  "settings.backToProduct": { sv: "← Tillbaka till produktsidan", en: "← Back to the product page", da: "← Tilbage til produktsiden", no: "← Tilbake til produktsiden" },
  // Receipt creation
  "receipt.garments": { sv: "Plagg", en: "Garments", da: "Beklædning", no: "Plagg" },
  "receipt.addGarment": { sv: "Lägg till plagg", en: "Add a garment", da: "Tilføj beklædning", no: "Legg til plagg" },
  "receipt.dates": { sv: "Datum", en: "Dates", da: "Datoer", no: "Datoer" },
  "receipt.dropOff": { sv: "Inlämnat", en: "Drop-off", da: "Indleveret", no: "Innlevert" },
  "receipt.ready": { sv: "Färdigt", en: "Ready", da: "Færdig", no: "Ferdig" },
  "receipt.customer": { sv: "Kund", en: "Customer", da: "Kunde", no: "Kunde" },
  "receipt.order": { sv: "Beställning", en: "Order", da: "Bestilling", no: "Bestilling" },
  "receipt.comment": { sv: "Kommentar", en: "Comment", da: "Kommentar", no: "Kommentar" },
  "receipt.commentPlaceholder": { sv: "Valfri kommentar...", en: "Optional comment...", da: "Valgfri kommentar...", no: "Valgfri kommentar..." },
  "receipt.submit": { sv: "Skapa kvitto", en: "Create receipt", da: "Opret kvittering", no: "Opprett kvittering" },
  "receipt.submitting": { sv: "Skapar...", en: "Creating...", da: "Opretter...", no: "Oppretter..." },
  "receipt.items": { sv: "plagg", en: "items", da: "stk", no: "stk" },
  "receipt.noItems": { sv: "Välj plagg till vänster", en: "Select garments on the left", da: "Vælg beklædning til venstre", no: "Velg plagg til venstre" },

  // Receipts list
  "receipts.title": { sv: "Kvitton", en: "Receipts", da: "Kvitteringer", no: "Kvitteringer" },
  "receipts.empty": { sv: "Inga kvitton ännu", en: "No receipts yet", da: "Ingen kvitteringer endnu", no: "Ingen kvitteringer enna" },
  "receipts.today": { sv: "Idag", en: "Today", da: "I dag", no: "I dag" },
  "receipts.sortDate": { sv: "Datum", en: "Date", da: "Dato", no: "Dato" },
  "receipts.sortNumber": { sv: "Nummer", en: "Number", da: "Nummer", no: "Nummer" },
  "receipts.search": { sv: "Sök på namn, e-post eller nummer", en: "Search by name, email or number", da: "Søg på navn, e-mail eller nummer", no: "Søk på navn, e-post eller nummer" },
  "receipts.noResults": { sv: "Inga kvitton matchar sökningen", en: "No receipts match the search", da: "Ingen kvitteringer matcher søgningen", no: "Ingen kvitteringer matcher søket" },
  "receipts.pickedUpNote": {
    sv: "Plagg räknas som hämtade av sig själva. Har något stått kvar kan du skicka en påminnelse.",
    en: "Garments count as picked up on their own. If something is still here, you can send a reminder.",
    da: "Tøj tæller som afhentet af sig selv. Hvis noget stadig står, kan du sende en påmindelse.",
    no: "Plagg regnes som hentet av seg selv. Har noe blitt stående, kan du sende en påminnelse.",
  },
  "receipts.shouldBeReady": { sv: "borde vara klar", en: "should be ready", da: "burde være klar", no: "burde være klar" },
  "receipts.sendReminder": { sv: "Skicka påminnelse", en: "Send reminder", da: "Send påmindelse", no: "Send påminnelse" },
  "receipts.sendAgain": { sv: "Skicka igen", en: "Send again", da: "Send igen", no: "Send igjen" },
  "receipts.reminderSent": { sv: "Påminnelse skickad", en: "Reminder sent", da: "Påmindelse sendt", no: "Påminnelse sendt" },
  "receipts.reminderFailed": { sv: "Påminnelsen kunde inte skickas.", en: "The reminder could not be sent.", da: "Påmindelsen kunne ikke sendes.", no: "Påminnelsen kunne ikke sendes." },
  "receipts.edit": { sv: "Ändra", en: "Edit", da: "Ret", no: "Endre" },
  "receipts.newReceipt": { sv: "+ Nytt kvitto", en: "+ New receipt", da: "+ Ny kvittering", no: "+ Ny kvittering" },

  // Settings
  "settings.title": { sv: "Inställningar", en: "Settings", da: "Indstillinger", no: "Innstillinger" },
  "settings.subscription": { sv: "Prenumeration och betalning", en: "Subscription and billing", da: "Abonnement og betaling", no: "Abonnement og betaling" },
  "settings.businessName": { sv: "Företagsnamn", en: "Business name", da: "Virksomhedsnavn", no: "Bedriftsnavn" },
  "settings.brandColor": { sv: "Kvittofärg", en: "Receipt color", da: "Kvitteringsfarve", no: "Kvitteringsfarge" },
  "settings.strength": { sv: "Styrka", en: "Strength", da: "Styrke", no: "Styrke" },
  "settings.strengthDamped": { sv: "Dämpad", en: "Soft", da: "Dæmpet", no: "Dempet" },
  "settings.strengthStandard": { sv: "Standard", en: "Standard", da: "Standard", no: "Standard" },
  "settings.strengthStrong": { sv: "Stark", en: "Strong", da: "Stærk", no: "Sterk" },
  "settings.company": { sv: "Företag", en: "Business", da: "Virksomhed", no: "Bedrift" },
  "settings.nextNumber": { sv: "Nästa kvittonummer", en: "Next receipt number", da: "Næste kvitteringsnummer", no: "Neste kvitteringsnummer" },
  "settings.changeNumber": { sv: "Ändra nummer", en: "Change number", da: "Ændr nummer", no: "Endre nummer" },
  "settings.numberHelp": {
    sv: "Standard: fyra siffror, så första kvittot blir nu 0001. Skriv in det nummer som står på ditt översta kvitto i blocket just nu så följer sekvensen efter allteftersom med paus ifall du behöver fylla i en helt alternativ beteckning. Ändra här eller direkt i fältet på produktsidan om du behöver synka om.",
    en: "Default: four digits, so the first receipt is now 0001. Enter the number on the top receipt in your pad and the sequence continues, with a pause if you need a completely different label. Change it here or in the field on the product page if you need to sync again.",
    da: "Standard: fire cifre, så den første kvittering bliver nu 0001. Skriv det nummer, der står på den øverste kvittering i blokken, så følger sekvensen med pause, hvis du skal bruge en helt anden betegnelse. Ændr her eller direkte i feltet på produktsiden, hvis du skal synkronisere igen.",
    no: "Standard: fire sifre, så den første kvitteringen blir nå 0001. Skriv inn nummeret på den øverste kvitteringen i blokken, så følger sekvensen etter, med pause hvis du trenger en helt annen betegnelse. Endre her eller direkte i feltet på produktsiden hvis du må synkronisere igjen.",
  },
  "settings.prices": { sv: "Priser", en: "Prices", da: "Priser", no: "Priser" },
  "settings.garments": { sv: "Plagg", en: "Garments", da: "Beklædning", no: "Plagg" },
  "settings.usePrices": { sv: "Visa priser på kvitton och påminnelser", en: "Show prices on receipts and reminders", da: "Vis priser på kvitteringer og påmindelser", no: "Vis priser på kvitteringer og påminnelser" },
  "settings.usePricesHint": {
    sv: "Är rutan avstängd visas inga priser i mejlen. Priserna används då bara som stöd på produktsidan.",
    en: "If the box is off, no prices are shown in the email. The prices are then only a guide on the product page.",
    da: "Er feltet slået fra, vises ingen priser i e-mailen. Priserne bruges så kun som støtte på produktsiden.",
    no: "Er ruten av, vises ingen priser i e-posten. Prisene brukes da bare som støtte på produktsiden.",
  },
  "settings.priceList": { sv: "Prislista", en: "Price list", da: "Prisliste", no: "Prisliste" },
  "settings.servicePrices": { sv: "Tjänstpriser", en: "Service prices", da: "Servicepriser", no: "Tjenestepriser" },
  "settings.unsavedTitle": { sv: "Vill du spara ändringarna?", en: "Save your changes?", da: "Vil du gemme ændringerne?", no: "Vil du lagre endringene?" },
  "settings.leaveWithoutSaving": { sv: "Lämna utan att spara", en: "Leave without saving", da: "Forlad uden at gemme", no: "Forlat uten å lagre" },
  "settings.stay": { sv: "Avbryt", en: "Cancel", da: "Annuller", no: "Avbryt" },
  "settings.save": { sv: "Spara", en: "Save", da: "Gem", no: "Lagre" },
  "settings.saving": { sv: "Sparar...", en: "Saving...", da: "Gemmer...", no: "Lagrer..." },
  "settings.saved": { sv: "Sparat!", en: "Saved!", da: "Gemt!", no: "Lagret!" },
  "settings.receiptNumber": { sv: "Kvittonummer", en: "Receipt number", da: "Kvitteringsnummer", no: "Kvitteringsnummer" },
  "settings.receiptNumberPlaceholder": { sv: "Nästa nummer...", en: "Next number...", da: "Næste nummer...", no: "Neste nummer..." },
  "settings.receiptNumberSet": { sv: "Sätt nummer", en: "Set number", da: "Sæt nummer", no: "Sett nummer" },
  "settings.receiptNumberReset": { sv: "Uppdaterat!", en: "Updated!", da: "Opdateret!", no: "Oppdatert!" },
  "settings.addGarment": { sv: "Lägg till plagg", en: "Add garment", da: "Tilføj beklædning", no: "Legg til plagg" },
  "settings.addService": { sv: "Lägg till tjänst", en: "Add service", da: "Tilføj tjeneste", no: "Legg til tjeneste" },

  // Receipt number controls
  "receipt.resetBtn": { sv: "Återställ", en: "Reset", da: "Nulstil", no: "Tilbakestill" },
  "receipt.resetTitle": { sv: "Spara detta nummer som nästa i sekvensen", en: "Save this as the next receipt number", da: "Gem dette som næste kvitteringsnummer", no: "Lagre dette som neste kvitteringsnummer" },
  "receipt.oneTimeBtn": { sv: "Engångsnummer", en: "One-time #", da: "Engangsnr.", no: "Engangsnr." },
  "receipt.oneTimeTitle": { sv: "Tillfälligt nummer för detta kvitto — påverkar inte sekvensen", en: "Temporary number for this receipt — does not affect the sequence", da: "Midlertidigt nummer til denne kvittering — påvirker ikke sekvensen", no: "Midlertidig nummer for denne kvitteringen — påvirker ikke sekvensen" },
  "receipt.helpText": { sv: "Numret räknas upp automatiskt vid varje kvitto.", en: "The receipt number increments automatically with each receipt.", da: "Nummeret tæller automatisk op ved hvert bon.", no: "Nummeret teller automatisk opp ved hver kvittering." },
  "receipt.helpOneTime": { sv: "använd ett specialnummer för ett enskilt kvitto utan att påverka sekvensen.", en: "use a temporary number for a single receipt without affecting the sequence.", da: "brug et specialnummer til en enkelt kvittering uden at påvirke sekvensen.", no: "bruk et spesialnummer for en enkelt kvittering uten å påvirke sekvensen." },
  "receipt.helpReset": { sv: "sätt nästa nummer i sekvensen till det värde som visas nu.", en: "set the next number in the sequence to the value shown now.", da: "sæt det næste nummer i sekvensen til den viste værdi.", no: "sett neste nummer i sekvensen til verdien som vises nå." },

  // Customer email page
  "email.title": { sv: "Ange din e-post", en: "Enter your email", da: "Indtast din e-mail", no: "Skriv inn din e-post" },
  "email.subtitle": { sv: "Så skickar vi kvittot till dig", en: "We'll send the receipt to you", da: "Så sender vi kvitteringen til dig", no: "Så sender vi kvitteringen til deg" },
  "email.placeholder": { sv: "din@epost.se", en: "your@email.com", da: "din@email.dk", no: "din@epost.no" },
  "email.submit": { sv: "Klar", en: "Done", da: "Færdig", no: "Ferdig" },
  "email.submitting": { sv: "Skickar...", en: "Sending...", da: "Sender...", no: "Sender..." },
  "email.thanks": { sv: "Tack!", en: "Thank you!", da: "Tak!", no: "Takk!" },
  "email.sent": { sv: "Kvittot skickas till din e-post", en: "The receipt will be sent to your email", da: "Kvitteringen sendes til din e-mail", no: "Kvitteringen sendes til din e-post" },

  // Login / Register
  "auth.login": { sv: "Logga in", en: "Log in", da: "Log ind", no: "Logg inn" },
  "auth.register": { sv: "Registrera", en: "Register", da: "Registrer", no: "Registrer" },
  "auth.email": { sv: "E-post", en: "Email", da: "E-mail", no: "E-post" },
  "auth.password": { sv: "Lösenord", en: "Password", da: "Adgangskode", no: "Passord" },
  "auth.businessName": { sv: "Företagsnamn", en: "Business name", da: "Virksomhedsnavn", no: "Bedriftsnavn" },
  "auth.noAccount": { sv: "Inget konto?", en: "No account?", da: "Ingen konto?", no: "Ingen konto?" },
  "auth.hasAccount": { sv: "Har redan konto?", en: "Already have an account?", da: "Har allerede en konto?", no: "Har allerede en konto?" },
  "auth.loginSubtitle": { sv: "Logga in på ditt konto", en: "Log in to your account", da: "Log ind på din konto", no: "Logg inn på kontoen din" },
  "auth.tagline": {
    sv: "Papper och e-post, med påminnelse. Aldrig mer ett borttappat kvitto.",
    en: "Paper and e-mail, with reminder. Never again a lost receipt.",
    da: "Papir og e-mail, med påmindelse. Aldrig mere en tabt kvittering.",
    no: "Papir og e-post, med påminnelse. Aldri mer en mistet kvittering.",
  },
  "auth.registerSubtitle": { sv: "Skapa ditt konto", en: "Create your account", da: "Opret din konto", no: "Opprett kontoen din" },
  "auth.loggingIn": { sv: "Loggar in...", en: "Logging in...", da: "Logger ind...", no: "Logger inn..." },
  "auth.registering": { sv: "Registrerar...", en: "Registering...", da: "Registrerer...", no: "Registrerer..." },
  "auth.loginError": { sv: "Fel e-post eller lösenord", en: "Wrong email or password", da: "Forkert e-mail eller adgangskode", no: "Feil e-post eller passord" },
  "auth.registerError": { sv: "Registrering misslyckades", en: "Registration failed", da: "Registrering mislykkedes", no: "Registrering mislyktes" },
  "auth.accountCreated": {
    sv: "Kontot är skapat. Logga in med din e-post och ditt lösenord.",
    en: "Your account has been created. Log in with your email and password.",
    da: "Kontoen er oprettet. Log ind med din e-mail og din adgangskode.",
    no: "Kontoen er opprettet. Logg inn med e-posten din og passordet ditt.",
  },
  "auth.passwordPlaceholder": { sv: "Lösenord", en: "Password", da: "Adgangskode", no: "Passord" },
  "auth.passwordMinLength": { sv: "Minst 8 tecken", en: "At least 8 characters", da: "Mindst 8 tegn", no: "Minst 8 tegn" },
  "auth.registerLead": {
    sv: "gratis. Kortuppgifter krävs från start.",
    en: "free. Card details are required from the start.",
    da: "gratis. Kortoplysninger kræves fra start.",
    no: "gratis. Kortopplysninger kreves fra start.",
  },
  "auth.yourColour": { sv: "Er färg", en: "Your colour", da: "Jeres farve", no: "Deres farge" },
  "auth.changeColour": { sv: "Ändra", en: "Change", da: "Ændr", no: "Endre" },
  "auth.colourLater": {
    sv: "(Kan ändras när som helst senare)",
    en: "(Can be changed at any time later)",
    da: "(Kan ændres når som helst senere)",
    no: "(Kan endres når som helst senere)",
  },
  "auth.alreadyAccount": { sv: "Har du redan ett konto?", en: "Already have an account?", da: "Har du allerede en konto?", no: "Har du allerede en konto?" },
  "auth.country": { sv: "Land", en: "Country", da: "Land", no: "Land" },
  "auth.countryPlaceholder": { sv: "Välj land", en: "Choose country", da: "Vælg land", no: "Velg land" },
  "subscribe.title": { sv: "Prenumeration", en: "Subscription", da: "Abonnement", no: "Abonnement" },
  "subscribe.leadTail": {
    sv: "dagars provperiod. Kortuppgifter krävs från start. Priset är i euro.",
    en: "day trial. A card is required up front. The price is in euros.",
    da: "dages prøveperiode. Kortoplysninger kræves fra start. Prisen er i euro.",
    no: "dagers prøveperiode. Kortopplysninger kreves fra start. Prisen er i euro.",
  },
  "subscribe.payment": { sv: "Betalning", en: "Payment", da: "Betaling", no: "Betaling" },
  "subscribe.freeFirst": { sv: "Första", en: "The first", da: "De første", no: "De første" },
  "subscribe.freeDays": { sv: "dagarna är gratis", en: "days are free", da: "dage er gratis", no: "dagene er gratis" },
  "subscribe.savePrefix": { sv: "Du sparar", en: "You save", da: "Du sparer", no: "Du sparer" },
  "subscribe.saveSuffix": { sv: "% mot månadsbetalning", en: "% compared with monthly payment", da: "% i forhold til månedsbetaling", no: "% mot månedsbetaling" },
  "subscribe.perkEmail": { sv: "Kvitto som e-post, i er färg", en: "Receipt by email, in your colour", da: "Kvittering som e-mail, i jeres farve", no: "Kvittering som e-post, i deres farge" },
  "subscribe.perkReady": { sv: "Påminnelse dagen då plagget borde vara klart", en: "A reminder on the day the garment should be ready", da: "Påmindelse den dag, tøjet bør være klar", no: "Påminnelse den dagen plagget bør være klart" },
  "subscribe.perkCancel": { sv: "Säg upp själv i kundportalen", en: "Cancel yourself in the customer portal", da: "Opsig selv i kundeportalen", no: "Si opp selv i kundeportalen" },
  "subscribe.vatFooter": {
    sv: "Kemkvitto är för företag. Ett momsregistreringsnummer krävs. Ingen moms debiteras – omvänd skattskyldighet gäller för företagskunder.",
    en: "Kemkvitto is for businesses. A VAT number is required. No VAT is charged – reverse charge applies for business customers.",
    da: "Kemkvitto er til virksomheder. Et momsnummer er påkrævet. Der opkræves ikke moms – omvendt betalingspligt gælder for erhvervskunder.",
    no: "Kemkvitto er for bedrifter. Et MVA-nummer kreves. Ingen merverdiavgift kreves – omvendt avgiftsplikt gjelder for bedriftskunder.",
  },
  "subscribe.monthly": { sv: "Månad", en: "Monthly", da: "Måned", no: "Måned" },
  "subscribe.yearly": { sv: "År", en: "Yearly", da: "År", no: "År" },
  "subscribe.start": { sv: "Starta provperiod", en: "Start trial", da: "Start prøveperiode", no: "Start prøveperiode" },
  "subscribe.manage": { sv: "Hantera kort eller avsluta", en: "Manage card or cancel", da: "Administrer kort eller opsig", no: "Administrer kort eller avslutt" },
  "subscribe.continue": { sv: "Gå till appen", en: "Go to the app", da: "Gå til appen", no: "Gå til appen" },
  "subscribe.businessVat": {
    sv: "Kemkvitto är för företag. Ett momsregistreringsnummer krävs.",
    en: "Kemkvitto is for businesses. A VAT number is required.",
    da: "Kemkvitto er til virksomheder. Et momsnummer er påkrævet.",
    no: "Kemkvitto er for bedrifter. Et MVA-nummer kreves.",
  },
  "subscribe.mismatch": {
    sv: "Fakturaadressen eller momsnumrets land i Stripe matchade inte landet du valde. Prenumerationen startades inte. Välj samma land och försök igen.",
    en: "The Stripe billing address or VAT number country did not match the country you chose. The subscription was not started. Choose the same country and try again.",
    da: "Fakturaadressen eller momsnummerets land i Stripe matchede ikke det land, du valgte. Abonnementet blev ikke startet. Vælg samme land og prøv igen.",
    no: "Fakturaadressen eller MVA-nummerets land i Stripe samsvarte ikke med landet du valgte. Abonnementet ble ikke startet. Velg samme land og prøv igjen.",
  },
  "subscribe.vatMissing": {
    sv: "Ett momsregistreringsnummer krävs. Prenumerationen startades inte. Ange momsnummer hos Stripe och försök igen.",
    en: "A VAT number is required. The subscription was not started. Enter the VAT number in Stripe and try again.",
    da: "Et momsnummer er påkrævet. Abonnementet blev ikke startet. Angiv momsnummer hos Stripe og prøv igen.",
    no: "Et MVA-nummer kreves. Abonnementet ble ikke startet. Oppgi MVA-nummer hos Stripe og prøv igjen.",
  },
  "subscribe.notReady": {
    sv: "Prenumerationen kan inte sparas ännu. Databaskolumnerna saknas.",
    en: "The subscription cannot be stored yet. The database columns are missing.",
    da: "Abonnementet kan ikke gemmes endnu. Databasekolonnerne mangler.",
    no: "Abonnementet kan ikke lagres ennå. Databasekolonnene mangler.",
  },
  "subscribe.reverseCharge": {
    sv: "Ingen moms debiteras. Omvänd skattskyldighet gäller för företagskunder.",
    en: "No VAT is charged. Reverse charge applies for business customers.",
    da: "Der opkræves ikke moms. Omvendt betalingspligt gælder for erhvervskunder.",
    no: "Ingen merverdiavgift kreves. Omvendt avgiftsplikt gjelder for bedriftskunder.",
  },
  "subscribe.active": { sv: "Prenumerationen är igång.", en: "Your subscription is active.", da: "Abonnementet er i gang.", no: "Abonnementet er i gang." },
  "subscribe.trialing": { sv: "Provperioden är igång.", en: "Your trial is active.", da: "Prøveperioden er i gang.", no: "Prøveperioden er i gang." },

  // Customer search
  "customer.searchPlaceholder": { sv: "Sök kundnamn...", en: "Search customer name...", da: "Søg kundenavn...", no: "Søk kundenavn..." },
  "customer.phone": { sv: "Telefon", en: "Phone", da: "Telefon", no: "Telefon" },
  "customer.email": { sv: "E-post", en: "Email", da: "E-mail", no: "E-post" },
  "customer.newCustomer": { sv: "Ny kund", en: "New customer", da: "Ny kunde", no: "Ny kunde" },
  "customer.addNew": { sv: "Lägg till som ny kund", en: "Add as new customer", da: "Tilføj som ny kunde", no: "Legg til som ny kunde" },
  "customer.noResults": { sv: "Ingen kund hittad", en: "No customer found", da: "Ingen kunde fundet", no: "Ingen kunde funnet" },
  "customer.clear": { sv: "Rensa", en: "Clear", da: "Ryd", no: "Tøm" },

  // Order summary / bottom bar
  "order.empty": { sv: "Tryck på plagg till vänster", en: "Tap a garment on the left", da: "Tryk på beklædning til venstre", no: "Trykk på plagg til venstre" },
  "order.serviceTotal": { sv: "Tjänster", en: "Services", da: "Tjenester", no: "Tjenester" },
  "order.total": { sv: "Summa", en: "Total", da: "Total", no: "Total" },
  "order.items": { sv: "plagg", en: "items", da: "stk", no: "stk" },
  "order.submit": { sv: "Skicka till kund ▶", en: "Send to customer ▶", da: "Send til kunde ▶", no: "Send til kunde ▶" },
  "order.submitSave": { sv: "Spara kvitto ▶", en: "Save receipt ▶", da: "Gem kvittering ▶", no: "Lagre kvittering ▶" },
  "order.submitting": { sv: "Sparar...", en: "Saving...", da: "Gemmer...", no: "Lagrer..." },
  "order.successTitle": { sv: "Kvitto skapat!", en: "Receipt created!", da: "Kvittering oprettet!", no: "Kvittering opprettet!" },
  "order.successEmailSent": { sv: "Kvitto skickat till kund via e-post", en: "Receipt sent to customer via email", da: "Kvittering sendt til kunde via e-mail", no: "Kvittering sendt til kunde via e-post" },
  "order.successNoEmail": { sv: "Kvitto sparat (ingen e-post angiven)", en: "Receipt saved (no email provided)", da: "Kvittering gemt (ingen e-mail angivet)", no: "Kvittering lagret (ingen e-post oppgitt)" },
  "order.newReceipt": { sv: "Nytt kvitto", en: "New receipt", da: "Ny kvittering", no: "Ny kvittering" },

  // Services
  "receipt.services": { sv: "Tjänster", en: "Services", da: "Tjenester", no: "Tjenester" },
  "service.pressning": { sv: "Pressning", en: "Pressing", da: "Presning", no: "Pressing" },
  "service.starkning": { sv: "Stärkning", en: "Starch", da: "Stivning", no: "Stiving" },
  "service.vikning": { sv: "Vikning", en: "Folding", da: "Foldning", no: "Bretting" },
  "service.express": { sv: "Express", en: "Express", da: "Express", no: "Express" },

  "landing.pill": { sv: "För kemtvätt och tvätteri", en: "For dry cleaners and laundries", da: "Til renseri og vaskeri", no: "For renseri og vaskeri" },
  "landing.headingBefore": { sv: "Kvitto på papper – ", en: "A paper receipt – ", da: "Kvittering på papir – ", no: "Kvittering på papir – " },
  "landing.headingAnd": { sv: "och", en: "and", da: "og", no: "og" },
  "landing.headingAfter": {
    sv: " i mejl till kunden. Nu med unikt kvittosekvensverktyg.",
    en: " an email to the customer. Now with a unique receipt-sequence tool.",
    da: " en e-mail til kunden. Nu med et unikt kvitteringssekvensværktøj.",
    no: " en e-post til kunden. Nå med et unikt kvitteringssekvensverktøy.",
  },
  "landing.lead": {
    sv: "Kemkvitto ändrar ingenting i hur ni arbetar i dag. Det lägger till en kopia av kvittot och en påminnelse – helt automatiskt, via e-post.",
    en: "Kemkvitto changes nothing about how you work today. It adds a copy of the receipt and a reminder – automatically, by email.",
    da: "Kemkvitto ændrer ikke, hvordan I arbejder i dag. Det tilføjer en kopi af kvitteringen og en påmindelse – helt automatisk, via e-mail.",
    no: "Kemkvitto endrer ingenting i hvordan dere jobber i dag. Det legger til en kopi av kvitteringen og en påminnelse – helt automatisk, via e-post.",
  },
  "landing.check1": { sv: "Kunden får papperskvittot som vanligt – OCH en kopia i mejlen", en: "The customer gets the paper receipt as usual – AND a copy by email", da: "Kunden får papirkvitteringen som vanligt – OG en kopi i e-mailen", no: "Kunden får papirkvitteringen som vanlig – OG en kopi i e-posten" },
  "landing.check2": { sv: "Aldrig mer ett bortappat kvitto", en: "Never a lost receipt again", da: "Aldrig mere en vækkommet kvittering", no: "Aldri mer en bortkommet kvittering" },
  "landing.check3": { sv: "Påminnelse skickas automatiskt dagen då plagget är klart", en: "A reminder is sent automatically on the day the garment is ready", da: "Påmindelse sendes automatisk den dag, tøjet er klar", no: "Påminnelse sendes automatisk den dagen plagget er klart" },
  "landing.check4": { sv: "Kvittot i er egen färg, som pappersblocket", en: "The receipt in your own colour, like the paper pad", da: "Kvitteringen i jeres egen farve, som papirblokken", no: "Kvitteringen i deres egen farge, som papirblokken" },
  "landing.check5": { sv: "Kunden behöver ingen app – allt går via e-post", en: "The customer needs no app – everything goes by email", da: "Kunden behøver ingen app – alt går via e-mail", no: "Kunden trenger ingen app – alt går via e-post" },
  "landing.welcome": { sv: "Välkommen tillbaka.", en: "Welcome back.", da: "Velkommen tilbage.", no: "Velkommen tilbake." },
  "landing.emailPlaceholder": { sv: "namn@foretag.se", en: "name@company.com", da: "navn@firma.dk", no: "navn@firma.no" },
  "landing.noAccountYet": { sv: "Inget konto än?", en: "No account yet?", da: "Ingen konto endnu?", no: "Ingen konto ennå?" },
  "landing.createAccount": { sv: "Skapa konto – gratis i", en: "Create account – free for", da: "Opret konto – gratis i", no: "Opprett konto – gratis i" },
  "landing.trialDays": { sv: "dagar", en: "days", da: "dage", no: "dager" },
  "landing.priceFrom": { sv: "Från", en: "From", da: "Fra", no: "Fra" },
  "landing.perMonth": { sv: "per månad", en: "per month", da: "pr. måned", no: "per måned" },
  "landing.compareTitle": { sv: "Inget ändras. Mycket läggs till.", en: "Nothing changes. A lot is added.", da: "Intet ændres. Meget lægges til.", no: "Ingenting endres. Mye legges til." },
  "landing.cardToday": { sv: "Som i dag", en: "As today", da: "Som i dag", no: "Som i dag" },
  "landing.today1": { sv: "Papperskvittot och kvittoblocket finns kvar", en: "The paper receipt and the receipt pad stay", da: "Papirkvitteringen og kvitteringsblokken bliver", no: "Papirkvitteringen og kvitteringsblokken blir" },
  "landing.today2": { sv: "Samma rutiner i kassan eller kortbetalning", en: "The same routines at the till or for card payment", da: "Samme rutiner i kassen eller ved kortbetaling", no: "Samme rutiner i kassen eller ved kortbetaling" },
  "landing.today3": { sv: "Era egna produkter och tjänster visas. Priser står med om ni vill, eller inte.", en: "Your own products and services are shown. Prices appear if you want them to, or not.", da: "Jeres egne produkter og tjenester vises. Priser står med, hvis I vil, eller ikke.", no: "Deres egne produkter og tjenester vises. Priser står med hvis dere vil, eller ikke." },
  "landing.cardAdds": { sv: "Det Kemkvitto lägger till", en: "What Kemkvitto adds", da: "Det Kemkvitto lægger til", no: "Det Kemkvitto legger til" },
  "landing.adds1": { sv: "Kvittot som e-post, i er färg", en: "The receipt by email, in your colour", da: "Kvitteringen som e-mail, i jeres farve", no: "Kvitteringen som e-post, i deres farge" },
  "landing.adds2": { sv: "Påminnelse till kunden när plagget är klart", en: "A reminder to the customer when the garment is ready", da: "Påmindelse til kunden, når tøjet er klar", no: "Påminnelse til kunden når plagget er klart" },
  "landing.adds3": { sv: "Kunden kan inte tappa bort kvittot", en: "The customer cannot lose the receipt", da: "Kunden kan ikke tabe kvitteringen", no: "Kunden kan ikke miste kvitteringen" },
  "landing.adds4": { sv: "Möjlighet att skicka extra påminnelse vid ej hämtad tvätt", en: "Option to send an extra reminder if the laundry is not collected", da: "Mulighed for at sende ekstra påmindelse, hvis tøjet ikke er hentet", no: "Mulighet til å sende ekstra påminnelse hvis tøyet ikke er hentet" },
  "landing.cardSequence": { sv: "Unikt kvittosekvensverktyg", en: "Unique receipt-sequence tool", da: "Unikt kvitteringssekvensværktøj", no: "Unikt kvitteringssekvensverktøy" },
  "landing.seq1": { sv: "Kemkvitto ställs in att synka med ditt kvittoblock", en: "Kemkvitto is set up to sync with your receipt pad", da: "Kemkvitto indstilles til at synkronisere med din kvitteringsblok", no: "Kemkvitto stilles inn til å synkronisere med kvitteringsblokken" },
  "landing.seq2": { sv: "Lägg till udda kvittonummer vid behov", en: "Add an odd receipt number when needed", da: "Tilføj et ulige kvitteringsnummer ved behov", no: "Legg til et oddetall-kvitteringsnummer ved behov" },
  "landing.seq3": { sv: "Synka om när det behövs, annars följs sekvensen automatiskt", en: "Sync again when needed, otherwise the sequence continues automatically", da: "Synkroniser igen, når det behøves, ellers følges sekvensen automatisk", no: "Synkroniser igjen når det trengs, ellers følges sekvensen automatisk" },
  "landing.pickerTitle": { sv: "Välj din kvittofärg – Testa nu", en: "Choose your receipt colour – Try it now", da: "Vælg din kvitteringsfarve – Prøv nu", no: "Velg kvitteringsfargen – Prøv nå" },
  "landing.pickerLead": {
    sv: "När ni beställde era kvittoblock på papper valde ni en färg. Välj samma färg här, så ser ni hur Kemkvitto passar in i ert befintliga erbjudande.",
    en: "When you ordered your paper receipt pads you chose a colour. Choose the same colour here and see how Kemkvitto fits your existing setup.",
    da: "Da I bestilte jeres papirkvitteringsblokke, valgte I en farve. Vælg samme farve her, så ser I, hvordan Kemkvitto passer ind.",
    no: "Da dere bestilte papirkvitteringsblokkene, valgte dere en farge. Velg samme farge her, så ser dere hvordan Kemkvitto passer inn.",
  },
  "landing.colour": { sv: "Färg", en: "Colour", da: "Farve", no: "Farge" },
  "landing.strength": { sv: "Färgstyrka", en: "Colour strength", da: "Farvestyrke", no: "Fargestyrke" },
  "landing.pickerNote": {
    sv: "Färgen följer med på skärmen, till kvittot och i mejlen. Den går att ändra när som helst i Inställningar.",
    en: "The colour follows onto the screen, the receipt and the email. It can be changed at any time in Settings.",
    da: "Farven følger med på skærmen, på kvitteringen og i e-mailen. Den kan ændres når som helst i Indstillinger.",
    no: "Fargen følger med på skjermen, på kvitteringen og i e-posten. Den kan endres når som helst i Innstillinger.",
  },
  "landing.exampleBusiness": { sv: "Ert tvätteri", en: "Your laundry", da: "Jeres vaskeri", no: "Deres vaskeri" },
  "landing.readyTomorrow": { sv: "Borde vara klar idag", en: "Should be ready today", da: "Bør være klar i dag", no: "Bør være klar i dag" },
  "landing.howTitle": { sv: "Så här ser det ut", en: "This is what it looks like", da: "Sådan ser det ud", no: "Slik ser det ut" },
  "landing.how1Title": { sv: "Snabbt att välja", en: "Quick to choose", da: "Hurtigt at vælge", no: "Raskt å velge" },
  "landing.how1Body": { sv: "Tryck på plaggen, skriv kundens e-post, hämtningsdatum, spara, färdigt.", en: "Tap the garments, enter the customer's email and collection date, save, done.", da: "Tryk på tøjet, skriv kundens e-mail, afhentningsdato, gem, færdig.", no: "Trykk på plaggene, skriv kundens e-post, hentedato, lagre, ferdig." },
  "landing.how2Title": { sv: "Kvitto i mejlen", en: "Receipt by email", da: "Kvittering i e-mailen", no: "Kvittering i e-posten" },
  "landing.how2Body": { sv: "Kunden får en kopia direkt, i er färg.", en: "The customer gets a copy straight away, in your colour.", da: "Kunden får en kopi med det samme, i jeres farve.", no: "Kunden får en kopi med en gang, i deres farge." },
  "landing.how3Title": { sv: "Påminnelsen", en: "The reminder", da: "Påmindelsen", no: "Påminnelsen" },
  "landing.how3Body": { sv: "Går ut automatiskt dagen då plagget är klart.", en: "Goes out automatically on the day the garment is ready.", da: "Sendes automatisk den dag, tøjet er klar.", no: "Sendes automatisk den dagen plagget er klart." },
  "landing.how4Title": { sv: "Alla kvitton på ett ställe", en: "Every receipt in one place", da: "Alle kvitteringer samlet", no: "Alle kvitteringer på ett sted" },
  "landing.how4Body": { sv: "Sök fram ett kvitto och skicka det igen.", en: "Find a receipt and send it again.", da: "Find en kvittering og send den igen.", no: "Finn en kvittering og send den igjen." },
  "landing.ctaTitle": { sv: "Prova gratis i", en: "Try it free for", da: "Prøv gratis i", no: "Prøv gratis i" },
  "landing.ctaButton": { sv: "Skapa konto", en: "Create account", da: "Opret konto", no: "Opprett konto" },
  "landing.privacy": { sv: "Integritet", en: "Privacy", da: "Privatliv", no: "Personvern" },
  "landing.terms": { sv: "Villkor", en: "Terms", da: "Vilkår", no: "Vilkår" },
  "color.green": { sv: "Grön", en: "Green", da: "Grøn", no: "Grønn" },
  "color.blue": { sv: "Blå", en: "Blue", da: "Blå", no: "Blå" },
  "color.orange": { sv: "Orange", en: "Orange", da: "Orange", no: "Oransje" },
  "color.teal": { sv: "Blågrön", en: "Teal", da: "Blågrøn", no: "Blågrønn" },
  "color.brown": { sv: "Brun", en: "Brown", da: "Brun", no: "Brun" },
  "color.yellow": { sv: "Gul", en: "Yellow", da: "Gul", no: "Gul" },
  "color.purple": { sv: "Lila", en: "Purple", da: "Lilla", no: "Lilla" },
  "color.pink": { sv: "Rosa", en: "Pink", da: "Rosa", no: "Rosa" },
  "color.red": { sv: "Röd", en: "Red", da: "Rød", no: "Rød" },
  "color.grey": { sv: "Grå", en: "Grey", da: "Grå", no: "Grå" },
} as const;

// Garment name translations — Swedish keys are used in DB, display is translated
const garmentNames: Record<string, Record<Locale, string>> = {
  "Rock": { sv: "Rock", en: "Coat", da: "Frakke", no: "Frakk" },
  "Kostym": { sv: "Kostym", en: "Suit", da: "Jakkesæt", no: "Dress" },
  "Kavaj": { sv: "Kavaj", en: "Blazer", da: "Blazer", no: "Blazer" },
  "Byxor": { sv: "Byxor", en: "Trousers", da: "Bukser", no: "Bukser" },
  "Bet": { sv: "Bet", en: "Pressing", da: "Presning", no: "Pressing" },
  "Kappa": { sv: "Kappa", en: "Overcoat", da: "Overfrakke", no: "Kåpe" },
  "Dräkt": { sv: "Dräkt", en: "Outfit", da: "Dragt", no: "Drakt" },
  "Jacka": { sv: "Jacka", en: "Jacket", da: "Jakke", no: "Jakke" },
  "Kjol": { sv: "Kjol", en: "Skirt", da: "Nederdel", no: "Skjørt" },
  "Ej Bet": { sv: "Ej Bet", en: "No pressing", da: "Ingen presning", no: "Ingen pressing" },
  "Poplin": { sv: "Poplin", en: "Poplin", da: "Poplin", no: "Poplin" },
  "Matta": { sv: "Matta", en: "Rug", da: "Tæppe", no: "Teppe" },
  "Klänning": { sv: "Klänning", en: "Dress", da: "Kjole", no: "Kjole" },
  "Blus": { sv: "Blus", en: "Blouse", da: "Bluse", no: "Bluse" },
  "Skjorta": { sv: "Skjorta", en: "Shirt", da: "Skjorte", no: "Skjorte" },
  "5 Skjortor": { sv: "5 Skjortor", en: "5 shirts", da: "5 skjorter", no: "5 skjorter" },
  "10 Skjortor": { sv: "10 Skjortor", en: "10 shirts", da: "10 skjorter", no: "10 skjorter" },
  "Mocka": { sv: "Mocka", en: "Suede", da: "Ruskind", no: "Semsket" },
  "Slips": { sv: "Slips", en: "Tie", da: "Slips", no: "Slips" },
  "Jumper": { sv: "Jumper", en: "Jumper", da: "Jumper", no: "Jumper" },
  "Gardin": { sv: "Gardin", en: "Curtain", da: "Gardin", no: "Gardin" },
  "Vittvätt": { sv: "Vittvätt", en: "Whites", da: "Hvidvask", no: "Hvitvask" },

};

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  tGarment: (name: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "sv",
  setLocale: () => {},
  t: (key) => translations[key]?.sv ?? key,
  tGarment: (name) => garmentNames[name]?.sv ?? name,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("kemkvitto-lang") as Locale) || "sv";
    }
    return "sv";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("kemkvitto-lang", l);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[key]?.[locale] ?? key,
    [locale]
  );

  const tGarment = useCallback(
    (name: string) => garmentNames[name]?.[locale] ?? name,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tGarment }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
