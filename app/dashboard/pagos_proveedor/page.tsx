"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Send } from "lucide-react";
import Filters from "@/components/Filters";
import {
  calcularNoches,
  formatDate,
  formatRoom,
  getPaymentBadge,
  getStageBadge,
  getStatusBadge,
  getWhoCreateBadge,
} from "@/helpers/utils";
import { Table5 } from "@/components/Table5";
import { TypeFilters, SolicitudProveedor } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { currentDate } from "@/lib/utils";
import { fetchGetSolicitudesProveedores } from "@/services/pago_proveedor";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

// --- helpers locales ---
const parseNum = (v: any) => (v == null ? 0 : Number(v));
// --- helpers de estatus y agrupación ---
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

type CategoriaEstatus =
  | "spei_solicitado"
  | "pagotdc"
  | "cupon_enviado"
  | "pagada"
  | "otros";

function mapEstatusToCategoria(estatus?: string | null): CategoriaEstatus {
  const v = norm(estatus);

  // matches exactos o cercanos
  if (v === "spei_solicitado" || v.includes("spei")) return "spei_solicitado";
  if (v === "pagotdc" || v.includes("tdc") || v.includes("tarjeta"))
    return "pagotdc";
  if (v === "cupon_enviado" || v.includes("cupon") || v.includes("cupón"))
    return "cupon_enviado";
  if (v === "pagada" || v === "pagado") return "pagada";
  return "otros";
}

function agruparPorCategoria<T extends { estatus_pagos?: string | null }>(
  registros: T[]
) {
  return registros.reduce(
    (acc, r) => {
      const cat = mapEstatusToCategoria(r.estatus_pagos);
      acc[cat].push(r);
      return acc;
    },
    {
      spei_solicitado: [] as T[],
      pagotdc: [] as T[],
      cupon_enviado: [] as T[],
      pagada: [] as T[],
      otros: [] as T[],
    }
  );
}

type ItemSolicitud = SolicitudProveedor & {
  pagos?: Array<{
    monto_pagado?: string;
    fecha_pago?: string;
    creado_en?: string;
    estado_pago?: string | null;
  }>;
  facturas?: Array<{
    monto_facturado?: string;
    fecha_factura?: string;
    uuid_cfdi?: string;
    estado_factura?: "emitida" | "pendiente" | string;
  }>;
  estatus_pagos?: string | null;
};

function getPagoInfo(item: ItemSolicitud) {
  const pagos = (item?.pagos || []).slice().sort((a, b) => {
    const da = new Date(a.fecha_pago || a.creado_en || 0).getTime();
    const db = new Date(b.fecha_pago || b.creado_en || 0).getTime();
    return db - da;
  });
  const ultimoPago = pagos[0];
  const totalPagado = pagos.reduce(
    (acc, p) => acc + parseNum(p.monto_pagado),
    0
  );
  const fechas = pagos
    .map((p) => p.fecha_pago || p.creado_en)
    .filter(Boolean)
    .map((f) => new Date(f!));
  const fechaUltimoPago = fechas.length
    ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString()
    : "";
  const estado_pago = (ultimoPago?.estado_pago as string | null) ?? null;
  return { estado_pago, totalPagado, fechaUltimoPago };
}

function getFacturaInfo(item: ItemSolicitud) {
  const facturas = item?.facturas || [];
  if (!facturas.length) {
    return {
      estado:
        (item?.solicitud_proveedor?.estado_facturacion as string) ||
        "sin factura",
      totalFacturado: 0,
      fechaUltimaFactura: "",
      uuid: "",
    };
  }
  const totalFacturado = facturas.reduce(
    (acc, f) => acc + parseNum(f.monto_facturado),
    0
  );
  const hayPendiente = facturas.some(
    (f) => (f.estado_factura || "").toLowerCase() === "pendiente"
  );
  const todasEmitidas = facturas.every(
    (f) => (f.estado_factura || "").toLowerCase() === "emitida"
  );
  let estado: "parcial" | "facturado" | string = "parcial";
  if (todasEmitidas) estado = "facturado";
  if (!todasEmitidas && !hayPendiente)
    estado = (facturas[0].estado_factura || "").toLowerCase();

  const fechas = facturas
    .map((f) => f.fecha_factura)
    .filter(Boolean)
    .map((f) => new Date(f!));
  const fechaUltimaFactura = fechas.length
    ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString()
    : "";
  const uuid = facturas[0]?.uuid_cfdi || "";

  return { estado, totalFacturado, fechaUltimaFactura, uuid };
}

