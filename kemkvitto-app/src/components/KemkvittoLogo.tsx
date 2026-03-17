"use client";

interface KemkvittoLogoProps {
  color?: string;
  size?: "sm" | "md" | "lg";
}

export default function KemkvittoLogo({
  color = "#0891b2",
  size = "md",
}: KemkvittoLogoProps) {
  const sizes = {
    //                         iconH  iconW  fontSize       gap       stroke
    sm: { iconH: 20, iconW: 15, fontSize: "1.0625rem", gap: "0.25rem", strokeW: 2.6 },
    md: { iconH: 32, iconW: 24, fontSize: "1.625rem",  gap: "0.35rem", strokeW: 2.6 },
    lg: { iconH: 52, iconW: 39, fontSize: "2.625rem",  gap: "0.55rem", strokeW: 2.4 },
  };

  const s = sizes[size];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      {/*
        Receipt icon — portrait rectangle, notch at bottom-right.
        ViewBox 18×24. Tight corner radius (1.5 units).
        Notch: x=12→18, y=18→24 (6 wide, 6 tall).
        Thick stroke gives the bold feel of the reference logo.
      */}
      <svg
        width={s.iconW}
        height={s.iconH}
        viewBox="0 0 18 24"
        fill="none"
        style={{ display: "block", flexShrink: 0 }}
      >
        <path
          d="M1.5,0 H16.5 Q18,0 18,1.5 V18 H12 V24 H1.5 Q0,24 0,22.5 V1.5 Q0,0 1.5,0 Z"
          stroke={color}
          strokeWidth={s.strokeW}
          strokeLinejoin="round"
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
