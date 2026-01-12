// app/conciliacion/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import { Filter, X, Search, Maximize2 } from "lucide-react";
import SubirFactura from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";

type AnyRow = Record<string, any>;

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

function formatMoney(n: any) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
}

function safeArray(source: any): any[] {
  if (!source) return [];
  if (Array.isArray(source)) return source;
  if (Array.isArray(source.todos)) return source.todos;
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.data)) return source.data;
  return [];
}

function getRowId(raw: any, index: number) {
  return String(
    raw?.id_reserva ??
      raw?.id_solicitud ??
      raw?.id ??
      raw?.codigo_reservacion_hotel ??
      raw?.codigo_hotel ??
      index
  );
}

/** helpers **/
function flattenPagos(raw: any): any[] {
  const pagos = raw?.pagos;
  if (!Array.isArray(pagos)) return [];

  const lvl1 = pagos.flatMap((x: any) => (Array.isArray(x) ? x : [x]));
  const lvl2 = lvl1.flatMap((x: any) => (Array.isArray(x) ? x : [x]));
  return lvl2.filter(Boolean);
}

function getPagoStats(raw: any) {
  const pagos = flattenPagos(raw);

  let solicitado = 0;
  let pagado = 0;
  let conFecha = 0;

  for (const p of pagos) {
    solicitado += Number(p?.monto_solicitado ?? 0) || 0;
    pagado += Number(p?.monto_pagado ?? 0) || 0;
    if (p?.fecha_pago) conFecha += 1;
  }

  return {
    count: pagos.length,
    solicitado,
    pagado,
    conFecha,
  };
}

/**
 * Prioridad "como payload":
 * 1) raw.estatus_pagos (si viene)
 * 2) raw.solicitud_proveedor.estado_solicitud (si viene)
 * 3) fallback calculado con pagos (por si ambos vienen vacíos)
 */
