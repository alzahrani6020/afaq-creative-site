'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { countries } from '@/lib/catalog/locations';
import { CountryOption } from '@/lib/catalog/types';

function FlagImage({ country, size = 24 }: { country: CountryOption; size?: number }) {
  const code = country.value.toLowerCase();
  return (
    <span className="inline-flex items-center justify-center shrink-0" style={{ width: size, height: Math.round(size * 0.75) }}>
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width={size}
        height={Math.round(size * 0.75)}
        alt={`علم ${country.label}`}
        loading="lazy"
        className="block rounded-[2px] object-cover shadow-sm"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = 'inline';
        }}
      />
      <span className="hidden text-xs text-white/60">{country.value}</span>
    </span>
  );
}

interface CountrySearchProps {
  value: string;
  onChange: (country: CountryOption) => void;
  error?: string;
}

export function CountrySearch({ value, onChange, error }: CountrySearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = countries.find((c) => c.value === value);

  const filtered = countries.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.label.toLowerCase().includes(q) ||
      c.value.toLowerCase().includes(q) ||
      c.labelEn?.toLowerCase().includes(q) ||
      c.aliases?.some((alias) => alias.toLowerCase().includes(q)) ||
      false
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: CountryOption) => {
    onChange(country);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-5 py-3 rounded-xl bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} text-white focus:outline-none focus:border-afaq-gold/50 flex items-center justify-between text-right`}
      >
        <span className={selected ? 'text-white flex items-center gap-2' : 'text-white/30'}>
          {selected ? (
            <>
              <FlagImage country={selected} size={24} />
              <span>{selected.label}</span>
            </>
          ) : 'اختر الدولة *'}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-afaq-bg border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div className="relative border-b border-white/10">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن الدولة..."
              className="w-full pr-10 pl-4 py-3 bg-white/5 text-white placeholder-white/30 focus:outline-none text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-white/40 text-sm text-center">لا توجد نتائج</div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.value}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full text-right px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center justify-between ${value === country.value ? 'bg-afaq-gold/10' : ''}`}
                >
                  <span className="text-white text-sm flex items-center gap-2">
                    <FlagImage country={country} size={22} />
                    <span>{country.label}</span>
                  </span>
                  <span className="text-white/40 text-xs">+{country.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
