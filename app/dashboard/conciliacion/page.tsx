// app/conciliacion/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import { Filter, X, Search, Maximize2 } from "lucide-react";

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

/**
 helper 
  **/ 

 function flattenPagos(raw: any): any[] {
  const pagos = raw?.pagos;
  if (!Array.isArray(pagos)) return [];

  // En tu payload viene como [ [ {...}, {...} ], [] ]
  // Pero lo aplanamos por si algún día llega más anidado
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
 *
 * Además conserva filtro_pago para tooltip.
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

  // Normaliza a "fecha" en UTC para evitar desfases por hora/zona
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
  // Heurística: ajusta conforme tengas claves definitivas
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

  // Si no parece hotel ni renta, lo tratamos como factura (por ahora)
  return "FACTURA";
}

type EstatusFacturaInferido = "FACTURADO" | "PARCIAL" | "SIN FACTURAR";

function getEstatusFacturas(raw: any): EstatusFacturaInferido {
  const facturas = Array.isArray(raw?.facturas) ? raw.facturas : [];
  if (facturas.length === 0) return "SIN FACTURAR";

  // pendiente_facturar puede venir en raíz o dentro de una factura (ajusta keys si difieren)
  const pendienteRoot =
    Number(raw?.pendiente_facturar ?? raw?.pendiente_por_facturar ?? raw?.pendiente ?? 0) || 0;

  const pendienteEnFacturas = facturas.reduce((acc: number, f: any) => {
    const p =
      Number(f?.pendiente_facturar ?? f?.pendiente_por_facturar ?? f?.pendiente ?? 0) || 0;
    return Math.max(acc, p);
  }, 0);

  const pendiente = Math.max(pendienteRoot, pendienteEnFacturas);

  return pendiente > 0 ? "PARCIAL" : "FACTURADO";
}


/**
 * Mapea tu raw -> row para Table5 (solo estructura).
 * Ajusta keys si tu API difiere, pero ya deja todas las columnas pedidas.
 */
