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

  // Receipt creation
  "receipt.paymentStatus": { sv: "Betalning", en: "Payment", da: "Betaling", no: "Betaling" },
  "receipt.garments": { sv: "Plagg", en: "Garments", da: "Beklædning", no: "Plagg" },
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

  // Treatment modes
  "treatment.bet": { sv: "Bet", en: "Paid", da: "Betalt", no: "Betalt" },
  "treatment.ejBet": { sv: "Ej Bet", en: "Not paid", da: "Ikke betalt", no: "Ikke betalt" },

  // Receipts list
  "receipts.title": { sv: "Kvitton", en: "Receipts", da: "Kvitteringer", no: "Kvitteringer" },
  "receipts.empty": { sv: "Inga kvitton ännu", en: "No receipts yet", da: "Ingen kvitteringer endnu", no: "Ingen kvitteringer enna" },
  "receipts.today": { sv: "Idag", en: "Today", da: "I dag", no: "I dag" },
  "receipts.sortDate": { sv: "Datum", en: "Date", da: "Dato", no: "Dato" },
  "receipts.sortNumber": { sv: "Nummer", en: "Number", da: "Nummer", no: "Nummer" },
  "receipts.paid": { sv: "Betald", en: "Paid", da: "Betalt", no: "Betalt" },
  "receipts.unpaid": { sv: "Obetald", en: "Unpaid", da: "Ubetalt", no: "Ubetalt" },
  "receipts.failed": { sv: "Misslyckad", en: "Failed", da: "Mislykket", no: "Mislykket" },
  "receipts.search": { sv: "Sök kvitto...", en: "Search receipt...", da: "Søg kvittering...", no: "Søk kvittering..." },
  "receipts.noResults": { sv: "Inga kvitton matchar sökningen", en: "No receipts match the search", da: "Ingen kvitteringer matcher søgningen", no: "Ingen kvitteringer matcher søket" },

  // Settings
  "settings.title": { sv: "Inställningar", en: "Settings", da: "Indstillinger", no: "Innstillinger" },
  "settings.businessName": { sv: "Företagsnamn", en: "Business name", da: "Virksomhedsnavn", no: "Bedriftsnavn" },
  "settings.brandColor": { sv: "Kvittofärg", en: "Receipt color", da: "Kvitteringsfarve", no: "Kvitteringsfarge" },
  "settings.priceList": { sv: "Prislista (kr)", en: "Price list (kr)", da: "Prisliste (kr)", no: "Prisliste (kr)" },
  "settings.servicePrices": { sv: "Tjänstpriser (kr)", en: "Service prices (kr)", da: "Servicepriser (kr)", no: "Tjenestepriser (kr)" },
  "settings.save": { sv: "Spara", en: "Save", da: "Gem", no: "Lagre" },
  "settings.saving": { sv: "Sparar...", en: "Saving...", da: "Gemmer...", no: "Lagrer..." },
  "settings.saved": { sv: "Sparat!", en: "Saved!", da: "Gemt!", no: "Lagret!" },
  "settings.receiptNumber": { sv: "Kvittonummer", en: "Receipt number", da: "Kvitteringsnummer", no: "Kvitteringsnummer" },
  "settings.receiptNumberPlaceholder": { sv: "Nästa nummer...", en: "Next number...", da: "Næste nummer...", no: "Neste nummer..." },
  "settings.receiptNumberSet": { sv: "Sätt nummer", en: "Set number", da: "Sæt nummer", no: "Sett nummer" },
  "settings.receiptNumberReset": { sv: "Uppdaterat!", en: "Updated!", da: "Opdateret!", no: "Oppdatert!" },

  // Customer email page
  "email.title": { sv: "Ange din e-post", en: "Enter your email", da: "Indtast din e-mail", no: "Skriv inn din e-post" },
  "email.subtitle": { sv: "Så skickar vi kvittot till dig", en: "We'll send the receipt to you", da: "Så sender vi kvitteringen til dig", no: "Så sender vi kvitteringen til deg" },
  "email.placeholder": { sv: "din@epost.se", en: "your@email.com", da: "din@email.dk", no: "din@epost.no" },
  "email.submit": { sv: "Klar", en: "Done", da: "Færdig", no: "Ferdig" },
  "email.submitting": { sv: "Skickar...", en: "Sending...", da: "Sender...", no: "Sender..." },
  "email.thanks": { sv: "Tack!", en: "Thank you!", da: "Tak!", no: "Takk!" },
  "email.sent": { sv: "Kvittot skickas till din e-post", en: "The receipt will be sent to your email", da: "Kvitteringen sendes til din e-mail", no: "Kvitteringen sendes til din e-post" },

  // Payment
  "payment.title": { sv: "Betalning", en: "Payment", da: "Betaling", no: "Betaling" },
  "payment.subtitle": { sv: "Betala ditt kvitto", en: "Pay your receipt", da: "Betal din kvittering", no: "Betal din kvittering" },
  "payment.receipt": { sv: "Kvitto", en: "Receipt", da: "Kvittering", no: "Kvittering" },
  "payment.total": { sv: "Totalt", en: "Total", da: "Total", no: "Totalt" },
  "payment.pay": { sv: "Betala", en: "Pay", da: "Betal", no: "Betal" },
  "payment.paying": { sv: "Bearbetar...", en: "Processing...", da: "Behandler...", no: "Behandler..." },
  "payment.success": { sv: "Betalningen lyckades!", en: "Payment successful!", da: "Betalingen lykkedes!", no: "Betalingen var vellykket!" },
  "payment.successSub": { sv: "Tack för din betalning", en: "Thank you for your payment", da: "Tak for din betaling", no: "Takk for din betaling" },
  "payment.failed": { sv: "Betalningen misslyckades", en: "Payment failed", da: "Betalingen mislykkedes", no: "Betalingen mislyktes" },
  "payment.failedSub": { sv: "Försök igen eller kontakta butiken", en: "Please try again or contact the store", da: "Prøv igen eller kontakt butikken", no: "Prøv igjen eller kontakt butikken" },
  "payment.tryAgain": { sv: "Försök igen", en: "Try again", da: "Prøv igen", no: "Prøv igjen" },
  "payment.alreadyPaid": { sv: "Detta kvitto är redan betalt", en: "This receipt has already been paid", da: "Denne kvittering er allerede betalt", no: "Denne kvitteringen er allerede betalt" },
  "payment.expired": { sv: "Betalningslänken har gått ut", en: "This payment link has expired", da: "Betalingslinket er udløbet", no: "Betalingslenken har utløpt" },

  // Login / Register
  "auth.login": { sv: "Logga in", en: "Log in", da: "Log ind", no: "Logg inn" },
  "auth.register": { sv: "Registrera", en: "Register", da: "Registrer", no: "Registrer" },
  "auth.email": { sv: "E-post", en: "Email", da: "E-mail", no: "E-post" },
  "auth.password": { sv: "Lösenord", en: "Password", da: "Adgangskode", no: "Passord" },
  "auth.businessName": { sv: "Företagsnamn", en: "Business name", da: "Virksomhedsnavn", no: "Bedriftsnavn" },
  "auth.noAccount": { sv: "Inget konto?", en: "No account?", da: "Ingen konto?", no: "Ingen konto?" },
  "auth.hasAccount": { sv: "Har redan konto?", en: "Already have an account?", da: "Har allerede en konto?", no: "Har allerede en konto?" },
  "auth.loginSubtitle": { sv: "Logga in på ditt konto", en: "Log in to your account", da: "Log ind på din konto", no: "Logg inn på kontoen din" },
  "auth.registerSubtitle": { sv: "Skapa ditt konto", en: "Create your account", da: "Opret din konto", no: "Opprett kontoen din" },
  "auth.loggingIn": { sv: "Loggar in...", en: "Logging in...", da: "Logger ind...", no: "Logger inn..." },
  "auth.registering": { sv: "Registrerar...", en: "Registering...", da: "Registrerer...", no: "Registrerer..." },
  "auth.loginError": { sv: "Fel e-post eller lösenord", en: "Wrong email or password", da: "Forkert e-mail eller adgangskode", no: "Feil e-post eller passord" },
  "auth.registerError": { sv: "Registrering misslyckades", en: "Registration failed", da: "Registrering mislykkedes", no: "Registrering mislyktes" },
  "auth.passwordPlaceholder": { sv: "Lösenord", en: "Password", da: "Adgangskode", no: "Passord" },
  "auth.passwordMinLength": { sv: "Lösenord (minst 6 tecken)", en: "Password (min 6 characters)", da: "Adgangskode (mindst 6 tegn)", no: "Passord (minst 6 tegn)" },

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
  "order.vat": { sv: "varav moms (25%)", en: "incl. VAT (25%)", da: "heraf moms (25%)", no: "herav mva (25%)" },
  "order.items": { sv: "plagg", en: "items", da: "stk", no: "stk" },
  "order.submit": { sv: "Skicka till kund ▶", en: "Send to customer ▶", da: "Send til kunde ▶", no: "Send til kunde ▶" },
  "order.submitSave": { sv: "Spara kvitto ▶", en: "Save receipt ▶", da: "Gem kvittering ▶", no: "Lagre kvittering ▶" },
  "order.submitting": { sv: "Sparar...", en: "Saving...", da: "Gemmer...", no: "Lagrer..." },
  "order.successTitle": { sv: "Kvitto skapat!", en: "Receipt created!", da: "Kvittering oprettet!", no: "Kvittering opprettet!" },
  "order.successEmailSent": { sv: "Kvitto skickat till kund via e-post", en: "Receipt sent to customer via email", da: "Kvittering sendt til kunde via e-mail", no: "Kvittering sendt til kunde via e-post" },
  "order.successNoEmail": { sv: "Kvitto sparat (ingen e-post angiven)", en: "Receipt saved (no email provided)", da: "Kvittering gemt (ingen e-mail angivet)", no: "Kvittering lagret (ingen e-post oppgitt)" },
  "order.newReceipt": { sv: "Nytt kvitto", en: "New receipt", da: "Ny kvittering", no: "Ny kvittering" },

  // Treatment
  "treatment.betLabel": { sv: "Bet", en: "Paid", da: "Betalt", no: "Betalt" },
  "treatment.ejBetLabel": { sv: "Ej Bet", en: "Not paid", da: "Ikke betalt", no: "Ikke betalt" },
  "treatment.betSub": { sv: "Betald vid inlämning", en: "Paid at drop-off", da: "Betalt ved indlevering", no: "Betalt ved innlevering" },
  "treatment.ejBetSub": { sv: "Betalar vid hämtning", en: "Pays at pickup", da: "Betaler ved afhentning", no: "Betaler ved henting" },

  // Payment status
  "payment.betald": { sv: "Betald", en: "Paid", da: "Betalt", no: "Betalt" },
  "payment.ejBetald": { sv: "Ej Betald", en: "Not Paid", da: "Ikke betalt", no: "Ikke betalt" },
  "payment.betaldSub": { sv: "Betalat vid inlämning", en: "Paid at drop-off", da: "Betalt ved indlevering", no: "Betalt ved innlevering" },
  "payment.ejBetaldSub": { sv: "Betalar vid hämtning", en: "Pays at pickup", da: "Betaler ved afhentning", no: "Betaler ved henting" },

  // Services
  "receipt.services": { sv: "Tjänster", en: "Services", da: "Tjenester", no: "Tjenester" },
  "service.pressning": { sv: "Pressning", en: "Pressing", da: "Presning", no: "Pressing" },
  "service.starkning": { sv: "Stärkning", en: "Starch", da: "Stivning", no: "Stiving" },
  "service.vikning": { sv: "Vikning", en: "Folding", da: "Foldning", no: "Bretting" },
  "service.express": { sv: "Express", en: "Express", da: "Express", no: "Express" },
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
