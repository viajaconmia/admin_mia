"use client";

import React, { useMemo } from "react";
import { X } from "lucide-react";
import { Table5 } from "@/components/Table5";
import Button from "@/components/atom/Button";

type BuscarUuidRow = {
  codigo_confirmacion: string;
  uuid_factura: string;
  id_solicitud: string | number;
  monto: number;
};

interface BuscarUuidFacturaModalProps {
  open: boolean;
  loading?: boolean;
  uuidFactura: string;
  rows: BuscarUuidRow[];
  onClose: () => void;
}

function formatMoney(n: any) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
}

export default function BuscarUuidFacturaModal({
  open,
  loading = false,
  uuidFactura,
  rows,
  onClose,
}: BuscarUuidFacturaModalProps) {
  const customColumns = useMemo(
    () => ["codigo_confirmacion", "uuid_factura", "id_solicitud", "monto"],
    [],
  );

  const renderers = useMemo<
    Record<string, React.FC<{ value: any; item: any; index: number }>>
  >(
    () => ({
      codigo_confirmacion: ({ value }) => (
        <span className="font-medium">{String(value ?? "—")}</span>
      ),

      uuid_factura: ({ value }) => (
        <span className="font-mono text-xs" title={String(value ?? "")}>
          {value ? String(value) : "—"}
        </span>
      ),

      id_solicitud: ({ value }) => <span>{String(value ?? "—")}</span>,

      monto: ({ value }) => <span>{formatMoney(value)}</span>,
    }),
    [],
  );

  const defaultSort = useMemo(
    () => ({ key: "codigo_confirmacion", sort: false }),
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div
        className="relative z-10 w-[min(1100px,96vw)] rounded-xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Coincidencias por UUID
            </p>
            <p className="text-xs text-gray-500 break-all">
              UUID: {uuidFactura || "—"}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-9 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Buscando coincidencias...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No se encontraron coincidencias
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200">
              <Table5<any>
                registros={rows as any}
                renderers={renderers}
                defaultSort={defaultSort as any}
                leyenda={`Mostrando ${rows.length} coincidencias`}
                customColumns={customColumns}
                fillHeight
                maxHeight="55vh"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}