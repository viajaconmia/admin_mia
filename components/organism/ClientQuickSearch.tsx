"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { fetchAgentes } from "@/services/agentes";
import Modal from "@/components/organism/Modal";
import { FichaResumen } from "@/components/organism/FichaResumen";
import { Agente } from "@/types";
import Button from "@/components/atom/Button";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

export function ClientQuickSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Agente[]>([]);
  const [selected, setSelected] = useState<Agente | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fichaItem, setFichaItem] = useState<Agente | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { hasPermission } = usePermiso();

  if (!hasPermission(PERMISOS.COMPONENTES.BOTON.FICHA_CLIENTE)) return null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (value: string) => {
    setSearchTerm(value);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetchAgentes({ client: value } as any, {} as any, (data) => {
        const term = value.toUpperCase();
        const filtered = data
          .filter(
            (c) =>
              c.nombre_agente_completo.toUpperCase().includes(term) ||
              c.correo?.toUpperCase().includes(term) ||
              c.id_agente.toUpperCase().replaceAll("-", "").includes(term.replaceAll("-", "")),
          )
          .slice(0, 8);
        setResults(filtered);
        setShowDropdown(filtered.length > 0);
        setLoading(false);
      });
    }, 400);
  };

  const handleSelect = (agente: Agente) => {
    setSelected(agente);
    setSearchTerm(agente.nombre_agente_completo);
    setShowDropdown(false);
  };

  const handleBuscar = () => {
    if (selected) {
      setFichaItem(selected);
      setSearchTerm("");
      setSelected(null);
      setResults([]);
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative flex items-center gap-2">
        {/* Input */}
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none">
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            className="flex rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-56"
          />

          {/* Dropdown */}
          {showDropdown && results.length > 0 && (
            <ul className="absolute top-full left-0 mt-1 w-72 z-50 bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto text-sm">
              {results.map((c) => (
                <li
                  key={c.id_agente}
                  onClick={() => handleSelect(c)}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-100 flex flex-col border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-800">{c.nombre_agente_completo}</span>
                  <span className="text-xs text-gray-400">{c.correo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <Button size="sm" variant="secondary" onClick={handleBuscar}>
            Ver Ficha
          </Button>
        )}
      </div>

      {fichaItem &&
        createPortal(
          <Modal
            onClose={() => setFichaItem(null)}
            title={`Ficha — ${fichaItem.nombre_agente_completo}`}
            subtitle="Resumen general del agente"
          >
            <FichaResumen id_agente={fichaItem.id_agente} notas={fichaItem.notas} />
          </Modal>,
          document.body,
        )}
    </>
  );
}
