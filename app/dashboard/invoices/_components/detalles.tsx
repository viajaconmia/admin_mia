"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { Table5 } from "@/components/Table5";
import {
  facturasService,
  DetalleFacturaResponse,
} from "@/angel/services/facturas";
import { URL, API_KEY } from "@/lib/constants";
import { fmtMoney } from "@/angel/lib/format/number";
import { formatDate } from "@/helpers/formater";

interface Props {
  open: boolean;
  onClose: () => void;
  id_factura: string | null;
  onDelete?: () => void;
}

function Badge({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "green" | "amber" | "blue";
}) {
  const toneMap = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${toneMap[tone]}`}
    >
      {text}
    </span>
  );
}

const ModalDetalleFactura: React.FC<Props> = ({
  open,
  onClose,
  id_factura,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<DetalleFacturaResponse | null>(null);
  const [eliminandoRelacion, setEliminandoRelacion] = useState<string | null>(
    null,
  );

  // ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Fetch
  useEffect(() => {
    if (!open || !id_factura) return;
    setLoading(true);
    setError("");
    setData(null);
    facturasService
      .getDetalleFactura(id_factura)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.message || "Error al cargar detalles"))
      .finally(() => setLoading(false));
  }, [open, id_factura]);

  const eliminarRelacion = useCallback(
    async (reserva: DetalleFacturaResponse["reservas"][number]) => {
      if (!reserva.id_relacion || !id_factura) return;
      if (!window.confirm("¿Desasociar esta reserva de la factura?")) return;
      setEliminandoRelacion(reserva.id_relacion);
      try {
        const resp = await fetch(`${URL}/mia/factura/desasociar_reserva`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY || "",
          },
          body: JSON.stringify({
            id_factura,
            id_relacion: reserva.id_relacion,
          }),
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(json?.message || "Error al desasociar");
        onDelete?.();
        setData((prev) =>
          prev
            ? {
                ...prev,
                reservas: prev.reservas.filter(
                  (r) => r.id_relacion !== reserva.id_relacion,
                ),
              }
            : prev,
        );
      } catch (e: any) {
        alert(e.message || "Error al desasociar");
      } finally {
        setEliminandoRelacion(null);
      }
    },
    [id_factura],
  );

  /* ── Reservas ── */
  const reservasRows = useMemo(
    () => (data?.reservas ?? []).map((r) => ({ ...r, acciones: "acciones" })),
    [data],
  );
  const reservasCols = [
    "codigo_confirmacion",
    "proveedor",
    "nombre_agente",
    "nombre_viajero",
    "total",
    "monto_asignado",
    "acciones",
  ];
  const reservasRenderers = useMemo(
    () => ({
      codigo_confirmacion: ({ value }: any) => (
        <span className="font-mono text-[11px]">{value ?? "—"}</span>
      ),
      proveedor: ({ value }: any) => (
        <span className="font-semibold text-gray-900">{value ?? "—"}</span>
      ),
      nombre_agente: ({ value }: any) => <span>{value ?? "—"}</span>,
      nombre_viajero: ({ value }: any) => <span>{value ?? "—"}</span>,
      total: ({ value }: any) => (
        <span className="font-semibold text-blue-700">{fmtMoney(value)}</span>
      ),
      monto_asignado: ({ value }: any) => (
        <span className="font-semibold text-emerald-700">
          {fmtMoney(value)}
        </span>
      ),
      acciones: ({ item }: any) => {
        const eliminando = eliminandoRelacion === item.id_relacion;
        return (
          <button
            type="button"
            onClick={() => eliminarRelacion(item)}
            disabled={eliminando}
            className="inline-flex items-center rounded-md bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {eliminando ? "Desasociando..." : "Desasociar"}
          </button>
        );
      },
    }),
    [eliminandoRelacion, eliminarRelacion],
  );

  /* ── Saldos ── */
  const saldosRows = useMemo(() => data?.saldos ?? [], [data]);
  const saldosCols = [
    "metodo_pago",
    "referencia",
    "fecha_pago",
    "monto",
    "monto_asignado",
    "saldo",
    "is_facturable",
    "is_facturado",
  ];
  const saldosRenderers = useMemo(
    () => ({
      metodo_pago: ({ value }: any) => (
        <Badge text={value ?? "—"} tone="blue" />
      ),
      referencia: ({ value }: any) => (
        <span className="text-[11px] text-gray-600">{value ?? "—"}</span>
      ),
      fecha_pago: ({ value }: any) => <span>{formatDate(value)}</span>,
      monto: ({ value }: any) => (
        <span className="font-semibold">{fmtMoney(value)}</span>
      ),
      monto_asignado: ({ value }: any) => (
        <span className="font-semibold text-emerald-700">
          {fmtMoney(value)}
        </span>
      ),
      saldo: ({ value }: any) => (
        <span className="font-semibold text-amber-700">{fmtMoney(value)}</span>
      ),
      is_facturable: ({ value }: any) => (
        <Badge
          text={Number(value) === 1 ? "Facturable" : "No facturable"}
          tone={Number(value) === 1 ? "green" : "gray"}
        />
      ),
      is_facturado: ({ value }: any) => (
        <Badge
          text={Number(value) === 1 ? "Facturado" : "No facturado"}
          tone={Number(value) === 1 ? "green" : "amber"}
        />
      ),
    }),
    [],
  );

  /* ── Pagos ── */
  const pagosRows = useMemo(
    () => (data?.pagos ?? []).filter((p) => p.id_pago !== null),
    [data],
  );
  const pagosCols = [
    "metodo_de_pago",
    "fecha_pago",
    "total",
    "monto_asignado",
    "estado",
    "saldo_aplicado",
    "acciones",
  ];
  const pagosRenderers = useMemo(
    () => ({
      metodo_de_pago: ({ value }: any) => (
        <Badge text={value ?? "—"} tone="blue" />
      ),
      fecha_pago: ({ value }: any) => <span>{formatDate(value)}</span>,
      total: ({ value }: any) => (
        <span className="font-semibold">{fmtMoney(value)}</span>
      ),
      monto_asignado: ({ value }: any) => (
        <span className="font-semibold text-emerald-700">
          {fmtMoney(value)}
        </span>
      ),
      estado: ({ value }: any) => <Badge text={value ?? "—"} tone="gray" />,
      saldo_aplicado: ({ value }: any) => (
        <span className="font-semibold text-emerald-700">
          {fmtMoney(value)}
        </span>
      ),
      acciones: ({ item }: any) => (
        <button
          type="button"
          onClick={() =>
            item.link_pago &&
            window.open(item.link_pago, "_blank", "noopener,noreferrer")
          }
          disabled={!item.link_pago}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Link
        </button>
      ),
    }),
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">
            Detalles de factura
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-60px)] overflow-y-auto p-5 space-y-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando detalles...
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
              {error}
            </p>
          )}

          {!loading && !error && data && (
            <>
              {/* Reservas */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Reservas ({reservasRows.length})
                </p>
                {reservasRows.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    Sin reservas asociadas.
                  </p>
                ) : (
                  <Table5<any>
                    registros={reservasRows as any}
                    customColumns={reservasCols as any}
                    renderers={reservasRenderers as any}
                    exportButton={false}
                    fillHeight={false}
                    maxHeight="260px"
                  />
                )}
              </div>

              {/* Saldos */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Saldos ({saldosRows.length})
                </p>
                {saldosRows.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin saldos.</p>
                ) : (
                  <Table5<any>
                    registros={saldosRows as any}
                    customColumns={saldosCols as any}
                    renderers={saldosRenderers as any}
                    exportButton={false}
                    fillHeight={false}
                    maxHeight="260px"
                  />
                )}
              </div>

              {/* Pagos */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Pagos ({pagosRows.length})
                </p>
                {pagosRows.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    Sin pagos registrados.
                  </p>
                ) : (
                  <Table5<any>
                    registros={pagosRows as any}
                    customColumns={pagosCols as any}
                    renderers={pagosRenderers as any}
                    exportButton={false}
                    fillHeight={false}
                    maxHeight="260px"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleFactura;
