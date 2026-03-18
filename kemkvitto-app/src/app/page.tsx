"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GarmentGrid, { type GarmentEntry } from "@/components/GarmentGrid";
import OrderSummary, { type OrderItem, type ServiceLine } from "@/components/OrderSummary";
import DateStepper, { getDefaultDeliveryDate } from "@/components/DateStepper";
import CustomerSearch from "@/components/CustomerSearch";
import BottomBar from "@/components/BottomBar";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Mix a hex brand color with white at the given percentage (0–1). */
function blendWithWhite(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * alpha + 255 * (1 - alpha));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export default function NewReceiptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [receiptNumber, setReceiptNumber] = useState(1);
  const [specialMode, setSpecialMode] = useState(false);
  const [specialNumber, setSpecialNumber] = useState<string>("");

  const [garments, setGarments] = useState<Record<string, GarmentEntry>>({});
  const [services, setServices] = useState<string[]>(["pressning"]);
  const [dropOffDate, setDropOffDate] = useState(todayISO());
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate());
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ receiptNum: string | number; emailSent: boolean; customerName: string } | null>(null);
  const [brandColor, setBrandColor] = useState("#82C58A");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [priceList, setPriceList] = useState<Record<string, number>>({});
  const [garmentList, setGarmentList] = useState<string[]>([]);
  const [serviceList, setServiceList] = useState<string[]>([]);
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
          setReceiptNumber(data.nextReceiptNumber);
          setBrandColor(data.brandColor || "#82C58A");
          if (data.priceList) setPriceList(data.priceList);
          if (data.garmentList) setGarmentList(data.garmentList);
          if (data.serviceList) setServiceList(data.serviceList);
          setSettingsLoaded(true);
        });
    }
  }, [status]);

  useEffect(() => {
    if (!showReceiptHelp) return;
    function handler() { setShowReceiptHelp(false); }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showReceiptHelp]);

  // Order items derived from garments
  const orderItems: OrderItem[] = Object.entries(garments).map(([name, entry]) => ({
    garment: name,
    qty: entry.qty,
    unitPrice: priceList[name] ?? 0,
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

  const effectiveReceiptNumber: string | number = specialMode && specialNumber !== "" ? specialNumber : receiptNumber;

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
          // Special receipts don't advance the regular counter
          nextReceiptNumber: specialMode ? receiptNumber : receiptNumber + 1,
          tagNumber: null,
          garments,
          deliveryDate,
          dropOffDate,
          comment,
          customerName,
          customerPhone,
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
      if (!specialMode && nextReceiptNumber) setReceiptNumber(nextReceiptNumber);
      setSuccessInfo({ receiptNum: effectiveReceiptNumber, emailSent, customerName });
    } catch (err) {
      setSubmitError(`Nätverksfel: ${err instanceof Error ? err.message : "okänt"}`);
      setSubmitting(false);
    }
  }

  if (status === "loading" || !settingsLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: "#82C58A transparent #82C58A #82C58A" }}
        />
      </div>
    );
  }

  function resetForm() {
    setGarments({});
    setServices(["pressning"]);
    setDropOffDate(todayISO());
    setDeliveryDate(getDefaultDeliveryDate());
    setComment("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSubmitting(false);
    setSubmitError("");
    setSuccessInfo(null);
    setSpecialMode(false);
    setSpecialNumber("");
  }

  if (!session) return null;

  // Success overlay after receipt creation
  if (successInfo) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6"
        style={{ background: `linear-gradient(135deg, ${brandColor}08 0%, ${brandColor}03 100%)` }}
      >
        <div className="animate-fade-up text-center" style={{ maxWidth: "28rem" }}>
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white"
            style={{ backgroundColor: brandColor }}
          >
            ✓
          </div>
          <h1
            className="mb-2 text-3xl font-bold"
            style={{ fontFamily: "'Syne', sans-serif", color: "var(--text)" }}
          >
            {t("order.successTitle")}
          </h1>
          <p className="mb-1 text-lg" style={{ color: "var(--text-muted)" }}>
            #{successInfo.receiptNum}
            {successInfo.customerName && ` — ${successInfo.customerName}`}
          </p>
          <p className="mb-8 text-base" style={{ color: successInfo.emailSent ? brandColor : "var(--text-light)" }}>
            {successInfo.emailSent ? t("order.successEmailSent") : t("order.successNoEmail")}
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-2xl px-8 py-4 text-lg font-bold text-white shadow-lg"
            style={{ backgroundColor: brandColor, boxShadow: `0 4px 20px ${brandColor}40` }}
          >
            {t("order.newReceipt")}
          </button>
        </div>
      </div>
    );
  }

  const bgTint = blendWithWhite(brandColor, 0.28);

  return (
    <div style={{ background: bgTint, minHeight: '100vh' }}>
      {/* ═══ HEADER ═══ */}
      <header className="pos-header" style={{ background: brandColor, borderBottom: 'none', color: 'white' }}>
        <div className="pos-header-left">
          <KemkvittoLogo color="white" size="sm" />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>/</span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8125rem", fontWeight: 600 }}>
            {session.user?.name}
          </span>
        </div>
        <div className="pos-header-nav">
          <LanguageToggle />
          <Link href="/receipts">{t("nav.receipts")}</Link>
          <Link href="/settings">{t("nav.settings")}</Link>
          <button onClick={() => signOut()}>{t("nav.logout")}</button>
        </div>
      </header>

      {/* ═══ TWO-PANEL LAYOUT ═══ */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="pos-layout">
          {/* LEFT PANEL */}
          <div className="pos-left" style={{ background: bgTint }}>
            {/* Garment grid — fills available space */}
            <div style={{ minHeight: 0 }}>
              <GarmentGrid
                garments={garments}
                onChange={setGarments}
                priceList={priceList}
                brandColor={brandColor}
                garmentList={garmentList}
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
                    {price > 0 && (
                      <span className="pos-service-price">{price} kr</span>
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowReceiptHelp((p) => !p); }}
                    title="Hjälp"
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
                  {showReceiptHelp && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 6px)",
                        zIndex: 100,
                        width: "16rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.75rem",
                        padding: "0.75rem",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {t("receipt.helpText")}
                      <br /><br />
                      <strong>{t("receipt.oneTimeBtn")}</strong> — {t("receipt.helpOneTime")}
                      <br /><br />
                      <strong>{t("receipt.resetBtn")}</strong> — {t("receipt.helpReset")}
                    </div>
                  )}
                </div>
              </div>
              {/* Row 1: stepper */}
              <div className="pos-counter-row">
                <button
                  type="button"
                  className="pos-counter-btn"
                  onClick={() => setReceiptNumber((p) => Math.max(1, p - 1))}
                  title="−"
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(Math.min(99999, parseInt(e.target.value) || 1))}
                  className="pos-counter-input"
                  style={{ color: specialMode ? "var(--text-light)" : brandColor, textDecoration: specialMode ? "line-through" : "none", opacity: specialMode ? 0.4 : 1 }}
                />
                <button
                  type="button"
                  className="pos-counter-btn"
                  onClick={() => setReceiptNumber((p) => Math.min(99999, p + 1))}
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
                      body: JSON.stringify({ nextReceiptNumber: receiptNumber }),
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
                  <span style={{ fontSize: "0.7rem", color: "var(--text-light)", whiteSpace: "nowrap" }}>→ återgår till #{receiptNumber}</span>
                </div>
              )}
            </div>

            {/* Customer */}
            <div>
              <div className="pos-section-label">{t("receipt.customer")}</div>
              <CustomerSearch
                name={customerName}
                phone={customerPhone}
                email={customerEmail}
                onSelect={(c) => {
                  setCustomerName(c.name);
                  setCustomerPhone(c.phone);
                  setCustomerEmail(c.email);
                }}
                onNameChange={setCustomerName}
                onPhoneChange={setCustomerPhone}
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
          disabled={submitting || garmentCount === 0 || !deliveryDate}
          customerName={customerName}
          customerEmail={customerEmail}
          onSubmit={handleSubmit}
        />
      </form>
    </div>
  );
}
