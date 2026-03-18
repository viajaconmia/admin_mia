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
  CalendarDays,
  CreditCard,
  Wallet,
  Receipt,
  Building2,
  User,
  FileSpreadsheet,
} from "lucide-react";
import { URL, API_KEY } from "@/lib/constants/index";
import { Table5 } from "@/components/Table5";
import Button from "@/components/atom/Button";

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

function getToneByDiff(diff: number) {
  if (diff === 0) return "green";
  return "amber";
}

/** ---------- UI atoms ---------- */
function Badge({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "green" | "red" | "blue" | "amber" | "violet";
}) {
  const toneMap: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneMap[tone]}`}
    >
      {text}
    </span>
  );
}

function InfoCard({
  icon,
  label,
  value,
  tone = "gray",
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "gray" | "green" | "blue" | "amber" | "violet";
}) {
  const toneMap: Record<string, string> = {
    gray: "border-gray-200 bg-white",
    green: "border-green-200 bg-green-50/40",
    blue: "border-blue-200 bg-blue-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    violet: "border-violet-200 bg-violet-50/40",
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneMap[tone]}`}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white">
            {icon}
          </div>
        ) : null}

        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <div className="mt-1 break-words text-sm font-semibold text-gray-900">
            {value}
          </div>
        </div>
      </div>
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
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {right}
    </div>
  );
}

/**
 * Payload fijo
 */
