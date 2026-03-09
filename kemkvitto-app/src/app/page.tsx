"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GarmentGrid, { type GarmentEntry } from "@/components/GarmentGrid";
import TreatmentModeBar from "@/components/TreatmentModeBar";
import OrderSummary, { type OrderItem } from "@/components/OrderSummary";
import DateStepper, { getDefaultDeliveryDate } from "@/components/DateStepper";
import CustomerSearch from "@/components/CustomerSearch";
import BottomBar from "@/components/BottomBar";
import KemkvittoLogo from "@/components/KemkvittoLogo";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NewReceiptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [receiptNumber, setReceiptNumber] = useState(1);
  const [garments, setGarments] = useState<Record<string, GarmentEntry>>({});
  const [treatment, setTreatment] = useState<"bet" | "ej_bet">("ej_bet");
  const [dropOffDate, setDropOffDate] = useState(todayISO());
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate());
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [brandColor, setBrandColor] = useState("#0891b2");
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

  // When global treatment changes, update all existing garments to match
  function handleTreatmentChange(t: "bet" | "ej_bet") {
    setTreatment(t);
    const isBet = t === "bet";
    const updated = { ...garments };
    for (const key of Object.keys(updated)) {
      updated[key] = { ...updated[key], bet: isBet };
    }
    setGarments(updated);
  }

  // Order items derived from garments
  const orderItems: OrderItem[] = Object.entries(garments).map(([name, entry]) => ({
    garment: name,
    qty: entry.qty,
    bet: entry.bet,
    unitPrice: priceList[name] ?? 0,
  }));

  const garmentCount = orderItems.reduce((s, i) => s + i.qty, 0);
  const garmentTotal = orderItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const betPrice = priceList["Bet"] ?? 0;
  const hasBetItems = orderItems.some((i) => i.bet);
  const grandTotal = garmentTotal + (hasBetItems ? betPrice : 0);

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

  const handleToggleTreatment = useCallback((garment: string) => {
    setGarments((prev) => ({
      ...prev,
      [garment]: { ...prev[garment], bet: !prev[garment].bet },
    }));
  }, []);

  async function handleSubmit() {
    if (Object.keys(garments).length === 0 || !deliveryDate) return;
    setSubmitting(true);

    const res = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiptNumber,
        garments,
        deliveryDate,
        dropOffDate,
        comment,
        customerName,
        customerPhone,
      }),
    });

    if (!res.ok) {
      setSubmitting(false);
      return;
    }

    const { id } = await res.json();
    router.push(
      `/receipt/${id}/email?brand=${encodeURIComponent(brandColor)}&name=${encodeURIComponent(session?.user?.name || "")}`
    );
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

  if (!session) return null;

  return (
    <div style={{ backgroundColor: "var(--bg)" }}>
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
              Kvitto
            </span>
            <span style={{ color: "var(--border-strong)" }}>#</span>
            <input
              type="number"
              min={1}
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(parseInt(e.target.value) || 1)}
              style={{ color: brandColor }}
            />
          </div>
        </div>
        <div className="pos-header-nav">
          <Link href="/receipts">Kvitton</Link>
          <Link href="/settings">Inställningar</Link>
          <button onClick={() => signOut()}>Logga ut</button>
        </div>
      </header>

      {/* ═══ TWO-PANEL LAYOUT ═══ */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="pos-layout">
          {/* LEFT PANEL */}
          <div className="pos-left">
            {/* Treatment mode */}
            <div>
              <div className="pos-section-label">Behandling</div>
              <TreatmentModeBar
                treatment={treatment}
                onTreatmentChange={handleTreatmentChange}
                betPrice={betPrice}
                brandColor={brandColor}
              />
            </div>

            {/* Garment grid */}
            <div style={{ flex: 1 }}>
              <div className="pos-section-label">Plagg</div>
              <GarmentGrid
                garments={garments}
                onChange={setGarments}
                priceList={priceList}
                brandColor={brandColor}
                defaultBet={treatment === "bet"}
              />
            </div>

            {/* Dates */}
            <div>
              <div className="pos-section-label">Datum</div>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <DateStepper
                  label="Inlämnat"
                  value={dropOffDate}
                  onChange={setDropOffDate}
                  readOnly
                />
                <DateStepper
                  label="Färdigt"
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  brandColor={brandColor}
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="pos-right">
            {/* Customer */}
            <div>
              <div className="pos-section-label">Kund</div>
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
              <div className="pos-section-label">Beställning</div>
              <OrderSummary
                items={orderItems}
                betPrice={betPrice}
                total={grandTotal}
                brandColor={brandColor}
                onRemove={handleRemove}
                onQtyChange={handleQtyChange}
                onToggleTreatment={handleToggleTreatment}
              />
            </div>

            {/* Comment */}
            <div>
              <div className="pos-section-label">Kommentar</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="pos-comment"
                style={{ width: "100%" }}
                placeholder="Valfri kommentar..."
              />
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM BAR ═══ */}
        <BottomBar
          garmentCount={garmentCount}
          hasBet={hasBetItems}
          total={grandTotal}
          brandColor={brandColor}
          submitting={submitting}
          disabled={submitting || garmentCount === 0 || !deliveryDate}
          onSubmit={handleSubmit}
        />
      </form>
    </div>
  );
}
