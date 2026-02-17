"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { X, Eye, Upload, FileText, Receipt, Download, Calendar, DollarSign, CreditCard, User, FileCheck, AlertCircle } from "lucide-react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import Button from "@/components/atom/Button";

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

function getBadgeColor(status: string) {
  const statusMap: Record<string, string> = {
    CARTA_ENVIADA: "bg-blue-100 text-blue-800 border-blue-200",
    PAGADO: "bg-green-100 text-green-800 border-green-200",
    PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    RECHAZADO: "bg-red-100 text-red-800 border-red-200",
    APROBADO: "bg-emerald-100 text-emerald-800 border-emerald-200",
    enviado_a_pago: "bg-purple-100 text-purple-800 border-purple-200",
    pagado: "bg-green-100 text-green-800 border-green-200",
    pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    link: "bg-indigo-100 text-indigo-800 border-indigo-200"
  };
  
  return statusMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(status)}`}>
      {normUpper(status)}
    </span>
  );
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

function toPagoRowFromPFPR(rel: any, idx: number) {
  const fecha = rel?.updated_at ?? rel?.created_at ?? "";
  const montoPagado = rel?.monto_pago ?? rel?.monto_pagado ?? rel?.monto ?? "";
  const referencia = rel?.id_pago_proveedor ?? rel?.id ?? "";
  const metodo = "TRANSFER";

  return {
    row_id: String(rel?.id_pago_proveedor ?? rel?.id ?? idx),
    fecha_pago: fecha,
    monto_pagado: montoPagado,
    metodo,
    referencia,
    estatus: "APLICADO",
    __raw: rel,
  };
}

async function fetchFacturaUrl(id_factura: string) {
  return { pdf: "", xml: "" };
}

async function fetchComprobanteUrl(id_pago_proveedor: string | number) {
  return { url: "" };
}

async function getPresignedUrlForUpload(fileName: string, contentType: string) {
  return { uploadUrl: "", publicUrl: "" };
}

async function uploadToPresigned(uploadUrl: string, file: File) {
  const r = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!r.ok) throw new Error(`No se pudo subir archivo (${r.status})`);
}

async function saveComprobantePago(id_pago_proveedor: string, comprobante_url: string) {
  return true;
}

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
              No hay URL disponible para mostrar.
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
        url_factura_pdf: rel?.url_factura_pdf ?? rel?.pdf_url ?? "",
        url_factura_xml: rel?.url_factura_xml ?? rel?.xml_url ?? "",
      });
    }

    if (byId.size === 0) return [];

    return Array.from(byId.values()).map((merged, i) =>
      toFacturaRowFromPorFactura(merged, i, proveedorFallback, solicitud)
    );
  }, [facturasRaw, porFacturaRaw, pfpRaw, proveedorFallback, solicitud]);

  const pagosRows = useMemo(() => {
    if (pagosRaw.length > 0) return pagosRaw.map((p, i) => toPagoRowFromPago(p, i));
    if (pfpRaw.length > 0) return pfpRaw.map((rel, i) => toPagoRowFromPFPR(rel, i));
    return [];
  }, [pagosRaw, pfpRaw]);

  const facturasColumns = useMemo(
    () => ["uuid_factura", "total_factura", "total_aplicable", "impuestos", "subtotal", "razon_social", "rfc", "acciones"],
    []
  );

  const onVerFactura = useCallback(
    async (row: any) => {
      const id_factura = row?.uuid_factura || row?.__raw?.id_factura;
      if (!id_factura) return;

      const urlPdf = row?.__raw?.url_factura_pdf || row?.__raw?.pdf_url || "";
      if (urlPdf) {
        openDoc(`Factura ${id_factura}`, urlPdf);
        return;
      }

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
        return <span className="font-medium" title={`${String(value)}${estatus}`}>{money(value)}</span>;
      },
      total_aplicable: ({ value }: any) => <span className="font-medium" title={String(value)}>{value === "" ? "—" : money(value)}</span>,
      impuestos: ({ value }: any) => <span title={String(value)}>{value === "" ? "—" : money(value)}</span>,
      subtotal: ({ value }: any) => <span title={String(value)}>{value === "" ? "—" : money(value)}</span>,
      razon_social: ({ value }: any) => (
        <span className="text-xs font-medium" title={String(value || "")}>
          {normUpper(value) || "—"}
        </span>
      ),
      rfc: ({ value }: any) => (
        <span className="font-mono text-xs font-medium" title={String(value || "")}>
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

      const { uploadUrl, publicUrl } = await getPresignedUrlForUpload(file.name, file.type);

      if (!uploadUrl || !publicUrl) {
        throw new Error("No hay presigned URL.");
      }

      await uploadToPresigned(uploadUrl, file);
      await saveComprobantePago(id_pago_proveedor, publicUrl);

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
      fecha_pago: ({ value }: any) => <span className="text-sm" title={String(value)}>{dateMx(value)}</span>,
      monto_pagado: ({ value }: any) => <span className="font-medium" title={String(value)}>{money(value)}</span>,
      metodo: ({ value }: any) => <span className="text-xs font-medium">{normUpper(value) || "—"}</span>,
      referencia: ({ value }: any) => (
        <span className="font-mono text-xs" title={String(value || "")}>
          {norm(value) ? truncate(norm(value), 22) : "—"}
        </span>
      ),
      estatus: ({ value }: any) => <StatusBadge status={value} />,
      acciones: ({ item }: any) => <PagoActions row={item} onVer={onVerComprobante} onUpload={onUploadComprobante} />,
    } as any;
  }, [onVerComprobante, onUploadComprobante]);

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
      facturado: ({ value }: any) => <span className="font-medium">{money(value)}</span>,
      pagado: ({ value }: any) => <span className="font-medium">{money(value)}</span>,
      diferencia: ({ value }: any) => {
        const color = Number(value) > 0 ? "text-red-600" : Number(value) < 0 ? "text-green-600" : "text-gray-900";
        return <span className={`font-medium ${color}`}>{money(value)}</span>;
      },
      estatus: ({ value }: any) => <StatusBadge status={value} />,
    } as any;
  }, []);

  const headerId = payload?.id_solicitud_proveedor || "—";
  
  // Información detallada de la solicitud para mostrar en cards
  const solicitudInfo = useMemo(() => {
    return [
      { 
        icon: Calendar,
        label: "Fecha solicitud",
        value: dateMx(solicitudApi?.fecha_solicitud)
      },
      { 
        icon: DollarSign,
        label: "Monto solicitado",
        value: money(solicitudApi?.monto_solicitado),
        highlight: true
      },
      { 
        icon: DollarSign,
        label: "Saldo",
        value: money(solicitudApi?.saldo)
      },
      { 
        icon: CreditCard,
        label: "Forma de pago",
        value: normUpper(solicitudApi?.forma_pago_solicitada),
        badge: true
      },
      { 
        icon: FileCheck,
        label: "Estado solicitud",
        value: solicitudApi?.estado_solicitud,
        badge: true
      },
      { 
        icon: FileCheck,
        label: "Estado facturación",
        value: solicitudApi?.estado_facturacion,
        badge: true
      },
      { 
        icon: AlertCircle,
        label: "Estatus pagos",
        value: solicitudApi?.estatus_pagos,
        badge: true
      },
      { 
        icon: User,
        label: "Comentarios",
        value: solicitudApi?.comentarios || solicitudApi?.comentario_CXP || "—",
        fullWidth: true
      }
    ];
  }, [solicitudApi]);

  return (
    <>
      <DocViewerModal open={docModal.open} title={docModal.title} url={docModal.url} onClose={closeDoc} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div className="relative z-10 w-[min(1400px,96vw)] max-h-[92vh] overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Header mejorado */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-start justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Detalles de Solicitud</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">Solicitud:</span>
                  <span className="text-sm font-mono font-medium bg-gray-100 px-2 py-0.5 rounded-md">{headerId}</span>
                  <StatusBadge status={solicitudApi?.estado_solicitud} />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              onClick={onClose}
              title="Cerrar"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-600">Cargando detalles...</span>
              </div>
            )}
            
            {!!error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Información de la solicitud en cards mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {solicitudInfo.map((item, idx) => {
                if (item.fullWidth) {
                  return (
                    <div key={idx} className="lg:col-span-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                          <div className="text-sm text-gray-900">{item.value}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 ${
                      item.highlight ? 'ring-2 ring-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${
                        item.highlight ? 'bg-blue-100' : 'bg-gray-100'
                      } flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-4 h-4 ${
                          item.highlight ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                        {item.badge ? (
                          <StatusBadge status={item.value} />
                        ) : (
                          <div className={`text-sm font-medium truncate ${
                            item.highlight ? 'text-blue-600 text-base' : 'text-gray-900'
                          }`}>
                            {item.value}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cards de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Resumen Financiero</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-sm text-gray-600">Monto facturado</span>
                    <span className="text-sm font-medium text-blue-600">{money(solicitudApi?.monto_facturado)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-sm text-gray-600">Por facturar</span>
                    <span className="text-sm font-medium text-blue-600">{money(solicitudApi?.monto_por_facturar)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Pagos</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-green-100">
                    <span className="text-sm text-gray-600">Total pagado</span>
                    <span className="text-sm font-medium text-green-600">{money(resumen?.total_pagado)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Total facturado</span>
                    <span className="text-sm font-medium text-green-600">{money(resumen?.total_facturado)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Validación</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-purple-100">
                    <span className="text-sm text-gray-600">Diferencia total</span>
                    <span className={`text-sm font-medium ${
                      Number(resumen?.diferencia_total) > 0 ? 'text-red-600' : 
                      Number(resumen?.diferencia_total) < 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {money(resumen?.diferencia_total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FACTURAS */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">Facturas</span>
                  {facturasRows.length > 0 && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {facturasRows.length} {facturasRows.length === 1 ? 'factura' : 'facturas'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                {facturasRows.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    No hay facturas para mostrar
                  </div>
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

            {/* PAGOS */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">Pagos</span>
                  {pagosRows.length > 0 && (
                    <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {pagosRows.length} {pagosRows.length === 1 ? 'pago' : 'pagos'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                {pagosRows.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    No hay pagos para mostrar
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
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">Validación por factura</span>
                    <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {validRows.length} {validRows.length === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
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

      <div className="relative">
        <Button variant="secondary" size="sm" icon={Upload as any} onClick={() => setOpen((s) => !s)}>
          Subir
        </Button>
        
        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-20">
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
              <div className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span className="text-xs text-gray-600 block text-center">
                  Seleccionar archivo
                </span>
                <span className="text-xs text-gray-400 block text-center mt-1">
                  PDF o imagen
                </span>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}