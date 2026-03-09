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

export default function NewReceiptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [receiptNumber, setReceiptNumber] = useState(1);
  const [tagNumber, setTagNumber] = useState("");
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
  const [successInfo, setSuccessInfo] = useState<{ receiptNum: number; tagNum: string; emailSent: boolean; customerName: string } | null>(null);
  const [brandColor, setBrandColor] = useState("#82C58A");
  const [priceList, setPriceList] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/receipts/next-number")
        .then((r) => r.json())
        .then((data) => {
          setReceiptNumber(data.nextReceiptNumber);
          if (data.brandColor) setBrandColor(data.brandColor);
          if (data.priceList) setPriceList(data.priceList);
        });
    }
  }, [status]);

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

  async function handleSubmit() {
    if (Object.keys(garments).length === 0 || !deliveryDate) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptNumber,
          tagNumber: tagNumber || null,
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

      const { emailSent } = await res.json();
      setSuccessInfo({ receiptNum: receiptNumber, tagNum: tagNumber, emailSent, customerName });
    } catch (err) {
      setSubmitError(`Nätverksfel: ${err instanceof Error ? err.message : "okänt"}`);
      setSubmitting(false);
    }
  }

  if (status === "loading") {
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
    setTagNumber("");
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
    setReceiptNumber((prev) => prev + 1);
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
            {successInfo.tagNum && ` · ${t("nav.tag")} ${successInfo.tagNum}`}
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

  return (
    <div style={{ background: `linear-gradient(135deg, ${brandColor}12 0%, ${brandColor}06 50%, var(--bg) 100%)`, minHeight: '100vh' }}>
      {/* ═══ HEADER ═══ */}
      <header className="pos-header">
        <div className="pos-header-left">
          <KemkvittoLogo color={brandColor} size="sm" />
          <span style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>/</span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontWeight: 600 }}>
            {session.user?.name}
          </span>
          <div className="pos-header-receipt" style={{ marginLeft: "0.75rem" }}>
            <span style={{ color: "var(--text-light)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("nav.receipt")}
            </span>
            <span style={{ color: "var(--border-strong)" }}>#</span>
            <input
              type="number"
              min={1}
              max={99999}
              value={receiptNumber}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 1;
                setReceiptNumber(Math.min(v, 99999));
              }}
              style={{ color: brandColor }}
            />
          </div>
          <div className="pos-header-receipt" style={{ marginLeft: "0.5rem" }}>
            <span style={{ color: "var(--text-light)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("nav.tag")}
            </span>
            <input
              type="text"
              value={tagNumber}
              onChange={(e) => setTagNumber(e.target.value)}
              placeholder="—"
              style={{ color: brandColor, width: "4rem" }}
            />
          </div>
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
          <div className="pos-left">
            {/* Garment grid — fills available space */}
            <div style={{ minHeight: 0 }}>
              <GarmentGrid
                garments={garments}
                onChange={setGarments}
                priceList={priceList}
                brandColor={brandColor}
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
