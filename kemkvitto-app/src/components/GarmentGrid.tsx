"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { onBrand } from "@/lib/brand";
import { formatLaundryMoney, isUnpricedGarment } from "@/lib/laundry-defaults";

export interface GarmentEntry {
  qty: number;
}

interface GarmentGridProps {
  garments: Record<string, GarmentEntry>;
  onChange: (garments: Record<string, GarmentEntry>) => void;
  priceList: Record<string, number>;
  brandColor: string;
  garmentList: string[];
  showPrices?: boolean;
  countryCode?: string | null;
}

export default function GarmentGrid({
  garments,
  onChange,
  priceList,
  brandColor,
  garmentList,
  showPrices = true,
  countryCode = null,
}: GarmentGridProps) {
  const { tGarment } = useI18n();
  const [lastTapped, setLastTapped] = useState<string | null>(null);

  const addQty = useCallback((name: string) => {
    setLastTapped(name);
    const next = { ...garments };
    next[name] = { qty: (next[name]?.qty ?? 0) + 1 };
    onChange(next);
    setTimeout(() => setLastTapped(null), 150);
  }, [garments, onChange]);

  const removeOne = useCallback((name: string) => {
    const current = garments[name]?.qty ?? 0;
    const next = { ...garments };
    if (current <= 1) delete next[name];
    else next[name] = { qty: current - 1 };
    onChange(next);
  }, [garments, onChange]);

  const inactiveBg = `color-mix(in srgb, ${brandColor} 4%, white)`;
  const activeBg = `color-mix(in srgb, ${brandColor} 14%, white)`;

  return (
    <div className="pos-garment-grid-flat">
      {garmentList.map((name) => {
        const entry = garments[name];
        const active = !!entry && entry.qty > 0;
        const price = isUnpricedGarment(name) ? 0 : (priceList[name] ?? 0);
        const isAnimating = lastTapped === name;

        return (
          <div
            key={name}
            className={`pos-garment-tile ${isAnimating ? "chip-select" : ""}`}
            style={{
              backgroundColor: active ? activeBg : inactiveBg,
              borderColor: active ? brandColor : "var(--border)",
              color: active ? brandColor : "var(--text)",
              position: "relative",
              overflow: "visible",
              padding: 0,
            }}
          >
            <button
              type="button"
              onClick={() => addQty(name)}
              style={{
                position: "relative",
                width: "100%",
                minHeight: "56px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                color: "inherit",
                padding: "1.4rem 0.375rem 0.75rem",
              }}
            >
              <span className="pos-tile-name">{tGarment(name)}</span>
              {showPrices && !isUnpricedGarment(name) && price > 0 && (
                <span className="pos-tile-price">{formatLaundryMoney(price, countryCode)}</span>
              )}
            </button>

            {active && (
              <span
                className="pos-tile-badge"
                style={{
                  backgroundColor: brandColor,
                  color: onBrand(brandColor),
                  top: "0.2rem",
                  left: "0.2rem",
                  right: "auto",
                }}
              >
                ×{entry.qty}
              </span>
            )}

            {active && (
              <button
                type="button"
                className="pos-tile-minus"
                aria-label="−"
                onClick={() => removeOne(name)}
              >
                <span
                  className="pos-tile-minus-mark"
                  style={{ backgroundColor: brandColor, color: onBrand(brandColor) }}
                >
                  −
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
