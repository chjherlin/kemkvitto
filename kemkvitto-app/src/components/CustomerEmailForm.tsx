"use client";

import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

interface CustomerEmailFormProps {
  receiptId: string;
  brandColor?: string;
  businessName?: string;
}

export default function CustomerEmailForm({
  receiptId,
  brandColor = "#0891b2",
  businessName,
}: CustomerEmailFormProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (email.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(
        `/api/receipts/autocomplete?q=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.emails || []);
        setShowSuggestions(true);
      }
    }, 200);
  }, [email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch(`/api/receipts/${receiptId}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      setSubmitting(false);
    }
  }

  function selectSuggestion(s: string) {
    setEmail(s);
    setShowSuggestions(false);
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="animate-fade-up text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white"
            style={{ backgroundColor: brandColor }}
          >
            ✓
          </div>
          <h1
            className="mb-2 text-3xl font-bold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {t("email.thanks")}
          </h1>
          <p style={{ color: "var(--text-muted)" }} className="text-lg">
            {t("email.sent")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: `linear-gradient(135deg, ${brandColor}08 0%, ${brandColor}03 100%)` }}
    >
      <form
        onSubmit={handleSubmit}
        className="animate-fade-up w-full max-w-lg space-y-8 text-center"
      >
        {/* Business branding */}
        <div>
          {businessName && (
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-widest"
              style={{ color: brandColor }}
            >
              {businessName}
            </p>
          )}
          <h1
            className="text-3xl font-bold"
            style={{
              fontFamily: "'Syne', sans-serif",
              color: "var(--text)",
            }}
          >
            {t("email.title")}
          </h1>
          <p className="mt-2 text-lg" style={{ color: "var(--text-muted)" }}>
            {t("email.subtitle")}
          </p>
        </div>

        {/* Email input with autocomplete */}
        <div className="relative">
          <input
            ref={inputRef}
            type="email"
            placeholder={t("email.placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            required
            autoComplete="off"
            className="w-full rounded-2xl border-3 bg-white px-6 py-5 text-center text-2xl font-medium focus:outline-none"
            style={{
              borderColor: email ? brandColor : "var(--border-strong)",
              borderWidth: "3px",
              boxShadow: email ? `0 4px 20px ${brandColor}15` : "none",
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border-2 bg-white shadow-lg"
              style={{ borderColor: "var(--border)" }}
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full px-6 py-4 text-left text-lg hover:bg-gray-50"
                  style={{ color: "var(--text)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !email}
          className="touch-target w-full rounded-2xl px-6 py-5 text-2xl font-bold text-white shadow-lg transition-all disabled:opacity-40"
          style={{
            backgroundColor: brandColor,
            boxShadow: `0 4px 20px ${brandColor}40`,
          }}
        >
          {submitting ? t("email.submitting") : t("email.submit")}
        </button>
      </form>
    </div>
  );
}
