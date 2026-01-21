"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Code2,
  ExternalLink,
} from "lucide-react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";

interface ModalDetallesProp {
  solicitud: any | null;
  onClose: () => void;
}

/** ---------- Helpers ---------- */
const safeString = (v: any) => String(v ?? "").trim();

function formatMoney(n: any) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
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

/** ---------- UI atoms ---------- */
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

/**
 * ✅ Payload fijo para TU forma actual de solicitud
 * - id_solicitud_proveedor: solicitud.id_solicitud_proveedor
 * - id_facturas: solicitud.asociaciones.id_facturas[]
 * - id_pagos: solicitud.asociaciones.id_pagos[]
 * - id_proveedor: informacion_completa.id_proveedor_resuelto (si existe)
 */
function buildPayloadFromSolicitud(solicitud: any) {
  const raw = solicitud ?? {};
  const asociaciones = raw?.asociaciones ?? {};
  const info = raw?.informacion_completa ?? {};

  const id_solicitud_proveedor = safeString(raw?.id_solicitud_proveedor ?? "");
  const id_proveedor = safeString(info?.id_proveedor_resuelto ?? info?.id_proveedor ?? "");

  const id_facturas = Array.isArray(asociaciones?.id_facturas)
    ? asociaciones.id_facturas.map((x: any) => safeString(x)).filter(Boolean)
    : [];

  const id_pagos = Array.isArray(asociaciones?.id_pagos)
    ? asociaciones.id_pagos.map((x: any) => safeString(x)).filter(Boolean)
    : [];

  return {
    id_solicitud_proveedor,
    id_proveedor,
    id_facturas,
    id_pagos,
  };
}

