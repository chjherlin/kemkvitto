"use client";

import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

export type WidePage = "new" | "receipts" | "settings";

/** Desktop header links. Narrow screens hide this and use the hamburger. */
export default function WideNav({
  color,
  current,
  onLogout,
}: {
  color: string;
  current?: WidePage;
  onLogout: () => void;
}) {
  const { t } = useI18n();
  const items: { key: WidePage; href: string; label: string }[] = [
    { key: "new", href: "/", label: t("nav.newReceipt") },
    { key: "receipts", href: "/receipts", label: t("nav.receipts") },
    { key: "settings", href: "/settings", label: t("nav.settings") },
  ];

  return (
    <nav className="wide-nav" aria-label={t("nav.menu")}>
      <LanguageToggle color={color} />
      {items.map((item) => {
        const here = current === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={here ? "page" : undefined}
            style={{
              color,
              fontWeight: here ? 800 : 600,
              textDecoration: here ? "underline" : "none",
              textUnderlineOffset: "0.28em",
            }}
          >
            {item.label}
          </Link>
        );
      })}
      <button type="button" onClick={onLogout} style={{ color, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
        {t("nav.logout")}
      </button>
    </nav>
  );
}
