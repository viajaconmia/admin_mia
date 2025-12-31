"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { formatDate } from "@/helpers/utils";
import { URL, API_KEY } from "@/lib/constants/index";

/* ─────────────────────────────
  Tipos base (ajusta keys según tu API real)
────────────────────────────── */

type CanalReservacion = "directo" | "intermediario" | "";
type TipoReserva = "prepago" | "credito" | "";
type TipoPago = "transferencia" | "tarjeta" | "link" | "cupon" | "";
type EstatusPago =
  | "carta_enviada"
  | "pagado_tarjeta"
  | "transferencia_solicitada"
  | "pagado_transferencia"
  | "pagado_link"
  | "cupon_enviado"
  | "";

type EstatusFactura = "pendiente" | "parcial" | "completo" | "";

type FacturaInfo = {
  uuid_factura: string | null;
  total_factura: number | null;
  total_aplicable: number | null;
  impuestos: number | null;
  subtotal: number | null;
  razon_social: string | null;
  rfc: string | null;
};

export type ReservaRow = {
  // CONTROL: siempre por ID de reserva
  id_reserva: string; // <- clave principal del menú
  folio_reserva: string | null;

  estado_reserva: string | null; // "confirmada" etc.

  creado_en: string | null; // o fecha_ultima_carta
  fecha_ultima_carta: string | null;

  hotel: string | null;
  codigo_hotel: string | null;
  viajero: string | null;

  check_in: string | null;
  check_out: string | null;
  noches: number | null;

  tipo_cuarto: string | null;

  costo_proveedor: number | null;
  markup_pct: number | null; // ej 7.55 (porcentaje)
  precio_venta: number | null;

  canal_reservacion: CanalReservacion;
  nombre_intermediario: string | null;

  tipo_reserva: TipoReserva;
  tipo_pago: TipoPago;

  tarjeta_ultimos5: string | null; // 5 últimos dígitos
  id_enviado: string | null; // 1er nombre titular

  comentarios_ops: string | null;
  comentarios_cxp: string | null;

  estatus_pago: EstatusPago;
  estatus_factura: EstatusFactura;

  total_facturado: number | null; // sumatoria facturada
  factura: FacturaInfo;

  // Para validación cuando es DIRECTO
  proveedor_razon_social: string | null;
  proveedor_rfc: string | null;

  raw?: any; // por si quieres inspección
};

/* ─────────────────────────────
  Helpers
────────────────────────────── */

const n = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
};

const s = (v: any): string | null => {
  if (v === null || v === undefined) return null;
  const str = String(v).trim();
  return str.length ? str : null;
};

const last5 = (v: any): string | null => {
  const str = s(v);
  if (!str) return null;
  const digits = str.replace(/\D/g, "");
  if (!digits) return null;
  return digits.slice(-5);
};

const formatMoney = (v: any) => {
  const num = Number(v);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(num);
};

// Solo confirmadas (robusto a variaciones)
const isConfirmed = (r: ReservaRow) => {
  const st = (r.estado_reserva || "").toLowerCase();
  return st.includes("confirm") || st === "ok" || st === "paid_confirmed"; // ajusta si aplica
};

/**
 * Mapper tolerante: ajusta a tu payload real.
 * La idea es que NO truene si vienen wrappers o nombres distintos.
 */
