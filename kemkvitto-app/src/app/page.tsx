"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GarmentGrid, { type GarmentEntry } from "@/components/GarmentGrid";
import OrderSummary, { type OrderItem, type ServiceLine } from "@/components/OrderSummary";
import DateStepper, { getDefaultDeliveryDate } from "@/components/DateStepper";
import CustomerSearch from "@/components/CustomerSearch";
import BottomBar from "@/components/BottomBar";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import AppMenu from "@/components/AppMenu";
import WideNav from "@/components/WideNav";
import { useI18n } from "@/lib/i18n";
import { pricesEnabled } from "@/lib/prices";
import { formatReceiptNumber, parseReceiptCounter } from "@/lib/receipt-number";
import { DEFAULT_BRAND, brandTheme } from "@/lib/brand";
import { formatLaundryMoney, garmentUnitPrice } from "@/lib/laundry-defaults";
import { jost } from "@/lib/fonts";
import { isValidCustomerEmail, showCreatedReceipt } from "@/lib/email-address";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NewReceiptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [receiptNumber, setReceiptNumber] = useState(1);
  const [numberDraft, setNumberDraft] = useState("0001");
  const [specialMode, setSpecialMode] = useState(false);
  const [specialNumber, setSpecialNumber] = useState<string>("");

  const [garments, setGarments] = useState<Record<string, GarmentEntry>>({});
  const [services, setServices] = useState<string[]>([]);
  const [dropOffDate, setDropOffDate] = useState(todayISO());
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate());
  const [comment, setComment] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ receiptNum: string | number; emailSent: boolean; emailAttempted: boolean; email: string } | null>(null);
  const resetRef = useRef<() => void>(() => {});
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [priceList, setPriceList] = useState<Record<string, number>>({});
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [garmentList, setGarmentList] = useState<string[]>([]);
  const [serviceList, setServiceList] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [showReceiptHelp, setShowReceiptHelp] = useState(false);
  const [resetSaved, setResetSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/receipts/next-number")
        .then((r) => r.json())
        .then((data) => {
          const next = data.nextReceiptNumber ?? 1;
          setReceiptNumber(next);
          setNumberDraft(formatReceiptNumber(next));
          setBrandColor(data.brandColor || DEFAULT_BRAND);
          if (data.priceList) setPriceList(data.priceList);
          if (data.garmentList) setGarmentList(data.garmentList);
          if (data.serviceList) setServiceList(data.serviceList);
          if (data.businessName) setBusinessName(data.businessName);
          setCountryCode(data.countryCode ?? null);
          setSettingsLoaded(true);
        });
    }
  }, [status]);

  useEffect(() => {
    if (!successInfo) return;
    if (successInfo.emailAttempted && !successInfo.emailSent) return;
    const timer = window.setTimeout(() => resetRef.current(), 2000);
    return () => window.clearTimeout(timer);
  }, [successInfo]);

  useEffect(() => {
    if (!showReceiptHelp) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setShowReceiptHelp(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showReceiptHelp]);

  // Order items derived from garments
  const orderItems: OrderItem[] = Object.entries(garments).map(([name, entry]) => ({
    garment: name,
    qty: entry.qty,
    unitPrice: garmentUnitPrice(name, priceList),
  }));

  const garmentCount = orderItems.reduce((s, i) => s + i.qty, 0);
  const garmentTotal = orderItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const svcNameMap: Record<string, string> = { pressning: "Pressning", starkning: "Stärkning", vikning: "Vikning", express: "Express" };
  const serviceLines: ServiceLine[] = services.map((svc) => {
    const name = svcNameMap[svc] || svc;
    return { key: svc, label: t(`service.${svc}` as Parameters<typeof t>[0]), price: priceList[name] ?? 0 };
  });
  const serviceTotal = serviceLines.reduce((s, l) => s + l.price, 0);
  const grandTotal = garmentTotal + serviceTotal;
  const showPrices = pricesEnabled(priceList);

  const handleRemove = useCallback((garment: string) => {
    const next = { ...garments };
    delete next[garment];
    setGarments(next);
  }, [garments]);

  const handleQtyChange = useCallback((garment: string, qty: number) => {
    if (qty <= 0) {
      handleRemove(garment);
      return;
    }
    setGarments((prev) => ({ ...prev, [garment]: { ...prev[garment], qty } }));
  }, [handleRemove]);

  function commitCounter(raw = numberDraft) {
    const next = parseReceiptCounter(raw);
    setReceiptNumber(next);
    setNumberDraft(formatReceiptNumber(next));
    return next;
  }

  const effectiveReceiptNumber: string = specialMode && specialNumber !== ""
    ? specialNumber
    : formatReceiptNumber(parseReceiptCounter(numberDraft));

  async function handleSubmit() {
    if (Object.keys(garments).length === 0 || !deliveryDate) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptNumber: effectiveReceiptNumber,
          oneTime: specialMode,
          // Special receipts don't advance the regular counter
          nextReceiptNumber: specialMode ? parseReceiptCounter(numberDraft) : parseReceiptCounter(numberDraft) + 1,
          tagNumber: null,
          garments,
          deliveryDate,
          dropOffDate,
          comment,
          customerName: null,
          customerPhone: null,
          customerEmail,
          amountTotal: grandTotal * 100,
          services,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.error || `Fel: ${res.status}`);
        setSubmitting(false);
        return;
      }

      const { emailSent, nextReceiptNumber } = await res.json();
      if (!specialMode && nextReceiptNumber) {
        setReceiptNumber(nextReceiptNumber);
        setNumberDraft(formatReceiptNumber(nextReceiptNumber));
      }
      if (!showCreatedReceipt(Boolean(emailSent))) {
        setSubmitError(t("order.emailFailed"));
        setSubmitting(false);
        return;
      }
      setSuccessInfo({
        receiptNum: effectiveReceiptNumber,
        emailSent: true,
        emailAttempted: true,
        email: customerEmail.trim(),
      });
    } catch (err) {
      setSubmitError(`Nätverksfel: ${err instanceof Error ? err.message : "okänt"}`);
      setSubmitting(false);
    }
  }

  const theme = brandTheme(brandColor);

  if (status === "loading" || !settingsLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${brandColor} transparent ${brandColor} ${brandColor}` }}
        />
      </div>
    );
  }

  function resetForm() {
    setGarments({});
    setServices([]);
    setDropOffDate(todayISO());
    setDeliveryDate(getDefaultDeliveryDate());
    setComment("");
    setCustomerEmail("");
    setSubmitting(false);
    setSubmitError("");
    setSuccessInfo(null);
    setSpecialMode(false);
    setSpecialNumber("");
    fetch("/api/receipts/next-number")
      .then((response) => response.json())
      .then((data) => {
        const next = data.nextReceiptNumber ?? 1;
        setReceiptNumber(next);
        setNumberDraft(formatReceiptNumber(next));
      })
      .catch(() => {});
  }
  resetRef.current = resetForm;

  if (!session) return null;

  // Success overlay after receipt creation
  if (successInfo) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6"
        style={{ background: theme.tint }}
      >
        <div className="animate-fade-up text-center" style={{ width: "100%", maxWidth: "28rem" }}>
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
            style={{ backgroundColor: theme.brand, color: theme.onBrand }}
          >
            ✓
          </div>
          <h1
            className="mb-2 text-3xl font-bold"
            style={{ fontFamily: jost.style.fontFamily, color: "var(--text)", overflowWrap: "anywhere" }}
          >
            {t("order.successTitle")}
          </h1>
          <p className="mb-1 text-lg" style={{ color: "var(--text-muted)", overflowWrap: "anywhere" }}>
            #{successInfo.receiptNum}
          </p>
          <p className="mb-8 text-base font-semibold" style={{ color: "var(--text)", overflowWrap: "anywhere" }}>
            {t("order.sentTo")} {successInfo.email}
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-2xl px-8 py-4 text-lg font-bold shadow-lg"
            style={{ backgroundColor: theme.brand, color: theme.onBrand, boxShadow: `0 4px 20px ${theme.brand}40` }}
          >
            {t("order.newReceipt")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: theme.tint, minHeight: '100vh' }}>
      {/* ═══ HEADER ═══ */}
      <header className="pos-header" style={{ background: theme.bar, borderBottom: 'none', color: theme.barInk }}>
        <div className="pos-header-left">
          <KemkvittoLogo color={theme.barInk} size="sm" />
          <span style={{ color: theme.barInk, opacity: 0.55, fontSize: "0.75rem" }}>/</span>
          <span style={{ color: theme.barInk, fontSize: "0.8125rem", fontWeight: 600 }}>
            {businessName || session.user?.name}
          </span>
        </div>
        <div className="pos-header-nav">
          <AppMenu
            brand={theme.brand}
            onLogout={() => signOut()}
            wide={<WideNav color={theme.barInk} current="new" onLogout={() => signOut()} />}
          />
        </div>
      </header>

      {/* ═══ TWO-PANEL LAYOUT ═══ */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="pos-layout">
          {/* LEFT PANEL */}
          <div className="pos-left" style={{ background: theme.tint }}>
            {/* Garment grid — fills available space */}
            <div style={{ minHeight: 0 }}>
              <GarmentGrid
                garments={garments}
                onChange={setGarments}
                priceList={priceList}
                brandColor={brandColor}
                garmentList={garmentList}
                showPrices={showPrices}
                countryCode={countryCode}
              />
            </div>

            {/* Services — compact horizontal strip */}
            <div className="pos-services-strip">
              {([
                { key: "pressning", priceKey: "Pressning" },
                { key: "starkning", priceKey: "Stärkning" },
                { key: "vikning", priceKey: "Vikning" },
                { key: "express", priceKey: "Express" },
              ] as const).map((svc) => {
                const active = services.includes(svc.key);
                const price = priceList[svc.priceKey] ?? 0;
                return (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() => {
                      if (active) setServices(services.filter((s) => s !== svc.key));
                      else setServices([...services, svc.key]);
                    }}
                    className="pos-service-chip"
                    style={{
                      borderColor: active ? brandColor : "var(--border)",
                      backgroundColor: active
                        ? `color-mix(in srgb, ${brandColor} 12%, white)`
                        : "var(--bg-card)",
                      color: active ? brandColor : "var(--text-muted)",
                    }}
                  >
                    {active && <span className="pos-service-check">✓</span>}
                    <span>{t(`service.${svc.key}` as Parameters<typeof t>[0])}</span>
                    {showPrices && price > 0 && (
                      <span className="pos-service-price">{formatLaundryMoney(price, countryCode)}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dates — inline row */}
            <div className="pos-dates-row">
              <DateStepper
                label={t("receipt.dropOff")}
                value={dropOffDate}
                onChange={setDropOffDate}
                readOnly
              />
              <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 0.25rem" }} />
              <DateStepper
                label={t("receipt.ready")}
                value={deliveryDate}
                onChange={setDeliveryDate}
                brandColor={brandColor}
                fromDate={dropOffDate}
              />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="pos-right">
            {/* Receipt number */}
            <div>
              {/* Section label + ? help inline */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                <div className="pos-section-label" style={{ margin: 0 }}>{t("nav.receipt")} nr</div>
                <button
                  type="button"
                  onClick={() => setShowReceiptHelp((p) => !p)}
                  title="Hjälp"
                  aria-expanded={showReceiptHelp}
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    borderRadius: "50%",
                    border: "1.5px solid var(--border)",
                    background: "var(--bg-card)",
                    color: "var(--text-muted)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >?</button>
              </div>
              {showReceiptHelp && typeof document !== "undefined" && createPortal(
                <div
                  role="presentation"
                  onClick={() => setShowReceiptHelp(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(28,25,23,0.35)" }}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("nav.receipt")}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      position: "fixed",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 81,
                      width: "min(20rem, calc(100% - 2rem))",
                      background: "#fff",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                      padding: "1rem",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                      fontSize: "0.9rem",
                      color: "#1c1917",
                      lineHeight: 1.5,
                    }}
                  >
                    {t("receipt.helpText")}
                    <br /><br />
                    <strong>{t("receipt.oneTimeBtn")}</strong> — {t("receipt.helpOneTime")}
                    <br /><br />
                    <strong>{t("receipt.resetBtn")}</strong> — {t("receipt.helpReset")}
                  </div>
                </div>,
                document.body
              )}
              {/* Row 1: stepper */}
              <div className="pos-counter-row">
                <button
                  type="button"
                  className="pos-counter-btn"
                  onClick={() => commitCounter(String(Math.max(1, parseReceiptCounter(numberDraft) - 1)))}
                  title="−"
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numberDraft}
                  onChange={(e) => setNumberDraft(e.target.value)}
                  onBlur={() => commitCounter()}
                  className="pos-counter-input"
                  style={{ color: specialMode ? "var(--text-light)" : brandColor, textDecoration: specialMode ? "line-through" : "none", opacity: specialMode ? 0.4 : 1 }}
                />
                <button
                  type="button"
                  className="pos-counter-btn"
                  onClick={() => commitCounter(String(parseReceiptCounter(numberDraft) + 1))}
                  title="Öka"
                >+</button>
              </div>
              {/* Row 2: action buttons */}
              <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.375rem" }}>
                <button
                  type="button"
                  className="pos-counter-reset"
                  onClick={async () => {
                    await fetch("/api/receipts/reset-number", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ nextReceiptNumber: commitCounter() }),
                    });
                    setResetSaved(true);
                    setTimeout(() => setResetSaved(false), 1500);
                  }}
                  title={t("receipt.resetTitle")}
                  style={resetSaved ? { color: "var(--success)", borderColor: "var(--success)" } : undefined}
                >{resetSaved ? "✓" : t("receipt.resetBtn")}</button>
                <button
                  type="button"
                  className="pos-counter-special-btn"
                  style={{
                    borderColor: specialMode ? brandColor : "var(--border)",
                    backgroundColor: specialMode ? `color-mix(in srgb, ${brandColor} 12%, white)` : "transparent",
                    color: specialMode ? brandColor : "var(--text-muted)",
                  }}
                  onClick={() => { setSpecialMode((p) => !p); setSpecialNumber(""); }}
                  title={t("receipt.oneTimeTitle")}
                >{t("receipt.oneTimeBtn")}</button>
              </div>
              {specialMode && (
                <div className="pos-special-row">
                  <span style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>#</span>
                  <input
                    type="text"
                    value={specialNumber}
                    onChange={(e) => setSpecialNumber(e.target.value)}
                    className="pos-counter-input"
                    style={{ color: brandColor, flex: 1 }}
                    placeholder="Ange specialnummer..."
                    autoFocus
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-light)", whiteSpace: "nowrap" }}>→ återgår till #{formatReceiptNumber(parseReceiptCounter(numberDraft))}</span>
                </div>
              )}
            </div>

            {/* Customer */}
            <div>
              <div className="pos-section-label">{t("receipt.customer")}</div>
              <CustomerSearch
                email={customerEmail}
                onEmailChange={setCustomerEmail}
              />
            </div>

            {/* Order summary */}
            <div style={{ flex: 1 }}>
              <div className="pos-section-label">{t("receipt.order")}</div>
              <OrderSummary
                items={orderItems}
                total={grandTotal}
                brandColor={brandColor}
                onRemove={handleRemove}
                onQtyChange={handleQtyChange}
                serviceLines={serviceLines}
                showPrices={showPrices}
                countryCode={countryCode}
              />
            </div>

            {/* Comment */}
            <div>
              <div className="pos-section-label">{t("receipt.comment")}</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="pos-comment"
                style={{ width: "100%" }}
                placeholder={t("receipt.commentPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* ═══ ERROR ═══ */}
        {submitError && (
          <div style={{ padding: "0.75rem 1.5rem", backgroundColor: "#fef2f2", color: "#dc2626", fontSize: "0.875rem", fontWeight: 500, textAlign: "center" }}>
            {submitError}
          </div>
        )}

        {/* ═══ BOTTOM BAR ═══ */}
        <BottomBar
          garmentCount={garmentCount}
          total={grandTotal}
          brandColor={brandColor}
          submitting={submitting}
          disabled={submitting || garmentCount === 0 || !deliveryDate || !isValidCustomerEmail(customerEmail)}
          customerName={customerEmail}
          customerEmail={customerEmail}
          countryCode={countryCode}
          onSubmit={handleSubmit}
          showPrices={showPrices}
        />
      </form>
    </div>
  );
}
