"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface ReceiptInfo {
  receiptNumber: number;
  businessName: string;
  amountTotal: number;
  paymentStatus: string;
  brandColor: string;
  garments: Record<string, number | { qty: number; bet: boolean }>;
}

function ReceiptSummaryCard({ receipt, lang }: { receipt: ReceiptInfo; lang: string }) {
  const t = (sv: string, en: string) => (lang === "en" ? en : sv);
  return (
    <div
      className="rounded-2xl border-2 p-5"
      style={{ borderColor: receipt.brandColor, backgroundColor: `${receipt.brandColor}05` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: receipt.brandColor }}>
            {receipt.businessName}
          </p>
          <p className="mt-1 font-receipt text-lg font-bold" style={{ color: "var(--text)" }}>
            {t("Kvitto", "Receipt")} #{receipt.receiptNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("Totalt", "Total")}
          </p>
          <p className="font-receipt text-2xl font-bold" style={{ color: receipt.brandColor }}>
            {(receipt.amountTotal / 100).toLocaleString("sv-SE")} kr
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {Object.entries(receipt.garments).map(([name, val]) => {
          const qty = typeof val === "number" ? val : val.qty;
          return (
            <span
              key={name}
              className="rounded-lg px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${receipt.brandColor} 10%, white)`,
                color: receipt.brandColor,
              }}
            >
              {name} {qty > 1 ? `x${qty}` : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DemoPaymentForm({ receipt, lang, onSuccess }: { receipt: ReceiptInfo; lang: string; onSuccess: () => void }) {
  const t = (sv: string, en: string) => (lang === "en" ? en : sv);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"card" | "swish">("card");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPaying(true);
    setTimeout(() => onSuccess(), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <ReceiptSummaryCard receipt={receipt} lang={lang} />

      {/* Demo payment methods */}
      <div className="rounded-2xl border-2 bg-white p-5" style={{ borderColor: "var(--border)" }}>
        {/* Demo badge */}
        <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
          <span className="text-sm font-semibold text-amber-700">
            {t("Demoläge — ingen riktig betalning sker", "Demo mode — no real payment will be processed")}
          </span>
        </div>

        {/* Payment method tabs */}
        <div className="mb-4 flex gap-2">
          {(["card", "swish"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              className="flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all"
              style={{
                borderColor: selectedMethod === method ? receipt.brandColor : "var(--border)",
                backgroundColor: selectedMethod === method ? `${receipt.brandColor}08` : "white",
                color: selectedMethod === method ? receipt.brandColor : "var(--text-muted)",
              }}
            >
              {method === "card" ? t("Kort", "Card") : "Swish"}
            </button>
          ))}
        </div>

        {/* Mock card form */}
        {selectedMethod === "card" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {t("Kortnummer", "Card number")}
              </label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full rounded-xl border-2 px-4 py-3 font-receipt text-sm"
                style={{ borderColor: "var(--border)" }}
                readOnly
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("Utgångsdatum", "Expiry")}
                </label>
                <input
                  type="text"
                  placeholder="12 / 28"
                  className="w-full rounded-xl border-2 px-4 py-3 font-receipt text-sm"
                  style={{ borderColor: "var(--border)" }}
                  readOnly
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full rounded-xl border-2 px-4 py-3 font-receipt text-sm"
                  style={{ borderColor: "var(--border)" }}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Mock Swish form */}
        {selectedMethod === "swish" && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {t("Mobilnummer", "Phone number")}
            </label>
            <input
              type="text"
              placeholder="+46 70 123 45 67"
              className="w-full rounded-xl border-2 px-4 py-3 font-receipt text-sm"
              style={{ borderColor: "var(--border)" }}
              readOnly
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={paying}
        className="touch-target w-full rounded-2xl px-6 py-5 text-xl font-bold text-white shadow-lg transition-all disabled:opacity-60"
        style={{
          backgroundColor: receipt.brandColor,
          boxShadow: `0 4px 20px ${receipt.brandColor}40`,
        }}
      >
        {paying
          ? t("Bearbetar...", "Processing...")
          : `${t("Betala", "Pay")} ${(receipt.amountTotal / 100).toLocaleString("sv-SE")} kr`}
      </button>
    </form>
  );
}

function LivePaymentForm({ receipt, clientSecret, lang, onSuccess, onError }: {
  receipt: ReceiptInfo;
  clientSecret: string;
  lang: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [StripeComponents, setStripeComponents] = useState<{
    Elements: typeof import("@stripe/react-stripe-js").Elements;
    PaymentElement: typeof import("@stripe/react-stripe-js").PaymentElement;
    useStripe: typeof import("@stripe/react-stripe-js").useStripe;
    useElements: typeof import("@stripe/react-stripe-js").useElements;
  } | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof import("@stripe/stripe-js").loadStripe> | null>(null);

  useEffect(() => {
    Promise.all([
      import("@stripe/react-stripe-js"),
      import("@stripe/stripe-js"),
    ]).then(([reactStripe, stripeJs]) => {
      setStripeComponents({
        Elements: reactStripe.Elements,
        PaymentElement: reactStripe.PaymentElement,
        useStripe: reactStripe.useStripe,
        useElements: reactStripe.useElements,
      });
      setStripePromise(stripeJs.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!));
    });
  }, []);

  if (!StripeComponents || !stripePromise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${receipt.brandColor} transparent ${receipt.brandColor} ${receipt.brandColor}` }}
        />
      </div>
    );
  }

  return (
    <StripeComponents.Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: receipt.brandColor, borderRadius: "12px" },
        },
        locale: lang === "en" ? "en" : "sv",
      }}
    >
      <StripeInnerForm receipt={receipt} lang={lang} onSuccess={onSuccess} onError={onError} components={StripeComponents} />
    </StripeComponents.Elements>
  );
}

function StripeInnerForm({ receipt, lang, onSuccess, onError, components }: {
  receipt: ReceiptInfo;
  lang: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  components: {
    PaymentElement: typeof import("@stripe/react-stripe-js").PaymentElement;
    useStripe: typeof import("@stripe/react-stripe-js").useStripe;
    useElements: typeof import("@stripe/react-stripe-js").useElements;
  };
}) {
  const stripe = components.useStripe();
  const elements = components.useElements();
  const [paying, setPaying] = useState(false);
  const t = (sv: string, en: string) => (lang === "en" ? en : sv);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?status=success&lang=${lang}`,
      },
    });
    if (error) {
      onError(error.message || t("Betalningen misslyckades", "Payment failed"));
      setPaying(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <ReceiptSummaryCard receipt={receipt} lang={lang} />
      <div className="rounded-2xl border-2 bg-white p-5" style={{ borderColor: "var(--border)" }}>
        <components.PaymentElement options={{ layout: "tabs" }} />
      </div>
      <button
        type="submit"
        disabled={paying || !stripe || !elements}
        className="touch-target w-full rounded-2xl px-6 py-5 text-xl font-bold text-white shadow-lg transition-all disabled:opacity-40"
        style={{ backgroundColor: receipt.brandColor, boxShadow: `0 4px 20px ${receipt.brandColor}40` }}
      >
        {paying
          ? t("Bearbetar...", "Processing...")
          : `${t("Betala", "Pay")} ${(receipt.amountTotal / 100).toLocaleString("sv-SE")} kr`}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "sv";
  const statusParam = searchParams.get("status");

  const [receipt, setReceipt] = useState<ReceiptInfo | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [pageState, setPageState] = useState<"loading" | "form" | "success" | "error" | "already_paid">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const t = (sv: string, en: string) => (lang === "en" ? en : sv);

  useEffect(() => {
    if (statusParam === "success") {
      setPageState("success");
      fetch(`/api/pay/${id}/info`)
        .then((r) => r.json())
        .then((data) => { if (data.receipt) setReceipt(data.receipt); });
      return;
    }

    fetch(`/api/pay/${id}/info`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.receipt) {
          setErrorMsg(t("Kvittot hittades inte", "Receipt not found"));
          setPageState("error");
          return;
        }
        setReceipt(data.receipt);

        if (data.receipt.paymentStatus === "paid") {
          setPageState("already_paid");
          return;
        }

        return fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiptId: id }),
        });
      })
      .then((r) => r?.json())
      .then((data) => {
        if (!data) return;
        if (data.demo) {
          setIsDemo(true);
          setPageState("form");
        } else if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setPageState("form");
        }
      })
      .catch(() => {
        setErrorMsg(t("Något gick fel", "Something went wrong"));
        setPageState("error");
      });
  }, [id, statusParam, lang]);

  const brandColor = receipt?.brandColor || "#0891b2";

  if (pageState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${brandColor} transparent ${brandColor} ${brandColor}` }}
        />
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="animate-fade-up text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white"
            style={{ backgroundColor: brandColor }}
          >
            ✓
          </div>
          <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t("Betalningen lyckades!", "Payment successful!")}
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-lg">
            {t("Tack för din betalning", "Thank you for your payment")}
          </p>
          {isDemo && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              {t("(Demo — ingen riktig betalning gjordes)", "(Demo — no real payment was made)")}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (pageState === "already_paid") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="animate-fade-up text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white"
            style={{ backgroundColor: "#16a34a" }}
          >
            ✓
          </div>
          <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t("Redan betald", "Already paid")}
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-lg">
            {t("Detta kvitto är redan betalt", "This receipt has already been paid")}
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "error" || !receipt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="animate-fade-up text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl">
            ✕
          </div>
          <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
            {t("Något gick fel", "Something went wrong")}
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-lg">
            {errorMsg || t("Försök igen senare", "Please try again later")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      style={{ background: `linear-gradient(135deg, ${brandColor}08 0%, ${brandColor}03 100%)` }}
    >
      <div className="animate-fade-up w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "var(--text)" }}>
            {t("Betalning", "Payment")}
          </h1>
        </div>

        {isDemo ? (
          <DemoPaymentForm
            receipt={receipt}
            lang={lang}
            onSuccess={() => setPageState("success")}
          />
        ) : clientSecret ? (
          <LivePaymentForm
            receipt={receipt}
            clientSecret={clientSecret}
            lang={lang}
            onSuccess={() => setPageState("success")}
            onError={(msg) => { setErrorMsg(msg); setPageState("error"); }}
          />
        ) : null}
      </div>
    </div>
  );
}
