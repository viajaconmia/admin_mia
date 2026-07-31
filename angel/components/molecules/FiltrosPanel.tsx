"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Cols = 2 | 3 | 4 | 5;

const COLS_CLASS: Record<Cols, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
};

type Props = {
  always: ReactNode;
  extra?: ReactNode;
  cols?: Cols;
  labelMas?: string;
  labelMenos?: string;
};

export function FiltrosPanel({
  always,
  extra,
  cols = 4,
  labelMas = "Más filtros",
  labelMenos = "Menos filtros",
}: Props) {
  const [open, setOpen] = useState(false);
  const gridClass = `grid gap-4 ${COLS_CLASS[cols]}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
      <div className="flex items-end gap-4">
        <div className={`flex-1 ${gridClass}`}>{always}</div>
        {extra && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 whitespace-nowrap pb-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {open ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {open ? labelMenos : labelMas}
          </button>
        )}
      </div>

      {open && extra && (
        <div className={`${gridClass} border-t border-gray-100 pt-3`}>
          {extra}
        </div>
      )}
    </div>
  );
}