const ModalDetalle: React.FC<ModalDetallesProp> = ({ solicitud, onClose }) => {
  const endpoint = `${URL}/mia/pago_proveedor/detalles`;

  const payload = useMemo(() => buildPayloadFromSolicitud(solicitud), [solicitud]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<any>(null);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch detalles (con abort real)
  useEffect(() => {
    if (!solicitud) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify(payload),
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok) {
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);
        }

        setData(json);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("❌ Error cargando detalles:", e);
        setError(e?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [endpoint, payload, solicitud]);

  /** --------- Datos base de la solicitud (tu objeto fijo) --------- */
  const raw = solicitud ?? {};
  const info = raw?.informacion_completa ?? {};

  /** --------- Respuesta backend --------- */
  const api = data?.data ?? {};
  const solicitudApi = api?.solicitud ?? info?.solicitud_proveedor ?? {};
  const facturasApi = Array.isArray(api?.facturas) ? api.facturas : [];
  const pagosApi = Array.isArray(api?.pagos) ? api.pagos : [];
  const resumen = api?.resumen_validacion ?? null;

  /** --------- Header info --------- */
  const hotel = safeString(info?.hotel);
  const viajero = safeString(info?.nombre_viajero_completo);
  const proveedorNombre = safeString(info?.proveedor?.razon_social);
  const rfcProveedor = safeString(info?.rfc_proveedor);

  const checkIn = formatDateSimple(info?.check_in);
  const checkOut = formatDateSimple(info?.check_out);

  /** --------- Cols/Renderers Table5 --------- */
  const facturasTable = useMemo(() => {
    return facturasApi.map((f: any) => ({
      ...f,
      acciones: "acciones",
    }));
  }, [facturasApi]);

  const pagosTable = useMemo(() => {
    return pagosApi.map((p: any) => ({
      ...p,
      acciones: "acciones",
    }));
  }, [pagosApi]);

  const facturasCols = useMemo(
    () => [
      "id_factura_proveedor",
      "uuid_cfdi",
      "monto_facturado",
      "fecha_factura",
      "estado_factura",
      "acciones",
    ],
    []
  );

  const pagosCols = useMemo(
    () => [
      "id_pago_proveedores",
      "metodo_de_pago",
      "monto_pagado",
      "fecha_pago",
      "numero_comprobante",
      "concepto",
      "acciones",
    ],
    []
  );

  const facturasRenderers = useMemo(
    () => ({
      uuid_cfdi: ({ value }: any) => (
        <span className="font-mono text-[11px] text-gray-700">
          {safeString(value).slice(0, 10)}…
        </span>
      ),
      monto_facturado: ({ value }: any) => (
        <span className="font-semibold">{formatMoney(value)}</span>
      ),
      fecha_factura: ({ value }: any) => <span>{formatDateSimple(value)}</span>,
      estado_factura: ({ value }: any) => (
        <Badge
          text={safeString(value) || "—"}
          tone={safeString(value).toLowerCase().includes("confirm")
            ? "green"
            : "gray"}
        />
      ),
      acciones: ({ item }: any) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openUrl(item?.url_pdf)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
            title="Abrir PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => openUrl(item?.url_xml)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
            title="Abrir XML"
          >
            <Code2 className="w-3.5 h-3.5" />
            XML
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }),
    []
  );

  const pagosRenderers = useMemo(
    () => ({
      monto_pagado: ({ value }: any) => (
        <span className="font-semibold">{formatMoney(value)}</span>
      ),
      fecha_pago: ({ value }: any) => <span>{formatDateSimple(value)}</span>,
      acciones: ({ item }: any) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openUrl(item?.url_pdf)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={!safeString(item?.url_pdf)}
            title={item?.url_pdf ? "Abrir comprobante PDF" : "Sin comprobante"}
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

  /** --------- Validación visual --------- */
  const totalPagado = resumen?.total_pagado ?? null;
  const totalFacturado = resumen?.total_facturado ?? null;
  const diferencia = resumen?.diferencia_total ?? null;
  const esCuadrado = Number(diferencia) === 0;

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
              <p className="text-sm font-semibold text-gray-900">
                Solicitud #{payload.id_solicitud_proveedor || "—"}
              </p>

              {proveedorNombre ? (
                <Badge text={proveedorNombre} tone="blue" />
              ) : (
                <Badge text="PROVEEDOR NO IDENTIFICADO" tone="gray" />
              )}

              {rfcProveedor ? (
                <Badge text={`RFC: ${rfcProveedor}`} tone="gray" />
              ) : null}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {hotel ? `Hotel: ${hotel}` : "Hotel: —"}
              {"  "}•{"  "}
              {viajero ? `Viajero: ${viajero}` : "Viajero: —"}
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                text={`Facturas: ${payload.id_facturas.length}`}
                tone="gray"
              />
              <Badge text={`Pagos: ${payload.id_pagos.length}`} tone="gray" />

              {resumen ? (
                <Badge
                  text={esCuadrado ? "VALIDACIÓN: CUADRADO" : "VALIDACIÓN: DIFERENCIA"}
                  tone={esCuadrado ? "green" : "amber"}
                />
              ) : null}
            </div>
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
            {/* loading */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando detalles...
              </div>
            )}

            {/* error */}
            {error && (
              <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold">Error</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* MAIN */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Overview cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard label="Check-in" value={checkIn} />
                    <StatCard label="Check-out" value={checkOut} />
                    <StatCard
                      label="Costo proveedor"
                      value={formatMoney(info?.costo_total)}
                    />
                    <StatCard label="Total venta" value={formatMoney(info?.total)} />
                  </div>

                  {/* Resumen validación */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <SectionTitle
                      title="Resumen de validación"
                      right={
                        resumen ? (
                          esCuadrado ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                              <CheckCircle2 className="w-4 h-4" />
                              Cuadrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <AlertTriangle className="w-4 h-4" />
                              Revisar diferencia
                            </span>
                          )
                        ) : null
                      }
                    />

                    {!resumen ? (
                      <p className="text-xs text-gray-500">
                        No llegó resumen de validación en la respuesta.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <StatCard
                            label="Total pagado"
                            value={formatMoney(totalPagado)}
                          />
                          <StatCard
                            label="Total facturado"
                            value={formatMoney(totalFacturado)}
                          />
                          <StatCard
                            label="Diferencia"
                            value={
                              <span
                                className={`font-bold ${
                                  esCuadrado ? "text-green-700" : "text-amber-700"
                                }`}
                              >
                                {formatMoney(diferencia)}
                              </span>
                            }
                            sub={
                              esCuadrado
                                ? "Todo cuadra correctamente."
                                : "Hay diferencia entre pagos y facturas."
                            }
                          />
                        </div>

                        {/* Por factura */}
                        {Array.isArray(resumen?.por_factura) &&
                        resumen.por_factura.length > 0 ? (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Validación por factura
                            </p>

                            <div className="space-y-2">
                              {resumen.por_factura.map((x: any, idx: number) => {
                                const ok = safeString(x?.estatus).toUpperCase() === "CUADRADO";
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-gray-900 truncate">
                                        {safeString(x?.id_factura)}
                                      </p>
                                      <p className="text-[11px] text-gray-600">
                                        Pagado: {formatMoney(x?.pagado)} • Facturado:{" "}
                                        {formatMoney(x?.facturado)} • Dif:{" "}
                                        <span
                                          className={`font-semibold ${
                                            Number(x?.diferencia) === 0
                                              ? "text-green-700"
                                              : "text-amber-700"
                                          }`}
                                        >
                                          {formatMoney(x?.diferencia)}
                                        </span>
                                      </p>
                                    </div>

                                    <Badge
                                      text={safeString(x?.estatus) || "—"}
                                      tone={ok ? "green" : "amber"}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* Facturas */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <SectionTitle title={`Facturas (${facturasTable.length})`} />

                    {facturasTable.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No hay facturas disponibles.
                      </p>
                    ) : (
                      <Table5<any>
                        registros={facturasTable as any}
                        customColumns={facturasCols as any}
                        renderers={facturasRenderers as any}
                        exportButton={false} // ✅ sin botones
                        fillHeight={false}
                        maxHeight="320px"
                      />
                    )}
                  </div>

                  {/* Pagos */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <SectionTitle title={`Pagos (${pagosTable.length})`} />

                    {pagosTable.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No hay pagos disponibles.
                      </p>
                    ) : (
                      <Table5<any>
                        registros={pagosTable as any}
                        customColumns={pagosCols as any}
                        renderers={pagosRenderers as any}
                        exportButton={false} // ✅ sin botones
                        fillHeight={false}
                        maxHeight="320px"
                      />
                    )}
                  </div>
                </div>

                {/* SIDEBAR */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <SectionTitle title="Datos de la solicitud" />

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-gray-500">Monto solicitado</p>
                        <p className="font-semibold text-gray-900">
                          {formatMoney(solicitudApi?.monto_solicitado)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-gray-500">Saldo</p>
                        <p className="font-semibold text-gray-900">
                          {formatMoney(solicitudApi?.saldo)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-gray-500">Forma de pago</p>
                        <Badge
                          text={safeString(solicitudApi?.forma_pago_solicitada || "—")}
                          tone="gray"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-gray-500">Estado solicitud</p>
                        <Badge
                          text={safeString(solicitudApi?.estado_solicitud || "—")}
                          tone="blue"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-gray-500">Estado facturación</p>
                        <Badge
                          text={safeString(solicitudApi?.estado_facturacion || "—")}
                          tone={
                            safeString(solicitudApi?.estado_facturacion)
                              .toLowerCase()
                              .includes("pendiente")
                              ? "amber"
                              : "green"
                          }
                        />
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-gray-500">Comentarios</p>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                          {safeString(solicitudApi?.comentarios) || "—"}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-gray-500">Comentario CXP</p>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                          {safeString(solicitudApi?.comentario_CXP) || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-700">
                      Identificadores
                    </p>
                    <div className="mt-2 space-y-2 text-[11px] text-gray-600">
                      <div className="flex justify-between gap-3">
                        <span>Proveedor ID</span>
                        <span className="font-mono text-gray-800">
                          {payload.id_proveedor || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Facturas</span>
                        <span className="font-mono text-gray-800">
                          {payload.id_facturas.length}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Pagos</span>
                        <span className="font-mono text-gray-800">
                          {payload.id_pagos.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    Tip: Puedes cerrar con <span className="font-semibold">ESC</span>
                    .
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalle;
