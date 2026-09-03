"use client";

import { useState } from "react";
import { TextAreaInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  textoACopiar: string;
  omitido: boolean;
  onToggleOmitir: () => void;
};

export function ObservacionesCfdi({
  value,
  onChange,
  placeholder,
  textoACopiar,
  omitido,
  onToggleOmitir,
}: Props) {
  const { success, error } = useAlert();
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(textoACopiar);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      success("Observación copiada");
    } catch {
      error("No se pudo copiar la observación");
    }
  };

  return (
    <div>
      <TextAreaInput
        label="Observación personalizada"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
      />

      <div className="flex items-center gap-2 mt-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleCopiar}>
          {copiado ? "Copiado" : "Copiar"}
        </Button>

        <button
          type="button"
          onClick={onToggleOmitir}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
            omitido
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-gray-300 bg-white hover:bg-gray-50"
          }`}
        >
          {omitido ? "Observación desactivada" : "No poner observación"}
        </button>

        {omitido && <span className="text-[11px] text-red-600">No se enviará Observations.</span>}
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {omitido
          ? "Observación desactivada: se enviará Observations vacío."
          : "Deja vacío para usar la descripción por defecto."}
      </p>
    </div>
  );
}
