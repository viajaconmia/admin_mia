"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { X, Eye, Upload, FileText, Receipt } from "lucide-react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import Button from "@/components/atom/Button"; // <- tu importación

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

function toFacturaRowFromPorFactura(
  merged: any,
  idx: number,
  fallback: { razon_social: string; rfc: string },
  rowFallback: any
) {
  const idFactura = merged?.id_factura ?? merged?.id_factura_rel ?? "";

  const totalFactura =
    merged?.facturado ??
    merged?.monto_facturado ??
    merged?.monto_facturado_rel ??
    rowFallback?.total_factura ??
    rowFallback?.__raw?.monto_facturado ??
    "";

  const totalAplicable = rowFallback?.total_aplicable ?? rowFallback?.__raw?.total_aplicable ?? "";
  const impuestos = rowFallback?.impuestos ?? rowFallback?.__raw?.impuestos ?? "";
  const subtotal = rowFallback?.subtotal ?? rowFallback?.__raw?.subtotal ?? "";

  const razon_social = fallback.razon_social || "—";
  const rfc = fallback.rfc || "—";

  return {
    row_id: String(idFactura || idx),
    uuid_factura: idFactura,
    total_factura: totalFactura,
    total_aplicable: totalAplicable,
    impuestos,
    subtotal,
    razon_social,
    rfc,
    __raw: merged,
  };
}

function toPagoRowFromPago(p: any, idx: number) {
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

/**
 * ESTE es el que te faltaba: construir pagos desde pagos_facturas_proveedores (PFPR)
 * porque tu endpoint está devolviendo ahí el pago y NO en data.pagos.
 */
function toPagoRowFromPFPR(rel: any, idx: number) {
  const fecha = rel?.updated_at ?? rel?.created_at ?? "";
  const montoPagado = rel?.monto_pago ?? rel?.monto_pagado ?? rel?.monto ?? "";
  const referencia = rel?.id_pago_proveedor ?? rel?.id ?? "";
  const metodo = "TRANSFER"; // tu solicitud es transfer; si luego te llega en data.solicitud úsalo mejor

  return {
    row_id: String(rel?.id_pago_proveedor ?? rel?.id ?? idx),
    fecha_pago: fecha,
    monto_pagado: montoPagado,
    metodo,
    referencia,
    estatus: "APLICADO", // no viene estatus; lo puedes inferir o traerlo del endpoint
    __raw: rel,
  };
}

/** ====== STUBS (conecta tus endpoints reales) ====== */
async function fetchFacturaUrl(id_factura: string) {
  // Ideal: endpoint que te regrese URL de PDF/XML (S3 o presigned)
  // Ejemplo:
  // const r = await fetch(`${URL}/mia/facturas/url/${id_factura}`, { headers: { "x-api-key": API_KEY || "" }});
  // const j = await r.json();
  // return { pdf: j.data.pdf_url, xml: j.data.xml_url };

  return { pdf: "", xml: "" }; // <- por ahora vacío
}

async function fetchComprobanteUrl(id_pago_proveedor: string | number) {
  // Ideal: endpoint que te regrese URL del comprobante asociado al pago
  return { url: "" };
}

async function getPresignedUrlForUpload(fileName: string, contentType: string) {
  // Ideal: endpoint para presigned URL
  // return { uploadUrl, publicUrl };
  return { uploadUrl: "", publicUrl: "" };
}

async function uploadToPresigned(uploadUrl: string, file: File) {
  const r = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!r.ok) throw new Error(`No se pudo subir archivo (${r.status})`);
}

async function saveComprobantePago(id_pago_proveedor: string, comprobante_url: string) {
  // Ideal: PATCH/POST a tu backend para guardar URL del comprobante para ese pago
  // await fetch(`${URL}/mia/pago_proveedor/comprobante`, { method:"POST", headers:{...}, body: JSON.stringify({id_pago_proveedor, comprobante_url})})
  return true;
}
/** ====== /STUBS ====== */

