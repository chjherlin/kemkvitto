"use client";

import { useI18n } from "@/lib/i18n";

interface PaymentStatusBarProps {
  paid: boolean;
  onPaidChange: (paid: boolean) => void;
  brandColor: string;
}

export default function PaymentStatusBar({
  paid,
  onPaidChange,
  brandColor,
}: PaymentStatusBarProps) {
  const { t } = useI18n();

  return (
    <div className="flex gap-2">
      {([true, false] as const).map((isPaid) => {
        const active = paid === isPaid;
        const label = isPaid ? t("payment.betald") : t("payment.ejBetald");
        const sub = isPaid ? t("payment.betaldSub") : t("payment.ejBetaldSub");

        return (
          <button
            key={String(isPaid)}
            type="button"
            onClick={() => onPaidChange(isPaid)}
            className="pos-treatment-pill"
            style={{
              flex: 1,
              borderColor: active ? (isPaid ? "#16a34a" : brandColor) : "var(--border)",
              backgroundColor: active
                ? isPaid ? "color-mix(in srgb, #16a34a 12%, white)" : `color-mix(in srgb, ${brandColor} 12%, white)`
                : "var(--bg-card)",
              color: active ? (isPaid ? "#16a34a" : brandColor) : "var(--text)",
            }}
          >
            <span className="block text-base font-bold leading-tight">{label}</span>
            <span
              className="block text-xs"
              style={{ color: active ? (isPaid ? "#16a34a" : brandColor) : "var(--text-light)", opacity: active ? 0.7 : 1 }}
            >
              {sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
