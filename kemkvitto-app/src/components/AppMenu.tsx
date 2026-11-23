"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

/**
 * Wide screens keep the page's own links. Narrow screens replace them with
 * one button that opens the same list on every signed-in page.
 */
export default function AppMenu({
  color,
  wide,
  onLogout,
}: {
  color: string;
  wide: ReactNode;
  onLogout: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <div ref={root} className="app-menu">
      <div className="app-menu-wide">{wide}</div>
      <button
        type="button"
        className="app-menu-button"
        aria-expanded={open}
        aria-label={t("nav.menu")}
        onClick={() => setOpen((value) => !value)}
        style={{ color }}
      >
        ☰
      </button>
      {open && (
        <div className="app-menu-panel" role="menu" style={{ color: "var(--text)" }}>
          <Link href="/" role="menuitem" onClick={close}>{t("nav.newReceipt")}</Link>
          <Link href="/receipts" role="menuitem" onClick={close}>{t("nav.receipts")}</Link>
          <Link href="/settings" role="menuitem" onClick={close}>{t("nav.settings")}</Link>
          <div className="app-menu-lang">
            <span>{t("nav.language")}</span>
            <LanguageToggle color="var(--text)" />
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
