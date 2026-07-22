"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  count: number;
  onLimpiar: () => void;
  children?: ReactNode;
};

export function AccionesSeleccion({ count, onLimpiar, children }: Props) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 shadow-2xl ring-1 ring-white/10">
        <span className="text-sm font-semibold text-white">
          {count} {count === 1 ? "seleccionado" : "seleccionados"}
        </span>

        <div className="h-4 w-px bg-white/20" />

        <div className="flex items-center gap-2">{children}</div>

        <div className="h-4 w-px bg-white/20" />

        <button
          type="button"
          onClick={onLimpiar}
          className="flex items-center justify-center rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Limpiar selección"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
