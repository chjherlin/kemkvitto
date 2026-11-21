"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { PALETTE, STRENGTHS, applyStrength, brandTheme, type Strength } from "@/lib/brand";
import { defaultLandingBrand, readBrandChoice, writeBrandChoice } from "@/lib/brand-choice";
import { CHOSEN_COUNTRY_KEY, formatEur, monthlyPriceEur, pricingConfig } from "@/lib/pricing";

const PREVIEW_TILES = [
  { name: "Kavaj", selected: false },
  { name: "Byxor", selected: false },
  { name: "Kjol", selected: true },
  { name: "Jacka", selected: false },
  { name: "Matta", selected: false },
  { name: "Skjorta", selected: false },
];

export default function LandingPage({ detectedCountry }: { detectedCountry: string | null }) {
  const router = useRouter();
  const { t, tGarment } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [brandHex, setBrandHex] = useState(defaultLandingBrand);
  const [chosenCountry, setChosenCountry] = useState<string | null>(null);
  const theme = brandTheme(brandHex);
  const strength: Strength = theme.strength ?? "strong";

  useEffect(() => {
    setBrandHex(readBrandChoice());
    try {
      setChosenCountry(localStorage.getItem(CHOSEN_COUNTRY_KEY));
    } catch {
      setChosenCountry(null);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") !== "1") return;
    setJustRegistered(true);
    try {
      const stored = sessionStorage.getItem("kemkvitto-pending-login-email");
      sessionStorage.removeItem("kemkvitto-pending-login-email");
      if (stored && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stored)) setEmail(stored);
    } catch {
      // The confirmation still shows without a prefilled address.
    }
  }, []);

  function choose(base: string, nextStrength: Strength) {
    const next = applyStrength(base, nextStrength);
    setBrandHex(next);
    writeBrandChoice(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError(t("auth.loginError"));
      setLoading(false);
      return;
    }
    router.push("/");
  }

  const colourKey = {
    green: "color.green",
    blue: "color.blue",
    orange: "color.orange",
    teal: "color.teal",
    brown: "color.brown",
    yellow: "color.yellow",
    purple: "color.purple",
    pink: "color.pink",
    red: "color.red",
    grey: "color.grey",
  } as const;
  const baseId = (PALETTE.find((c) => c.hex.toLowerCase() === theme.base.toLowerCase())?.id ?? "blue") as keyof typeof colourKey;
  const colourName = t(colourKey[baseId]);
  const checks = ["landing.check1", "landing.check2", "landing.check3", "landing.check4", "landing.check5"] as const;

  return (
    <div style={{ background: theme.tint, color: "#1c1917", minHeight: "100vh" }}>
      <header style={{ background: theme.bar, color: theme.barInk }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <KemkvittoLogo color={theme.barInk} size="sm" />
          <div className="flex items-center gap-3">
            <LanguageToggle color={theme.barInk} />
            <a href="#login" className="text-base font-semibold" style={{ color: theme.barInk, minHeight: "56px", display: "inline-flex", alignItems: "center" }}>
              {t("auth.login")}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full px-3 py-1 text-base font-semibold" style={{ background: "#fff", color: theme.brand }}>
              {t("landing.pill")}
            </p>
            <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-jost), sans-serif" }}>
              {t("landing.headingBefore")}
              <span style={{ textDecoration: "underline", textDecorationColor: theme.brand, textUnderlineOffset: "0.15em" }}>{t("landing.headingAnd")}</span>
              {t("landing.headingAfter")}
            </h1>
            <p className="mt-4 text-lg" style={{ color: "#44403c" }}>{t("landing.lead")}</p>
            <ul className="mt-6 space-y-3">
              {checks.map((key) => (
                <li key={key} className="flex items-start gap-3 text-base">
                  <span aria-hidden="true" className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded" style={{ background: theme.brand, color: theme.onBrand }}>✓</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <form id="login" onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #e7e5e4" }}>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{t("auth.login")}</h2>
            <p className="mt-1 text-base" style={{ color: "#44403c" }}>{t("landing.welcome")}</p>
            {justRegistered && !error && (
              <p role="status" className="mt-4 rounded-xl p-4 text-base" style={{ background: "#f0fdf4", color: "#14532d" }}>{t("auth.accountCreated")}</p>
            )}
            {error && <p role="alert" className="mt-4 rounded-xl p-4 text-base" style={{ background: "#fef2f2", color: "#7f1d1d" }}>{error}</p>}
            <label className="mt-4 block text-base font-medium">
              {t("auth.email")}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("landing.emailPlaceholder")}
                className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
                style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
              />
            </label>
            <label className="mt-3 block text-base font-medium">
              {t("auth.password")}
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
                style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl text-base font-bold disabled:opacity-50"
              style={{ background: theme.brand, color: theme.onBrand, minHeight: "60px" }}
            >
              {loading ? t("auth.loggingIn") : t("auth.login")}
            </button>
            <div className="my-4 h-px" style={{ background: "#e7e5e4" }} />
            <p className="text-center text-base">{t("landing.noAccountYet")}</p>
            <Link
              href="/register"
              className="mt-3 flex w-full items-center justify-center rounded-xl border-2 text-base font-bold"
              style={{ borderColor: theme.brand, color: "#1c1917", minHeight: "60px" }}
            >
              {t("landing.createAccount")} {pricingConfig.trialDays} {t("landing.trialDays")}
            </Link>
          </form>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-3xl font-bold" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{t("landing.compareTitle")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card title={t("landing.cardToday")} lines={[t("landing.today1"), t("landing.today2"), t("landing.today3")]} />
            <Card title={t("landing.cardAdds")} lines={[t("landing.adds1"), t("landing.adds2"), t("landing.adds3"), t("landing.adds4")]} border={theme.brand} />
            <Card title={t("landing.cardSequence")} lines={[t("landing.seq1"), t("landing.seq2"), t("landing.seq3")]} />
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-white p-6 md:p-8" style={{ border: "1px solid #e7e5e4" }}>
          <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{t("landing.pickerTitle")}</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-base" style={{ color: "#44403c" }}>{t("landing.pickerLead")}</p>
              <p className="mt-6 text-sm font-bold tracking-wide" style={{ color: "#44403c" }}>{t("landing.colour")}: {colourName}</p>
              <div className="mt-3 grid grid-cols-5 gap-3">
                {PALETTE.map((color) => {
                  const selected = theme.base.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.id}
                      type="button"
                      aria-label={t(colourKey[color.id as keyof typeof colourKey])}
                      aria-pressed={selected}
                      onClick={() => choose(color.hex, strength)}
                      className="rounded-xl"
                      style={{
                        background: color.hex,
                        minHeight: "56px",
                        outline: selected ? "3px solid #1c1917" : "2px solid transparent",
                        outlineOffset: "3px",
                      }}
                    />
                  );
                })}
              </div>
              <p className="mt-6 text-sm font-bold tracking-wide" style={{ color: "#44403c" }}>{t("landing.strength")}</p>
              <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl" style={{ border: "1px solid #e7e5e4" }} role="radiogroup">
                {STRENGTHS.map((level) => {
                  const selected = strength === level;
                  const label = level === "damped" ? t("settings.strengthDamped") : level === "strong" ? t("settings.strengthStrong") : t("settings.strengthStandard");
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => choose(theme.base, level)}
                      className="text-base font-semibold"
                      style={{ minHeight: "56px", background: selected ? "#1c1917" : "#fff", color: selected ? "#fff" : "#1c1917" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-base" style={{ color: "#44403c" }}>{t("landing.pickerNote")}</p>
            </div>
            <Preview theme={theme} business={t("landing.exampleBusiness")} ready={t("landing.readyTomorrow")} tGarment={tGarment} />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-3xl font-bold" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{t("landing.howTitle")}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <HowCard title={t("landing.how1Title")} body={t("landing.how1Body")} />
            <HowCard title={t("landing.how2Title")} body={t("landing.how2Body")} />
            <HowCard title={t("landing.how3Title")} body={t("landing.how3Body")} note={t("landing.readyTomorrow")} brand={theme.brand} onBrand={theme.onBrand} />
            <HowCard title={t("landing.how4Title")} body={t("landing.how4Body")} numbers={["#1042", "#1041", "#1040"]} />
          </div>
        </section>
      </main>

      <section className="mt-10 px-4 py-12 text-center" style={{ background: theme.brand, color: theme.onBrand }}>
        <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{t("landing.ctaTitle")} {pricingConfig.trialDays} {t("landing.trialDays")}</h2>
        <VisitorPrice chosenCountry={chosenCountry} detectedCountry={detectedCountry} perMonth={t("landing.perMonth")} />
        <Link
          href="/register"
          className="mt-6 inline-flex items-center justify-center rounded-xl px-8 text-base font-bold"
          style={{ background: "#1c1917", color: "#fff", minHeight: "60px" }}
        >
          {t("landing.ctaButton")}
        </Link>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-base" style={{ color: "#44403c" }}>
        <span>© Kemkvitto</span>
        <span className="flex gap-4">
          <Link href="/privacy">{t("landing.privacy")}</Link>
          <Link href="/terms">{t("landing.terms")}</Link>
        </span>
      </footer>
    </div>
  );
}

function VisitorPrice({
  chosenCountry,
  detectedCountry,
  perMonth,
}: {
  chosenCountry: string | null;
  detectedCountry: string | null;
  perMonth: string;
}) {
  const hasChoice = Boolean(chosenCountry);
  const code = hasChoice ? chosenCountry : detectedCountry;
  const monthly = code ? monthlyPriceEur(code) : null;
  if (monthly == null) return null;
  return <p className="mt-3 text-lg font-receipt">{formatEur(monthly)} {perMonth}</p>;
}

function Card({ title, lines, border }: { title: string; lines: string[]; border?: string }) {
  return (
    <article className="rounded-2xl bg-white p-5" style={{ border: border ? `3px solid ${border}` : "1px solid #e7e5e4" }}>
      <h3 className="text-sm font-bold tracking-wide" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{title}</h3>
      <ul className="mt-3 space-y-2 text-base">
        {lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </article>
  );
}

function Preview({
  theme,
  business,
  ready,
  tGarment,
}: {
  theme: ReturnType<typeof brandTheme>;
  business: string;
  ready: string;
  tGarment: (name: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid #e7e5e4" }}>
        <div className="flex items-center gap-2 px-3 py-3" style={{ background: theme.bar, color: theme.barInk }}>
          <KemkvittoLogo color={theme.barInk} size="sm" />
          <span className="text-base">/ {business}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {PREVIEW_TILES.map((tile) => (
            <div
              key={tile.name}
              className="rounded-xl p-2 text-center"
              style={{ border: tile.selected ? `2px solid ${theme.brand}` : "1px solid #e7e5e4", background: tile.selected ? theme.tint : "#fff" }}
            >
              <div className="text-base">{tGarment(tile.name)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid #e7e5e4" }}>
        <div className="px-4 py-3" style={{ background: theme.brand, color: theme.onBrand }}>
          <div className="text-base font-bold">{business}</div>
          <div className="font-receipt text-base">Kvitto #1042</div>
        </div>
        <div className="space-y-2 px-4 py-3 text-base">
          <div className="flex justify-between"><span>{tGarment("Kavaj")}</span><span className="font-receipt">1</span></div>
          <div className="flex justify-between"><span>{tGarment("Byxor")}</span><span className="font-receipt">2</span></div>
          <p className="rounded-xl px-3 py-2 text-base font-semibold" style={{ background: theme.tint }}>{ready}</p>
        </div>
      </div>
    </div>
  );
}

function HowCard({ title, body, note, brand, onBrand, numbers }: { title: string; body: string; note?: string; brand?: string; onBrand?: string; numbers?: string[] }) {
  return (
    <article className="rounded-2xl bg-white p-4" style={{ border: "1px solid #e7e5e4" }}>
      <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{title}</h3>
      {note && <p className="mt-3 rounded-xl px-3 py-2 text-base font-semibold" style={{ background: brand, color: onBrand }}>{note}</p>}
      {numbers && (
        <ul className="mt-3 space-y-1 font-receipt text-base">
          {numbers.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
      <p className="mt-3 text-base" style={{ color: "#44403c" }}>{body}</p>
    </article>
  );
}
