"use client";

import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

interface CustomerResult {
  name: string;
  phone: string;
  email: string;
}

interface CustomerSearchProps {
  name: string;
  phone: string;
  email: string;
  onSelect: (customer: { name: string; phone: string; email: string }) => void;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  onEmailChange: (email: string) => void;
}

export default function CustomerSearch({
  name,
  phone,
  email,
  onSelect,
  onNameChange,
  onPhoneChange,
  onEmailChange,
}: CustomerSearchProps) {
  const { t } = useI18n();
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(q: string) {
    onNameChange(q);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      let customers: CustomerResult[] = [];
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          customers = data.customers || [];
        }
      } catch { /* ignore fetch errors */ }

      // Fallback to receipt-based autocomplete
      if (customers.length === 0) {
        try {
          const fallback = await fetch(`/api/receipts/autocomplete?q=${encodeURIComponent(q)}`);
          if (fallback.ok) {
            const fbData = await fallback.json();
            customers = fbData.customers || [];
          }
        } catch { /* ignore */ }
      }

      setResults(customers);
      // Always show dropdown when typing 2+ chars (shows results or "add new")
      setShowDropdown(true);
    }, 300);
  }

  function selectCustomer(c: CustomerResult) {
    onSelect(c);
    setShowDropdown(false);
  }

  return (
    <div ref={containerRef} className="pos-customer-search">
      {/* Name with search icon */}
      <div className="relative">
        <div className="pos-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={t("customer.searchPlaceholder")}
          className="pos-input pos-input-name"
          style={{ width: "100%" }}
        />
        {showDropdown && (
          <div className="pos-customer-dropdown">
            {results.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectCustomer(c)}
                className="pos-customer-option"
              >
                <span className="font-semibold" style={{ flex: 1 }}>{c.name || "—"}</span>
                {c.phone && <span className="text-xs" style={{ color: "var(--text-light)" }}>{c.phone}</span>}
                {c.email && <span className="text-xs" style={{ color: "var(--text-light)" }}>{c.email}</span>}
              </button>
            ))}
            {results.length === 0 && name.length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  onSelect({ name, phone: "", email: "" });
                  setShowDropdown(false);
                }}
                className="pos-customer-option"
                style={{ color: "var(--text-muted)" }}
              >
                <span style={{ flex: 1 }}>
                  <strong>{name}</strong> — {t("customer.addNew")}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Phone + Email — always visible */}
      <div className="pos-customer-inputs">
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder={t("customer.phone")}
          className="pos-input"
          style={{ flex: 1 }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={t("customer.email")}
          className="pos-input"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}