function getEstatusPagoPayload(raw: any) {
  const estatusPayload = raw?.estatus_pagos ?? raw?.estatus_pago ?? "";
  const estadoSolicitud = raw?.solicitud_proveedor?.estado_solicitud ?? "";
  const filtroPago = raw?.filtro_pago ?? "";

  const stats = getPagoStats(raw);

  let computed = "";
  if (stats.solicitado > 0) {
    if (stats.pagado >= stats.solicitado) computed = "PAGADO";
    else if (stats.pagado > 0) computed = "PARCIAL";
    else computed = "PENDIENTE";
  }

  const label = (estatusPayload || estadoSolicitud || computed || "").toString();

  return {
    label,
    estatusPayload,
    estadoSolicitud,
    filtroPago,
    ...stats,
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcNoches(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) return 0;

  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  if (Number.isNaN(inD.getTime()) || Number.isNaN(outD.getTime())) return 0;

  const startUTC = Date.UTC(inD.getUTCFullYear(), inD.getUTCMonth(), inD.getUTCDate());
  const endUTC = Date.UTC(outD.getUTCFullYear(), outD.getUTCMonth(), outD.getUTCDate());

  const diffDays = Math.round((endUTC - startUTC) / MS_PER_DAY);
  return diffDays > 0 ? diffDays : 0;
}

function getTipoPago(raw: any): string {
  const detalles = Array.isArray(raw?.detalles_pagos) ? raw.detalles_pagos : [];
  const first = detalles?.[0] ?? null;

  return (
    first?.tipo_de_pago ??
    first?.metodo_de_pago ??
    raw?.solicitud_proveedor?.forma_pago_solicitada ??
    ""
  );
}

type TipoReservaInferida = "HOTEL" | "RENTA AUTO" | "FACTURA" | "";

function inferTipoReserva(raw: any): TipoReservaInferida {
  const isHotel = !!(raw?.id_hospedaje || raw?.hotel || raw?.room || raw?.codigo_reservacion_hotel);
  if (isHotel) return "HOTEL";

  const isRentaAuto = !!(
    raw?.id_renta_auto ||
    raw?.id_car_rental ||
    raw?.renta_auto ||
    raw?.car_rental ||
    raw?.vehiculo
  );
  if (isRentaAuto) return "RENTA AUTO";

  return "FACTURA";
}

type EstatusFacturaInferido = "FACTURADO" | "PARCIAL" | "SIN FACTURAR";

function getEstatusFacturas(raw: any): EstatusFacturaInferido {
  const facturas = Array.isArray(raw?.facturas) ? raw.facturas : [];
  if (facturas.length === 0) return "SIN FACTURAR";

  const pendienteRoot =
    Number(raw?.pendiente_facturar ?? raw?.pendiente_por_facturar ?? raw?.pendiente ?? 0) || 0;

  const pendienteEnFacturas = facturas.reduce((acc: number, f: any) => {
    const p = Number(f?.pendiente_facturar ?? f?.pendiente_por_facturar ?? f?.pendiente ?? 0) || 0;
    return Math.max(acc, p);
  }, 0);

  const pendiente = Math.max(pendienteRoot, pendienteEnFacturas);
  return pendiente > 0 ? "PARCIAL" : "FACTURADO";
}

function truncateText(v: any, max = 28) {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

/**
 * Mapea raw -> row para Table5
 * IMPORTANTE: agrega id_servicio para editar (backend actualiza por id_servicio)
 */
function toConciliacionRow(raw: any, index: number): AnyRow {
  const row_id = getRowId(raw, index);

  const hotel = (raw?.hotel ?? "").toString();
  const viajero = (raw?.nombre_viajero_completo ?? raw?.nombre_viajero ?? "").toString();

  const costo_proveedor = Number(raw?.costo_total ?? raw?.costo_proveedor ?? 0) || 0;
  const precio_de_venta = Number(raw?.total ?? raw?.precio_de_venta ?? 0) || 0;
  const markup =
    precio_de_venta > 0 ? ((precio_de_venta - costo_proveedor) / precio_de_venta) * 100 : 0;

  const nochesCalc = calcNoches(raw?.check_in, raw?.check_out);
  const tipoPago = getTipoPago(raw);
  const tipoReserva = inferTipoReserva(raw);
  const comentariosOps = raw?.comments ?? raw?.comentarios_ops ?? "";
  const estatusFacturas = getEstatusFacturas(raw);

  const uuid_factura = raw?.uuid_factura ?? raw?.UUID ?? raw?.uuid ?? null;
  const total_factura = Number(raw?.total_factura ?? 0) || 0;
  const total_facturado = Number(raw?.total_facturado ?? raw?.costo_facturado ?? 0) || 0;

  const total_aplicable = raw?.total_aplicable ?? raw?.totalAplicable ?? "";
  const impuestos = raw?.impuestos ?? "";
  const subtotal = raw?.subtotal ?? "";

  const baseFactura = Number(total_aplicable) || Number(total_facturado) || Number(total_factura) || 0;
  const estatusPagoObj = getEstatusPagoPayload(raw);
  const diferencia = Number(costo_proveedor) - Number(baseFactura);

  const tarjeta =
    raw?.tarjeta?.ultimos_4 ?? raw?.digitos_tajeta ?? raw?.ultimos_4 ?? raw?.tarjeta ?? "";

  const id_enviado = raw?.id_enviado ?? raw?.titular_tarjeta ?? "";

  const razon_social = raw?.proveedor?.razon_social ?? raw?.razon_social ?? "";
  const rfc = raw?.proveedor?.rfc ?? raw?.rfc ?? "";

  // ✅ CLAVE PARA EDITAR: id_servicio (ajusta fallback si tu payload difiere)
  const id_servicio =
    raw?.id_servicio ??
    raw?.solicitud_proveedor?.id_servicio ??
    raw?.servicio?.id_servicio ??
    null;

  return {
    row_id,

    // para edición por backend
    id_servicio,

    creado: raw?.created_at ?? raw?.creado ?? null,
    hotel: hotel ? hotel.toUpperCase() : "",
    codigo_hotel: raw?.codigo_reservacion_hotel ?? raw?.codigo_hotel ?? "",
    viajero: viajero ? viajero.toUpperCase() : "",
    check_in: raw?.check_in ?? null,
    check_out: raw?.check_out ?? null,

    noches: nochesCalc,
    tipo_cuarto: raw?.room ?? raw?.tipo_cuarto ?? "",

    costo_proveedor,
    markup,
    precio_de_venta,

    canal_de_reservacion: raw?.canal_de_reservacion ?? raw?.canal_reservacion ?? "",
    nombre_intermediario: raw?.nombre_intermediario ?? "",

    tipo_de_reserva: tipoReserva,
    tipo_de_pago: tipoPago,

    tarjeta,
    id_enviado,

    comentarios_ops: comentariosOps,
    conmentarios_cxp: raw?.comentarios_cxp ?? raw?.conmentarios_cxp ?? "",
    estatus_pago: estatusPagoObj.label ? estatusPagoObj.label.toUpperCase() : "",
    __estatus_pago: estatusPagoObj,

    detalles: "",
    subir_factura: "",

    estatus_facturas: estatusFacturas,

    total_facturado,
    diferencia_costo_proveedor_vs_factura: diferencia,

    uuid_factura,
    total_factura,
    total_aplicable,
    impuestos,
    subtotal,

    razon_social,
    rfc,

    __raw: raw,
    id_solicitud_proveedor: raw?.solicitud_proveedor?.id_solicitud_proveedor ?? null,
  };
}

type EditableField =
  | "canal_de_reservacion"
  | "nombre_intermediario"
  | "comentarios_ops"
  | "conmentarios_cxp"
  | "total_aplicable"
  | "impuestos"
  | "subtotal";

const MONEY_FIELDS: EditableField[] = ["total_aplicable", "impuestos", "subtotal"];

// Si tu backend usa nombres diferentes a los de UI, mapea aquí
const FIELD_TO_API: Record<string, string> = {
  canal_de_reservacion: "canal_de_reservacion",
  nombre_intermediario: "nombre_intermediario",
  comentarios_ops: "comentarios_ops",
  conmentarios_cxp: "conmentarios_cxp",
  total_aplicable: "total_aplicable",
  impuestos: "impuestos",
  subtotal: "subtotal",
};

type EditModalState = {
  open: boolean;
  rowId: string;
  idServicio: string | number | null;
  field: EditableField;
  value: string; // siempre string en UI
};

export default function ConciliacionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSubirFactura, setShowSubirFactura] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  // UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Draft UI para reflejar cambios ya guardados/pendientes
  const [draftEdits, setDraftEdits] = useState<Record<string, Partial<AnyRow>>>({});

  const endpoint = `${URL}/mia/pago_proveedor/solicitud`;
  const editEndpoint = `${URL}/mia/pago_proveedor/edit`;

  const load = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const json = await response.json();
      const source = json?.data?.todos ?? json?.data ?? json;
      const list = safeArray(source);

      console.log("envio de informacion", list);
      setRows(list);
    } catch (err) {
      console.error("Error cargando reservas:", err);
      setRows([]);
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * ✅ handleEdit ahora edita por id_servicio (requisito del backend)
   * Se dispara desde el botón "Cambiar" del modal expansivo.
   */
  const handleEdit = useCallback(
    async (rowId: string, field: EditableField, value: any, idServicio?: string | number | null) => {
      // 1) UI optimistic
      setDraftEdits((prev) => ({
        ...prev,
        [rowId]: { ...(prev[rowId] || {}), [field]: value },
      }));

      const id_servicio = (idServicio ?? null) as any;
      if (!id_servicio) {
        console.warn("Sin id_servicio para editar", { rowId, field, value });
        return;
      }

      const apiField = FIELD_TO_API[field] ?? field;

      const payload = {
        id_servicio, // ✅ clave de selección
        field: apiField,
        value,
        row_id: rowId, // opcional debug
      };

      try {
        const resp = await fetch(editEndpoint, {
          method: "PATCH",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify(payload),
        });

        const json = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(json?.message || `Error HTTP: ${resp.status}`);

        console.log("✅ edit ok", payload);
      } catch (err) {
        console.error("❌ edit fail", err);
      }
    },
    [editEndpoint]
  );

  // ---- Modal expansivo genérico para TODOS los editables ----
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    rowId: "",
    idServicio: null,
    field: "comentarios_ops",
    value: "",
  });

  const openEditModal = useCallback(
    (rowId: string, idServicio: any, field: EditableField, currentValue: any) => {
      setEditModal({
        open: true,
        rowId,
        idServicio: idServicio ? idServicio : null,
        field,
        value: String(currentValue ?? ""),
      });
    },
    []
  );

  const closeEditModal = useCallback(() => {
    setEditModal((s) => ({ ...s, open: false }));
  }, []);

  const saveEditModal = useCallback(async () => {
    const { rowId, field, value, idServicio } = editModal;
    if (!rowId) return;

    const normalizedValue =
      MONEY_FIELDS.includes(field) ? (value.trim() === "" ? null : Number(value)) : value;

    await handleEdit(rowId, field, normalizedValue, idServicio);
    closeEditModal();
  }, [editModal, handleEdit, closeEditModal]);

  const registrosVisibles = useMemo(() => {
    const mapped = rows.map((r, i) => toConciliacionRow(r, i));

    const q = (searchTerm || "").toUpperCase().trim();
    if (!q) return mapped;

    return mapped.filter((r) => {
      return (
        (r.hotel || "").toUpperCase().includes(q) ||
        (r.codigo_hotel || "").toUpperCase().includes(q) ||
        (r.viajero || "").toUpperCase().includes(q)
      );
    });
  }, [rows, searchTerm]);

  const customColumns = useMemo(
    () => [
      "creado",
      "hotel",
      "codigo_hotel",
      "viajero",
      "check_in",
      "check_out",
      "noches",
      "tipo_cuarto",
      "costo_proveedor",
      "markup",
      "precio_de_venta",
      "canal_de_reservacion",
      "nombre_intermediario",
      "tipo_de_reserva",
      "tipo_de_pago",
      "tarjeta",
      "id_enviado",
      "comentarios_ops",
      "conmentarios_cxp",
      "detalles",
      "estatus_facturas",
      "estatus_pago",
      "total_facturado",
      "diferencia_costo_proveedor_vs_factura",
      "subir_factura",
      "uuid_factura",
      "total_factura",
      "total_aplicable",
      "impuestos",
      "subtotal",
      "razon_social",
      "rfc",
    ],
    []
  );

  const renderers = useMemo<
    Record<string, React.FC<{ value: any; item: any; index: number }>>
  >(
    () => ({
      creado: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,
      check_in: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,
      check_out: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,

      codigo_hotel: ({ value }) => (
        <span className="font-semibold">{value ? String(value).toUpperCase() : ""}</span>
      ),

      costo_proveedor: ({ value }) => <span title={String(value)}>{formatMoney(value)}</span>,
      precio_de_venta: ({ value }) => <span title={String(value)}>{formatMoney(value)}</span>,

      markup: ({ value }) => {
        const n = Number(value || 0);
        return (
          <span
            className={[
              "font-semibold border px-2 py-1 rounded-full text-xs",
              n >= 0
                ? "text-green-700 bg-green-50 border-green-200"
                : "text-red-700 bg-red-50 border-red-200",
            ].join(" ")}
            title={`${n.toFixed(2)}%`}
          >
            {n.toFixed(2)}%
          </span>
        );
      },

      // ---------- EDITABLES (AHORA IGUALES A LOS DEMÁS + EXPANSIVO) ----------
      canal_de_reservacion: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const idServicio = item?.id_servicio ?? item?.__raw?.id_servicio ?? null;

        const v = draftEdits[rowId]?.canal_de_reservacion ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs">{String(v || "—").toUpperCase()}</span>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title="Editar"
              onClick={() => openEditModal(rowId, idServicio, "canal_de_reservacion", v)}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },

      nombre_intermediario: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const idServicio = item?.id_servicio ?? item?.__raw?.id_servicio ?? null;

        const v = draftEdits[rowId]?.nombre_intermediario ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {truncateText(v, 30)}
            </span>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title="Editar"
              onClick={() => openEditModal(rowId, idServicio, "nombre_intermediario", v)}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },

      comentarios_ops: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const idServicio = item?.id_servicio ?? item?.__raw?.id_servicio ?? null;

        const v = draftEdits[rowId]?.comentarios_ops ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {truncateText(v, 26)}
            </span>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title="Editar"
              onClick={() => openEditModal(rowId, idServicio, "comentarios_ops", v)}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },

      conmentarios_cxp: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const idServicio = item?.id_servicio ?? item?.__raw?.id_servicio ?? null;

        const v = draftEdits[rowId]?.conmentarios_cxp ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {truncateText(v, 26)}
            </span>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title="Editar"
              onClick={() => openEditModal(rowId, idServicio, "conmentarios_cxp", v)}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },

      total_aplicable: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const idServicio = item?.id_servicio ?? item?.__raw?.id_servicio ?? null;

        const v = draftEdits[rowId]?.total_aplicable ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {v === "" || v === null || typeof v === "undefined" ? "—" : formatMoney(v)}
            </span>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title="Editar"
              onClick={() => openEditModal(rowId, idServicio, "total_aplicable", v)}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },

      impuestos: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const idServicio = item?.id_servicio ?? item?.__raw?.id_servicio ?? null;

        const v = draftEdits[rowId]?.impuestos ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {v === "" || v === null || typeof v === "undefined" ? "—" : formatMoney(v)}
            </span>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title="Editar"
              onClick={() => openEditModal(rowId, idServicio, "impuestos", v)}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },

      subtotal: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const idServicio = item?.id_servicio ?? item?.__raw?.id_servicio ?? null;

        const v = draftEdits[rowId]?.subtotal ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {v === "" || v === null || typeof v === "undefined" ? "—" : formatMoney(v)}
            </span>
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title="Editar"
              onClick={() => openEditModal(rowId, idServicio, "subtotal", v)}
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },

      // ------- BOTONES / SELECT -------
      detalles: ({ item }) => {
        const rowId = String(item?.row_id ?? "");
        return (
          <button
            type="button"
            className="px-2 py-1 rounded-md text-xs border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            onClick={() => console.log("detalles", { rowId })}
          >
            Detalles
          </button>
        );
      },

      subir_factura: ({ item }) => {
        const rowId = String(item?.row_id ?? "");
        return (
          <button
            type="button"
            className="px-2 py-1 rounded-md text-xs border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            onClick={() => {
              console.log("subir_factura", { rowId });
              setShowSubirFactura(true);
            }}
          >
            Subir
          </button>
        );
      },

      // ------- DISPLAY EXTRA -------
      total_facturado: ({ value }) => <span title={String(value)}>{formatMoney(value)}</span>,

      diferencia_costo_proveedor_vs_factura: ({ value }) => {
        const n = Number(value || 0);
        return (
          <span
            className={
              n === 0
                ? "text-gray-700"
                : n > 0
                ? "text-amber-700 font-semibold"
                : "text-red-700 font-semibold"
            }
            title={String(value)}
          >
            {formatMoney(n)}
          </span>
        );
      },

      uuid_factura: ({ value }) => (
        <span className="font-mono text-xs" title={value || ""}>
          {value ? String(value).slice(0, 8) + "…" : "—"}
        </span>
      ),

      total_factura: ({ value }) => <span title={String(value)}>{formatMoney(value)}</span>,
    }),
    [draftEdits, openEditModal]
  );

  const defaultSort = useMemo(() => ({ key: "creado", sort: false }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
        {/* Barra de búsqueda + botones */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código, ID, cliente..."
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((s) => !s)}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>

              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>

          {/* Panel de filtros (solo espaciado / sin lógica) */}
          {filtersOpen && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Folio / ID reserva
                  </label>
                  <input
                    placeholder="Ej. 302081977..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cliente
                  </label>
                  <input
                    placeholder="Buscar cliente..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Viajero
                  </label>
                  <input
                    placeholder="Buscar viajero..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rango de fechas
                  </label>
                  <input
                    placeholder="Check-in / Check-out"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla principal */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
          <Table5<any>
            registros={registrosVisibles as any}
            renderers={renderers}
            defaultSort={defaultSort as any}
            leyenda={`Mostrando ${registrosVisibles.length} registros`}
            customColumns={customColumns}
            fillHeight
            maxHeight="calc(100vh - 220px)"
          />
        </div>

        {/* MODAL EXPANSIVO PARA EDITABLES */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={closeEditModal} />

            {/* modal */}
            <div className="relative w-[min(720px,92vw)] bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Editar campo</p>
                  <p className="text-xs text-gray-500">
                    Row: {editModal.rowId} • id_servicio: {String(editModal.idServicio ?? "—")}
                  </p>
                  <p className="text-xs text-gray-500">Campo: {editModal.field}</p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                  onClick={closeEditModal}
                  title="Cerrar"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              <div className="p-4">
                {/* Render del input según field */}
                {editModal.field === "canal_de_reservacion" ? (
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    value={editModal.value}
                    onChange={(e) => setEditModal((s) => ({ ...s, value: e.target.value }))}
                  >
                    <option value="">—</option>
                    <option value="DIRECTO">DIRECTO</option>
                    <option value="INTERMEDIARIO">INTERMEDIARIO</option>
                  </select>
                ) : editModal.field === "comentarios_ops" || editModal.field === "conmentarios_cxp" ? (
                  <textarea
                    className="w-full min-h-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) => setEditModal((s) => ({ ...s, value: e.target.value }))}
                    placeholder="Escribe el texto completo..."
                  />
                ) : editModal.field === "total_aplicable" ||
                  editModal.field === "impuestos" ||
                  editModal.field === "subtotal" ? (
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) => setEditModal((s) => ({ ...s, value: e.target.value }))}
                    placeholder="0.00"
                  />
                ) : (
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) => setEditModal((s) => ({ ...s, value: e.target.value }))}
                    placeholder="Escribe..."
                  />
                )}

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
                    onClick={closeEditModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={saveEditModal}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SUBIR FACTURA */}
        {showSubirFactura && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800"></h2>
                <button
                  onClick={() => setShowSubirFactura(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <SubirFactura
                  proveedores_data={true}
                  onSuccess={() => {
                    setShowSubirFactura(false);
                    // Opcional: load() para refrescar tabla
                    // load();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
