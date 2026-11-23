"use client";

import { useI18n, type Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["sv", "en", "da", "no"];
const LABELS: Record<Locale, string> = { sv: "SV", en: "EN", da: "DA", no: "NO" };

export default function LanguageToggle({ color, large }: { color?: string; large?: boolean }) {
  const { locale, setLocale } = useI18n();

  function nextLocale() {
    const idx = LOCALES.indexOf(locale);
    setLocale(LOCALES[(idx + 1) % LOCALES.length]);
  }

  const icon = large ? 22 : 16;

  return (
    <button
      onClick={nextLocale}
      className={large
        ? "flex items-center justify-center gap-2 rounded-xl font-semibold"
        : "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-base font-semibold"}
      style={{
        color: color ?? "currentColor",
        minHeight: large ? 56 : undefined,
        minWidth: large ? 56 : undefined,
        fontSize: large ? 20 : 16,
      }}
      title={`Language: ${LABELS[locale]}`}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {LABELS[locale]}
    </button>
  );
}