function DocViewerModal({
  open,
  title,
  url,
  onClose,
}: {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-[min(1100px,96vw)] h-[min(85vh,900px)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div className="p-3 h-[calc(100%-56px)]">
          {!url ? (
            <div className="text-sm text-gray-600">
              No hay URL disponible para mostrar. Conecta un endpoint que regrese el link (PDF/XML/S3) y listo.
            </div>
          ) : (
            <iframe title={title} src={url} className="w-full h-full rounded-md border border-gray-200" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModalDetalle({ solicitud, onClose }: Props) {
  const endpoint = `${URL}/mia/pago_proveedor/detalles`;
  const payload = useMemo(() => buildPayloadFromRow(solicitud), [solicitud]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [resp, setResp] = useState<any>(null);

  const [docModal, setDocModal] = useState<{ open: boolean; title: string; url: string }>({
    open: false,
    title: "",
    url: "",
  });

  const openDoc = useCallback((title: string, url: string) => {
    setDocModal({ open: true, title, url });
  }, []);

  const closeDoc = useCallback(() => {
    setDocModal({ open: false, title: "", url: "" });
  }, []);

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

  const proveedorFallback = useMemo(() => {
    const razon_social =
      solicitud?.razon_social ?? solicitud?.__raw?.proveedor?.razon_social ?? solicitud?.__raw?.razon_social ?? "";

    const rfc = solicitud?.rfc ?? solicitud?.__raw?.rfc_proveedor ?? solicitud?.__raw?.rfc ?? "";

    return { razon_social: normUpper(razon_social), rfc: normUpper(rfc) };
  }, [solicitud]);

  const solicitudApi = resp?.data?.solicitud ?? {};
  const resumen = resp?.data?.resumen_validacion ?? {};

  const facturasRaw: any[] = useMemo(() => safeArray(resp?.data?.facturas), [resp]);
  const pagosRaw: any[] = useMemo(() => safeArray(resp?.data?.pagos), [resp]);

  const pfpRaw: any[] = useMemo(() => safeArray(resp?.data?.pagos_facturas_proveedores), [resp]);
  const porFacturaRaw: any[] = useMemo(() => safeArray(resumen?.por_factura), [resumen]);

  /** FACTURAS */
  const facturasRows = useMemo(() => {
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

    const byId = new Map<string, any>();

    for (const pf of porFacturaRaw) {
      const id = String(pf?.id_factura ?? "").trim();
      if (!id) continue;
      byId.set(id, { ...pf });
    }

    for (const rel of pfpRaw) {
      const id = String(rel?.id_factura ?? "").trim();
      if (!id) continue;
      const prev = byId.get(id) ?? { id_factura: id };
      byId.set(id, {
        ...prev,
        monto_facturado_rel: rel?.monto_facturado,
        created_at_rel: rel?.created_at,
        updated_at_rel: rel?.updated_at,
        // si algún día tu backend manda url_factura aquí, ya queda guardada:
        url_factura_pdf: rel?.url_factura_pdf ?? rel?.pdf_url ?? "",
        url_factura_xml: rel?.url_factura_xml ?? rel?.xml_url ?? "",
      });
    }

    if (byId.size === 0) return [];

    return Array.from(byId.values()).map((merged, i) =>
      toFacturaRowFromPorFactura(merged, i, proveedorFallback, solicitud)
    );
  }, [facturasRaw, porFacturaRaw, pfpRaw, proveedorFallback, solicitud]);

  /** PAGOS
   * FIX: si pagosRaw viene vacío, construir desde pfpRaw
   */
  const pagosRows = useMemo(() => {
    if (pagosRaw.length > 0) return pagosRaw.map((p, i) => toPagoRowFromPago(p, i));
    if (pfpRaw.length > 0) return pfpRaw.map((rel, i) => toPagoRowFromPFPR(rel, i));
    return [];
  }, [pagosRaw, pfpRaw]);

  // ---- Columnas Facturas (agrego acciones) ----
  const facturasColumns = useMemo(
    () => ["uuid_factura", "total_factura", "total_aplicable", "impuestos", "subtotal", "razon_social", "rfc", "acciones"],
    []
  );

  const onVerFactura = useCallback(
    async (row: any) => {
      const id_factura = row?.uuid_factura || row?.__raw?.id_factura;
      if (!id_factura) return;

      // 1) si ya viene URL en el raw, úsala
      const urlPdf = row?.__raw?.url_factura_pdf || row?.__raw?.pdf_url || "";
      if (urlPdf) {
        openDoc(`Factura ${id_factura}`, urlPdf);
        return;
      }

      // 2) si no viene, pide a backend (conecta endpoint real)
      try {
        const { pdf } = await fetchFacturaUrl(String(id_factura));
        openDoc(`Factura ${id_factura}`, pdf || "");
      } catch (e: any) {
        setError(e?.message || "No se pudo obtener la factura");
      }
    },
    [openDoc]
  );

  const facturasRenderers = useMemo(() => {
    return {
      uuid_factura: ({ value }: any) => (
        <span className="font-mono text-xs" title={String(value || "")}>
          {value ? truncate(String(value), 22) : "—"}
        </span>
      ),
      total_factura: ({ value, item }: any) => {
        const estatus = item?.__raw?.estatus ? ` · ${item.__raw.estatus}` : "";
        return <span title={`${String(value)}${estatus}`}>{money(value)}</span>;
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
      acciones: ({ item }: any) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" icon={Eye as any} onClick={() => onVerFactura(item)}>
            Ver
          </Button>
        </div>
      ),
    } as any;
  }, [onVerFactura]);

  // ---- Columnas Pagos (agrego acciones) ----
  const pagosColumns = useMemo(() => ["fecha_pago", "monto_pagado", "metodo", "referencia", "estatus", "acciones"], []);

  const onVerComprobante = useCallback(
    async (row: any) => {
      const id_pago_proveedor = row?.__raw?.id_pago_proveedor ?? row?.row_id;
      if (!id_pago_proveedor) return;

      const existing = row?.__raw?.url_comprobante || row?.__raw?.comprobante_url || "";
      if (existing) {
        openDoc(`Comprobante pago ${id_pago_proveedor}`, existing);
        return;
      }

      try {
        const { url } = await fetchComprobanteUrl(String(id_pago_proveedor));
        openDoc(`Comprobante pago ${id_pago_proveedor}`, url || "");
      } catch (e: any) {
        setError(e?.message || "No se pudo obtener el comprobante");
      }
    },
    [openDoc]
  );

  const onUploadComprobante = useCallback(async (row: any, file: File) => {
    const id_pago_proveedor = String(row?.__raw?.id_pago_proveedor ?? row?.row_id ?? "");
    if (!id_pago_proveedor) {
      setError("No se encontró id_pago_proveedor para subir comprobante");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 1) presigned
      const { uploadUrl, publicUrl } = await getPresignedUrlForUpload(file.name, file.type);

      if (!uploadUrl || !publicUrl) {
        throw new Error("No hay presigned URL. Conecta el endpoint de presigned.");
      }

      // 2) subir
      await uploadToPresigned(uploadUrl, file);

      // 3) guardar en backend
      await saveComprobantePago(id_pago_proveedor, publicUrl);

      // 4) refrescar (re-consulta detalles)
      // forzamos reload simple reusando endpoint
      const r = await fetch(`${URL}/mia/pago_proveedor/detalles`, {
        method: "POST",
        headers: { "x-api-key": API_KEY || "", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => null);
      if (j?.ok) setResp(j);

    } catch (e: any) {
      setError(e?.message || "No se pudo subir el comprobante");
    } finally {
      setLoading(false);
    }
  }, [payload]);

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
      acciones: ({ item }: any) => <PagoActions row={item} onVer={onVerComprobante} onUpload={onUploadComprobante} />,
    } as any;
  }, [onVerComprobante, onUploadComprobante]);

  // ---- Table5: VALIDACIÓN POR FACTURA ----
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
    <>
      <DocViewerModal open={docModal.open} title={docModal.title} url={docModal.url} onClose={closeDoc} />

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

            {/* FACTURAS */}
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
                  <div className="text-sm text-gray-500">
                    Sin pagos para mostrar (si el backend no llena <code className="font-mono">data.pagos</code>,
                    usamos <code className="font-mono">data.pagos_facturas_proveedores</code>).
                  </div>
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

            {/* VALIDACIÓN POR FACTURA */}
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
    </>
  );
}

function PagoActions({
  row,
  onVer,
  onUpload,
}: {
  row: any;
  onVer: (row: any) => void;
  onUpload: (row: any, file: File) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await onUpload(row, f);
    e.target.value = "";
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" icon={Eye as any} onClick={() => onVer(row)}>
        Ver
      </Button>

      <Button variant="secondary" size="sm" icon={Upload as any} onClick={() => setOpen((s) => !s)}>
        Subir
      </Button>

      {open && (
        <label className="ml-2 inline-flex items-center gap-2 text-xs text-gray-600">
          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
          <span className="inline-flex items-center gap-2">
            <span className="font-medium">Seleccionar archivo</span>
            <span className="text-gray-400">(PDF/imagen)</span>
          </span>
        </label>
      )}
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
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
