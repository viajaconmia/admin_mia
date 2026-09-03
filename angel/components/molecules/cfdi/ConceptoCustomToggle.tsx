"use client";

import { TextInput } from "@/components/atom/Input";

type Props = {
  titulo: string;
  activo: boolean;
  onToggle: () => void;
  valor: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint: string;
};

/** Bloque "concepto custom" reutilizable para los 3 modos de facturación
 * (antes copy-pasteado 3 veces en el legacy). */
export function ConceptoCustomToggle({
  titulo,
  activo,
  onToggle,
  valor,
  onChange,
  placeholder,
  hint,
}: Props) {
  return (
    <div className="bg-white border rounded-md p-3 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-gray-900">{titulo}</div>
        <button
          type="button"
          onClick={onToggle}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
            activo
              ? "border-blue-500 bg-blue-600 text-white hover:bg-blue-700"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {activo ? "Custom activo" : "Activar custom"}
        </button>
      </div>
      <div className="mt-3">
        <TextInput
          label="Descripción del concepto"
          value={valor}
          onChange={onChange}
          disabled={!activo}
          placeholder={placeholder}
        />
        <p className="text-[11px] text-gray-500 mt-1">{hint}</p>
      </div>
    </div>
  );
}
