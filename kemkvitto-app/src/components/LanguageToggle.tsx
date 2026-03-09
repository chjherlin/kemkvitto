"use client";

import { useI18n, type Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["sv", "en", "da", "no"];
const LABELS: Record<Locale, string> = { sv: "SV", en: "EN", da: "DA", no: "NO" };

export default function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  function nextLocale() {
    const idx = LOCALES.indexOf(locale);
    setLocale(LOCALES[(idx + 1) % LOCALES.length]);
  }

  return (
    <button
      onClick={nextLocale}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-100"
      style={{ color: "var(--text-muted)" }}
      title={`Language: ${LABELS[locale]}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {LABELS[locale]}
    </button>
  );
}
