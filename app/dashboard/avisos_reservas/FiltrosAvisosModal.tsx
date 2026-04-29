"use client";

import React from "react";
import { X } from "lucide-react";
import Button from "@/components/atom/Button";

export type AvisosFilters = {
  id_agente: string;
  nombre_agente: string;
  hotel: string;
  codigo_reservacion: string;
  traveler: string;
  tipo_hospedaje: string;
};

export const EMPTY_AVISOS_FILTERS: AvisosFilters = {
  id_agente: "",
  nombre_agente: "",
  hotel: "",
  codigo_reservacion: "",
  traveler: "",
  tipo_hospedaje: "",
};

type Props = {
  open: boolean;
  filters: AvisosFilters;
  onChange: (field: keyof AvisosFilters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function InputWithClear({
  value,
  onChange,
  onClear,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm outline-none"
      />
      <button
        type="button"
        onClick={onClear}
        className="w-11 border-l border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FiltrosAvisosModal({
  open,
  filters,
  onChange,
  onApply,
  onClear,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="ID Agente">
              <InputWithClear
                value={filters.id_agente}
                onChange={(v) => onChange("id_agente", v)}
                onClear={() => onChange("id_agente", "")}
                placeholder="Buscar por ID agente"
              />
            </Field>

            <Field label="Nombre agente">
              <InputWithClear
                value={filters.nombre_agente}
                onChange={(v) => onChange("nombre_agente", v)}
                onClear={() => onChange("nombre_agente", "")}
                placeholder="Buscar por nombre"
              />
            </Field>

            <Field label="Hotel">
              <InputWithClear
                value={filters.hotel}
                onChange={(v) => onChange("hotel", v)}
                onClear={() => onChange("hotel", "")}
                placeholder="Buscar por hotel"
              />
            </Field>

            <Field label="Código de reservación">
              <InputWithClear
                value={filters.codigo_reservacion}
                onChange={(v) => onChange("codigo_reservacion", v)}
                onClear={() => onChange("codigo_reservacion", "")}
                placeholder="Buscar por código"
              />
            </Field>

            <Field label="Viajero">
              <InputWithClear
                value={filters.traveler}
                onChange={(v) => onChange("traveler", v)}
                onClear={() => onChange("traveler", "")}
                placeholder="Buscar por viajero"
              />
            </Field>

            <Field label="Tipo de hospedaje">
              <InputWithClear
                value={filters.tipo_hospedaje}
                onChange={(v) => onChange("tipo_hospedaje", v)}
                onClear={() => onChange("tipo_hospedaje", "")}
                placeholder="Buscar por tipo"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 mt-5">
            <Button
              variant="secondary"
              size="md"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              onClick={onClear}
            >
              Limpiar
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
              onClick={onApply}
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
