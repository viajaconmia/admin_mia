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
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 sm:bottom-6 sm:w-auto">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl bg-gray-900 px-4 py-3 shadow-2xl ring-1 ring-white/10">
        <span className="text-sm font-semibold text-white whitespace-nowrap mr-2">
          {count} {count === 1 ? "seleccionado" : "seleccionados"}
        </span>

        <div className="hidden h-4 w-px bg-white/20 sm:block" />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>

        <div className="hidden h-4 w-px bg-white/20 sm:block" />

        <button
          type="button"
          onClick={onLimpiar}
          className="flex shrink-0 items-center justify-center rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Limpiar selección"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