const mapReserva = (x: any): ReservaRow => {
  const facturaSrc = x?.factura ?? x?.factura_info ?? x?.invoice ?? {};
  const markupRaw = n(x?.markup_pct ?? x?.markup ?? x?.porcentaje_markup);

  const costo = n(x?.costo_proveedor ?? x?.costo ?? x?.neto_proveedor);
  const precioVenta =
    n(x?.precio_venta ?? x?.venta ?? x?.total_venta) ??
    (costo !== null && markupRaw !== null ? costo * (1 + markupRaw / 100) : null);

  return {
    id_reserva: String(x?.id_reserva ?? x?.id_reservation ?? x?.id ?? ""),
    folio_reserva: s(x?.folio_reserva ?? x?.folio ?? x?.codigo_reserva ?? x?.booking_code),

    estado_reserva: s(x?.estado_reserva ?? x?.status_reserva ?? x?.estado),

    creado_en: s(x?.creado_en ?? x?.created_at ?? x?.fecha_creacion),
    fecha_ultima_carta: s(x?.fecha_ultima_carta ?? x?.last_letter_at ?? x?.fecha_carta),

    hotel: s(x?.hotel ?? x?.hotel_nombre ?? x?.nombre_hotel),
    codigo_hotel: s(x?.codigo_hotel ?? x?.hotel_code ?? x?.codigo),

    viajero: s(x?.viajero ?? x?.cliente ?? x?.titular ?? x?.guest_name),

    check_in: s(x?.check_in ?? x?.fecha_check_in),
    check_out: s(x?.check_out ?? x?.fecha_check_out),
    noches: n(x?.noches ?? x?.nights),

    tipo_cuarto: s(x?.tipo_cuarto ?? x?.room_type),

    costo_proveedor: costo,
    markup_pct: markupRaw,
    precio_venta: precioVenta,

    canal_reservacion: (s(x?.canal_reservacion ?? x?.canal) as any) ?? "",
    nombre_intermediario: s(x?.nombre_intermediario ?? x?.intermediario ?? x?.agencia),

    tipo_reserva: (s(x?.tipo_reserva) as any) ?? "",
    tipo_pago: (s(x?.tipo_pago) as any) ?? "",

    tarjeta_ultimos5: s(x?.tarjeta_ultimos5 ?? x?.tarjeta) ?? last5(x?.tarjeta_numero),
    id_enviado: s(x?.id_enviado ?? x?.titular_tarjeta_nombre ?? x?.cardholder_firstname),

    comentarios_ops: s(x?.comentarios_ops ?? x?.comentarios_operaciones),
    comentarios_cxp: s(x?.comentarios_cxp ?? x?.comentarios_cuentas_por_pagar),

    estatus_pago: (s(x?.estatus_pago ?? x?.payment_status) as any) ?? "",
    estatus_factura: (s(x?.estatus_factura ?? x?.invoice_status) as any) ?? "",

    total_facturado: n(x?.total_facturado ?? x?.facturado_total ?? x?.invoice_total_sum),

    factura: {
      uuid_factura: s(facturaSrc?.uuid_factura ?? facturaSrc?.uuid),
      total_factura: n(facturaSrc?.total_factura ?? facturaSrc?.total),
      total_aplicable: n(facturaSrc?.total_aplicable),
      impuestos: n(facturaSrc?.impuestos ?? facturaSrc?.taxes),
      subtotal: n(facturaSrc?.subtotal),
      razon_social: s(facturaSrc?.razon_social),
      rfc: s(facturaSrc?.rfc),
    },

    proveedor_razon_social: s(x?.proveedor_razon_social ?? x?.razon_social_proveedor),
    proveedor_rfc: s(x?.proveedor_rfc ?? x?.rfc_proveedor),

    raw: x,
  };
};

const extractReservas = (payload: any): ReservaRow[] => {
  const data = payload?.data ?? payload?.items ?? payload ?? [];
  if (Array.isArray(data)) return data.map(mapReserva);

  // wrappers comunes
  const arr =
    payload?.data?.reservas ??
    payload?.data?.reservas_json ??
    payload?.reservas ??
    payload?.reservas_json ??
    null;

  return Array.isArray(arr) ? arr.map(mapReserva) : [];
};

/* ─────────────────────────────
  Página
────────────────────────────── */

