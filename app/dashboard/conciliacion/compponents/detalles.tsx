"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";

type Props = {
  solicitud: any;
  onClose: () => void;
};

const money = (v: any) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
};

const dateMx = (v: any) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const norm = (v: any) => String(v ?? "").trim();
const normUpper = (v: any) => norm(v).toUpperCase();

const safeArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

function truncate(s: string, max = 24) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function buildPayloadFromRow(row: any) {
  const id_solicitud_proveedor =
    row?.id_solicitud_proveedor ??
    row?.item?.id_solicitud_proveedor ??
    row?.__raw?.solicitud_proveedor?.id_solicitud_proveedor ??
    row?.row_id ??
    null;

  const id_proveedor =
    row?.id_proveedor ??
    row?.item?.id_proveedor ??
    row?.__raw?.id_proveedor_resuelto ??
    row?.__raw?.solicitud_proveedor?.id_proveedor ??
    "";

  const asociaciones = row?.item?.asociaciones ?? {};
  const id_facturas = safeArray(asociaciones?.id_facturas);
  const id_pagos = safeArray(asociaciones?.id_pagos);

  return {
    id_solicitud_proveedor: id_solicitud_proveedor != null ? String(id_solicitud_proveedor) : "",
    id_proveedor: id_proveedor != null ? String(id_proveedor) : "",
    id_facturas,
    id_pagos,
  };
}

/**
 * Row de FACTURA para la tabla principal (columnas de la imagen)
 * Aquí “uuid_factura” será id_factura (fac-xxxx) porque detalles no trae uuid_cfdi.
 * total_factura sale de por_factura.facturado o pfp.monto_facturado.
 */
function toFacturaRowFromPorFactura(
  merged: any,
  idx: number,
  fallback: { razon_social: string; rfc: string },
  rowFallback: any
) {
  const idFactura = merged?.id_factura ?? merged?.id_factura_rel ?? "";

  // TOTAL FACTURA: preferimos "facturado" (número) y luego "monto_facturado" (string)
  const totalFactura =
    merged?.facturado ??
    merged?.monto_facturado ??
    merged?.monto_facturado_rel ??
    rowFallback?.total_factura ??
    rowFallback?.__raw?.monto_facturado ??
    "";

  // Estos 3 no vienen por factura en tu respuesta -> fallback desde la fila (si aplica) o "—"
  const totalAplicable =
    rowFallback?.total_aplicable ??
    rowFallback?.__raw?.total_aplicable ??
    "";

  const impuestos =
    rowFallback?.impuestos ??
    rowFallback?.__raw?.impuestos ??
    "";

  const subtotal =
    rowFallback?.subtotal ??
    rowFallback?.__raw?.subtotal ??
    "";

  const razon_social = fallback.razon_social || "—";
  const rfc = fallback.rfc || "—";

  return {
    row_id: String(idFactura || idx),
    uuid_factura: idFactura, // <- lo mostramos como “UUID DE LA FACTURA” en UI
    total_factura: totalFactura,
    total_aplicable: totalAplicable,
    impuestos,
    subtotal,
    razon_social,
    rfc,
    __raw: merged,
  };
}

function toPagoRow(p: any, idx: number) {
  const fecha = p?.fecha_pago ?? p?.fecha ?? p?.created_at ?? p?.updated_at ?? "";
  const montoPagado = p?.monto_pagado ?? p?.monto ?? p?.importe ?? "";
  const referencia = p?.referencia ?? p?.referencia_pago ?? p?.folio ?? p?.id_pago_proveedor ?? p?.id_pago ?? "";
  const estatus = p?.estatus ?? p?.estado ?? p?.status ?? "";
  const metodo = p?.forma_pago ?? p?.metodo ?? p?.tipo ?? "";

  return {
    row_id: String(p?.id_pago_proveedor ?? p?.id_pago ?? idx),
    fecha_pago: fecha,
    monto_pagado: montoPagado,
    metodo,
    referencia,
    estatus,
    __raw: p,
  };
}

