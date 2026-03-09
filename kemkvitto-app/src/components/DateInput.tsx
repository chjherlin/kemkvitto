"use client";

interface DateInputProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
  required?: boolean;
  brandColor?: string;
}

// Simple native date input with YYYY-MM-DD display overlay
export default function DateInput({
  value,
  onChange,
  label,
  required,
  brandColor,
}: DateInputProps) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <div className="relative">
        {/* Visible formatted display */}
        <div
          className="touch-target pointer-events-none absolute inset-0 flex items-center px-4 text-lg font-medium"
          style={{ color: value ? "var(--text)" : "var(--text-light)" }}
        >
          <span className={value ? "font-receipt" : ""}>
            {value || "ÅÅÅÅ-MM-DD"}
          </span>
        </div>
        {/* Actual date input — fully interactive but text hidden */}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="touch-target w-full rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium text-transparent"
          style={{
            borderColor: value ? (brandColor || "var(--border)") : "var(--border)",
            colorScheme: "light",
          }}
        />
      </div>
    </div>
  );
}
