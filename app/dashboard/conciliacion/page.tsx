// app/conciliacion/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import { Filter, X, Search } from "lucide-react";

import Button from "@/components/atom/Button";
import SubirFactura from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";
import ModalDetalle from "@/app/dashboard/conciliacion/compponents/detalles";

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

function truncateText(v: any, max = 28) {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

/**
 * ✅ RowId SIEMPRE = id_solicitud_proveedor
 */
function getRowId(raw: any, index: number) {
  const id =
    raw?.solicitud_proveedor?.id_solicitud_proveedor ??
    raw?.id_solicitud_proveedor ??
    raw?.row_id ??
    null;

  return id != null ? String(id) : String(index);
}

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

  for (const p of pagos) {
    solicitado += Number(p?.monto_solicitado ?? 0) || 0;
    pagado += Number(p?.monto_pagado ?? 0) || 0;
  }

  return { count: pagos.length, solicitado, pagado };
}

function getEstatusPagoPayload(raw: any) {
  const estatusPayload = raw?.estatus_pagos ?? raw?.estatus_pago ?? "";
  const estadoSolicitud = raw?.solicitud_proveedor?.estado_solicitud ?? "";

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
    ...stats,
  };
}

function getTipoPago(raw: any): string {
  const forma_pag = raw?.solicitud_proveedor?.forma_pago_solicitada;
  let final = "";
  switch (forma_pag) {
    case "card":
      final = "TARJETA";
      break;
    case "link":
      final = "LINK_PAGO";
      break;
    case "transfer":
      final = "TRANSFERENCIA";
      break;
    default:
      final = "";
      break;
  }
  return final;
}

type TipoReservaInferida = "PREPAGO" | "CREDITO" | "";

function inferTipoReserva(raw: any): TipoReservaInferida {
  const isRentaAuto = raw?.is_credito;
  if (!isRentaAuto) return "PREPAGO";
  return "CREDITO";
}

function extractFacturasYPagosFromPFP(raw: any) {
  const v = raw?.pagos_facturas_proveedores_json;

  const arr: any[] = Array.isArray(v)
    ? v
    : typeof v === "string"
    ? JSON.parse(v)
    : [];

  const id_facturas = Array.from(
    new Set(
      arr
        .map((x) => String(x?.id_factura ?? "").trim())
        .filter(Boolean)
    )
  );

  const id_pagos = Array.from(
    new Set(
      arr
        .map((x) => String(x?.id_pago_proveedor ?? x?.id_pago ?? "").trim())
        .filter(Boolean)
    )
  );

  return { id_facturas, id_pagos };
}

type EstatusFacturaInferido = "FACTURADO" | "PARCIAL" | "SIN FACTURAR";

function getEstatusFacturas(
  diferencia: any,
  costo_proveedor: any,
  _baseFactura: any
): EstatusFacturaInferido {
  if (diferencia == 0) return "FACTURADO";
  if (diferencia == costo_proveedor) return "SIN FACTURAR";
  return "PARCIAL";
}

/**
 * ✅ TRANSFORMACIÓN: raw -> row final
 */
