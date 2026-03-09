"use client";

import { useState, useEffect, useRef } from "react";

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
      const res = await fetch(`/api/receipts/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const customers = data.customers || [];
      setResults(customers);
      setShowDropdown(customers.length > 0);
    }, 300);
  }

  function selectCustomer(c: CustomerResult) {
    onSelect(c);
    setShowDropdown(false);
  }

  return (
    <div ref={containerRef} className="pos-customer-search">
      {/* Name — full width, larger, with search icon */}
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
          placeholder="Sök eller skriv kundnamn..."
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
          </div>
        )}
      </div>

      {/* Phone + Email row */}
      <div className="pos-customer-inputs">
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Telefon"
          className="pos-input"
          style={{ flex: 1 }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="E-post"
          className="pos-input"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}
