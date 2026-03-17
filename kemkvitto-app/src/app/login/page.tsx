"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("auth.loginError"));
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#e8edf0" }}>
      <div className="absolute right-4 top-4 z-10">
        <LanguageToggle />
      </div>

      {/* Cyan header banner */}
      <div
        className="flex flex-col items-center px-6 py-10"
        style={{ backgroundColor: "#0891b2" }}
      >
        <KemkvittoLogo size="lg" color="white" />
        <div className="mt-5 space-y-1 text-center text-base font-medium text-white" style={{ lineHeight: 1.7 }}>
          <p>- {locale === "sv" ? "Kundkvitto på papper" : locale === "en" ? "Customer receipt on paper" : "Kundekvittering på papir"} <strong style={{ fontWeight: 800 }}>{locale === "sv" ? "OCH" : locale === "en" ? "AND" : "OG"}</strong> {locale === "sv" ? "som e-post." : locale === "en" ? "as e-mail." : "som e-post."}</p>
          <p>- {locale === "sv" ? "Aldrig mer ett bortappat kvitto!" : locale === "en" ? "Never lose a receipt again!" : "Aldrig mere et tabt kvittering!"}</p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex flex-1 items-start justify-center px-4 pt-10">
        <div className="animate-fade-up w-full max-w-sm space-y-4">
          {error && (
            <p className="rounded-xl bg-red-50 p-4 text-center text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="touch-target w-full rounded-xl border bg-white px-4 py-4 text-lg font-medium focus:outline-none"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="password"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="touch-target w-full rounded-xl border bg-white px-4 py-4 text-lg font-medium focus:outline-none"
              style={{ borderColor: "var(--border)" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="touch-target w-full rounded-xl px-4 py-4 text-lg font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: "#5b8a9f" }}
            >
              {loading ? t("auth.loggingIn") : t("auth.login")}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-semibold" style={{ color: "#0891b2" }}>
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
