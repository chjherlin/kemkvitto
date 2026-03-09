"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, businessName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("auth.registerError"));
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="animate-fade-up w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <KemkvittoLogo size="lg" />
          <p style={{ color: "var(--text-muted)" }}>
            {t("auth.registerSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <input
            type="text"
            placeholder={t("auth.businessName")}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="touch-target w-full rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium focus:outline-none"
            style={{ borderColor: "var(--border)" }}
          />
          <input
            type="email"
            placeholder={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="touch-target w-full rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium focus:outline-none"
            style={{ borderColor: "var(--border)" }}
          />
          <input
            type="password"
            placeholder={t("auth.passwordMinLength")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="touch-target w-full rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium focus:outline-none"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            type="submit"
            disabled={loading}
            className="touch-target w-full rounded-xl bg-[#0891b2] px-4 py-4 text-lg font-bold text-white shadow-lg disabled:opacity-50"
            style={{ boxShadow: "0 4px 20px #0891b240" }}
          >
            {loading ? t("auth.registering") : t("auth.register")}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#0891b2" }}>
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