function toConciliacionRow(raw: any, index: number): AnyRow {
  const row_id = getRowId(raw, index);

  const hotel = (raw?.hotel ?? "").toString();
  const viajero = (
    raw?.nombre_viajero_completo ??
    raw?.nombre_viajero ??
    ""
  ).toString();

  const costo_proveedor = Number(raw?.costo_total ?? raw?.costo_proveedor ?? 0) || 0;
  const precio_de_venta = Number(raw?.total ?? raw?.precio_de_venta ?? 0) || 0;
  const markup = precio_de_venta > 0 ? ((precio_de_venta - costo_proveedor) / precio_de_venta) * 100 : 0;

  // ✅ NUEVO: noches calculadas desde fechas
  const nochesCalc = calcNoches(raw?.check_in, raw?.check_out);

  // ✅ NUEVO: tipo de pago desde detalles_pagos[0]
  const tipoPago = getTipoPago(raw);

  // ✅ NUEVO: tipo de reserva inferido
  const tipoReserva = inferTipoReserva(raw);

  // ✅ NUEVO: comentarios_ops desde comments
  const comentariosOps = raw?.comments ?? raw?.comentarios_ops ?? "";

  // ✅ NUEVO: estatus facturas (facturas[])
  const estatusFacturas = getEstatusFacturas(raw);

  // Factura / conciliación (igual que ya lo tenías)
  const uuid_factura = raw?.uuid_factura ?? raw?.UUID ?? raw?.uuid ?? null;
  const total_factura = Number(raw?.total_factura ?? 0) || 0;
  const total_facturado = Number(raw?.total_facturado ?? raw?.costo_facturado ?? 0) || 0;

  const total_aplicable = raw?.total_aplicable ?? raw?.totalAplicable ?? "";
  const impuestos = raw?.impuestos ?? "";
  const subtotal = raw?.subtotal ?? "";

  const baseFactura =
    Number(total_aplicable) ||
    Number(total_facturado) ||
    Number(total_factura) ||
    0;

    const estatusPagoObj = getEstatusPagoPayload(raw);

  const diferencia = Number(costo_proveedor) - Number(baseFactura);

  const tarjeta =
    raw?.tarjeta?.ultimos_4 ??
    raw?.digitos_tajeta ??
    raw?.ultimos_4 ??
    raw?.tarjeta ??
    "";

  const id_enviado = raw?.id_enviado ?? raw?.titular_tarjeta ?? "";

  const razon_social =
    raw?.proveedor?.razon_social ?? raw?.razon_social ?? "";
  const rfc = raw?.proveedor?.rfc ?? raw?.rfc ?? "";

  return {
    row_id,

    creado: raw?.created_at ?? raw?.creado ?? null,
    hotel: hotel ? hotel.toUpperCase() : "",
    codigo_hotel: raw?.codigo_reservacion_hotel ?? raw?.codigo_hotel ?? "",
    viajero: viajero ? viajero.toUpperCase() : "",
    check_in: raw?.check_in ?? null,
    check_out: raw?.check_out ?? null,

    // ✅ aquí reemplaza tu noches anterior
    noches: nochesCalc,

    tipo_cuarto: raw?.room ?? raw?.tipo_cuarto ?? "",

    costo_proveedor,
    markup,
    precio_de_venta,

    canal_de_reservacion:
      raw?.canal_de_reservacion ?? raw?.canal_reservacion ?? "",
    nombre_intermediario: raw?.nombre_intermediario ?? "",

    // ✅ aquí reemplaza tipo_de_reserva y tipo_de_pago anteriores
    tipo_de_reserva: tipoReserva,
    tipo_de_pago: tipoPago,

    tarjeta,
    id_enviado,

    // ✅ aquí reemplaza comentarios_ops anterior
    comentarios_ops: comentariosOps,
    conmentarios_cxp: raw?.comentarios_cxp ?? raw?.conmentarios_cxp ?? "",
    estatus_pago: estatusPagoObj.label ? estatusPagoObj.label.toUpperCase() : "",
__estatus_pago: estatusPagoObj,

    detalles: "",
    subir_factura: "",

    // ✅ aquí reemplaza estatus_facturas anterior
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
  };
}


export default function ConciliacionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  // UI (solo layout)
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Draft UI para que se refleje lo editado (tu lógica real vendrá después)
  const [draftEdits, setDraftEdits] = useState<Record<string, Partial<AnyRow>>>(
    {}
  );

  const endpoint = `${URL}/mia/pago_proveedor/solicitud`;

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

  const handleEdit = useCallback(
    (rowId: string, field: string, value: any) => {
      // ✅ Solo imprime cambio (tú conectas lógica después)
      console.log("cambio", { rowId, field, value });

      // Para que se vea el cambio en UI (opcional)
      setDraftEdits((prev) => ({
        ...prev,
        [rowId]: { ...(prev[rowId] || {}), [field]: value },
      }));
    },
    []
  );
  type CommentField = "comentarios_ops" | "conmentarios_cxp";

type CommentModalState = {
  open: boolean;
  rowId: string;
  field: CommentField;
  value: string;
};

const [commentModal, setCommentModal] = useState<CommentModalState>({
  open: false,
  rowId: "",
  field: "comentarios_ops",
  value: "",
});

const openCommentModal = useCallback((rowId: string, field: CommentField, value: any) => {
  setCommentModal({
    open: true,
    rowId,
    field,
    value: String(value ?? ""),
  });
}, []);

const closeCommentModal = useCallback(() => {
  setCommentModal((s) => ({ ...s, open: false }));
}, []);

