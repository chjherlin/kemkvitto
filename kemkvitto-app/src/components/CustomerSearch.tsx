"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface CustomerHit {
  email: string;
}

interface CustomerSearchProps {
  email: string;
  onEmailChange: (email: string) => void;
}

export default function CustomerSearch({ email, onEmailChange }: CustomerSearchProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function search(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 4) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(value.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        const hits = (data.customers || []) as CustomerHit[];
        setResults(hits);
        setOpen(hits.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 300);
  }

  return (
    <div ref={containerRef} className="pos-customer-search">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(event) => search(event.target.value)}
          placeholder={t("customer.searchPlaceholder")}
          autoComplete="off"
          className="pos-input"
          style={{ width: "100%", minHeight: "56px" }}
        />
        {open && results.length > 0 && (
          <div className="pos-customer-dropdown">
            {results.map((hit) => (
              <button
                key={hit.email}
                type="button"
                onClick={() => {
                  onEmailChange(hit.email);
                  setQuery("");
                  setOpen(false);
                  setResults([]);
                }}
                className="pos-customer-option"
                style={{ minHeight: "56px", fontSize: "16px" }}
              >
                <span className="font-semibold" style={{ flex: 1 }}>{hit.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder={t("customer.email")}
        autoComplete="off"
        className="pos-input"
        style={{ width: "100%", minHeight: "56px" }}
      />
    </div>
  );
}