function toConciliacionRow(raw: any, index: number): AnyRow {
  const row_id = getRowId(raw, index);

  const id_solicitud_proveedor =
    raw?.solicitud_proveedor?.id_solicitud_proveedor ??
    raw?.id_solicitud_proveedor ??
    null;

  const id_proveedor =
    raw?.id_proveedor_resuelto ??
    raw?.solicitud_proveedor?.id_proveedor ??
    raw?.proveedor?.id_proveedor ??
    null;

  const hotel = (raw?.hotel ?? "").toString();
  const viajero = (raw?.nombre_viajero_completo ?? raw?.nombre_viajero ?? "").toString();

  const costo_proveedor = Number(raw?.costo_total ?? 0) || 0;
  const precio_de_venta = Number(raw?.total ?? 0) || 0;

  const markup =
    precio_de_venta > 0
      ? ((precio_de_venta - costo_proveedor) / precio_de_venta) * 100
      : 0;

  const nochesCalc = calcNoches(raw?.check_in, raw?.check_out);
  const tipoPago = getTipoPago(raw);
  const tipoReserva = inferTipoReserva(raw);

  const comentariosOps =
    raw?.solicitud_proveedor?.comentarios ?? raw?.comentarios_ops ?? "";

  const estatusPagoObj = getEstatusPagoPayload(raw);

  const total_facturado =
    Number(raw?.total_facturado_en_pfp ?? raw?.total_facturado ?? 0) || 0;

  const total_factura = Number(raw?.monto_facturado ?? 0) || 0;

  const total_aplicable = raw?.total_aplicable ?? "";
  const impuestos = raw?.impuestos ?? "";
  const subtotal = raw?.subtotal ?? "";

  const baseFactura = Number(total_aplicable) || total_facturado || total_factura || 0;
  const diferencia = Number((costo_proveedor - baseFactura).toFixed(2));

  const estatusFacturas = getEstatusFacturas(diferencia, costo_proveedor, baseFactura);

  const tarjeta = raw?.tarjeta?.ultimos_4 ?? raw?.ultimos_4 ?? "";

  const razon_social =
    raw?.proveedor?.razon_social ??
    raw?.razon_social_hotel ??
    raw?.razon_social ??
    "";

  // ⚠️ Se mantiene en data para validaciones internas, pero ya NO se muestra como columna
  const rfc = raw?.rfc_proveedor;

  const id_servicio = raw?.id_servicio ?? null;

  const asociaciones = extractFacturasYPagosFromPFP(raw);

  return {
    row_id,
    seleccionar: row_id,

    id_solicitud_proveedor,
    id_proveedor,
    id_servicio,

    creado: raw?.created_at ?? null,
    hotel: hotel ? hotel.toUpperCase() : "",
    codigo_hotel: raw?.codigo_reservacion_hotel ?? "",
    viajero: viajero ? viajero.toUpperCase() : "",
    check_in: raw?.check_in ?? null,
    check_out: raw?.check_out ?? null,

    noches: nochesCalc,
    tipo_cuarto: raw?.room ?? "",

    costo_proveedor,
    markup,
    precio_de_venta,

    canal_de_reservacion: raw?.canal_de_reservacion ?? "",
    nombre_intermediario: raw?.nombre_intermediario ?? "",

    tipo_de_reserva: tipoReserva,
    tipo_de_pago: tipoPago,

    tarjeta,
    id_enviado: raw?.titular_tarjeta ?? "",

    comentarios_ops: comentariosOps,
    comentarios_cxp: raw?.comentario_CXP ?? raw?.comentarios_cxp ?? "",

    conciliacion: raw, // ✅ botón conciliación
    estatus_facturas: estatusFacturas,
    estatus_pago: estatusPagoObj.label ? estatusPagoObj.label.toUpperCase() : "",

    total_facturado,
    diferencia_costo_proveedor_vs_factura: diferencia,

    uuid_factura: raw?.uuid_factura ?? null,
    total_factura,

    subir_factura: raw,
    comprobante: raw, // ✅ botón subir comprobante (sin lógica)

    total_aplicable,
    impuestos,
    subtotal,

    razon_social,
    rfc: rfc, // NO se muestra como columna

    item: {
      id_solicitud_proveedor,
      diferencia_costo_proveedor_vs_factura: diferencia,
      asociaciones,
      informacion_completa: raw,
      id_proveedor,
    },

    __raw: raw,
  };
}

// ✅ Solo quedan editables estos:
type EditableField =
  | "comentarios_ops"
  | "comentarios_cxp"
  | "total_aplicable"
  | "impuestos"
  | "subtotal";

const MONEY_FIELDS: EditableField[] = ["total_aplicable", "impuestos", "subtotal"];

const FIELD_TO_API: Record<string, string> = {
  comentarios_ops: "comentarios_ops",
  comentarios_cxp: "comentarios_cxp",
  total_aplicable: "total_aplicable",
  impuestos: "impuestos",
  subtotal: "subtotal",
};

