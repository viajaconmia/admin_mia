"use client";

import { InvoiceMode } from "@/angel/lib/cfdi/payload";

const OPCIONES: { value: InvoiceMode; label: string }[] = [
  { value: "consolidada", label: "Consolidada" },
  { value: "detallada_por_grupo", label: "Detallada (por grupo)" },
  { value: "detallada_por_item", label: "Detallada (por ítem)" },
];

type Props = {
  mode: InvoiceMode;
  onChange: (mode: InvoiceMode) => void;
};

export function ModoFacturacionSelector({ mode, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Modo de facturación
      </label>
      <div className="flex flex-wrap gap-2">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.value}
            type="button"
            onClick={() => onChange(opcion.value)}
            className={`px-3 py-2 text-sm rounded-md border ${
              mode === opcion.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {opcion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
