"use client";

import React, { useState, useEffect, useRef } from "react";
import { Spinner } from "@phosphor-icons/react";
import { buscarComposicoes, ItemComposicao } from "@/lib/api/composicoes";
import { BaseItemRow } from "@/components/bases/BaseItemRow";

interface CompositionAutocompleteProps {
  value: string;
  onSelect: (composition: ItemComposicao) => void;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  fontePadrao?: string;
}

export function CompositionAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = "Digite para buscar no catálogo...",
  className = "",
  fontePadrao = "SINAPI"
}: CompositionAutocompleteProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ItemComposicao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    if (searchTimeout) clearTimeout(searchTimeout);

    if (newValue.length >= 3) {
      setIsOpen(true);
      const timeout = setTimeout(async () => {
        setIsSearching(true);
        try {
          const data = await buscarComposicoes(newValue, fontePadrao);
          setResults(data || []);
        } catch (error) {
          console.error("Erro na busca de composições:", error);
        } finally {
          setIsSearching(false);
        }
      }, 400);
      setSearchTimeout(timeout);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (comp: ItemComposicao) => {
    onSelect(comp);
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value.length >= 3 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none text-sm focus:text-brand-primary font-medium"
      />

      {isOpen && (
        <div className="absolute left-0 top-full z-[100] w-[500px] bg-white border border-border rounded-lg shadow-xl mt-1 overflow-hidden">
          {isSearching ? (
            <div className="p-4 text-center flex items-center justify-center gap-2 text-text-muted text-xs">
              <Spinner size={16} className="animate-spin text-brand-primary" />
              Buscando no catálogo...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border bg-slate-50 p-2 space-y-2">
              {results.map((comp) => (
                <BaseItemRow 
                  key={`${comp.codigo_composicao}-${comp.fonte}`}
                  item={comp}
                  onClick={handleSelect}
                  className="shadow-sm border-slate-200"
                />
              ))}
            </div>
          ) : value.length >= 3 && (
            <div className="p-4 text-center text-text-muted text-xs italic">
              Nenhuma composição encontrada para "{value}"
            </div>
          )}
          
          {results.length > 0 && (
            <div className="p-2 bg-white border-t border-border text-[9px] text-text-muted text-center uppercase font-bold">
              {results.length} resultados encontrados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