const saveCommentModal = useCallback(() => {
  if (!commentModal.rowId) return;
  handleEdit(commentModal.rowId, commentModal.field, commentModal.value);
  closeCommentModal();
}, [commentModal, handleEdit, closeCommentModal]);


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


      
      // ------- EDITABLES -------
      canal_de_reservacion: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const v = draftEdits[rowId]?.canal_de_reservacion ?? value ?? "";
        return (
          <select
            className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs bg-white"
            value={String(v)}
            onChange={(e) => handleEdit(rowId, "canal_de_reservacion", e.target.value)}
          >
            <option value="">—</option>
            <option value="DIRECTO">DIRECTO</option>
            <option value="INTERMEDIARIO">INTERMEDIARIO</option>
          </select>
        );
      },

      nombre_intermediario: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const v = draftEdits[rowId]?.nombre_intermediario ?? value ?? "";
        return (
          <input
            className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs"
            value={String(v)}
            onChange={(e) => handleEdit(rowId, "nombre_intermediario", e.target.value)}
            placeholder="Editable..."
          />
        );
      },

      comentarios_ops: ({ value, item }) => {
  const rowId = String(item?.row_id ?? "");
  const v = draftEdits[rowId]?.comentarios_ops ?? value ?? "";

  return (
    <div className="flex items-center gap-2">
      <input
        className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs"
        value={String(v)}
        onChange={(e) => handleEdit(rowId, "comentarios_ops", e.target.value)}
        onDoubleClick={() => openCommentModal(rowId, "comentarios_ops", v)}
        placeholder="Editable..."
      />
      <button
        type="button"
        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
        title="Ver comentario completo"
        onClick={() => openCommentModal(rowId, "comentarios_ops", v)}
      >
        <Maximize2 className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
},

conmentarios_cxp: ({ value, item }) => {
  const rowId = String(item?.row_id ?? "");
  const v = draftEdits[rowId]?.conmentarios_cxp ?? value ?? "";

  return (
    <div className="flex items-center gap-2">
      <input
        className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs"
        value={String(v)}
        onChange={(e) => handleEdit(rowId, "conmentarios_cxp", e.target.value)}
        onDoubleClick={() => openCommentModal(rowId, "conmentarios_cxp", v)}
        placeholder="Editable..."
      />
      <button
        type="button"
        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
        title="Ver comentario completo"
        onClick={() => openCommentModal(rowId, "conmentarios_cxp", v)}
      >
        <Maximize2 className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
},


      total_aplicable: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const v = draftEdits[rowId]?.total_aplicable ?? value ?? "";
        return (
          <input
            type="number"
            className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs"
            value={String(v)}
            onChange={(e) => handleEdit(rowId, "total_aplicable", e.target.value)}
            placeholder="0.00"
          />
        );
      },

      impuestos: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const v = draftEdits[rowId]?.impuestos ?? value ?? "";
        return (
          <input
            type="number"
            className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs"
            value={String(v)}
            onChange={(e) => handleEdit(rowId, "impuestos", e.target.value)}
            placeholder="0.00"
          />
        );
      },

      subtotal: ({ value, item }) => {
        const rowId = String(item?.row_id ?? "");
        const v = draftEdits[rowId]?.subtotal ?? value ?? "";
        return (
          <input
            type="number"
            className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs"
            value={String(v)}
            onChange={(e) => handleEdit(rowId, "subtotal", e.target.value)}
            placeholder="0.00"
          />
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
            onClick={() => console.log("subir_factura", { rowId })}
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
            className={n === 0 ? "text-gray-700" : n > 0 ? "text-amber-700 font-semibold" : "text-red-700 font-semibold"}
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
    [draftEdits, handleEdit,openCommentModal]
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
{commentModal.open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* overlay */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={closeCommentModal}
    />

    {/* modal */}
    <div className="relative w-[min(720px,92vw)] bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {commentModal.field === "comentarios_ops"
              ? "Comentario OPS"
              : "Comentario CXP"}
          </p>
          <p className="text-xs text-gray-500">
            ID: {commentModal.rowId}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
          onClick={closeCommentModal}
          title="Cerrar"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      <div className="p-4">
        <textarea
          className="w-full min-h-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          value={commentModal.value}
          onChange={(e) =>
            setCommentModal((s) => ({ ...s, value: e.target.value }))
          }
          placeholder="Escribe el comentario completo..."
        />

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
            onClick={closeCommentModal}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg text-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            onClick={saveCommentModal}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      </div>

    </div>
  );
}
