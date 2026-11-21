"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { SHOW_PRICES_KEY, pricesEnabled } from "@/lib/prices";
import { formatReceiptNumber, parseReceiptCounter } from "@/lib/receipt-number";
import { currencySymbol } from "@/lib/laundry-defaults";
import { DEFAULT_BRAND, PALETTE, STRENGTHS, applyStrength, brandTheme, type Strength } from "@/lib/brand";

function ItemListEditor({
  title,
  list,
  setList,
  isService = false,
  addLabel,
  priceList,
  showPrices,
  countryCode = null,
  onRename,
  onRemove,
  onAdd,
  onPriceChange,
}: {
  title: string;
  list: string[];
  setList: (l: string[]) => void;
  isService?: boolean;
  addLabel: string;
  priceList: Record<string, number>;
  showPrices: boolean;
  countryCode?: string | null;
  onRename: (idx: number, newName: string) => void;
  onRemove: (idx: number) => void;
  onAdd: () => void;
  onPriceChange: (item: string, value: string) => void;
}) {
  return (
    <section>
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </h2>
      <div className="space-y-2">
        {list.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2"
            style={{ borderColor: "var(--border)" }}
          >
            <input
              type="text"
              value={item}
              onChange={(e) => onRename(idx, e.target.value)}
              placeholder={isService ? "Tjänstnamn..." : "Plaggnamn..."}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
              style={{ color: "var(--text)" }}
            />
            {showPrices && (
              <>
                <input
                  type="number"
                  min={0}
                  placeholder="—"
                  value={item ? (priceList[item] || "") : ""}
                  onChange={(e) => onPriceChange(item, e.target.value)}
                  disabled={!item}
                  step="any"
                  className="w-20 rounded-lg border bg-gray-50 px-2 py-2 text-right text-sm font-medium"
                  style={{ borderColor: "var(--border)" }}
                  aria-label={item}
                />
                <span className="text-xs" style={{ color: "var(--text-light)" }}>{currencySymbol(countryCode)}</span>
              </>
            )}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-red-50 hover:text-red-500"
              style={{ color: "var(--text-light)" }}
              title="Ta bort"
            >×</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:border-current"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
        {addLabel}
      </button>
    </section>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [priceList, setPriceList] = useState<Record<string, number>>({});
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetNumber, setResetNumber] = useState("0001");
  const [resetDone, setResetDone] = useState(false);
  const [garmentList, setGarmentList] = useState<string[]>([]);
  const [serviceList, setServiceList] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setBrandColor(data.brandColor || DEFAULT_BRAND);
        setPriceList(data.priceList || {});
        setBusinessName(data.businessName || "");
        setGarmentList(data.garmentList || []);
        setServiceList(data.serviceList || []);
        setResetNumber(formatReceiptNumber(data.nextReceiptNumber ?? 1));
        setCountryCode(data.countryCode ?? null);
        setLoading(false);
      });
  }, [status]);

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandColor, priceList, businessName, garmentList, serviceList }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error || "Kunde inte spara. Försök igen.");
    }
  }

  const usePrices = pricesEnabled(priceList);

  function setUsePrices(on: boolean) {
    setPriceList((prev) => {
      const next = { ...prev };
      if (on) delete next[SHOW_PRICES_KEY];
      else next[SHOW_PRICES_KEY] = 0;
      return next;
    });
  }

  function setPrice(garment: string, value: string) {
    const num = parseFloat(value);
    const next = { ...priceList };
    if (!num || num <= 0) {
      delete next[garment];
    } else {
      next[garment] = num;
    }
    setPriceList(next);
  }

  function renameItem(
    list: string[],
    setList: (l: string[]) => void,
    idx: number,
    newName: string
  ) {
    const oldName = list[idx];
    const next = [...list];
    next[idx] = newName;
    setList(next);
    if (oldName && oldName !== newName && priceList[oldName] !== undefined) {
      const nextPrices = { ...priceList, [newName]: priceList[oldName] };
      delete nextPrices[oldName];
      setPriceList(nextPrices);
    }
  }

  function removeItem(list: string[], setList: (l: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  function addItem(list: string[], setList: (l: string[]) => void) {
    setList([...list, ""]);
  }

  const theme = brandTheme(brandColor);
  const selectedBase = theme.base.toLowerCase();
  const selectedStrength: Strength = theme.strength ?? "standard";

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${brandColor} transparent ${brandColor} ${brandColor}` }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: theme.tint, minHeight: '100vh' }}>
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          backgroundColor: theme.bar,
          borderColor: "transparent",
          color: theme.barInk,
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-sm font-medium"
            style={{ color: theme.barInk }}
          >
            {t("nav.back")}
          </Link>
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {t("settings.title")}
          </h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {saveError && (
              <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>{saveError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: theme.brand, color: theme.onBrand }}
            >
              {saved ? t("settings.saved") : saving ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <section>
          <Link
            href="/subscribe"
            className="touch-target flex w-full items-center rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium"
            style={{ borderColor: "var(--border)", color: "#1c1917", minHeight: "48px" }}
          >
            {t("settings.subscription")}
          </Link>
        </section>

        {/* Business name */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {t("settings.businessName")}
          </h2>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="touch-target w-full rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium"
            style={{ borderColor: "var(--border)" }}
          />
        </section>

        {/* Receipt number */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {t("settings.receiptNumber")}
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              value={resetNumber}
              onChange={(e) => setResetNumber(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => {
                if (!resetNumber) return;
                setResetNumber(formatReceiptNumber(parseReceiptCounter(resetNumber)));
              }}
              placeholder={t("settings.receiptNumberPlaceholder")}
              className="touch-target flex-1 rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium font-receipt"
              style={{ borderColor: "var(--border)", color: "#1c1917" }}
            />
            <button
              type="button"
              onClick={async () => {
                if (!resetNumber) return;
                const next = parseReceiptCounter(resetNumber);
                await fetch("/api/receipts/reset-number", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nextReceiptNumber: next }),
                });
                setResetNumber(formatReceiptNumber(next));
                setResetDone(true);
                setTimeout(() => setResetDone(false), 2000);
              }}
              disabled={!resetNumber}
              className="rounded-xl px-6 py-4 text-sm font-semibold"
              style={{ backgroundColor: resetNumber ? theme.brand : "var(--border)", color: resetNumber ? theme.onBrand : "var(--text-light)", minHeight: "48px" }}
            >
              {resetDone ? t("settings.receiptNumberReset") : t("settings.receiptNumberSet")}
            </button>
          </div>
        </section>

        {/* Brand color */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {t("settings.brandColor")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {PALETTE.map((color) => {
              const selected = selectedBase === color.hex.toLowerCase();
              return (
                <button
                  key={color.id}
                  type="button"
                  aria-label={color.name}
                  aria-pressed={selected}
                  onClick={() => setBrandColor(applyStrength(color.hex, selectedStrength))}
                  className="h-12 w-12 rounded-xl"
                  style={{
                    backgroundColor: color.hex,
                    outline: selected ? `3px solid ${color.hex}` : "2px solid transparent",
                    outlineOffset: selected ? "3px" : "0",
                  }}
                />
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={t("settings.strength")}>
            {STRENGTHS.map((level) => {
              const selected = theme.strength === level;
              const label = level === "damped" ? t("settings.strengthDamped") : level === "strong" ? t("settings.strengthStrong") : t("settings.strengthStandard");
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setBrandColor(applyStrength(theme.base, level))}
                  className="rounded-xl border-2 px-4 text-base font-semibold"
                  style={{
                    minHeight: "48px",
                    borderColor: selected ? theme.brand : "var(--border)",
                    backgroundColor: selected ? theme.tint : "#fff",
                    color: "#1c1917",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <label
            htmlFor="use-prices"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              minHeight: "48px",
              cursor: "pointer",
              color: "#1c1917",
            }}
          >
            <input
              id="use-prices"
              type="checkbox"
              role="switch"
              aria-checked={usePrices}
              checked={usePrices}
              onChange={(e) => setUsePrices(e.target.checked)}
              style={{ width: "44px", height: "44px", accentColor: "#14532d", flexShrink: 0 }}
            />
            <span>
              <span style={{ display: "block", fontWeight: 700 }}>{t("settings.usePrices")}</span>
              <span style={{ display: "block", fontSize: "0.875rem", color: "#44403c" }}>
                {t("settings.usePricesHint")}
              </span>
            </span>
          </label>
        </section>

        <ItemListEditor
          title={t("settings.priceList")}
          list={garmentList}
          setList={setGarmentList}
          addLabel={t("settings.addGarment")}
          priceList={priceList}
          showPrices={usePrices}
          countryCode={countryCode}
          onRename={(idx, name) => renameItem(garmentList, setGarmentList, idx, name)}
          onRemove={(idx) => removeItem(garmentList, setGarmentList, idx)}
          onAdd={() => addItem(garmentList, setGarmentList)}
          onPriceChange={setPrice}
        />
        <ItemListEditor
          title={t("settings.servicePrices")}
          list={serviceList}
          setList={setServiceList}
          isService
          addLabel={t("settings.addService")}
          priceList={priceList}
          showPrices={usePrices}
          countryCode={countryCode}
          onRename={(idx, name) => renameItem(serviceList, setServiceList, idx, name)}
          onRemove={(idx) => removeItem(serviceList, setServiceList, idx)}
          onAdd={() => addItem(serviceList, setServiceList)}
          onPriceChange={setPrice}
        />

      {/* Legal */}
      <section className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Legal
        </h2>
        <div className="flex gap-4">
          <Link href="/privacy" className="text-sm font-medium underline" style={{ color: "var(--text-muted)" }}>
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm font-medium underline" style={{ color: "var(--text-muted)" }}>
            Terms of Service
          </Link>
        </div>
      </section>

    </main>
  </div>
  );
}
   