function buildPayloadFromSolicitud(solicitud: any) {
  const raw = solicitud ?? {};
  const asociaciones = raw?.asociaciones ?? {};
  const info = raw?.informacion_completa ?? {};

  const id_solicitud_proveedor = safeString(raw?.id_solicitud_proveedor ?? "");
  const id_proveedor = safeString(
    info?.id_proveedor_resuelto ?? info?.id_proveedor ?? ""
  );

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
          throw new Error(
            json?.message || json?.error || `Error HTTP: ${resp.status}`
          );
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

  /** --------- Datos --------- */
  const raw = solicitud ?? {};
  const info = raw?.informacion_completa ?? {};

  const api = data?.data ?? data ?? {};
  const solicitudApi = api?.solicitud ?? info?.solicitud_proveedor ?? {};
  const facturas = Array.isArray(api?.facturas) ? api.facturas : [];
  const pagos = Array.isArray(api?.pagos) ? api.pagos : [];
  const resumen = api?.resumen_validacion ?? null;

  const hotel = safeString(info?.hotel);
  const viajero = safeString(info?.nombre_viajero_completo);
  const proveedorNombre =
    safeString(info?.proveedor?.razon_social) ||
    safeString(info?.proveedor_nombre) ||
    safeString(solicitudApi?.proveedor_nombre);

  const rfcProveedor = safeString(info?.rfc_proveedor);
  const checkIn = formatDateSimple(info?.check_in);
  const checkOut = formatDateSimple(info?.check_out);

  const totalPagado = Number(resumen?.total_pagado ?? 0);
  const totalFacturado = Number(resumen?.total_facturado ?? 0);
  const diferencia = Number(resumen?.diferencia_total ?? 0);
  const esCuadrado = diferencia === 0;

  /** =========================================================
   * FACTURAS con Table5
   * ========================================================= */
  const facturasTable = useMemo(() => {
    return facturas.map((f: any) => ({
      // ✅ PRIMERO para que sí aparezca en tu Table5 actual
      acciones: "",
      id_factura_proveedor: safeString(f?.id_factura_proveedor) || "—",
      uuid_cfdi: safeString(f?.uuid_cfdi) || "—",
      monto_facturado: f?.monto_facturado,
      fecha_factura: f?.fecha_factura,
      fecha_vencimiento: f?.fecha_vencimiento,
      estado_factura: safeString(f?.estado_factura) || "—",
      rfc_emisor: safeString(f?.rfc_emisor) || "—",
      total: f?.total,
      item: f, // ✅ Table5 usa item.item
    }));
  }, [facturas]);

  const facturasCols = useMemo(
    () => [
      "acciones",
      "id_factura_proveedor",
      "uuid_cfdi",
      "monto_facturado",
      "fecha_factura",
      "fecha_vencimiento",
      "estado_factura",
      "rfc_emisor",
      "total",
    ],
    []
  );

  const facturasRenderers = useMemo(
    () => ({
      acciones: ({ item }: any) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className={[
              "px-2 py-1 text-xs border",
              !safeString(item?.url_pdf)
                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
            disabled={!safeString(item?.url_pdf)}
            onClick={() => openUrl(item?.url_pdf)}
            title={item?.url_pdf ? "Descargar PDF" : "Sin PDF"}
          >
            <span className="inline-flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden xl:inline">PDF</span>
            </span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className={[
              "px-2 py-1 text-xs border",
              !safeString(item?.url_xml)
                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
            ].join(" ")}
            disabled={!safeString(item?.url_xml)}
            onClick={() => openUrl(item?.url_xml)}
            title={item?.url_xml ? "Descargar XML" : "Sin XML"}
          >
            <span className="inline-flex items-center gap-1">
              <Code2 className="w-4 h-4" />
              <span className="hidden xl:inline">XML</span>
            </span>
          </Button>
        </div>
      ),

      id_factura_proveedor: ({ value }: any) => (
        <span className="font-mono text-xs" title={safeString(value)}>
          {safeString(value)}
        </span>
      ),

      uuid_cfdi: ({ value }: any) => (
        <span className="font-mono text-xs" title={safeString(value)}>
          {safeString(value) ? `${safeString(value).slice(0, 12)}…` : "—"}
        </span>
      ),

      monto_facturado: ({ value }: any) => (
        <span title={String(value)}>{formatMoney(value)}</span>
      ),

      fecha_factura: ({ value }: any) => (
        <span title={String(value)}>{formatDateSimple(value)}</span>
      ),

      fecha_vencimiento: ({ value }: any) => (
        <span title={String(value)}>{formatDateSimple(value)}</span>
      ),

      estado_factura: ({ value }: any) => (
        <Badge
          text={safeString(value) || "—"}
          tone={
            safeString(value).toLowerCase().includes("confirm")
              ? "green"
              : "gray"
          }
        />
      ),

      rfc_emisor: ({ value }: any) => (
        <span className="font-mono text-xs">{safeString(value) || "—"}</span>
      ),

      total: ({ value }: any) => <span title={String(value)}>{formatMoney(value)}</span>,
    }),
    []
  );

  /** =========================================================
   * PAGOS con Table5
   * ========================================================= */
  const pagosTable = useMemo(() => {
    return pagos.map((p: any) => ({
      // ✅ PRIMERO para que sí aparezca
      acciones: "",
      id_pago_proveedores: safeString(p?.id_pago_proveedores) || "—",
      fecha_pago: p?.fecha_pago,
      monto_pagado: p?.monto_pagado ?? p?.monto,
      metodo_de_pago: safeString(p?.metodo_de_pago) || "—",
      referencia_pago: safeString(p?.referencia_pago) || "—",
      concepto: safeString(p?.concepto) || "—",
      item: p, // ✅ Table5 usa item.item
    }));
  }, [pagos]);

  const pagosCols = useMemo(
    () => [
      "acciones",
      "id_pago_proveedores",
      "fecha_pago",
      "monto_pagado",
      "metodo_de_pago",
      "referencia_pago",
      "concepto",
    ],
    []
  );

  const pagosRenderers = useMemo(
    () => ({
      acciones: ({ item }: any) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className={[
              "px-2 py-1 text-xs border",
              !safeString(item?.url_pdf)
                ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
            disabled={!safeString(item?.url_pdf)}
            onClick={() => openUrl(item?.url_pdf)}
            title={item?.url_pdf ? "Descargar comprobante" : "Sin comprobante"}
          >
            <span className="inline-flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden xl:inline">Comprobante</span>
            </span>
          </Button>
        </div>
      ),

      id_pago_proveedores: ({ value }: any) => (
        <span className="font-mono text-xs">{safeString(value)}</span>
      ),

      fecha_pago: ({ value }: any) => (
        <span title={String(value)}>{formatDateSimple(value)}</span>
      ),

      monto_pagado: ({ value }: any) => (
        <span title={String(value)}>{formatMoney(value)}</span>
      ),

      metodo_de_pago: ({ value }: any) => (
        <Badge text={safeString(value) || "—"} tone="gray" />
      ),

      referencia_pago: ({ value }: any) => (
        <span className="font-mono text-xs" title={safeString(value)}>
          {safeString(value) ? `${safeString(value).slice(0, 12)}…` : "—"}
        </span>
      ),

      concepto: ({ value }: any) => (
        <span title={safeString(value)}>{safeString(value) || "—"}</span>
      ),
    }),
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative h-[94vh] w-[98vw] max-w-[1600px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">
                  Detalles de conciliación
                </p>

                <Badge
                  text={`Solicitud #${payload.id_solicitud_proveedor || "—"}`}
                  tone="blue"
                />

                {safeString(solicitudApi?.estado_solicitud) ? (
                  <Badge
                    text={safeString(solicitudApi?.estado_solicitud)}
                    tone="gray"
                  />
                ) : null}

                {proveedorNombre ? (
                  <Badge text={proveedorNombre} tone="violet" />
                ) : null}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {hotel ? `Hotel: ${hotel}` : "Hotel: —"}
                {" • "}
                {viajero ? `Viajero: ${viajero}` : "Viajero: —"}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
              onClick={onClose}
              title="Cerrar"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="h-[calc(94vh-76px)] overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando detalles...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Error</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                  icon={<CalendarDays className="h-4 w-4 text-gray-600" />}
                  label="Fecha solicitud"
                  value={formatDateSimple(solicitudApi?.fecha_solicitud)}
                />

                <InfoCard
                  icon={<Wallet className="h-4 w-4 text-blue-600" />}
                  label="Monto solicitado"
                  value={formatMoney(solicitudApi?.monto_solicitado)}
                  tone="blue"
                />

                <InfoCard
                  icon={<Receipt className="h-4 w-4 text-gray-600" />}
                  label="Saldo"
                  value={formatMoney(solicitudApi?.saldo)}
                />

                <InfoCard
                  icon={<CreditCard className="h-4 w-4 text-gray-600" />}
                  label="Forma de pago"
                  value={
                    <Badge
                      text={safeString(
                        solicitudApi?.forma_pago_solicitada || "—"
                      )}
                      tone="gray"
                    />
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                  icon={<FileSpreadsheet className="h-4 w-4 text-gray-600" />}
                  label="Estado solicitud"
                  value={
                    <Badge
                      text={safeString(solicitudApi?.estado_solicitud || "—")}
                      tone="blue"
                    />
                  }
                />

                <InfoCard
                  icon={<FileText className="h-4 w-4 text-gray-600" />}
                  label="Estado facturación"
                  value={
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
                  }
                />

                <InfoCard
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  label="Estatus pagos"
                  value={
                    <Badge
                      text={safeString(solicitudApi?.estatus_pagos || "—")}
                      tone="green"
                    />
                  }
                  tone="green"
                />

                <InfoCard
                  icon={<Building2 className="h-4 w-4 text-gray-600" />}
                  label="Proveedor ID"
                  value={safeString(
                    solicitudApi?.id_proveedor || payload.id_proveedor || "—"
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <InfoCard
                  icon={<User className="h-4 w-4 text-gray-600" />}
                  label="Proveedor"
                  value={proveedorNombre || "—"}
                />
                <InfoCard
                  icon={<FileText className="h-4 w-4 text-gray-600" />}
                  label="RFC proveedor"
                  value={rfcProveedor || "—"}
                />
                <InfoCard
                  icon={<CalendarDays className="h-4 w-4 text-gray-600" />}
                  label="Estancia"
                  value={`${checkIn} — ${checkOut}`}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <SectionTitle title="Comentarios" />
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {safeString(solicitudApi?.comentarios) || "—"}
                </p>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    Comentario CXP
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {safeString(solicitudApi?.comentario_CXP) || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
                  <SectionTitle title="Resumen financiero" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Monto solicitado</span>
                      <span className="font-semibold text-gray-900">
                        {formatMoney(solicitudApi?.monto_solicitado)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Monto facturado</span>
                      <span className="font-semibold text-blue-700">
                        {formatMoney(totalFacturado)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Por facturar</span>
                      <span className="font-semibold text-gray-900">
                        {formatMoney(
                          Number(solicitudApi?.monto_por_facturar ?? 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-green-200 bg-green-50/40 p-4 shadow-sm">
                  <SectionTitle title="Pagos" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Total pagado</span>
                      <span className="font-semibold text-green-700">
                        {formatMoney(totalPagado)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Total facturado</span>
                      <span className="font-semibold text-green-700">
                        {formatMoney(totalFacturado)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Número de pagos</span>
                      <span className="font-semibold text-gray-900">
                        {pagos.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
                  <SectionTitle
                    title="Validación"
                    right={
                      <Badge
                        text={esCuadrado ? "CUADRADO" : "DIFERENCIA"}
                        tone={getToneByDiff(diferencia) as any}
                      />
                    }
                  />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Diferencia total</span>
                      <span
                        className={`font-semibold ${
                          esCuadrado ? "text-green-700" : "text-amber-700"
                        }`}
                      >
                        {formatMoney(diferencia)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {esCuadrado
                        ? "Los pagos y las facturas cuadran correctamente."
                        : "Existe diferencia entre el total pagado y el total facturado."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Facturas */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <SectionTitle
                  title={`Facturas (${facturas.length})`}
                  right={
                    <Badge
                      text={`${facturas.length} factura${
                        facturas.length === 1 ? "" : "s"
                      }`}
                      tone="blue"
                    />
                  }
                />

                {facturas.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay facturas disponibles.
                  </p>
                ) : (
                  <Table5<any>
                    registros={facturasTable as any}
                    renderers={facturasRenderers as any}
                    customColumns={facturasCols as any}
                    exportButton={false}
                    isExport={false}
                    fillHeight={false}
                    maxHeight="320px"
                  />
                )}
              </div>

              {/* Pagos */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <SectionTitle
                  title={`Pagos (${pagos.length})`}
                  right={
                    <Badge
                      text={`${pagos.length} pago${pagos.length === 1 ? "" : "s"}`}
                      tone="green"
                    />
                  }
                />

                {pagos.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay pagos disponibles.
                  </p>
                ) : (
                  <Table5<any>
                    registros={pagosTable as any}
                    renderers={pagosRenderers as any}
                    customColumns={pagosCols as any}
                    exportButton={false}
                    isExport={false}
                    fillHeight={false}
                    maxHeight="320px"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetalle;