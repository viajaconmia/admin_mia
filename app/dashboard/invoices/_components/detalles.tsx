"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  FileText,
  CreditCard,
  Wallet,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants";

/* ===================== Types (flexibles) ===================== */
type Pago = Record<string, any>;
type Saldo = Record<string, any>;
type Reserva = Record<string, any>;

export interface DetalleFacturaData {
  tipo_origen?: string;
  id_origen?: string[];
  pagos?: Pago[];
  saldos?: Saldo[];
  reservas?: Reserva[];
}

interface ModalDetalleFacturaProps {
  open: boolean;
  onClose: () => void;

  /** ✅ SOLO RECIBE id_factura */
  id_factura: string | null;

  /**
   * ✅ opcional: si quieres guardar en el padre la respuesta
   * (lo que dijiste: "aqui lo enviare setDetalleFacturaData")
   */
  setDetalleFacturaData?: (v: DetalleFacturaData | null) => void;

  title?: string;
}

/* ===================== Helpers ===================== */
const safeString = (v: any) => String(v ?? "").trim();

function formatMoney(n: any) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDateSimple(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function openUrl(url?: string | null) {
  const u = safeString(url);
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

/* ===================== UI atoms ===================== */
function Badge({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "green" | "red" | "blue" | "amber";
}) {
  const toneMap: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${toneMap[tone]}`}
    >
      {text}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

function SectionTitle({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {right}
    </div>
  );
}

/* ===================== Modal ===================== */
const ModalDetalleFactura: React.FC<ModalDetalleFacturaProps> = ({
  open,
  onClose,
  id_factura,
  setDetalleFacturaData,
  title = "Detalles de factura",
}) => {
  // Estado fetch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<DetalleFacturaData | null>(null);

  // cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ✅ Fetch interno al abrir / cambiar id_factura
  useEffect(() => {
    if (!open) return;
    if (!id_factura) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        // ⚠️ AJUSTA ESTE ENDPOINT A TU REAL
        const endpoint = `${URL}/mia/factura/detalles_facturas?id_factura=${encodeURIComponent(
  id_factura
)}`;

const resp = await fetch(endpoint, {
  method: "GET",
  signal: controller.signal,
  headers: {
    "x-api-key": API_KEY || "",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    // "Content-Type": "application/json", // <- opcional en GET (no hay body)
    Accept: "application/json",
  },
  cache: "no-store",
});

const json = await resp.json().catch(() => null);

if (!resp.ok) {
  throw new Error(json?.message || `Error HTTP: ${resp.status}`);
}

// json debería ser tu objeto: {tipo_origen,id_origen,pagos,saldos,reservas}
// o a veces viene envuelto. Ajusta si tu backend lo envuelve.
const resolved = (json?.data as any) ?? json;

setData(resolved);
setDetalleFacturaData?.(resolved);

      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("❌ Error cargando detalles factura:", e);
        setError(e?.message || "Error desconocido");
        setDetalleFacturaData?.(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [open, id_factura, setDetalleFacturaData]);

  // Render data
  const payload = data ?? {};
  const facturaId = payload?.id_origen?.[0] ?? id_factura ?? "—";

  const pagos = Array.isArray(payload?.pagos) ? payload.pagos : [];
  const saldos = Array.isArray(payload?.saldos) ? payload.saldos : [];
  const reservas = Array.isArray(payload?.reservas) ? payload.reservas : [];

  const totalPagos = useMemo(
    () => pagos.reduce((s: number, p: any) => s + Number(p?.total ?? 0), 0),
    [pagos]
  );
  const totalSaldoMonto = useMemo(
    () => saldos.reduce((s: number, x: any) => s + Number(x?.monto ?? 0), 0),
    [saldos]
  );
  const totalReservas = useMemo(
    () => reservas.reduce((s: number, r: any) => s + Number(r?.total ?? 0), 0),
    [reservas]
  );

  const agenteId = pagos?.[0]?.id_agente || saldos?.[0]?.id_agente || "—";
  const idSaldoAFavor = pagos?.[0]?.id_saldo_a_favor || saldos?.[0]?.id_saldos || "—";

  const warnMismatch = Math.abs(Number(totalPagos) - Number(totalReservas)) > 0.01;

  /* --------- Table5: Pagos --------- */
  const pagosTable = useMemo(
    () => pagos.map((p: any) => ({ ...p, acciones: "acciones" })),
    [pagos]
  );

  const pagosCols = useMemo(
    () => [
      "id_pago",
      "estado",
      "metodo_de_pago",
      "tipo_de_tarjeta",
      "fecha_pago",
      "total",
      "saldo_aplicado",
      "transaccion",
      "acciones",
    ],
    []
  );

  const pagosRenderers = useMemo(
    () => ({
      id_pago: ({ value }: any) => (
        <span className="font-mono text-[11px] text-gray-700">
          {safeString(value).slice(0, 10)}…
        </span>
      ),
      estado: ({ value }: any) => {
        const v = safeString(value);
        const tone = v.toLowerCase().includes("confirm") ? "green" : "gray";
        return <Badge text={v || "—"} tone={tone as any} />;
      },
      metodo_de_pago: ({ value }: any) => (
        <Badge text={safeString(value) || "—"} tone="blue" />
      ),
      tipo_de_tarjeta: ({ value }: any) => (
        <Badge text={safeString(value) || "—"} tone="gray" />
      ),
      fecha_pago: ({ value }: any) => <span>{formatDateSimple(value)}</span>,
      total: ({ value }: any) => (
        <span className="font-semibold">{formatMoney(value)}</span>
      ),
      saldo_aplicado: ({ value }: any) => (
        <span className="font-semibold text-emerald-700">
          {formatMoney(value)}
        </span>
      ),
      transaccion: ({ value }: any) => (
        <span className="font-mono text-[11px] text-gray-700">
          {safeString(value) ? `${safeString(value).slice(0, 10)}…` : "—"}
        </span>
      ),
      acciones: ({ item }: any) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openUrl(item?.link_pago)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={!safeString(item?.link_pago)}
            title={item?.link_pago ? "Abrir link de pago" : "Sin link"}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Link
          </button>
        </div>
      ),
    }),
    []
  );

  /* --------- Table5: Saldos --------- */
  const saldosTable = useMemo(
    () => saldos.map((s: any) => ({ ...s, acciones: "acciones" })),
    [saldos]
  );

  const saldosCols = useMemo(
    () => [
      "id_saldos",
      "metodo_pago",
      "tipo_tarjeta",
      "banco_tarjeta",
      "fecha_pago",
      "monto",
      "saldo",
      "activo",
      "is_facturable",
      "is_facturado",
      "acciones",
    ],
    []
  );

  const saldosRenderers = useMemo(
    () => ({
      id_saldos: ({ value }: any) => (
        <span className="font-mono text-[11px] text-gray-700">
          {safeString(value) || "—"}
        </span>
      ),
      metodo_pago: ({ value }: any) => (
        <Badge text={safeString(value) || "—"} tone="blue" />
      ),
      tipo_tarjeta: ({ value }: any) => (
        <Badge text={safeString(value) || "—"} tone="gray" />
      ),
      banco_tarjeta: ({ value }: any) => (
        <Badge text={safeString(value) || "—"} tone="gray" />
      ),
      fecha_pago: ({ value }: any) => <span>{formatDateSimple(value)}</span>,
      monto: ({ value }: any) => (
        <span className="font-semibold">{formatMoney(value)}</span>
      ),
      saldo: ({ value }: any) => (
        <span className="font-semibold text-amber-700">
          {formatMoney(value)}
        </span>
      ),
      activo: ({ value }: any) => (
        <Badge text={Number(value) === 1 ? "Activo" : "Inactivo"} tone="gray" />
      ),
      is_facturable: ({ value }: any) => (
        <Badge
          text={Number(value) === 1 ? "Facturable" : "No facturable"}
          tone="green"
        />
      ),
      is_facturado: ({ value }: any) => (
        <Badge
          text={Number(value) === 1 ? "Facturado" : "No facturado"}
          tone="amber"
        />
      ),
      acciones: ({ item }: any) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openUrl(item?.comprobante)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={!safeString(item?.comprobante)}
            title={item?.comprobante ? "Abrir comprobante" : "Sin comprobante"}
          >
            <FileText className="w-3.5 h-3.5" />
            Comprobante
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }),
    []
  );

  /* --------- Table5: Reservas --------- */
  const reservasTable = useMemo(
    () => reservas.map((r: any) => ({ ...r, acciones: "acciones" })),
    [reservas]
  );

  const reservasCols = useMemo(
    () => ["codigo_reservacion_hotel", "hotel", "nombre_viajero_reservacion", "total"],
    []
  );

  const reservasRenderers = useMemo(
    () => ({
      codigo_reservacion_hotel: ({ value }: any) => (
        <span className="font-mono text-[11px] text-gray-700">
          {safeString(value) || "—"}
        </span>
      ),
      hotel: ({ value }: any) => (
        <span className="font-semibold text-gray-900">
          {safeString(value) || "—"}
        </span>
      ),
      total: ({ value }: any) => (
        <span className="font-semibold text-blue-700">
          {formatMoney(value)}
        </span>
      ),
    }),
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* modal */}
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <Badge text={`Factura: ${safeString(facturaId)}`} tone="blue" />
              <Badge text={`Agente: ${safeString(agenteId)}`} tone="gray" />
              <Badge text={`Saldo a favor: ${safeString(idSaldoAFavor)}`} tone="gray" />
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Origen: {safeString(payload?.tipo_origen) || "—"} • Pagos: {pagos.length} •
              Saldos: {saldos.length} • Reservas: {reservas.length}
            </p>

            {!loading && !error && data && (
              warnMismatch ? (
                <div className="mt-2">
                  <Badge text="Revisar: total pagos ≠ total reservas" tone="amber" />
                </div>
              ) : (
                <div className="mt-2">
                  <Badge text="Totales consistentes" tone="green" />
                </div>
              )
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* content */}
        <div className="max-h-[calc(90vh-72px)] overflow-y-auto">
          <div className="p-5">
            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando detalles...
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold">Error</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {/* Empty / No id */}
            {!loading && !error && !id_factura && (
              <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  No se recibió id_factura
                </p>
              </div>
            )}

            {/* Success */}
            {!loading && !error && data && (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <StatCard
                    label="Total pagos"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {formatMoney(totalPagos)}
                      </span>
                    }
                  />
                  <StatCard
                    label="Total reservas"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {formatMoney(totalReservas)}
                      </span>
                    }
                  />
                  <StatCard
                    label="Monto saldos"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        {formatMoney(totalSaldoMonto)}
                      </span>
                    }
                  />
                  <StatCard
                    label="Diferencia (pagos - reservas)"
                    value={
                      <span
                        className={`font-bold ${
                          warnMismatch ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        {formatMoney(Number(totalPagos) - Number(totalReservas))}
                      </span>
                    }
                    sub={warnMismatch ? "Hay diferencia, revisa." : "Cuadra."}
                  />
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* MAIN */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Reservas */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <SectionTitle title={`Reservas (${reservasTable.length})`} />
                      {reservasTable.length === 0 ? (
                        <p className="text-xs text-gray-500">No hay reservas asociadas.</p>
                      ) : (
                        <Table5<any>
                          registros={reservasTable as any}
                          customColumns={reservasCols as any}
                          renderers={reservasRenderers as any}
                          exportButton={false}
                          fillHeight={false}
                          maxHeight="280px"
                        />
                      )}
                    </div>

                    {/* Pagos */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <SectionTitle title={`Pagos (${pagosTable.length})`} />
                      {pagosTable.length === 0 ? (
                        <p className="text-xs text-gray-500">No hay pagos.</p>
                      ) : (
                        <Table5<any>
                          registros={pagosTable as any}
                          customColumns={pagosCols as any}
                          renderers={pagosRenderers as any}
                          exportButton={false}
                          fillHeight={false}
                          maxHeight="320px"
                        />
                      )}
                    </div>

                    {/* Saldos */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <SectionTitle title={`Saldos (${saldosTable.length})`} />
                      {saldosTable.length === 0 ? (
                        <p className="text-xs text-gray-500">No hay saldos.</p>
                      ) : (
                        <Table5<any>
                          registros={saldosTable as any}
                          customColumns={saldosCols as any}
                          renderers={saldosRenderers as any}
                          exportButton={false}
                          fillHeight={false}
                          maxHeight="320px"
                        />
                      )}
                    </div>
                  </div>

                  {/* SIDEBAR */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <SectionTitle title="Resumen rápido" />
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-gray-500">Factura ID</p>
                          <p className="font-mono text-gray-800">{safeString(facturaId)}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <p className="text-gray-500">Agente</p>
                          <p className="font-mono text-gray-800">{safeString(agenteId)}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <p className="text-gray-500">Saldo a favor</p>
                          <p className="font-mono text-gray-800">{safeString(idSaldoAFavor)}</p>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-gray-500">Consistencia</p>
                          {warnMismatch ? (
                            <div className="mt-1 flex items-center gap-2 text-amber-700">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-semibold">
                                Total pagos no cuadra con reservas
                              </span>
                            </div>
                          ) : (
                            <Badge text="Cuadra" tone="green" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-700">Tip</p>
                      <div className="mt-2 text-[11px] text-gray-600">
                        Puedes cerrar con <span className="font-semibold">ESC</span>.
                      </div>
                    </div>
                  </div>
                </div>
                {/* END GRID */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleFactura;
