"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

export interface GarmentEntry {
  qty: number;
}

interface GarmentGridProps {
  garments: Record<string, GarmentEntry>;
  onChange: (garments: Record<string, GarmentEntry>) => void;
  priceList: Record<string, number>;
  brandColor: string;
  garmentList: string[];
}

export default function GarmentGrid({
  garments,
  onChange,
  priceList,
  brandColor,
  garmentList,
}: GarmentGridProps) {
  const { tGarment } = useI18n();
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const addQty = useCallback((name: string, qty: number) => {
    setLastTapped(name);
    const next = { ...garments };
    next[name] = { qty: (next[name]?.qty ?? 0) + qty };
    onChange(next);
    setTimeout(() => setLastTapped(null), 150);
  }, [garments, onChange]);

  const startLongPress = useCallback((name: string) => {
    const timer = setTimeout(() => {
      const next = { ...garments };
      delete next[name];
      onChange(next);
      setLastTapped(null);
    }, 500);
    setLongPressTimer(timer);
  }, [garments, onChange]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Slightly tint inactive tiles so the brand color shows even when window is focused
  const inactiveBg = `color-mix(in srgb, ${brandColor} 4%, white)`;
  const activeBg = `color-mix(in srgb, ${brandColor} 14%, white)`;
  const cornerBtnBase: React.CSSProperties = {
    position: "absolute",
    zIndex: 2,
    border: "none",
    borderRadius: "0.3rem",
    fontSize: "0.625rem",
    fontWeight: 800,
    lineHeight: 1,
    padding: "0.2rem 0.3rem",
    cursor: "pointer",
    pointerEvents: "auto",
  };

  return (
    <div className="pos-garment-grid-flat">
      {garmentList.map((name) => {
        const entry = garments[name];
        const active = !!entry && entry.qty > 0;
        const price = priceList[name] ?? 0;
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
              overflow: "hidden",
              padding: 0,
              cursor: "default",
            }}
          >
            {/* Full-tile main tap area */}
            <button
              type="button"
              onClick={() => addQty(name, 1)}
              onMouseDown={() => active && startLongPress(name)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => active && startLongPress(name)}
              onTouchEnd={cancelLongPress}
              title={active ? "Long-press to remove" : undefined}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                padding: "0.375rem 1.75rem 0.375rem 0.375rem",
              }}
            >
              <span className="pos-tile-name">{tGarment(name)}</span>
              {price > 0 && (
                <span className="pos-tile-price">{price} kr</span>
              )}
            </button>

            {/* Qty badge — top left */}
            {active && (
              <span
                className="pos-tile-badge"
                style={{
                  backgroundColor: brandColor,
                  top: "0.25rem",
                  left: "0.25rem",
                  right: "auto",
                }}
              >
                ×{entry.qty}
              </span>
            )}

            {/* +5 — top right */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); addQty(name, 5); }}
              title="Add 5"
              style={{
                ...cornerBtnBase,
                top: "0.3rem",
                right: "0.3rem",
                backgroundColor: active
                  ? `color-mix(in srgb, ${brandColor} 20%, white)`
                  : "rgba(0,0,0,0.06)",
                color: active ? brandColor : "var(--text-light)",
              }}
            >
              +5
            </button>

            {/* +10 — bottom right */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); addQty(name, 10); }}
              title="Add 10"
              style={{
                ...cornerBtnBase,
                bottom: "0.3rem",
                right: "0.3rem",
                backgroundColor: active
                  ? `color-mix(in srgb, ${brandColor} 20%, white)`
                  : "rgba(0,0,0,0.06)",
                color: active ? brandColor : "var(--text-light)",
              }}
            >
              +10
            </button>
          </div>
        );
      })}
    </div>
  );
}
