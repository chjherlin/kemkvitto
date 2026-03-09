"use client";

import { useState } from "react";

interface ReceiptNumberControlProps {
  value: number;
  onChange: (n: number) => void;
  onReset: (n: number) => void;
  brandColor: string;
}

export default function ReceiptNumberControl({
  value,
  onChange,
  onReset,
  brandColor,
}: ReceiptNumberControlProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showResetInput, setShowResetInput] = useState(false);
  const [resetValue, setResetValue] = useState("1");

  function handleReset() {
    if (!showResetInput) {
      setResetValue(String(value));
      setShowResetInput(true);
      return;
    }
    const num = parseInt(resetValue) || 1;
    onReset(num);
    setShowResetInput(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-xl border-2 px-4 py-3"
          style={{ borderColor: brandColor }}
        >
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Kvitto
          </span>
          <span className="text-sm" style={{ color: "var(--border-strong)" }}>
            #
          </span>
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 1)}
            className="font-receipt w-24 bg-transparent text-right text-2xl font-bold focus:outline-none"
            style={{ color: brandColor }}
          />
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="touch-target rounded-xl border-2 px-4 py-3 text-sm font-medium"
          style={{
            borderColor: showResetInput ? brandColor : "var(--border)",
            color: showResetInput ? brandColor : "var(--text-muted)",
          }}
        >
          {showResetInput ? "Bekräfta" : "Nollställ"}
        </button>
        {showResetInput && (
          <input
            type="number"
            min={1}
            value={resetValue}
            onChange={(e) => setResetValue(e.target.value)}
            autoFocus
            placeholder="Nytt startnr"
            className="font-receipt w-24 rounded-xl border-2 bg-white px-3 py-3 text-center text-lg font-bold"
            style={{ borderColor: brandColor }}
          />
        )}
        {showResetInput && (
          <button
            type="button"
            onClick={() => setShowResetInput(false)}
            className="text-sm"
            style={{ color: "var(--text-light)" }}
          >
            Avbryt
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          ?
        </button>
      </div>
      {showHelp && (
        <div
          className="animate-fade-up rounded-xl p-4 text-sm leading-relaxed"
          style={{
            backgroundColor: `color-mix(in srgb, ${brandColor} 6%, white)`,
            color: "var(--text-muted)",
          }}
        >
          Kvittonumret följer automatiskt efter första numret du skriver in.
          Du kan när som helst skriva in ett annat nummer — nästa kvitto
          fortsätter från det ursprungliga numret. Tryck{" "}
          <strong>Nollställ</strong> för att börja om från valfritt nummer.
        </div>
      )}
    </div>
  );
}