const Pill = ({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "green" | "yellow" | "red" | "blue";
}) => {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-300",
    green: "bg-green-100 text-green-700 border-green-300",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-300",
    red: "bg-red-100 text-red-700 border-red-300",
    blue: "bg-blue-100 text-blue-700 border-blue-300",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full border text-xs font-semibold ${tones[tone] || tones.gray
        }`}
    >
      {text}
    </span>
  );
};

const pagoTone3 = (estado: string | null) => {
  const v = (estado || "").toLowerCase();
  if (v === "pagado") return "green";
  if (v === "enviado_a_pago") return "blue";
  return "gray";
};

const facturaTone = (estado: string) =>
  estado === "facturado"
    ? "green"
    : estado === "parcial"
      ? "yellow"
      : estado === "pendiente"
        ? "red"
        : "gray";

function App() {
  const [solicitudesPago, setSolicitudesPago] = useState<SolicitudProveedor[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );
  const [activeFilter, setActiveFilter] = useState<string>("all"); // "all" | "creditCard" | "sentToPayments"
  const { hasAccess } = usePermiso();

  hasAccess(PERMISOS.VISTAS.PROVEEDOR_PAGOS);

  // categoría visible en la tabla
  const [categoria, setCategoria] = useState<CategoriaEstatus | "all">("all");
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

  // Filtra todo lo que esté pagado desde el inicio
  const cleanedSolicitudes = solicitudesPago.filter(
    (it) => norm((it as ItemSolicitud).estatus_pagos) !== "pagado"
  );


  // Filtro adicional
  const filteredSolicitudes = cleanedSolicitudes.filter((item) => {
    if (activeFilter === "creditCard") {
      return !!item.tarjeta?.ultimos_4;
    } else if (activeFilter === "enviado_a_pago") {
      return (item as ItemSolicitud).estatus_pagos?.toLowerCase() === "enviado_a_pago";
    }
    return true;
  });

  const formatDateSimple = (date: string | Date) => {
    if (!date) return "—"; // Si no hay fecha, mostramos un guion
    const localDate = new Date(date);
    return localDate.toLocaleDateString("es-MX", {
      // Aquí usamos el formato mexicano (es-MX)
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // 1) Aplica tu filtro extra (credit card / enviado_a_pago) si aún lo quieres.
  //    Si ya no lo necesitas, puedes quitar activeFilter y dejar solo la categoría.
  const filteredSolicitudes = solicitudesPago.filter((item) => {
    if (activeFilter === "creditCard") return !!item.tarjeta?.ultimos_4;
    if (activeFilter === "enviado_a_pago")
      return (item as ItemSolicitud).estatus_pagos?.toLowerCase() === "enviado_a_pago";
    return true;
  });

  // 2) Búsqueda y mapeo a tu estructura de tabla
  const formatedSolicitudes = filteredSolicitudes
    .filter((item) => {
      const q = (searchTerm || "").toUpperCase();
      return (
        item.hotel.toUpperCase().includes(q) ||
        item.nombre_agente_completo.toUpperCase().includes(q) ||
        (item.nombre_viajero_completo || item.nombre_viajero || "")
          .toUpperCase()
          .includes(q)
      );
    })
    .map((raw) => {
      const item = raw as ItemSolicitud;
      const pagoInfo = getPagoInfo(item);
      const facInfo = getFacturaInfo(item);

      return {
        id_cliente: item.id_agente,
        cliente: (item?.razon_social || "").toUpperCase(),
        creado: item.created_at,
        hotel: item.hotel.toUpperCase(),
        codigo_hotel: item.codigo_reservacion_hotel,
        viajero: (
          item.nombre_viajero_completo ||
          item.nombre_viajero ||
          ""
        ).toUpperCase(),
        check_in: item.check_in,
        check_out: item.check_out,
        noches: calcularNoches(item.check_in, item.check_out),
        habitacion: formatRoom(item.room),
        costo_proveedor: Number(item.costo_total) || 0,
        markup:
          ((Number(item.total || 0) - Number(item.costo_total || 0)) / Number(item.total || 0)) *
          100,
        precio_de_venta: parseFloat(item.total),
        metodo_de_pago: item.id_credito ? "credito" : "contado",
        reservante: item.id_usuario_generador ? "Cliente" : "Operaciones",
        etapa_reservacion: item.estado_reserva,
        estado: item.status,

        // Pagos / Factura
        estado_pago: pagoInfo.estado_pago,
        monto_pagado_proveedor: pagoInfo.totalPagado,
        fecha_real_cobro: pagoInfo.fechaUltimoPago,

        estado_factura_proveedor: facInfo.estado,
        costo_facturado: facInfo.totalFacturado,
        fecha_facturacion: facInfo.fechaUltimaFactura,
        UUID: facInfo.uuid,

        fecha_solicitud: item.solicitud_proveedor?.fecha_solicitud,
        razon_social: item.proveedor?.razon_social,
        rfc: item.proveedor?.rfc,
        forma_de_pago_solicitada:
          item.solicitud_proveedor?.forma_pago_solicitada,
        digitos_tajeta: item.tarjeta?.ultimos_4,
        banco: item.tarjeta?.banco_emisor,
        tipo_tarjeta: item.tarjeta?.tipo_tarjeta,

        // Estatus original (lo usaremos para categorizar)
        estatus_pagos: item.estatus_pagos ?? "",

        item: raw,
      };
    });

  // 3) Agrupa por categoría
  const grupos = agruparPorCategoria(formatedSolicitudes);

  // 4) Decide qué lista mostrar según la categoría seleccionada
  const registrosVisibles =
    categoria === "all" ? formatedSolicitudes : grupos[categoria];

  const renderers: Record<
    string,
    React.FC<{ value: any; item: ItemSolicitud; index: number }>
  > = {
    id_cliente: ({ value }) => (
      <span className="font-semibold text-sm">
        {value ? String(value).slice(0, 11).toUpperCase() : ""}
      </span>
    ),
    creado: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,
    hotel: ({ value }) => (
      <span className="font-medium" title={value}>
        {value ? value.toUpperCase() : ""}
      </span>
    ),
    codigo_hotel: ({ value }) => (
      <span className="font-semibold">{value ? value.toUpperCase() : ""}</span>
    ),
    check_in: ({ value }) => (
      <span title={value}>{formatDateSimple(value)}</span>
    ),
    check_out: ({ value }) => (
      <span title={value}>{formatDateSimple(value)}</span>
    ),
    costo_proveedor: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),
    markup: ({ value }) => (
      <span
        className={`font-semibold border p-2 rounded-full ${value == "Infinity"
          ? "text-gray-700 bg-gray-100 border-gray-300 "
          : value > 0
            ? "text-green-600 bg-green-100 border-green-300"
            : "text-red-600 bg-red-100 border-red-300"
          }`}
      >
        {value == "Infinity" ? "0%" : `${Number(value).toFixed(2)}%`}
      </span>
    ),
    precio_de_venta: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),
    metodo_de_pago: ({ value }) => getPaymentBadge(value),
    reservante: ({ value }) => getWhoCreateBadge(value),
    etapa_reservacion: ({ value }) => getStageBadge(value),
    estado: ({ value }) => getStatusBadge(value),

    estado_pago: ({ value }) => (
      <Pill
        text={(value ?? "—").toUpperCase()}
        tone={pagoTone3(value) as any}
      />
    ),
    monto_pagado_proveedor: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),
    fecha_real_cobro: ({ value }) =>
      value ? (
        <span title={value}>{formatDateSimple(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),

    estado_factura_proveedor: ({ value }) => (
      <Pill
        text={(value || "—").toUpperCase()}
        tone={facturaTone((value || "").toLowerCase()) as any}
      />
    ),
    costo_facturado: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),
    fecha_facturacion: ({ value }) =>
      value ? (
        <span title={value}>{formatDateSimple(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),

    UUID: ({ value }) => (
      <span className="font-mono text-xs" title={value}>
        {value ? String(value).slice(0, 8) + "…" : "—"}
      </span>
    ),
    fecha_solicitud: ({ value }) =>
      value ? (
        <span title={value}>{formatDateSimple(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
    forma_de_pago_solicitada: ({ value }) => (
      <span className="font-semibold">{value ? value.toUpperCase() : ""}</span>
    ),
    estatus_pagos: ({ value }) => (
      <Pill text={value ? value.toUpperCase() : "—"} tone="blue" />
    ),
  };

  // ---------- MULTIPANTALLA ----------
  // const cols = useResponsiveColumns({
  //   xs: [
  //     "creado",
  //     "hotel",
  //     "viajero",
  //     "estado_pago",
  //     "estado_factura_proveedor",
  //     "monto_pagado_proveedor",
  //   ],
  //   md: [
  //     "creado",
  //     "hotel",
  //     "viajero",
  //     "check_in",
  //     "check_out",
  //     "monto_pagado_proveedor",
  //     "fecha_real_cobro",
  //     "metodo_de_pago",
  //     "estado_pago",
  //     "estado_factura_proveedor",
  //     "precio_de_venta",
  //   ],
  //   lg: [
  //     "creado",
  //     "cliente",
  //     "hotel",
  //     "codigo_hotel",
  //     "viajero",
  //     "habitacion",
  //     "check_in",
  //     "check_out",
  //     "noches",
  //     "costo_proveedor",
  //     "markup",
  //     "precio_de_venta",
  //     "metodo_de_pago",
  //     "reservante",
  //     "etapa_reservacion",
  //     "estado",
  //     "estado_pago",
  //     "monto_pagado_proveedor",
  //     "fecha_real_cobro",
  //     "estado_factura_proveedor",
  //     "costo_facturado",
  //     "fecha_facturacion",
  //     "UUID",
  //     "banco",
  //     "digitos_tajeta",
  //     "tipo_tarjeta",
  //   ],
  // });

  const handleFetchSolicitudesPago = () => {
    setLoading(true);
    fetchGetSolicitudesProveedores((data) => {
      setSolicitudesPago(data.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchSolicitudesPago();
  }, [filters]);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Pagos a proveedor
      </h1>

      <div className="w-full mx-auto bg-white p-4 rounded-lg shadow">
        <Filters
          defaultFilters={filters}
          onFilter={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Categorías por estatus_pagos */}
        {/* Categorías por estatus_pagos */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-300 pb-2">
          {([
            { key: "all", label: "Todos", count: formatedSolicitudes.length },
            { key: "spei_solicitado", label: "SPEI solicitado", count: grupos.spei_solicitado.length },
            { key: "pagotdc", label: "Pago TDC", count: grupos.pagotdc.length },
            { key: "cupon_enviado", label: "Cupón enviado", count: grupos.cupon_enviado.length },
            { key: "pagada", label: "Pagada", count: grupos.pagada.length },
          ] as Array<{ key: CategoriaEstatus | "all"; label: string; count: number }>).map(btn => {
            const isActive = categoria === btn.key;
            return (
              <button
                key={btn.key}
                onClick={() => setCategoria(btn.key)}
                className={`relative px-4 py-2 rounded-t-md font-medium border border-b-0 
          transition-all duration-200 
          ${isActive
                    ? "bg-white text-blue-700 border-blue-600 shadow-md -mb-[1px]"
                    : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                  }`}
                title={`Mostrar ${btn.label.toLowerCase()}`}
              >
                <span>{btn.label}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-blue-100 text-blue-700" : "bg-white border"}`}>
                  {btn.count}
                </span>

                {/* efecto carpeta */}
                {isActive && (
                  <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-white"></span>
                )}
              </button>
            );
          })}
        </div>

        <div>
          {loading ? (
            <Loader />
          ) : (
            <Table5<ItemSolicitud>
              registros={registrosVisibles}
              renderers={renderers}
              defaultSort={defaultSort}
              leyenda={`Mostrando ${registrosVisibles.length} registros (${categoria === "all"
                  ? "todas las categorías"
                  : `categoría: ${categoria}`
                })`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const defaultSort = { key: "creado", sort: false };

const defaultFiltersSolicitudes: TypeFilters = {
  codigo_reservacion: null,
  client: null,
  reservante: null,
  reservationStage: null,
  hotel: null,
  status: "Confirmada",
  startDate: currentDate(),
  endDate: currentDate(),
  traveler: null,
  paymentMethod: null,
  id_client: null,
  statusPagoProveedor: null,
  filterType: "Transaccion",
  markup_end: null,
  markup_start: null,
};

export default App;
