"use client";

interface KemkvittoLogoProps {
  color?: string;
  iconBg?: string;
  size?: "sm" | "md" | "lg";
}

export default function KemkvittoLogo({
  color = "#0891b2",
  iconBg,
  size = "md",
}: KemkvittoLogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg", gap: "gap-2" },
    md: { icon: 36, text: "text-3xl", gap: "gap-3" },
    lg: { icon: 52, text: "text-5xl", gap: "gap-4" },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap}`}>
      {/* Receipt with checkmark icon */}
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: s.icon,
          height: s.icon,
          backgroundColor: iconBg ?? color,
        }}
      >
        <svg
          width={s.icon * 0.55}
          height={s.icon * 0.55}
          viewBox="0 0 20 20"
          fill="none"
        >
          <rect
            x="3"
            y="1"
            width="14"
            height="17"
            rx="1.5"
            stroke="white"
            strokeWidth="1.8"
            fill="none"
          />
          <path
            d="M7 10l2.5 2.5L13 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        className={`${s.text} font-extrabold tracking-tight`}
        style={{
          fontFamily: "'Syne', sans-serif",
          color: color,
        }}
      >
        kemkvitto
      </span>
    </div>
  );
}
