"use client";

interface KemkvittoLogoProps {
  color?: string;
  size?: "sm" | "md" | "lg";
}

export default function KemkvittoLogo({
  color = "#0891b2",
  size = "md",
}: KemkvittoLogoProps) {
  // White variant: use the transparent PNG (exact brand asset, white pixels)
  if (color === "white") {
    const heights = { sm: 22, md: 36, lg: 58 };
    const h = heights[size];
    return (
      <img
        src="/kemkvitto-logo-white.png"
        height={h}
        alt="kemkvitto"
        style={{ display: "block", width: "auto" }}
      />
    );
  }

  // Coloured variant: SVG icon + text, adapts to any brand color
  const sizes = {
    sm: { iconH: 20, iconW: 15, fontSize: "1.0625rem", gap: "0.25rem", strokeW: 1.6 },
    md: { iconH: 32, iconW: 24, fontSize: "1.625rem",  gap: "0.35rem", strokeW: 1.6 },
    lg: { iconH: 52, iconW: 39, fontSize: "2.625rem",  gap: "0.55rem", strokeW: 1.5 },
  };
  const s = sizes[size];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      <svg
        width={s.iconW}
        height={s.iconH}
        viewBox="0 0 18 24"
        fill="none"
        style={{ display: "block", flexShrink: 0, overflow: "visible" }}
      >
        <path
          d="M0,0 H18 V18 H12 V24 H0 Z"
          stroke={color}
          strokeWidth={s.strokeW}
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          x={2.5} y={3} width={5} height={5.5}
          stroke={color}
          strokeWidth={s.strokeW * 0.85}
          fill="none"
        />
      </svg>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: s.fontSize,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: color,
        }}
      >
        kemkvitto
      </span>
    </div>
  );
}