type EditModalState = {
  open: boolean;
  rowId: string;
  idServicio: string | number | null;
  field: EditableField;
  value: string;
};

type ProveedorSeleccionado = {
  id_solicitud: string;
  id_proveedor: string;
};

// ✅ Modal “Subir comprobante” sin lógica
type ComprobanteModalState = {
  open: boolean;
  row: AnyRow | null;
  file: File | null;
  nota: string;
};

export default function ConciliacionPage() {
  const EPS = 0.01;
  const isZero = (n: any) => Math.abs(Number(n) || 0) < EPS;

  const [isLoading, setIsLoading] = useState(false);
  const [showSubirFactura, setShowSubirFactura] = useState(false);

  const [todos, setTodos] = useState<any[]>([]);

  // UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Draft edits
  const [draftEdits, setDraftEdits] = useState<Record<string, Partial<AnyRow>>>({});
  const [selectedForFactura, setSelectedForFactura] = useState<ProveedorSeleccionado[]>([]);

  const endpoint = `${URL}/mia/pago_proveedor/solicitud`;
  const editEndpoint = `${URL}/mia/pago_proveedor/edit`;

  const [selectedRfc, setSelectedRfc] = useState<string>("");

  // ✅ Conciliación (tu lógica: abre ModalDetalle)
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleSolicitud, setDetalleSolicitud] = useState<any | null>(null);

  const openDetalle = useCallback((row: any) => {
    setDetalleSolicitud(row);
    setDetalleOpen(true);
  }, []);

  const closeDetalle = useCallback(() => {
    setDetalleOpen(false);
    setDetalleSolicitud(null);
  }, []);

  const closeSubirFactura = useCallback(() => {
    setShowSubirFactura(false);
    setSelectedForFactura([]);
  }, []);

  // ✅ Modal comprobante (sin lógica)
  const [comprobanteModal, setComprobanteModal] = useState<ComprobanteModalState>({
    open: false,
    row: null,
    file: null,
    nota: "",
  });

  const openComprobanteModal = useCallback((row: AnyRow) => {
    setComprobanteModal({ open: true, row, file: null, nota: "" });
  }, []);

  const closeComprobanteModal = useCallback(() => {
    setComprobanteModal({ open: false, row: null, file: null, nota: "" });
  }, []);

  // ✅ FETCH
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
      const list = Array.isArray(json?.data?.todos) ? json.data.todos : [];
      setTodos(list);
    } catch (err) {
      console.error("Error cargando conciliación:", err);
      setTodos([]);
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * ✅ KEY estable para selección/edición
   */
  const getSelectionKey = (rowOrValue: any, index?: number) => {
    if (typeof rowOrValue === "string" || typeof rowOrValue === "number") {
      const s = String(rowOrValue).trim();
      if (s !== "" && s !== "undefined" && s !== "null") return s;
    }

    const row = rowOrValue && typeof rowOrValue === "object" ? rowOrValue : null;

    const id =
      row?.id_solicitud_proveedor ??
      row?.row_id ??
      row?.__raw?.solicitud_proveedor?.id_solicitud_proveedor ??
      null;

    const clean = id != null ? String(id).trim() : "";
    if (clean !== "" && clean !== "undefined" && clean !== "null") return clean;

    return String(index ?? "");
  };

  // ---- Modal de edición (solo comentarios y totales) ----
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    rowId: "",
    idServicio: null,
    field: "comentarios_ops",
    value: "",
  });

  const openEditModal = useCallback(
    (rowIdSolicitudProveedor: string, idServicio: any, field: EditableField, currentValue: any) => {
      setEditModal({
        open: true,
        rowId: String(rowIdSolicitudProveedor),
        idServicio: idServicio ?? null,
        field,
        value: currentValue == null ? "" : String(currentValue),
      });
    },
    []
  );

  const closeEditModal = useCallback(() => {
    setEditModal((s) => ({ ...s, open: false }));
  }, []);

  const handleEdit = useCallback(
    async (rowIdSolicitudProveedor: string, field: EditableField, value: any) => {
      // draft UI
      setDraftEdits((prev) => ({
        ...prev,
        [rowIdSolicitudProveedor]: {
          ...(prev[rowIdSolicitudProveedor] || {}),
          [field]: value,
        },
      }));

      const normalizedValue = MONEY_FIELDS.includes(field)
        ? String(value).trim() === ""
          ? null
          : Number(value)
        : value;

      const apiField = FIELD_TO_API[field] ?? field;

      const payload = {
        id_solicitud_proveedor: rowIdSolicitudProveedor,
        [apiField]: normalizedValue,
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

        if (!resp.ok) {
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);
        }
      } catch (err) {
        console.error("❌ edit fail", err);
      }
    },
    [editEndpoint]
  );

  const saveEditModal = useCallback(async () => {
    const { rowId, field, value } = editModal;
    if (!rowId) return;
    await handleEdit(rowId, field, value);
    closeEditModal();
  }, [editModal, handleEdit, closeEditModal]);

  /**
   * ✅ filteredData
   */
  const filteredData = useMemo(() => {
    const q = (searchTerm || "").toUpperCase().trim();

    const filteredItems = todos.filter((raw) => {
      if (!q) return true;

      const hotel = String(raw?.hotel ?? "").toUpperCase();
      const codigo = String(raw?.codigo_reservacion_hotel ?? "").toUpperCase();
      const viajero = String(raw?.nombre_viajero_completo ?? raw?.nombre_viajero ?? "").toUpperCase();

      return (
        hotel.includes(q) ||
        codigo.includes(q) ||
        viajero.includes(q) ||
        String(raw?.id_servicio ?? "").toUpperCase().includes(q)
      );
    });

    return filteredItems.map((raw, i) => toConciliacionRow(raw, i));
  }, [todos, searchTerm]);

  // ---------------- RFC VALIDATION (se mantiene para selección/bulk) ----------------
  const normRfc = (v: any) => String(v ?? "").trim().toUpperCase();

  const rfcByKey = useMemo(() => {
    const m = new Map<string, string>();
    (filteredData || []).forEach((row: AnyRow, index: number) => {
      const key = getSelectionKey(row, index);
      const rfc = normRfc(row?.rfc ?? row?.__raw?.rfc_proveedor ?? "");
      m.set(key, rfc);
    });
    return m;
  }, [filteredData]);

  const getSelectedRfcInfo = useCallback(
    (map: Record<string, boolean>) => {
      const set = new Set<string>();

      for (const [key, isSelected] of Object.entries(map)) {
        if (!isSelected) continue;
        const rfc = normRfc(rfcByKey.get(key) ?? "");
        if (rfc) set.add(rfc);
        if (set.size > 1) break;
      }

      const list = Array.from(set);
      return {
        ok: list.length <= 1,
        rfc: list[0] ?? "",
        rfcs: list,
      };
    },
    [rfcByKey]
  );

  // ✅ Columnas (RFC quitado)
  const customColumns = useMemo(
    () => [
      "seleccionar",
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
      "canal_de_reservacion",     // se muestra, pero ya NO se edita
      "nombre_intermediario",     // se muestra, pero ya NO se edita
      "tipo_de_reserva",
      "tipo_de_pago",
      "tarjeta",
      "id_enviado",
      "comentarios_ops",
      "comentarios_cxp",
      "conciliacion",             // ✅ botón conciliación con tu lógica (ModalDetalle)
      "estatus_facturas",
      "estatus_pago",
      "total_facturado",
      "diferencia_costo_proveedor_vs_factura",
      "subir_factura",
      "comprobante",              // ✅ botón subir comprobante (modal sin lógica)
      "total_factura",
      "razon_social",
    ],
    []
  );

  // ✅ selección
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(() => {
    return Object.keys(selectedMap).filter((k) => selectedMap[k]);
  }, [selectedMap]);

  const selectedRows = useMemo(() => {
    return filteredData.filter((r: AnyRow, index: number) => {
      const key = getSelectionKey(r, index);
      if (!key) return false;

      const diff = Number(r?.diferencia_costo_proveedor_vs_factura ?? 0) || 0;
      if (isZero(diff)) return false;

      return !!selectedMap[key];
    });
  }, [filteredData, selectedMap]);

  const clearSelection = useCallback(() => {
    setSelectedMap({});
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedMap((prev) => {
      const next = { ...prev };

      const current = getSelectedRfcInfo(prev);
      let baseRfc = current.rfc;

      if (!baseRfc) {
        const firstWithRfc = filteredData.find((r: AnyRow) => normRfc(r?.rfc));
        baseRfc = normRfc(firstWithRfc?.rfc ?? "");
      }

      filteredData.forEach((r: AnyRow, index: number) => {
        const diff = Number(r?.diferencia_costo_proveedor_vs_factura ?? 0) || 0;
        if (isZero(diff)) return;

        const key = getSelectionKey(r, index);
        const rowRfc = normRfc(r?.rfc ?? "");

        const ok = baseRfc ? rowRfc === baseRfc : !rowRfc;
        if (ok) next[key] = true;
      });

      return next;
    });
  }, [filteredData, getSelectedRfcInfo]);

  const selectedProveedorData = useMemo(() => {
    const arr = selectedRows
      .map((r: AnyRow) => ({
        id_solicitud: String(r?.id_solicitud_proveedor ?? "").trim(),
        id_proveedor: String(r?.id_proveedor ?? "").trim(),
      }))
      .filter(
        (x) =>
          x.id_solicitud !== "" &&
          x.id_solicitud !== "null" &&
          x.id_solicitud !== "undefined" &&
          x.id_proveedor !== "" &&
          x.id_proveedor !== "null" &&
          x.id_proveedor !== "undefined"
      );

    return arr;
  }, [selectedRows]);

  // ✅ renderers
  const tableRenderers = useMemo<
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

      // ✅ YA NO EDITABLES: solo texto
      canal_de_reservacion: ({ value }) => (
        <span className="text-xs">{String(value ?? "—").toUpperCase()}</span>
      ),
      nombre_intermediario: ({ value }) => (
        <span className="text-xs" title={String(value ?? "")}>
          {truncateText(value, 30)}
        </span>
      ),

      comentarios_ops: ({ value, item }) => {
        const rowId = getSelectionKey(item);
        const v = draftEdits[rowId]?.comentarios_ops ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {truncateText(v, 26)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              onClick={() => openEditModal(rowId, item?.id_servicio, "comentarios_ops", v)}
            >
              …
            </Button>
          </div>
        );
      },

      comentarios_cxp: ({ value, item }) => {
        const rowId = getSelectionKey(item);
        const v = draftEdits[rowId]?.comentarios_cxp ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {truncateText(v, 26)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              onClick={() => openEditModal(rowId, item?.id_servicio, "comentarios_cxp", v)}
            >
              …
            </Button>
          </div>
        );
      },

      seleccionar: ({ value, item, index }) => {
        const diff = Number(item?.diferencia_costo_proveedor_vs_factura ?? 0) || 0;
        if (isZero(diff)) return <div className="w-4 h-4" />;

        const key = getSelectionKey(item && typeof item === "object" ? item : value, index);
        const checked = !!selectedMap[key];

        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={checked}
              onChange={(e) => {
                const isChecked = e.target.checked;

                setSelectedMap((prev) => {
                  const next = { ...prev };

                  if (!isChecked) {
                    delete next[key];
                    return next;
                  }

                  const current = getSelectedRfcInfo(prev);
                  const candidateRfc = normRfc(rfcByKey.get(key) ?? "");

                  if (current.rfc && !candidateRfc) {
                    alert(`No puedes mezclar seleccionados sin RFC.\nRFC seleccionado: ${current.rfc}`);
                    return prev;
                  }

                  if (current.rfc && candidateRfc && candidateRfc !== current.rfc) {
                    alert(
                      `No puedes seleccionar filas con RFC diferente.\nRFC seleccionado: ${current.rfc}\nRFC nuevo: ${candidateRfc}`
                    );
                    return prev;
                  }

                  next[key] = true;
                  return next;
                });
              }}
            />
          </div>
        );
      },

      total_aplicable: ({ value, item }) => {
        const rowId = getSelectionKey(item);
        const v = draftEdits[rowId]?.total_aplicable ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {v === "" || v === null || typeof v === "undefined" ? "—" : formatMoney(v)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              onClick={() => openEditModal(rowId, item?.id_servicio, "total_aplicable", v)}
            >
              …
            </Button>
          </div>
        );
      },

      impuestos: ({ value, item }) => {
        const rowId = getSelectionKey(item);
        const v = draftEdits[rowId]?.impuestos ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {v === "" || v === null || typeof v === "undefined" ? "—" : formatMoney(v)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              onClick={() => openEditModal(rowId, item?.id_servicio, "impuestos", v)}
            >
              …
            </Button>
          </div>
        );
      },

      subtotal: ({ value, item }) => {
        const rowId = getSelectionKey(item);
        const v = draftEdits[rowId]?.subtotal ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs" title={String(v ?? "")}>
              {v === "" || v === null || typeof v === "undefined" ? "—" : formatMoney(v)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              onClick={() => openEditModal(rowId, item?.id_servicio, "subtotal", v)}
            >
              …
            </Button>
          </div>
        );
      },

      // ✅ BOTÓN CONCILIACIÓN (tu lógica): abre ModalDetalle
      conciliacion: ({ item }) => {
        return (
          <Button
            variant="secondary"
            size="sm"
            className="px-2 py-1 text-xs border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            onClick={() => openDetalle(item)}
          >
            Conciliar
          </Button>
        );
      },

      // ✅ Subir 1 factura (misma lógica)
      subir_factura: ({ item }) => {
        const diff = Number(item?.diferencia_costo_proveedor_vs_factura ?? 0) || 0;
        if (isZero(diff)) return <span className="text-xs text-gray-300">—</span>;

        return (
          <Button
            variant="secondary"
            size="sm"
            className="px-2 py-1 text-xs border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            onClick={() => {
              const payload = [
                {
                  id_solicitud: String(item?.id_solicitud_proveedor).trim(),
                  id_proveedor: String(item?.id_proveedor ?? "").trim(),
                },
              ].filter(
                (x) =>
                  x.id_solicitud &&
                  x.id_solicitud !== "null" &&
                  x.id_solicitud !== "undefined" &&
                  x.id_proveedor &&
                  x.id_proveedor !== "null" &&
                  x.id_proveedor !== "undefined"
              );

              clearSelection(); // modo single-row
              setSelectedForFactura(payload);
              setShowSubirFactura(true);
            }}
          >
            Subir factura
          </Button>
        );
      },

      // ✅ Botón “Subir comprobante” (modal sin lógica)
      comprobante: ({ item }) => {
        return (
          <Button
            variant="secondary"
            size="sm"
            className="px-2 py-1 text-xs border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
            onClick={() => openComprobanteModal(item)}
          >
            Subir comprobante
          </Button>
        );
      },

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
    [
      draftEdits,
      openEditModal,
      selectedMap,
      openDetalle,
      clearSelection,
      rfcByKey,
      getSelectedRfcInfo,
      openComprobanteModal,
    ]
  );

  const defaultSort = useMemo(() => ({ key: "creado", sort: false }), []);

  useEffect(() => {
    const info = getSelectedRfcInfo(selectedMap);
    setSelectedRfc(info.rfc || "");
  }, [selectedMap, getSelectedRfcInfo]);

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
                  placeholder="Buscar por código, hotel, viajero..."
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={() => setFiltersOpen((s) => !s)}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>

              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
                Limpiar
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Folio / ID reserva
                  </label>
                  <input
                    placeholder="Ej. ser-e36b2f32..."
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

        {/* Barra de selección masiva */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-gray-600">
            Seleccionados: <span className="font-semibold">{selectedIds.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              className="px-3 py-2 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              onClick={selectAllFiltered}
            >
              Seleccionar filtrados ({filteredData.length})
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="px-3 py-2 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              onClick={clearSelection}
            >
              Limpiar selección
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={selectedRows.length === 0}
              className={[
                "px-3 py-2 text-sm border",
                selectedRows.length === 0
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              ].join(" ")}
              onClick={() => {
                const rfcs = Array.from(
                  new Set(
                    selectedRows
                      .map((r: AnyRow) => normRfc(r?.rfc))
                      .filter(Boolean)
                  )
                );

                if (rfcs.length > 1) {
                  alert(`No puedes subir facturas con RFC diferente.\nRFCs: ${rfcs.join(", ")}`);
                  return;
                }

                setSelectedForFactura(selectedProveedorData);
                setShowSubirFactura(true);
              }}
            >
              Subir factura ({selectedRows.length})
            </Button>
          </div>
        </div>

        {/* Tabla principal */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
          <Table5<any>
            registros={filteredData as any}
            renderers={tableRenderers}
            defaultSort={defaultSort as any}
            leyenda={`Mostrando ${filteredData.length} registros`}
            customColumns={customColumns}
            fillHeight
            maxHeight="calc(100vh - 220px)"
          />
        </div>

        {/* MODAL EXPANSIVO PARA EDITABLES */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 z-0" onClick={closeEditModal} />

            <div
              className="relative z-10 w-[min(720px,92vw)] bg-white rounded-xl shadow-lg border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Editar campo</p>
                  <p className="text-xs text-gray-500">
                    id_solicitud_proveedor: {editModal.rowId}
                  </p>
                  <p className="text-xs text-gray-500">Campo: {editModal.field}</p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-9 h-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  onClick={closeEditModal}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4">
                {editModal.field === "comentarios_ops" || editModal.field === "comentarios_cxp" ? (
                  <textarea
                    className="w-full min-h-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) => setEditModal((s) => ({ ...s, value: e.target.value }))}
                    placeholder="Escribe el texto completo..."
                  />
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) => setEditModal((s) => ({ ...s, value: e.target.value }))}
                    placeholder="0.00"
                  />
                )}

                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="px-3 py-2 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                    onClick={closeEditModal}
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    className="px-3 py-2 text-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={() => void saveEditModal()}
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SUBIR COMPROBANTE (SIN LÓGICA) */}
        {comprobanteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={closeComprobanteModal} />

            <div
              className="relative z-10 w-[min(520px,92vw)] bg-white rounded-xl shadow-lg border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Subir comprobante</p>
                  <p className="text-xs text-gray-500">
                    Solicitud: {String(comprobanteModal.row?.id_solicitud_proveedor ?? "—")}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-9 h-9 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  onClick={closeComprobanteModal}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Archivo (PDF / imagen)
                  </label>
                  <input
                    type="file"
                    className="w-full text-sm"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setComprobanteModal((s) => ({ ...s, file: f }));
                    }}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    (Sin lógica: este modal solo captura el archivo y cierra.)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nota</label>
                  <textarea
                    className="w-full min-h-[90px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={comprobanteModal.nota}
                    onChange={(e) =>
                      setComprobanteModal((s) => ({ ...s, nota: e.target.value }))
                    }
                    placeholder="Opcional..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="px-3 py-2 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                    onClick={closeComprobanteModal}
                  >
                    Cancelar
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    className="px-3 py-2 text-sm border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    onClick={() => {
                      // ✅ sin lógica: solo cerrar
                      closeComprobanteModal();
                    }}
                  >
                    Guardar
                  </Button>
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
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  onClick={closeSubirFactura}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6">
                <SubirFactura
                  proveedoresData={selectedRows.length == 0 ? selectedForFactura : selectedRows}
                  id_proveedor={selectedRows.length === 1 ? selectedRows[0]?.id_proveedor : undefined}
                  proveedoresRfc={selectedRfc}
                  autoOpen={true}
                  onSuccess={() => {
                    closeSubirFactura();
                    // load();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ✅ Conciliación (tu modal) */}
        {detalleOpen && <ModalDetalle solicitud={detalleSolicitud} onClose={closeDetalle} />}

        {isLoading && <div className="text-sm text-gray-500 px-2">Cargando información...</div>}
      </div>
    </div>
  );
}
