"use client";

import { useState, useMemo } from 'react';
import { countries, countryAliases, normalizeStr, Country } from '@/lib/countries';

interface InputAutocompleteProps {
  onGuess: (isoCode: string) => void;
  disabled: boolean;
}

export default function InputAutocomplete({ onGuess, disabled }: InputAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<unknown[]>([]);

  // Pre-calculate normalized arrays
  const searchIndex = useMemo(() => {
    const list = countries.map(c => ({
      ...c,
      normalizedName: normalizeStr(c.name)
    }));

    const aliasList = Object.entries(countryAliases).map(([alias, iso]) => ({
      alias,
      normalizedAlias: normalizeStr(alias),
      iso
    }));

    return { list, aliasList };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.trim().length > 0) {
      const normalizedQuery = normalizeStr(val);

      const exactMatches = searchIndex.list.filter(c => 
        c.normalizedName.includes(normalizedQuery)
      ).map(c => ({ label: c.name, iso: c.id }));

      const aliasMatches = searchIndex.aliasList.filter(a => 
        a.normalizedAlias.includes(normalizedQuery)
      ).map(a => {
        const country = searchIndex.list.find(c => c.id === a.iso);
        return { 
          label: `${country?.name || a.iso} (${a.alias})`, 
          iso: a.iso 
        };
      });

      // Combine and filter out duplicate ISOs
      const combined = [...exactMatches, ...aliasMatches];
      const unique = Array.from(new Map(combined.map(item => [item.iso, item])).values());
      
      setSuggestions(unique);
    } else {
      setSuggestions([]);
    }
  };

  const submitGuess = (isoCode: string) => {
    onGuess(isoCode);
    setQuery("");
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      submitGuess((suggestions[0] as any).iso);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto z-10">
      <input 
        type="text" 
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? "Você já chegou!" : "Digite o nome do país..."}
        className="w-full px-4 py-3 border-2 border-green-400 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 bg-white text-green-900 placeholder:text-green-300 disabled:opacity-50"
      />
      {suggestions.length > 0 && (
        <ul className="absolute top-14 left-0 right-0 bg-white border border-green-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-20">
          {suggestions.map((c: any) => (
            <li 
              key={c.iso + c.label} 
              className="px-4 py-2 hover:bg-green-100 cursor-pointer text-green-800"
              onClick={() => submitGuess(c.iso)}
            >
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