export default function ModalDetalle({ solicitud, onClose }: Props) {
  const endpoint = `${URL}/mia/pago_proveedor/detalles`;
  const payload = useMemo(() => buildPayloadFromRow(solicitud), [solicitud]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [resp, setResp] = useState<any>(null);

  useEffect(() => {
    if (!payload?.id_solicitud_proveedor) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResp(null);

    (async () => {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify(payload),
        });

        const j = await r.json().catch(() => null);

        if (!r.ok) throw new Error(j?.message || `Error HTTP: ${r.status}`);
        if (!j?.ok) throw new Error(j?.message || "La respuesta no fue ok");

        setResp(j);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Error cargando detalles");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [endpoint, payload]);

  // fallback proveedor desde la fila de conciliación
  const proveedorFallback = useMemo(() => {
    const razon_social =
      solicitud?.razon_social ??
      solicitud?.__raw?.proveedor?.razon_social ??
      solicitud?.__raw?.razon_social ??
      "";

    const rfc =
      solicitud?.rfc ??
      solicitud?.__raw?.rfc_proveedor ??
      solicitud?.__raw?.rfc ??
      "";

    return { razon_social: normUpper(razon_social), rfc: normUpper(rfc) };
  }, [solicitud]);

  const solicitudApi = resp?.data?.solicitud ?? {};
  const resumen = resp?.data?.resumen_validacion ?? {};

  const facturasRaw: any[] = useMemo(() => safeArray(resp?.data?.facturas), [resp]);
  const pagosRaw: any[] = useMemo(() => safeArray(resp?.data?.pagos), [resp]);

  const pfpRaw: any[] = useMemo(() => safeArray(resp?.data?.pagos_facturas_proveedores), [resp]);
  const porFacturaRaw: any[] = useMemo(() => safeArray(resumen?.por_factura), [resumen]);

  /**
   * FACTURAS:
   * - Si vienen facturas reales -> úsalo
   * - Si NO vienen (tu caso) -> armar desde resumen_validacion.por_factura y merge con pfp
   */
  const facturasRows = useMemo(() => {
    // Caso 1: endpoint sí manda "facturas" con más info (no es tu ejemplo, pero lo dejamos)
    if (facturasRaw.length > 0) {
      return facturasRaw.map((f, i) => {
        const idFactura = f?.id_factura ?? f?.uuid_factura ?? f?.uuid ?? i;
        return {
          row_id: String(idFactura),
          uuid_factura: f?.uuid_factura ?? f?.uuid ?? f?.uuid_cfdi ?? f?.UUID ?? f?.id_factura ?? "",
          total_factura: f?.total_factura ?? f?.total ?? f?.monto ?? f?.importe ?? "",
          total_aplicable: f?.total_aplicable ?? "",
          impuestos: f?.impuestos ?? f?.iva ?? "",
          subtotal: f?.subtotal ?? "",
          razon_social: f?.razon_social ?? proveedorFallback.razon_social ?? "—",
          rfc: f?.rfc ?? proveedorFallback.rfc ?? "—",
          __raw: f,
        };
      });
    }

    // Caso 2: construir desde por_factura + pfp
    const byId = new Map<string, any>();

    // base: por_factura (trae estatus, diferencia, facturado/pagado)
    for (const pf of porFacturaRaw) {
      const id = String(pf?.id_factura ?? "").trim();
      if (!id) continue;
      byId.set(id, { ...pf });
    }

    // merge: pagos_facturas_proveedores (trae monto_facturado + timestamps)
    for (const rel of pfpRaw) {
      const id = String(rel?.id_factura ?? "").trim();
      if (!id) continue;
      const prev = byId.get(id) ?? { id_factura: id };
      byId.set(id, {
        ...prev,
        monto_facturado_rel: rel?.monto_facturado,
        created_at_rel: rel?.created_at,
        updated_at_rel: rel?.updated_at,
      });
    }

    // si no hay nada, intenta 1 fila con la info del row (como fallback)
    if (byId.size === 0) {
      const maybeId = solicitud?.uuid_factura ?? solicitud?.__raw?.uuid_factura ?? "";
      const maybeTotal = solicitud?.total_factura ?? solicitud?.__raw?.monto_facturado ?? "";
      if (maybeId || maybeTotal) {
        return [
          toFacturaRowFromPorFactura(
            { id_factura: maybeId, facturado: maybeTotal },
            0,
            proveedorFallback,
            solicitud
          ),
        ];
      }
      return [];
    }

    return Array.from(byId.values()).map((merged, i) =>
      toFacturaRowFromPorFactura(merged, i, proveedorFallback, solicitud)
    );
  }, [facturasRaw, porFacturaRaw, pfpRaw, proveedorFallback, solicitud]);

  const pagosRows = useMemo(() => pagosRaw.map((p, i) => toPagoRow(p, i)), [pagosRaw]);

  // ---- Table5: FACTURAS (columnas exactas como la imagen) ----
  const facturasColumns = useMemo(
    () => ["uuid_factura", "total_factura", "total_aplicable", "impuestos", "subtotal", "razon_social", "rfc"],
    []
  );

  const facturasRenderers = useMemo(() => {
    return {
      uuid_factura: ({ value }: any) => (
        <span className="font-mono text-xs" title={String(value || "")}>
          {value ? truncate(String(value), 22) : "—"}
        </span>
      ),
      total_factura: ({ value, item }: any) => {
        // tooltip con estatus si viene por_factura
        const estatus = item?.__raw?.estatus ? ` · ${item.__raw.estatus}` : "";
        return (
          <span title={`${String(value)}${estatus}`}>
            {money(value)}
          </span>
        );
      },
      total_aplicable: ({ value }: any) => <span title={String(value)}>{value === "" ? "—" : money(value)}</span>,
      impuestos: ({ value }: any) => <span title={String(value)}>{value === "" ? "—" : money(value)}</span>,
      subtotal: ({ value }: any) => <span title={String(value)}>{value === "" ? "—" : money(value)}</span>,
      razon_social: ({ value }: any) => (
        <span className="text-xs" title={String(value || "")}>
          {normUpper(value) || "—"}
        </span>
      ),
      rfc: ({ value }: any) => (
        <span className="font-mono text-xs" title={String(value || "")}>
          {normUpper(value) || "—"}
        </span>
      ),
    } as any;
  }, []);

  // ---- Table5: PAGOS ----
  const pagosColumns = useMemo(() => ["fecha_pago", "monto_pagado", "metodo", "referencia", "estatus"], []);

  const pagosRenderers = useMemo(() => {
    return {
      fecha_pago: ({ value }: any) => <span title={String(value)}>{dateMx(value)}</span>,
      monto_pagado: ({ value }: any) => <span title={String(value)}>{money(value)}</span>,
      metodo: ({ value }: any) => <span className="text-xs">{normUpper(value) || "—"}</span>,
      referencia: ({ value }: any) => (
        <span className="font-mono text-xs" title={String(value || "")}>
          {norm(value) ? truncate(norm(value), 22) : "—"}
        </span>
      ),
      estatus: ({ value }: any) => <span className="text-xs">{normUpper(value) || "—"}</span>,
    } as any;
  }, []);

  // ---- Table5: VALIDACIÓN POR FACTURA (extra útil) ----
  const validRows = useMemo(() => {
    return porFacturaRaw.map((x, i) => ({
      row_id: String(x?.id_factura ?? i),
      id_factura: x?.id_factura ?? "",
      facturado: x?.facturado ?? 0,
      pagado: x?.pagado ?? 0,
      diferencia: x?.diferencia ?? 0,
      estatus: x?.estatus ?? "",
      __raw: x,
    }));
  }, [porFacturaRaw]);

  const validColumns = useMemo(() => ["id_factura", "facturado", "pagado", "diferencia", "estatus"], []);

  const validRenderers = useMemo(() => {
    return {
      id_factura: ({ value }: any) => (
        <span className="font-mono text-xs" title={String(value || "")}>
          {value ? truncate(String(value), 22) : "—"}
        </span>
      ),
      facturado: ({ value }: any) => <span>{money(value)}</span>,
      pagado: ({ value }: any) => <span>{money(value)}</span>,
      diferencia: ({ value }: any) => <span>{money(value)}</span>,
      estatus: ({ value }: any) => <span className="text-xs">{normUpper(value) || "—"}</span>,
    } as any;
  }, []);

  const headerId = payload?.id_solicitud_proveedor || "—";
  const headerFecha = solicitudApi?.fecha_solicitud ? ` · ${dateMx(solicitudApi.fecha_solicitud)}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-[min(1300px,96vw)] max-h-[92vh] overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Detalles</h2>
            <p className="text-xs text-gray-500">
              Solicitud: <span className="font-semibold">{headerId}</span>
              <span>{headerFecha}</span>
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {loading && <div className="text-sm text-gray-500">Cargando detalles...</div>}
          {!!error && <div className="text-sm text-red-600">{error}</div>}

          {/* FACTURAS (TABLA PRINCIPAL CON COLUMNAS DE IMAGEN) */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-800">
              Facturas
            </div>

            <div className="p-3">
              {facturasRows.length === 0 ? (
                <div className="text-sm text-gray-500">Sin facturas para mostrar.</div>
              ) : (
                <Table5<any>
                  registros={facturasRows as any}
                  customColumns={facturasColumns as any}
                  renderers={facturasRenderers as any}
                  leyenda={`Mostrando ${facturasRows.length} factura(s)`}
                />
              )}
            </div>
          </div>

          {/* INFO DE PAGO (RESUMEN) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoCard
              title="Solicitud"
              rows={[
                ["Forma pago", normUpper(solicitudApi?.forma_pago_solicitada) || "—"],
                ["Estatus pagos", normUpper(solicitudApi?.estatus_pagos) || "—"],
                ["Estado solicitud", normUpper(solicitudApi?.estado_solicitud) || "—"],
              ]}
            />

            <InfoCard
              title="Facturación"
              rows={[
                ["Estado facturación", normUpper(solicitudApi?.estado_facturacion) || "—"],
                ["Monto facturado", money(solicitudApi?.monto_facturado)],
                ["Por facturar", money(solicitudApi?.monto_por_facturar)],
              ]}
            />

            <InfoCard
              title="Validación"
              rows={[
                ["Total pagado", money(resumen?.total_pagado)],
                ["Total facturado", money(resumen?.total_facturado)],
                ["Diferencia total", money(resumen?.diferencia_total)],
              ]}
            />
          </div>

          {/* PAGOS */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-800">
              Pagos
            </div>

            <div className="p-3">
              {pagosRows.length === 0 ? (
                <div className="text-sm text-gray-500">Sin pagos para mostrar.</div>
              ) : (
                <Table5<any>
                  registros={pagosRows as any}
                  customColumns={pagosColumns as any}
                  renderers={pagosRenderers as any}
                  leyenda={`Mostrando ${pagosRows.length} pago(s)`}
                />
              )}
            </div>
          </div>

          {/* VALIDACIÓN POR FACTURA (RECOMENDADO) */}
          {validRows.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-800">
                Validación por factura
              </div>

              <div className="p-3">
                <Table5<any>
                  registros={validRows as any}
                  customColumns={validColumns as any}
                  renderers={validRenderers as any}
                  leyenda={`Mostrando ${validRows.length} registro(s)`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="text-sm font-semibold text-gray-800 mb-2">{title}</div>
      <div className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">{k}</span>
            <span className="text-xs font-medium text-gray-900 text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
