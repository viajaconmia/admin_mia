"use client";

import React, { useMemo, useState } from "react";
import { X, Search, FileText, Loader2, Unlink } from "lucide-react";
import { Table5 } from "@/components/Table5";
import Button from "@/components/atom/Button";

type BuscarUuidRow = {
  id_factura_proveedor: string;
  codigo_confirmacion: string;
  uuid_factura: string;
  id_solicitud: number;
  monto: number;
  estado?: string;
};

interface BuscarUuidFacturaModalProps {
  open: boolean;
  loading?: boolean;
  uuidFactura: string;
  rows: BuscarUuidRow[];
  onClose: () => void;
  onUuidChange: (value: string) => void;
  onSearch: () => void;
  onDesasignar?: (row: BuscarUuidRow) => Promise<void>;
}

function formatMoney(n: any) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(num);
}

export default function BuscarUuidFacturaModal({
  open,
  loading = false,
  uuidFactura,
  rows,
  onClose,
  onUuidChange,
  onSearch,
  onDesasignar,
}: BuscarUuidFacturaModalProps) {
  const [desasignandoIds, setDesasignandoIds] = useState<Set<string>>(
    new Set(),
  );

  const customColumns = useMemo(
    () => [
      "codigo_confirmacion",
      "uuid_factura",
      "id_solicitud",
      "monto",
      "estado",
      "acciones",
    ],
    [],
  );

  const renderers = useMemo<
    Record<string, React.FC<{ value: any; item: any; index: number }>>
  >(
    () => ({
      codigo_confirmacion: ({ value }) => (
        <div className="w-full flex justify-center">
          <span className="font-medium text-gray-800">
            {String(value ?? "—")}
          </span>
        </div>
      ),

      uuid_factura: ({ value }) => (
        <div className="w-full flex justify-center">
          <span
            className="font-mono text-xs bg-gray-50 px-2 py-1 rounded-md break-all max-w-[200px] md:max-w-none"
            title={String(value ?? "")}
          >
            {value ? String(value) : "—"}
          </span>
        </div>
      ),

      id_solicitud: ({ value }) => (
        <div className="w-full flex justify-center">
          <span className="text-gray-700">{String(value ?? "—")}</span>
        </div>
      ),

      monto: ({ value }) => (
        <div className="w-full flex justify-center">
          <span className="font-semibold text-green-700">
            {formatMoney(value)}
          </span>
        </div>
      ),

      acciones: ({ item }) => {
        const { acciones } = item;
        const rowKey = String(item?.id_solicitud ?? item?.uuid_factura ?? "");
        const isDesasignando = desasignandoIds.has(rowKey);
        console.log(item);

        return (
          <div className="w-full flex justify-center px-4">
            <Button
              variant="warning"
              size="sm"
              icon={isDesasignando ? Loader2 : Unlink}
              disabled={isDesasignando || !onDesasignar}
              onClick={async () => {
                if (!onDesasignar || isDesasignando) return;
                const ok = confirm(
                  `¿Desasignar la factura de la solicitud ${item?.id_solicitud}?`,
                );
                if (!ok) return;
                setDesasignandoIds((prev) => new Set([...prev, rowKey]));
                try {
                  await onDesasignar(item as BuscarUuidRow);
                } catch (err: any) {
                  alert(err?.message || "Error al desasignar");
                } finally {
                  setDesasignandoIds((prev) => {
                    const next = new Set(prev);
                    next.delete(rowKey);
                    return next;
                  });
                }
              }}
            >
              {isDesasignando ? "Desasignando…" : "Desasignar"}
            </Button>
          </div>
        );
      },
    }),
    [desasignandoIds, onDesasignar],
  );

  const defaultSort = useMemo(
    () => ({ key: "codigo_confirmacion", sort: false }),
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl transition-all duration-200 animate-in fade-in zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-50 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Buscar factura por UUID
              </h2>
              <p className="text-xs text-gray-500">
                Ingresa el identificador único de la factura
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Search Section */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center justify-center max-w-xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={uuidFactura}
                onChange={(e) => onUuidChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearch();
                }}
                placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
            </div>

            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto border border-blue-200 bg-blue-50 px-6 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
              onClick={onSearch}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>

          {/* Results / Loading / Empty */}
          <div className="min-h-[280px]">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm">Buscando coincidencias...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-center">
                <Search className="h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  No se encontraron coincidencias
                </p>
                <p className="text-xs text-gray-400">
                  Verifica que el UUID sea correcto
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <Table5<any>
                  registros={rows as any}
                  renderers={renderers}
                  defaultSort={defaultSort as any}
                  customColumns={customColumns}
                  fillHeight
                  maxHeight="55vh"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
