"use client";

import { suggestEmail } from "@/lib/email-address";
import { useI18n } from "@/lib/i18n";

export default function EmailSuggestion({
  value,
  onPick,
}: {
  value: string;
  onPick: (email: string) => void;
}) {
  const { t } = useI18n();
  const suggestion = suggestEmail(value);
  if (!suggestion) return null;
  return (
    <button
      type="button"
      onClick={() => onPick(suggestion)}
      style={{
        minHeight: "44px",
        padding: "0.25rem 0",
        background: "none",
        border: "none",
        color: "var(--text)",
        fontSize: "16px",
        fontWeight: 600,
        textAlign: "left",
      }}
    >
      {t("email.didYouMean")} {suggestion}?
    </button>
  );
}
