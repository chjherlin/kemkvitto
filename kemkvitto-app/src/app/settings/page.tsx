"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import LanguageToggle from "@/components/LanguageToggle";
import AppMenu from "@/components/AppMenu";
import { useI18n } from "@/lib/i18n";
import { SHOW_PRICES_KEY, pricesEnabled } from "@/lib/prices";
import { formatReceiptNumber, parseReceiptCounter } from "@/lib/receipt-number";
import { currencyAffix } from "@/lib/laundry-defaults";
import { DEFAULT_BRAND, INK_DARK, INK_LIGHT, PALETTE, STRENGTHS, applyStrength, brandTheme, type Strength } from "@/lib/brand";
import { cloneSettings, settingsAreDirty, type SettingsSnapshot } from "@/lib/settings-dirty";
import { figtree, jost, mono } from "@/lib/fonts";
const QUIET_GREY = brandTheme(PALETTE.find((color) => color.id === "grey")!.hex).bar;

type LeaveAction = { kind: "href"; href: string } | { kind: "signout" };

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
  const money = currencyAffix(countryCode);
  return (
    <section>
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "#78716c" }}
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
              className="flex-1 bg-transparent text-base font-bold focus:outline-none"
              style={{ color: "#1c1917", minHeight: "56px" }}
            />
            {showPrices && (
              <>
                {money.position === "before" && (
                  <span className="font-receipt text-base font-bold" style={{ color: "var(--text-light)" }}>{money.symbol}</span>
                )}
                <input
                  type="number"
                  min={0}
                  placeholder="—"
                  value={item ? (priceList[item] || "") : ""}
                  onChange={(e) => onPriceChange(item, e.target.value)}
                  disabled={!item}
                  step="any"
                  className="w-24 rounded-lg border bg-white px-2 text-right text-base"
                  style={{ borderColor: "#e7e5e4", fontFamily: mono.style.fontFamily, fontWeight: 700, minHeight: "48px", color: "#1c1917" }}
                  aria-label={item}
                />
                {money.position === "after" && (
                  <span className="text-base" style={{ color: "#44403c", fontFamily: mono.style.fontFamily, fontWeight: 700 }}>{money.symbol}</span>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="flex items-center justify-center text-base"
              style={{ color: "#44403c", minWidth: "44px", minHeight: "44px", background: "none", border: "none" }}
              title="Ta bort"
            >×</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 text-base font-semibold"
        style={{ borderColor: "#d6d3d1", color: "#1c1917", minHeight: "56px", background: "#fff" }}
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<SettingsSnapshot | null>(null);
  const [pendingLeave, setPendingLeave] = useState<LeaveAction | null>(null);
  const dirtyRef = useRef(false);
  const allowLeave = useRef(false);

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
        const loadedNumber = formatReceiptNumber(data.nextReceiptNumber ?? 1);
        setResetNumber(loadedNumber);
        setCountryCode(data.countryCode ?? null);
        setBaseline(cloneSettings({
          brandColor: data.brandColor || DEFAULT_BRAND,
          businessName: data.businessName || "",
          priceList: data.priceList || {},
          garmentList: data.garmentList || [],
          serviceList: data.serviceList || [],
          receiptNumber: loadedNumber,
        }));
        setLoading(false);
      });
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((data) => setSubscriptionStatus(data.status ?? null))
      .catch(() => setSubscriptionStatus(null));
  }, [status]);

  async function persistChanges(): Promise<boolean> {
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandColor, priceList, businessName, garmentList, serviceList }),
    });
    if (!res.ok) {
      setSaving(false);
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error || "Kunde inte spara. Försök igen.");
      return false;
    }
    let nextNumber = resetNumber;
    if (baseline && resetNumber !== baseline.receiptNumber) {
      const next = parseReceiptCounter(resetNumber || "1");
      const numberRes = await fetch("/api/receipts/reset-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextReceiptNumber: next }),
      });
      if (!numberRes.ok) {
        setSaving(false);
        setSaveError("Kunde inte spara. Försök igen.");
        setBaseline(cloneSettings({
          brandColor,
          businessName,
          priceList,
          garmentList,
          serviceList,
          receiptNumber: baseline.receiptNumber,
        }));
        return false;
      }
      nextNumber = formatReceiptNumber(next);
      setResetNumber(nextNumber);
    }
    setBaseline(cloneSettings({
      brandColor,
      businessName,
      priceList,
      garmentList,
      serviceList,
      receiptNumber: nextNumber,
    }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    return true;
  }

  const snapshot: SettingsSnapshot = {
    brandColor,
    businessName,
    priceList,
    garmentList,
    serviceList,
    receiptNumber: resetNumber,
  };
  const dirty = baseline != null && settingsAreDirty(snapshot, baseline);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeave.current || !dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (allowLeave.current || !dirtyRef.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.getAttribute("target") === "_blank") return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingLeave({ kind: "href", href: `${url.pathname}${url.search}${url.hash}` });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!pendingLeave) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPendingLeave(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingLeave]);

  function follow(action: LeaveAction) {
    allowLeave.current = true;
    dirtyRef.current = false;
    if (action.kind === "signout") {
      void signOut();
      return;
    }
    router.push(action.href);
  }

  function askToLeave(action: LeaveAction) {
    if (!dirtyRef.current) {
      follow(action);
      return;
    }
    setPendingLeave(action);
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

  const previewNumber = formatReceiptNumber(parseReceiptCounter(resetNumber || "1"));
  const subscriptionLead = subscriptionStatus === "trialing"
    ? t("subscribe.trialing")
    : subscriptionStatus === "active"
      ? t("subscribe.active")
      : "";
  const subscriptionLine = subscriptionLead
    ? `${subscriptionLead.replace(/\.$/, "")} · ${t("subscribe.manage")}`
    : t("subscribe.manage");

  return (
    <div className={figtree.className} style={{ background: theme.tint, color: "#1c1917", minHeight: "100vh", fontSize: "16px" }}>
      <header style={{ background: theme.bar, color: theme.barInk }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <KemkvittoLogo color={theme.barInk} size="sm" />
            {businessName && <span className="text-base">/ {businessName}</span>}
          </div>
          <AppMenu
            color={theme.barInk}
            onLogout={() => askToLeave({ kind: "signout" })}
            wide={
              <nav className="flex flex-wrap items-center gap-3 text-base">
                <LanguageToggle color={theme.barInk} />
                <Link href="/receipts" style={{ color: theme.barInk }}>{t("nav.receipts")}</Link>
                <button type="button" onClick={() => askToLeave({ kind: "signout" })} style={{ color: theme.barInk, background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>{t("nav.logout")}</button>
              </nav>
            }
          />
        </div>
      </header>

      <main className="mx-auto flex w-full flex-col gap-4 px-4 py-8" style={{ maxWidth: "410px" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href="/" className="text-base font-medium" style={{ color: "#44403c" }}>{t("settings.backToProduct")}</Link>
            <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: jost.style.fontFamily }}>{t("settings.title")}</h1>
          </div>
          <button
            type="button"
            onClick={() => { void persistChanges(); }}
            disabled={saving}
            className="rounded-xl px-4 text-base font-bold disabled:opacity-50"
            style={{ background: theme.brand, color: theme.onBrand, minHeight: "56px" }}
          >
            {saved ? t("settings.saved") : saving ? t("settings.saving") : t("settings.save")}
          </button>
        </div>
        {saveError && <p role="alert" className="text-base" style={{ color: "#7f1d1d" }}>{saveError}</p>}

        <Card label={t("settings.company")}>
          <label className="block text-base font-medium">
            {t("settings.businessName")}
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
              style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
            />
          </label>
          <label className="mt-4 block text-base font-medium">
            {t("settings.nextNumber")}
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={resetNumber}
                onChange={(e) => setResetNumber(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => {
                  if (!resetNumber) return;
                  setResetNumber(formatReceiptNumber(parseReceiptCounter(resetNumber)));
                }}
                className="min-w-0 flex-1 rounded-xl border-2 bg-white px-4"
                style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917", fontFamily: mono.style.fontFamily, fontWeight: 700, fontSize: "21px", letterSpacing: "0.06em" }}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!resetNumber) return;
                  const next = parseReceiptCounter(resetNumber);
                  const numberRes = await fetch("/api/receipts/reset-number", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nextReceiptNumber: next }),
                  });
                  if (!numberRes.ok) return;
                  const formatted = formatReceiptNumber(next);
                  setResetNumber(formatted);
                  setBaseline((prev) => prev ? cloneSettings({ ...prev, receiptNumber: formatted }) : prev);
                  setResetDone(true);
                  setTimeout(() => setResetDone(false), 2000);
                }}
                disabled={!resetNumber}
                className="rounded-xl border-2 bg-white px-3 text-base font-semibold"
                style={{ borderColor: theme.brand, color: "#1c1917", minHeight: "56px" }}
              >
                {resetDone ? t("settings.receiptNumberReset") : t("settings.changeNumber")}
              </button>
            </div>
          </label>
          <p className="mt-3 text-base" style={{ color: "#44403c" }}>{t("settings.numberHelp")}</p>
        </Card>

        <Card label={t("settings.brandColor")}>
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
                  className="rounded-xl"
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: color.hex,
                    outline: selected ? `3px solid ${INK_DARK}` : "2px solid transparent",
                    outlineOffset: "3px",
                  }}
                />
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl" role="radiogroup" aria-label={t("settings.strength")} style={{ border: "1px solid #e7e5e4" }}>
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
                  className="text-base font-semibold"
                  style={{ minHeight: "56px", background: selected ? INK_DARK : INK_LIGHT, color: selected ? INK_LIGHT : INK_DARK, border: "none" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl" style={{ border: "1px solid #e7e5e4" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: theme.brand, color: theme.onBrand }}>
              <span className="text-base font-bold">{businessName || t("settings.businessName")}</span>
              <span style={{ fontFamily: mono.style.fontFamily, fontWeight: 700, fontSize: "22px" }}>{t("nav.receipt")} #{previewNumber}</span>
            </div>
            <div className="flex justify-between px-4 py-3 text-base">
              <span>Kavaj</span>
              <span style={{ fontFamily: mono.style.fontFamily, fontWeight: 700 }}>1</span>
            </div>
          </div>
        </Card>

        <Card label={t("settings.prices")}>
          <label htmlFor="use-prices" className="flex items-start gap-3" style={{ minHeight: "56px", cursor: "pointer" }}>
            <input
              id="use-prices"
              type="checkbox"
              role="switch"
              aria-checked={usePrices}
              checked={usePrices}
              onChange={(e) => setUsePrices(e.target.checked)}
              style={{ width: "28px", height: "28px", marginTop: "2px", accentColor: theme.brand, flexShrink: 0 }}
            />
            <span>
              <span className="block text-base font-bold">{t("settings.usePrices")}</span>
              <span className="mt-1 block text-base" style={{ color: "#44403c" }}>{t("settings.usePricesHint")}</span>
            </span>
          </label>
        </Card>

        <ItemListEditor
          title={t("settings.garments")}
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

        <Link href="/subscribe" className="block rounded-2xl bg-white p-4" style={{ border: "1px solid #e7e5e4", color: "#1c1917" }}>
          <span className="block text-base font-bold">{t("settings.subscription")}</span>
          <span className="mt-1 block text-base" style={{ color: "#44403c" }}>{subscriptionLine}</span>
        </Link>
        <div className="flex gap-4 pb-8">
          <Link href="/privacy" className="text-base underline" style={{ color: "#44403c" }}>Privacy Policy</Link>
          <Link href="/terms" className="text-base underline" style={{ color: "#44403c" }}>Terms of Service</Link>
        </div>
      </main>
      {pendingLeave && (
        <div
          role="presentation"
          onClick={() => setPendingLeave(null)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: `${INK_DARK}73`, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-2xl p-5"
            style={{ maxWidth: "410px", background: INK_LIGHT, color: INK_DARK }}
          >
            <h2 id="unsaved-title" className="text-2xl font-bold" style={{ fontFamily: jost.style.fontFamily }}>{t("settings.unsavedTitle")}</h2>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  void persistChanges().then((ok) => {
                    if (!ok || !pendingLeave) return;
                    const action = pendingLeave;
                    setPendingLeave(null);
                    follow(action);
                  });
                }}
                className="rounded-xl text-base font-bold disabled:opacity-50"
                style={{ background: theme.brand, color: theme.onBrand, minHeight: "56px" }}
              >
                {saving ? t("settings.saving") : t("settings.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingLeave;
                  setPendingLeave(null);
                  follow(action);
                }}
                className="rounded-xl bg-white text-base"
                style={{ border: `2px solid ${INK_DARK}`, color: INK_DARK, minHeight: "56px" }}
              >
                {t("settings.leaveWithoutSaving")}
              </button>
              <button
                type="button"
                onClick={() => setPendingLeave(null)}
                className="rounded-xl bg-white text-base font-semibold"
                style={{ border: `2px solid ${QUIET_GREY}`, color: INK_DARK, minHeight: "56px" }}
              >
                {t("settings.stay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4" style={{ border: "1px solid #e7e5e4" }}>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: "#78716c" }}>{label}</h2>
      {children}
    </section>
  );
}
   