export default function ReservasConfirmadasFacturacionPage() {
  const [rows, setRows] = useState<ReservaRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder (sin componente de filtros)
  const [q, setQ] = useState("");

  // Modal detalles
  const [openDetalles, setOpenDetalles] = useState(false);
  const [selected, setSelected] = useState<ReservaRow | null>(null);

  const fetchReservas = async () => {
    /**
     * IMPORTANTE:
     * - Mantengo el MISMO patrón de fetch que tu componente original (headers, GET, etc.).
     * - Ajusta el endpoint a tu ruta real de “reservas confirmadas”.
     */
    const endpoint = `${URL}/mia/pago_proveedor/solicitud`; // <- AJUSTA AQUÍ
    setIsLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const json = await response.json();
      const list = extractReservas(json);
      setRows(list);
    } catch (err) {
      console.error("Error cargando reservas:", err);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solo confirmadas + búsqueda simple (placeholder)
  const reservas = useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows
      .filter(isConfirmed) // REGLA: SOLO CONFIRMADAS
      .filter((r) => {
        if (!term) return true;
        return [
          r.id_reserva,
          r.folio_reserva,
          r.hotel,
          r.codigo_hotel,
          r.viajero,
          r.proveedor_razon_social,
          r.factura?.uuid_factura,
        ]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(term));
      });
  }, [rows, q]);

  // Update local (NO persiste a BD: tú lo conectas después)
  const patchRow = (id_reserva: string, patch: Partial<ReservaRow>) => {
    setRows((prev) => prev.map((r) => (r.id_reserva === id_reserva ? { ...r, ...patch } : r)));
  };

  const patchFactura = (id_reserva: string, patch: Partial<FacturaInfo>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id_reserva === id_reserva
          ? { ...r, factura: { ...r.factura, ...patch } }
          : r
      )
    );
  };

  const registros = reservas.map((r) => {
    const totalFacturado = r.total_facturado ?? r.factura?.total_factura ?? 0;
    const costo = r.costo_proveedor ?? 0;
    const diff = totalFacturado - costo;

    return {
      id_reserva: r.id_reserva,
      creado: r.fecha_ultima_carta ?? r.creado_en,
      hotel: r.hotel,
      codigo_hotel: r.codigo_hotel,
      viajero: r.viajero,
      check_in: r.check_in,
      check_out: r.check_out,
      noches: r.noches,
      tipo_cuarto: r.tipo_cuarto,
      costo_proveedor: r.costo_proveedor,
      markup: r.markup_pct,
      precio_venta: r.precio_venta,
      canal_reservacion: r.canal_reservacion,
      nombre_intermediario: r.nombre_intermediario,
      tipo_reserva: r.tipo_reserva,
      tipo_pago: r.tipo_pago,

      tarjeta: r.tarjeta_ultimos5,
      id_enviado: r.id_enviado,
      comentarios_ops: r.comentarios_ops,
      comentarios_cxp: r.comentarios_cxp,
      estatus_pago: r.estatus_pago,
      detalles: "Detalles",
      estatus_factura: r.estatus_factura,
      total_facturado: totalFacturado,
      diferencia_costo_vs_factura: diff,

      subir_factura: "Subir factura",
      todos_detalles: false,

      item: r, // Table5 pasa item a renderers
    };
  });

  const renderers: { [key: string]: React.FC<{ value: any; item: any; index: number }> } = {
    id_reserva: ({ value }) => (
      <div className="flex justify-start">
        <span className="font-semibold text-gray-900">{value || "—"}</span>
      </div>
    ),

    creado: ({ value, item }) => (
      <div className="flex justify-start">
        <div className="flex flex-col">
          <span className="text-gray-800">{formatDate(value ?? null)}</span>
          <span className="text-[11px] text-gray-500">
            {/* Solo texto guía como en la imagen */}
            Última carta (descargada/enviada)
          </span>
          <span className="text-[11px] text-gray-400">
            Folio: {item?.item?.folio_reserva || item?.item?.folio || "—"}
          </span>
        </div>
      </div>
    ),

    hotel: ({ value }) => (
      <div className="flex justify-start">
        <span className="text-gray-800 font-semibold">{value || "—"}</span>
      </div>
    ),

    codigo_hotel: ({ value }) => (
      <div className="flex justify-start">
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    ),

    viajero: ({ value }) => (
      <div className="flex justify-start">
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    ),

    check_in: ({ value }) => <span className="text-gray-700">{formatDate(value ?? null)}</span>,
    check_out: ({ value }) => <span className="text-gray-700">{formatDate(value ?? null)}</span>,

    noches: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-gray-700">{value ?? "—"}</span>
      </div>
    ),

    tipo_cuarto: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-xs px-2 py-1 rounded border bg-gray-50 text-gray-700">
          {value || "—"}
        </span>
      </div>
    ),

    costo_proveedor: ({ value }) => (
      <div className="flex justify-end">
        <span className="font-semibold text-gray-900">{formatMoney(value)}</span>
      </div>
    ),

    markup: ({ value }) => {
      const pct = Number(value);
      const label = Number.isFinite(pct) ? `${pct.toFixed(2)}%` : "—";
      return (
        <div className="flex justify-center">
          <span className="text-xs font-semibold px-2 py-1 rounded-full border bg-emerald-50 text-emerald-700">
            {label}
          </span>
        </div>
      );
    },

    precio_venta: ({ value }) => (
      <div className="flex justify-end">
        <span className="font-semibold text-gray-900">{formatMoney(value)}</span>
      </div>
    ),

    canal_reservacion: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <div className="flex justify-center">
          <select
            value={r.canal_reservacion || ""}
            onChange={(e) =>
              patchRow(r.id_reserva, { canal_reservacion: e.target.value as CanalReservacion })
            }
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">(editable al elegir)</option>
            <option value="directo">DIRECTO</option>
            <option value="intermediario">INTERMEDIARIO</option>
          </select>
        </div>
      );
    },

    nombre_intermediario: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <div className="flex flex-col gap-1">
          <input
            value={r.nombre_intermediario || ""}
            onChange={(e) => patchRow(r.id_reserva, { nombre_intermediario: e.target.value })}
            placeholder="(editable)"
            className="border rounded px-2 py-1 text-xs"
          />
          <span className="text-[11px] text-gray-400">Solo si es intermediario</span>
        </div>
      );
    },

    tipo_reserva: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <div className="flex justify-center">
          <select
            value={r.tipo_reserva || ""}
            onChange={(e) => patchRow(r.id_reserva, { tipo_reserva: e.target.value as TipoReserva })}
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">—</option>
            <option value="prepago">PREPAGO</option>
            <option value="credito">CRÉDITO</option>
          </select>
        </div>
      );
    },

    tipo_pago: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <div className="flex justify-center">
          <select
            value={r.tipo_pago || ""}
            onChange={(e) => patchRow(r.id_reserva, { tipo_pago: e.target.value as TipoPago })}
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">—</option>
            <option value="transferencia">TRANSFERENCIA</option>
            <option value="tarjeta">TARJETA</option>
            <option value="link">LINK</option>
            <option value="cupon">CUPÓN</option>
          </select>
        </div>
      );
    },

    tarjeta: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-gray-800 font-semibold">{value ? `••••• ${value}` : "—"}</span>
      </div>
    ),

    id_enviado: ({ value }) => (
      <div className="flex justify-start">
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    ),

    comentarios_ops: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <textarea
          value={r.comentarios_ops || ""}
          onChange={(e) => patchRow(r.id_reserva, { comentarios_ops: e.target.value })}
          placeholder="(editable)"
          className="border rounded px-2 py-1 text-xs w-full min-w-[240px]"
          rows={2}
        />
      );
    },

    comentarios_cxp: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <textarea
          value={r.comentarios_cxp || ""}
          onChange={(e) => patchRow(r.id_reserva, { comentarios_cxp: e.target.value })}
          placeholder="(editable)"
          className="border rounded px-2 py-1 text-xs w-full min-w-[240px]"
          rows={2}
        />
      );
    },

    estatus_pago: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <div className="flex justify-center">
          <select
            value={r.estatus_pago || ""}
            onChange={(e) => patchRow(r.id_reserva, { estatus_pago: e.target.value as EstatusPago })}
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">—</option>
            <option value="carta_enviada">CARTA ENVIADA</option>
            <option value="pagado_tarjeta">PAGADO TARJETA</option>
            <option value="transferencia_solicitada">TRANSFERENCIA SOLICITADA</option>
            <option value="pagado_transferencia">PAGADO TRANSFERENCIA</option>
            <option value="pagado_link">PAGADO LINK</option>
            <option value="cupon_enviado">CUPÓN ENVIADO</option>
          </select>
        </div>
      );
    },

    detalles: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <button
          onClick={() => {
            setSelected(r);
            setOpenDetalles(true);
          }}
          className="text-xs px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100"
        >
          Detalles
        </button>
      );
    },

    estatus_factura: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <div className="flex justify-center">
          <select
            value={r.estatus_factura || ""}
            onChange={(e) =>
              patchRow(r.id_reserva, { estatus_factura: e.target.value as EstatusFactura })
            }
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">—</option>
            <option value="pendiente">PENDIENTE: SIN FACTURA</option>
            <option value="parcial">PARCIAL (±$20)</option>
            <option value="completo">COMPLETO</option>
          </select>
        </div>
      );
    },

    total_facturado: ({ value }) => (
      <div className="flex justify-end">
        <span className="font-semibold text-gray-900">{formatMoney(value)}</span>
      </div>
    ),

    diferencia_costo_vs_factura: ({ value }) => {
      const num = Number(value);
      const ok = Number.isFinite(num) && Math.abs(num) <= 20;
      return (
        <div className="flex justify-end">
          <span className={`font-semibold ${ok ? "text-emerald-700" : "text-rose-700"}`}>
            {Number.isFinite(num) ? formatMoney(num) : "—"}
          </span>
        </div>
      );
    },

    subir_factura: ({ item }) => {
      const r: ReservaRow = item.item;
      return (
        <button
          onClick={() => {
            // TODO: aquí conectas tu flujo real de subida (por id_reserva)
            alert(`Subir factura (id_reserva: ${r.id_reserva})`);
          }}
          className="text-xs px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Subir factura
        </button>
      );
    },

    todos_detalles: () => (
      <div className="flex justify-center">
        {/* Placeholder: tú harás el comportamiento real */}
        <input type="checkbox" className="h-4 w-4" />
      </div>
    ),
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header / Search (sin componente de filtros) */}
      <div className="bg-white border rounded-lg shadow-sm p-4 md:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Reservas confirmadas (Facturación / Pagos)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Control por <span className="font-semibold">ID de reserva</span>. Solo se listan reservas{" "}
                <span className="font-semibold">confirmadas</span>.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchReservas}
                disabled={isLoading}
                className="text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? "Cargando..." : "Refrescar"}
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código, ID, cliente..."
              className="w-full md:w-[520px] border rounded px-3 py-2 text-sm"
            />

            {/* Placeholder: tú harás tu componente de filtros después */}
            <button
              onClick={() => alert("Pendiente: componente de filtros")}
              className="text-sm px-3 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Filtros
            </button>

            <button
              onClick={() => setQ("")}
              className="text-sm px-3 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Limpiar
            </button>

            <div className="md:ml-auto text-xs text-gray-600">
              Mostrando <span className="font-semibold">{registros.length}</span> reserva(s)
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-4 bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="p-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-56">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <p className="mt-2 text-sm text-gray-600">Cargando reservas...</p>
              </div>
            </div>
          ) : registros.length === 0 ? (
            <p className="text-sm text-gray-500 p-3">
              No hay reservas confirmadas para mostrar (o ajusta el endpoint/mapeo).
            </p>
          ) : (
            <Table5<any>
              registros={registros}
              renderers={renderers}
              exportButton={true}
              leyenda={`Mostrando ${registros.length} reserva(s) confirmada(s)`}
              maxHeight="70vh"
              customColumns={[
                // Parte superior (como en la imagen)
                "id_reserva",
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
                "precio_venta",
                "canal_reservacion",
                "nombre_intermediario",
                "tipo_reserva",
                "tipo_pago",

                // Parte inferior (como en la imagen)
                "tarjeta",
                "id_enviado",
                "comentarios_ops",
                "comentarios_cxp",
                "estatus_pago",
                "detalles",
                "estatus_factura",
                "total_facturado",
                "diferencia_costo_vs_factura",
                "subir_factura",
                "todos_detalles",
              ]}
            />
          )}
        </div>
      </div>

      {/* Modal Detalles (Factura) */}
      {openDetalles && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg border">
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detalles de factura</h2>
                <p className="text-xs text-gray-600 mt-1">
                  Reserva: <span className="font-semibold">{selected.id_reserva}</span> •{" "}
                  {selected.hotel || "—"} • {selected.viajero || "—"}
                </p>
              </div>

              <button
                onClick={() => {
                  setOpenDetalles(false);
                  setSelected(null);
                }}
                className="text-sm px-3 py-2 rounded border bg-white hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <div className="p-4">
              {/* Validación “DIRECTO” vs razón social proveedor */}
              {String(selected.canal_reservacion).toLowerCase() === "directo" && (
                <div className="mb-3 rounded border bg-amber-50 p-3 text-sm text-amber-900">
                  <span className="font-semibold">Regla:</span> Si el canal es{" "}
                  <span className="font-semibold">DIRECTO</span>, la{" "}
                  <span className="font-semibold">Razón Social</span> de la factura debe cuadrar con la
                  registrada en proveedor.
                  <div className="mt-2 text-xs text-amber-900/80">
                    Proveedor (registrado):{" "}
                    <span className="font-semibold">{selected.proveedor_razon_social || "—"}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600">UUID de la factura</label>
                  <input
                    value={selected.factura.uuid_factura || ""}
                    onChange={(e) => {
                      patchFactura(selected.id_reserva, { uuid_factura: e.target.value });
                      setSelected((p) =>
                        p ? { ...p, factura: { ...p.factura, uuid_factura: e.target.value } } : p
                      );
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Total factura</label>
                  <input
                    value={selected.factura.total_factura ?? ""}
                    onChange={(e) => {
                      const v = n(e.target.value);
                      patchFactura(selected.id_reserva, { total_factura: v });
                      setSelected((p) =>
                        p ? { ...p, factura: { ...p.factura, total_factura: v } } : p
                      );
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Total aplicable (editable)</label>
                  <input
                    value={selected.factura.total_aplicable ?? ""}
                    onChange={(e) => {
                      const v = n(e.target.value);
                      patchFactura(selected.id_reserva, { total_aplicable: v });
                      setSelected((p) =>
                        p ? { ...p, factura: { ...p.factura, total_aplicable: v } } : p
                      );
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Impuestos (editable)</label>
                  <input
                    value={selected.factura.impuestos ?? ""}
                    onChange={(e) => {
                      const v = n(e.target.value);
                      patchFactura(selected.id_reserva, { impuestos: v });
                      setSelected((p) =>
                        p ? { ...p, factura: { ...p.factura, impuestos: v } } : p
                      );
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">Subtotal (editable)</label>
                  <input
                    value={selected.factura.subtotal ?? ""}
                    onChange={(e) => {
                      const v = n(e.target.value);
                      patchFactura(selected.id_reserva, { subtotal: v });
                      setSelected((p) =>
                        p ? { ...p, factura: { ...p.factura, subtotal: v } } : p
                      );
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">RFC</label>
                  <input
                    value={selected.factura.rfc || ""}
                    onChange={(e) => {
                      patchFactura(selected.id_reserva, { rfc: e.target.value });
                      setSelected((p) =>
                        p ? { ...p, factura: { ...p.factura, rfc: e.target.value } } : p
                      );
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600">Razón social</label>
                  <input
                    value={selected.factura.razon_social || ""}
                    onChange={(e) => {
                      patchFactura(selected.id_reserva, { razon_social: e.target.value });
                      setSelected((p) =>
                        p ? { ...p, factura: { ...p.factura, razon_social: e.target.value } } : p
                      );
                    }}
                    className="w-full border rounded px-2 py-2 text-sm"
                  />

                  {String(selected.canal_reservacion).toLowerCase() === "directo" &&
                    selected.proveedor_razon_social &&
                    selected.factura.razon_social &&
                    selected.proveedor_razon_social.trim().toLowerCase() !==
                      selected.factura.razon_social.trim().toLowerCase() && (
                      <p className="mt-2 text-xs text-rose-700">
                        La razón social de la factura no coincide con la registrada del proveedor.
                      </p>
                    )}
                </div>

                <div>
                  <label className="text-xs text-gray-600">Costo proveedor</label>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {formatMoney(selected.costo_proveedor)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    // TODO: aquí conectas tu PUT/PATCH por id_reserva
                    alert(`Guardar cambios (id_reserva: ${selected.id_reserva})`);
                  }}
                  className="text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Guardar (pendiente backend)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
