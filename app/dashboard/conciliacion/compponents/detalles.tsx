"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Code2,
  ExternalLink,
  Save,
  Trash2,
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

function toInputMoney(v: any) {
  if (v === null || v === undefined || String(v).trim() === "") return "";
  const num = Number(v);
  return Number.isFinite(num) ? String(num) : "";
}

function toApiNumber(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toNum(v: any) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function openUrl(url?: string | null) {
  const u = safeString(url);
  if (!u) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

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

type FacturaDraft = {
  subtotal: string;
  impuestos: string;
  monto_asociar: string;
};

function getFacturaBaseKey(f: any) {
  return (
    safeString(f?.id_factura_proveedor) ||
    safeString(f?.uuid_cfdi) ||
    safeString(f?.uuid_factura)
  );
}

function getFacturaRowKey(f: any, idx: number) {
  return [
    safeString(f?.id_factura_proveedor),
    safeString(f?.uuid_cfdi),
    safeString(f?.uuid_factura),
    String(idx),
  ]
    .filter(Boolean)
    .join("__");
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function toFixedInput(n: number) {
  return Number.isFinite(n) ? round2(n).toFixed(2) : "";
}

function getTaxRateDecimal(f: any) {
  const pct = toNum(
    f?.porcentaje_impuesto ??
      f?.tasa_impuesto ??
      f?.iva_porcentaje ??
      f?.tax_percent ??
      0
  );

  return pct > 0 ? pct / 100 : 0;
}

function getFacturaBaseAmounts(f: any) {
  const subtotalFactura = toNum(
    f?.subtotal_factura ??
      f?.subtotal_moneda_O ??
      f?.sub_total_moneda_O ??
      f?.subtotal ??
      0
  );

  const impuestosFactura = toNum(
    f?.impuestos_factura ??
      f?.impuestos_moneda_O ??
      f?.impuestos ??
      0
  );

  const totalFactura = toNum(
    f?.total_factura ??
      f?.total_moneda_O ??
      f?.total ??
      subtotalFactura + impuestosFactura
  );

  const baseTotal =
    subtotalFactura > 0 || impuestosFactura > 0
      ? round2(subtotalFactura + impuestosFactura)
      : round2(totalFactura);

  return {
    subtotalFactura: round2(subtotalFactura),
    impuestosFactura: round2(impuestosFactura),
    totalFactura: round2(baseTotal),
  };
}

function getFacturaRatios(f: any) {
  const { subtotalFactura, impuestosFactura, totalFactura } =
    getFacturaBaseAmounts(f);

  if (totalFactura > 0 && (subtotalFactura > 0 || impuestosFactura > 0)) {
    return {
      subtotalRatio: subtotalFactura / totalFactura,
      impuestosRatio: impuestosFactura / totalFactura,
    };
  }

  const taxRateDecimal = getTaxRateDecimal(f);

  if (taxRateDecimal > 0) {
    return {
      subtotalRatio: 1 / (1 + taxRateDecimal),
      impuestosRatio: taxRateDecimal / (1 + taxRateDecimal),
    };
  }

  return {
    subtotalRatio: 1,
    impuestosRatio: 0,
  };
}

function splitMontoAsociadoProporcional(monto: number, factura: any) {
  const montoAsociar = round2(monto);

  if (montoAsociar <= 0) {
    return {
      subtotal: 0,
      impuestos: 0,
      monto_asociar: 0,
    };
  }

  const { subtotalRatio, impuestosRatio } = getFacturaRatios(factura);

  const subtotal = round2(montoAsociar * subtotalRatio);
  const impuestos = round2(montoAsociar - subtotal);

  return {
    subtotal,
    impuestos: impuestosRatio > 0 ? impuestos : 0,
    monto_asociar: montoAsociar,
  };
}

function toDraftString(n: number) {
  return Number.isFinite(n) ? String(round2(n)) : "";
}

function recalcDraftFromField(
  field: "subtotal" | "impuestos" | "monto_asociar",
  rawValue: string,
  current: FacturaDraft,
  factura: any
): FacturaDraft {
  const raw = String(rawValue ?? "");

  if (raw.trim() === "") {
    if (field === "monto_asociar") {
      return {
        subtotal: "",
        impuestos: "",
        monto_asociar: "",
      };
    }

    return {
      ...current,
      [field]: "",
    };
  }

  const value = toNum(raw);
  const { subtotalRatio, impuestosRatio } = getFacturaRatios(factura);

  if (field === "monto_asociar") {
    const next = splitMontoAsociadoProporcional(value, factura);

    return {
      subtotal: toDraftString(next.subtotal),
      impuestos: toDraftString(next.impuestos),
      monto_asociar: raw,
    };
  }

  if (field === "subtotal") {
    const monto_asociar =
      subtotalRatio > 0 ? round2(value / subtotalRatio) : round2(value);

    const next = splitMontoAsociadoProporcional(monto_asociar, factura);

    return {
      subtotal: raw,
      impuestos: toDraftString(next.impuestos),
      monto_asociar: toDraftString(next.monto_asociar),
    };
  }

  const monto_asociar =
    impuestosRatio > 0 ? round2(value / impuestosRatio) : round2(value);

  const next = splitMontoAsociadoProporcional(monto_asociar, factura);

  return {
    subtotal: toDraftString(next.subtotal),
    impuestos: raw,
    monto_asociar: toDraftString(next.monto_asociar),
  };
}

function buildDraftsFromFacturas(facturas: any[]): Record<string, FacturaDraft> {
  const next: Record<string, FacturaDraft> = {};

  facturas.forEach((f: any, idx: number) => {
    const key = getFacturaRowKey(f, idx);

    const subtotalAsociado = toNum(
      f?.subtotal_facturado ?? f?.subtotal_asociado ?? 0
    );

    const impuestosAsociado = toNum(
      f?.impuestos_facturado ?? f?.impuestos_asociados ?? 0
    );

    const montoAsociado = round2(
      subtotalAsociado > 0 || impuestosAsociado > 0
        ? subtotalAsociado + impuestosAsociado
        : toNum(f?.monto_facturado_relacion ?? f?.total_asociado_factura ?? 0)
    );

    if (montoAsociado > 0) {
      if (subtotalAsociado > 0 || impuestosAsociado > 0) {
        next[key] = {
          subtotal: toFixedInput(subtotalAsociado),
          impuestos: toFixedInput(impuestosAsociado),
          monto_asociar: toFixedInput(montoAsociado),
        };
      } else {
        const parts = splitMontoAsociadoProporcional(montoAsociado, f);

        next[key] = {
          subtotal: toFixedInput(parts.subtotal),
          impuestos: toFixedInput(parts.impuestos),
          monto_asociar: toFixedInput(parts.monto_asociar),
        };
      }
    } else {
      next[key] = {
        subtotal: "",
        impuestos: "",
        monto_asociar: "",
      };
    }
  });

  return next;
}

const ModalDetalle: React.FC<ModalDetallesProp> = ({ solicitud, onClose }) => {
  const endpoint = `${URL}/mia/pago_proveedor/detalles`;
  const asignarMontoFactEndpoint = `${URL}/mia/pago_proveedor/asignar_monto_fact`;
  const deleteFacturaEndpoint = `${URL}/mia/pago_proveedor/edit_factura`;

  const payload = useMemo(() => buildPayloadFromSolicitud(solicitud), [solicitud]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const [drafts, setDrafts] = useState<Record<string, FacturaDraft>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const fetchDetalles = useCallback(
    async (signal?: AbortSignal) => {
      if (!solicitud) return;

      setLoading(true);
      setError("");

      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          signal,
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

        const facturas = Array.isArray(json?.data?.facturas) ? json.data.facturas : [];
        setDrafts(buildDraftsFromFacturas(facturas));
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("❌ Error cargando detalles:", e);
        setError(e?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [endpoint, payload, solicitud]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchDetalles(controller.signal);
    return () => controller.abort();
  }, [fetchDetalles]);

  const api = data?.data ?? {};
  const solicitudApi = api?.solicitud ?? null;
  const facturasApi = Array.isArray(api?.facturas) ? api.facturas : [];
  const resumen = api?.resumen_validacion ?? null;

const setDraftField = useCallback(
  (
    factura: any,
    facturaKey: string,
    field: "subtotal" | "impuestos" | "monto_asociar",
    value: string
  ) => {
    setDrafts((prev) => {
      const current = prev[facturaKey] || {
        subtotal: "",
        impuestos: "",
        monto_asociar: "",
      };

      return {
        ...prev,
        [facturaKey]: recalcDraftFromField(field, value, current, factura),
      };
    });
  },
  []
);

  const saveFactura = useCallback(
    async (factura: any) => {
      const facturaKey = safeString(factura?.facturaKey);
      if (!facturaKey) {
        alert("No se encontró identificador de la fila");
        return;
      }

      const draft = drafts[facturaKey];
      if (!draft) return;

      const id_solicitud_proveedor = safeString(payload.id_solicitud_proveedor);
      const id_factura_proveedor = safeString(factura?.id_factura_proveedor);
      const uuid_factura = safeString(
        factura?.uuid_cfdi ?? factura?.uuid_factura
      );

     const montoAsociar = toApiNumber(draft.monto_asociar) ?? 0;

const partesAsociadas = splitMontoAsociadoProporcional(montoAsociar, factura);
const subtotalFacturado = partesAsociadas.subtotal;
const impuestosFacturado = partesAsociadas.impuestos;

const totalYaAsociado = toNum(
  factura?.monto_facturado_relacion ?? factura?.total_asociado_factura ?? 0
);

const maximoAdicional = toNum(factura?.maximo_a_asociar);
const maximoTotalPermitido = round2(totalYaAsociado + maximoAdicional);

      if (subtotalFacturado < 0 || impuestosFacturado < 0) {
        alert("Subtotal e impuestos deben ser mayores o iguales a 0");
        return;
      }

      if (montoAsociar <= 0) {
        alert("El monto a asociar debe ser mayor a 0");
        return;
      }

      if (montoAsociar > maximoTotalPermitido) {
  alert(
    `El monto a asociar no puede ser mayor a ${formatMoney(
      maximoTotalPermitido
    )} (asociado actual ${formatMoney(
      totalYaAsociado
    )} + adicional disponible ${formatMoney(maximoAdicional)})`
  );
  return;
}

      try {
        setSavingKey(facturaKey);

        const body = {
          id_solicitud_proveedor,
          id_factura_proveedor,
          uuid_factura,
          subtotal_facturado: subtotalFacturado,
          impuestos_facturado: impuestosFacturado,
        };

        const resp = await fetch(asignarMontoFactEndpoint, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify(body),
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok) {
          throw new Error(
            json?.message || json?.error || `Error HTTP: ${resp.status}`
          );
        }

        await fetchDetalles();
      } catch (e: any) {
        console.error("❌ Error guardando factura:", e);
        alert(e?.message || "Error al guardar la factura");
      } finally {
        setSavingKey(null);
      }
    },
    [drafts, asignarMontoFactEndpoint, fetchDetalles, payload.id_solicitud_proveedor]
  );

  const deleteFactura = useCallback(
    async (factura: any) => {
      const facturaKey = safeString(factura?.facturaKey);
      const id_solicitud_proveedor = safeString(payload.id_solicitud_proveedor);
      const id_factura_proveedor = safeString(factura?.id_factura_proveedor);
      const uuid_factura = safeString(
        factura?.uuid_cfdi ??
          factura?.uuid_factura ??
          factura?.uuid_factura_full
      );

      const ok = window.confirm(
        `¿Seguro que deseas eliminar esta factura?\n\nUUID: ${uuid_factura || "—"}`
      );
      if (!ok) return;

      try {
        setDeletingKey(facturaKey);

        const resp = await fetch(deleteFacturaEndpoint, {
          method: "DELETE",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify({
            id_solicitud_proveedor,
            id_factura_proveedor,
            uuid_factura,
          }),
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok) {
          throw new Error(
            json?.message || json?.error || `Error HTTP: ${resp.status}`
          );
        }

        await fetchDetalles();
      } catch (e: any) {
        console.error("❌ Error eliminando factura:", e);
        alert(e?.message || "Error al eliminar la factura");
      } finally {
        setDeletingKey(null);
      }
    },
    [deleteFacturaEndpoint, fetchDetalles, payload.id_solicitud_proveedor]
  );

  const montoSolicitado =
    resumen?.monto_solicitado ?? solicitudApi?.monto_solicitado ?? 0;
  const totalAsociadoSolicitud = resumen?.total_asociado_solicitud ?? 0;
  const restanteSolicitud = resumen?.restante_solicitud ?? 0;
  const totalPagado = resumen?.total_pagado ?? 0;
  const totalFacturas = resumen?.total_facturado ?? 0;
  const diferencia = resumen?.diferencia_total ?? 0;
  const esCuadrado = Number(diferencia) === 0;

const facturasTable = useMemo(() => {
  return facturasApi.map((f: any, idx: number) => {
    const facturaKey = getFacturaRowKey(f, idx);
    const draft = drafts[facturaKey] || {
      subtotal: "",
      impuestos: "",
      monto_asociar: "",
    };

    const totalAsociado = toNum(
      f?.monto_facturado_relacion ?? f?.total_asociado_factura ?? 0
    );
    const maximoAdicional = toNum(f?.maximo_a_asociar);
    const maximoTotalPermitido = round2(totalAsociado + maximoAdicional);

    return {
      id: facturaKey,
      facturaKey,
      rawFactura: f,

      uuid_factura_full:
        safeString(f?.uuid_cfdi) || safeString(f?.uuid_factura) || "—",
      razon_social_view:
        safeString(f?.razon_social_fiscal) ||
        safeString(f?.razon_social_emisor) ||
        safeString(f?.razon_social) ||
        "—",
      rfc_view: safeString(f?.rfc_emisor) || safeString(f?.rfc) || "—",

      total_factura_view: toNum(f?.total_factura || f?.total),
      total_asociado_factura_view: totalAsociado,
      restante_factura_view: toNum(f?.restante_factura),
      maximo_a_asociar_view: maximoAdicional,
      maximo_total_permitido_view: maximoTotalPermitido,

      subtotal_edit: draft.subtotal,
      impuestos_edit: draft.impuestos,
      monto_asociar_edit: draft.monto_asociar,

      acciones: {
        ...f,
        facturaKey,
        rawFactura: f,
      },
    };
  });
}, [facturasApi, drafts]);

  const facturasCols = useMemo(
    () => [
      "uuid_factura_full",
      "razon_social_view",
      "rfc_view",
      "total_factura_view",
      "total_asociado_factura_view",
      "restante_factura_view",
      "maximo_a_asociar_view",
      "subtotal_edit",
      "impuestos_edit",
      "monto_asociar_edit",
      "acciones",
    ],
    []
  );

  const facturasRenderers = useMemo(
    () => ({
      uuid_factura_full: ({ value }: any) => (
        <span className="font-mono text-xs text-gray-800 break-all whitespace-normal">
          {value || "—"}
        </span>
      ),

      razon_social_view: ({ value }: any) => (
        <span className="text-xs text-gray-800">{value || "—"}</span>
      ),

      rfc_view: ({ value }: any) => (
        <span className="font-mono text-xs text-gray-800">{value || "—"}</span>
      ),

      total_factura_view: ({ value }: any) => (
        <span className="text-xs font-semibold text-gray-800">
          {formatMoney(value)}
        </span>
      ),

      total_asociado_factura_view: ({ value }: any) => (
        <span className="text-xs text-blue-700 font-semibold">
          {formatMoney(value)}
        </span>
      ),

      restante_factura_view: ({ value }: any) => (
        <span className="text-xs text-amber-700 font-semibold">
          {formatMoney(value)}
        </span>
      ),

      monto_asociar_edit: ({ item }: any) => {
  const facturaKey = String(item?.facturaKey ?? "");
  const maximo = toNum(item?.maximo_total_permitido_view);
  const adicional = toNum(item?.maximo_a_asociar_view);
  const asociadoActual = toNum(item?.total_asociado_factura_view);
  const monto = toNum(drafts[facturaKey]?.monto_asociar ?? 0);
  const excedido = monto > maximo;

  return (
    <div key={`${facturaKey}-monto`} className="min-w-[170px]">
      <input
        type="number"
        step="0.01"
        value={drafts[facturaKey]?.monto_asociar ?? ""}
        onChange={(e) =>
          setDraftField(
            item?.rawFactura ?? item,
            facturaKey,
            "monto_asociar",
            e.target.value
          )
        }
        className={`w-full border rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 ${
          excedido
            ? "border-red-300 focus:ring-red-100 text-red-700"
            : "border-gray-200 focus:ring-blue-100"
        }`}
        placeholder="0.00"
      />
      <p className="mt-1 text-[10px] text-gray-500">
        Máximo total: {formatMoney(maximo)}
      </p>
      <p className="text-[10px] text-gray-400">
        Asociado: {formatMoney(asociadoActual)} + adicional: {formatMoney(adicional)}
      </p>
    </div>
  );
},

      subtotal_edit: ({ item }: any) => {
  const facturaKey = String(item?.facturaKey ?? "");
  return (
    <div key={`${facturaKey}-subtotal`}>
      <input
        type="number"
        step="0.01"
        value={drafts[facturaKey]?.subtotal ?? ""}
        onChange={(e) =>
          setDraftField(item?.rawFactura ?? item, facturaKey, "subtotal", e.target.value)
        }
        className="w-full min-w-[110px] border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="0.00"
      />
    </div>
  );
},

impuestos_edit: ({ item }: any) => {
  const facturaKey = String(item?.facturaKey ?? "");
  return (
    <div key={`${facturaKey}-impuestos`}>
      <input
        type="number"
        step="0.01"
        value={drafts[facturaKey]?.impuestos ?? ""}
        onChange={(e) =>
          setDraftField(item?.rawFactura ?? item, facturaKey, "impuestos", e.target.value)
        }
        className="w-full min-w-[110px] border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        placeholder="0.00"
      />
    </div>
  );
},

      acciones: ({ value }: any) => {
        const facturaKey = safeString(value?.facturaKey);
        const rawFactura = value?.rawFactura ?? value;

        const isSaving = !!facturaKey && savingKey === facturaKey;
        const isDeleting = !!facturaKey && deletingKey === facturaKey;

        return (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openUrl(rawFactura?.url_pdf)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
              title="Abrir PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => openUrl(rawFactura?.url_xml)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
              title="Abrir XML"
            >
              <Code2 className="w-3.5 h-3.5" />
              XML
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => void saveFactura({ ...rawFactura, facturaKey })}
              disabled={isSaving || isDeleting}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              title="Guardar cambios"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar
            </button>

            <button
              type="button"
              onClick={() => void deleteFactura({ ...rawFactura, facturaKey })}
              disabled={isSaving || isDeleting}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100 disabled:opacity-50"
              title="Eliminar factura"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Eliminar
            </button>
          </div>
        );
      },
    }),
    [drafts, savingKey, deletingKey, setDraftField, saveFactura, deleteFactura]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">
                Solicitud #{payload.id_solicitud_proveedor || "—"}
              </p>

              {resumen ? (
                <Badge
                  text={esCuadrado ? "VALIDACIÓN: CUADRADO" : "VALIDACIÓN: DIFERENCIA"}
                  tone={esCuadrado ? "green" : "amber"}
                />
              ) : null}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Validación de solicitud, facturas y monto máximo asociable.
            </p>
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

        <div className="max-h-[calc(90vh-72px)] overflow-y-auto">
          <div className="p-5 space-y-4">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando detalles...
              </div>
            )}

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold">Error</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Resumen de validación
                    </p>

                    {resumen ? (
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
                    ) : null}
                  </div>

                  {!resumen ? (
                    <p className="text-xs text-gray-500">
                      No llegó resumen de validación en la respuesta.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                      <StatCard
                        label="Monto solicitado"
                        value={formatMoney(montoSolicitado)}
                      />
                      <StatCard
                        label="Total asociado solicitud"
                        value={formatMoney(totalAsociadoSolicitud)}
                      />
                      <StatCard
                        label="Restante solicitud"
                        value={
                          <span className="text-amber-700 font-bold">
                            {formatMoney(restanteSolicitud)}
                          </span>
                        }
                      />
                      <StatCard
                        label="Total pagado"
                        value={formatMoney(totalPagado)}
                      />
                      <StatCard
                        label="Total facturas"
                        value={formatMoney(totalFacturas)}
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
                            ? "Pagos y facturas cuadran."
                            : "Hay diferencia entre pago y total de facturas."
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Facturas ({facturasApi.length})
                    </p>
                  </div>

                  {facturasApi.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No hay facturas disponibles.
                    </p>
                  ) : (
                    <Table5<any>
                      registros={facturasTable as any}
                      customColumns={facturasCols as any}
                      renderers={facturasRenderers as any}
                      exportButton={false}
                      fillHeight={false}
                      maxHeight="420px"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalle;