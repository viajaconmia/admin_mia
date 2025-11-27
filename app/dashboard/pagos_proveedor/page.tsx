"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Send, Pencil } from "lucide-react";
import Filters from "@/components/Filters";
import {
  calcularNoches,
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
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

// ---------- HELPERS GENERALES ----------

const parseNum = (v: any) => (v == null ? 0 : Number(v));
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

// ---------- CATEGORÍAS ----------

type CategoriaEstatus =
  | "spei_solicitado"
  | "pago_tdc"
  | "cupon_enviado"
  | "pagada"
  | "otros";


type SolicitudesPorFiltro = {
  todos: SolicitudProveedor[];
  spei_solicitado: SolicitudProveedor[];
  pago_tdc: SolicitudProveedor[];
  cupon_enviado: SolicitudProveedor[];
  pagada: SolicitudProveedor[];
};

function mapEstatusToCategoria(estatus?: string | null): CategoriaEstatus {
  const v = norm(estatus);

  // matches exactos o cercanos
  if (v === "spei_solicitado" || v.includes("spei")) return "spei_solicitado";
  if (v === "pago_tdc" || v.includes("tdc") || v.includes("tarjeta"))
    return "pago_tdc";
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

// -----helper para asignar color en fechas ----
const getFechaPagoColor = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";

  const pagoDate = new Date(dateStr);
  if (isNaN(pagoDate.getTime())) return "";

  // Normalizamos ambas fechas a inicio del día para comparar sin horas
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const pagoSinHora = new Date(
    pagoDate.getFullYear(),
    pagoDate.getMonth(),
    pagoDate.getDate()
  );

  const diffMs = pagoSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // 🔴 Ya pasó la fecha
  if (diffDays < 0) return "bg-red-100 text-red-800 border-red-300";

  // 🟡 Hoy o en los próximos 2 días
  if (diffDays <= 2) return "bg-yellow-100 text-yellow-800 border-yellow-300";

  // 🟢 Faltan más de 2 días
  return "bg-green-100 text-green-800 border-green-300";
};

const getFechaPagoRowClass = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";

  const pagoDate = new Date(dateStr);
  if (isNaN(pagoDate.getTime())) return "";

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const pagoSinHora = new Date(
    pagoDate.getFullYear(),
    pagoDate.getMonth(),
    pagoDate.getDate()
  );

  const diffMs = pagoSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // 🔴 Ya pasó la fecha
  if (diffDays < 0) return "bg-red-200";

  // 🟡 Hoy o en los próximos 2 días
  if (diffDays <= 2) return "bg-yellow-200";

  // 🟢 Faltan más de 2 días
  return "bg-green-200";
};


// ---------- TIPOS DE ITEM ----------

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
  filtro_pago?: string | null; // 👈 también lo ponemos aquí
};

// ---------- INFO DE PAGOS / FACTURAS ----------

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

const handleEdit = (
  item: ItemSolicitud,
  field: "razon_social" | "rfc" | "costo_proveedor",
  newValue: string
) => {
  // Por ahora solo mostramos que se está editando
  console.log("editando", {
    field,
    newValue,
    id_solicitud: (item as any).id_solicitud,
    id: (item as any).id,
  });

  // Aquí después podrás hacer:
  // - actualizar un estado local de edición
  // - llamar a un servicio para guardar en el back, etc.
};



// ---------- UI HELPERS ----------

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

const formatDateSimple = (date: string | Date) => {
  if (!date) return "—";
  const localDate = new Date(date);
  return localDate.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ---------- COMPONENTE PRINCIPAL ----------

function App() {
  const [solicitudesPago, setSolicitudesPago] = useState<SolicitudesPorFiltro>({
    todos: [],
    spei_solicitado: [],
    pago_tdc: [],
    cupon_enviado: [],
    pagada: [],
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [categoria, setCategoria] = useState<CategoriaEstatus | "all">("all");

  // 🔹 NUEVO: estado para solicitudes seleccionadas
  const [solicitud, setSolicitud] = useState<SolicitudProveedor[]>([]);

  // 🔹 NUEVO: objeto (map) de seleccionados
  type SelectedSolicitudesMap = Record<string, SolicitudProveedor>;
  const [selectedSolicitudesMap, setSelectedSolicitudesMap] =
    useState<SelectedSolicitudesMap>({});

  const selectedCount = solicitud.length;

  const { hasAccess } = usePermiso();

  const [editModal, setEditModal] = useState<{
    open: boolean;
    item: ItemSolicitud | null;
    field: "razon_social" | "rfc" | "costo_proveedor" | null;
    value: string;
  }>({
    open: false,
    item: null,
    field: null,
    value: "",
  });

  const [editError, setEditError] = useState<string | null>(null);

  const closeEditModal = () => {
    setEditModal({
      open: false,
      item: null,
      field: null,
      value: "",
    });
    setEditError(null);
  };

  const handleConfirmEdit = () => {
    if (!editModal.item || !editModal.field) return;

    const cleaned = editModal.value.replace(",", ".").trim();
    if (cleaned === "" || isNaN(Number(cleaned))) {
      setEditError("Valor no válido. Usa solo números (puedes usar punto decimal).");
      return;
    }

    // 🔥 Llamamos a tu handleEdit real
    handleEdit(editModal.item, editModal.field, cleaned);

    closeEditModal();
  };

  hasAccess(PERMISOS.VISTAS.PROVEEDOR_PAGOS);

  const cleanedSolicitudes = (solicitudesPago || []) as ItemSolicitud[];

  const baseList: SolicitudProveedor[] =
    categoria === "all"
      ? solicitudesPago.todos
      : categoria === "spei_solicitado"
        ? solicitudesPago.spei_solicitado
        : categoria === "pago_tdc"
          ? solicitudesPago.pago_tdc
          : categoria === "cupon_enviado"
            ? solicitudesPago.cupon_enviado
            : solicitudesPago.pagada;

  // 1) Aplica tu filtro extra (credit card / enviado_a_pago) si aún lo quieres.
  //    Si ya no lo necesitas, puedes quitar activeFilter y dejar solo la categoría.
  const filteredSolicitudes = baseList.filter((item) => {
    if (activeFilter === "creditCard") return !!item.tarjeta?.ultimos_4;
    if (activeFilter === "enviado_a_pago")
      return (
        (item as ItemSolicitud).estatus_pagos?.toLowerCase() ===
        "enviado_a_pago"
      );
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
        // 🔹 NUEVO: campo al inicio para seleccionar (primera columna)
        seleccionar: "",

        // 🟦 INFORMACIÓN DE LA RESERVA
        codigo_hotel: item.codigo_reservacion_hotel,
        creado: item.created_at,
        hotel: item.hotel.toUpperCase(),
        razon_social: item.proveedor?.razon_social,
        rfc: item.proveedor?.rfc,
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
          ((Number(item.total || 0) - Number(item.costo_total || 0)) /
            Number(item.total || 0)) *
          100,
        precio_de_venta: parseFloat(item.total),
        metodo_de_pago: item.id_credito ? "credito" : "contado",
        etapa_reservacion: item.estado_reserva,
        estado: item.status,
        reservante: item.id_usuario_generador ? "Cliente" : "Operaciones",
        // 🟩 INFORMACIÓN DEL CLIENTE
        id_cliente: item.id_agente,
        cliente: (item.nombre_agente_completo || "").toUpperCase(),
        // 🟨 INFORMACIÓN DEL PROVEEDOR
        // 🟧 INFORMACIÓN DE LA SOLICITUD / PAGOS / FACTURACIÓN
        fecha_de_pago: item.solicitud_proveedor?.fecha_solicitud,
        forma_de_pago_solicitada:
          item.solicitud_proveedor?.forma_pago_solicitada,
        digitos_tajeta: item.tarjeta?.ultimos_4,
        banco: item.tarjeta?.banco_emisor,
        tipo_tarjeta: item.tarjeta?.tipo_tarjeta,
        // 🟥 PAGO AL PROVEEDOR
        estado_pago: pagoInfo.estado_pago,
        monto_pagado_proveedor: pagoInfo.totalPagado,
        fecha_real_pago: pagoInfo.fechaUltimoPago,
        // 🟪 FACTURACIÓN
        estado_factura_proveedor: facInfo.estado,
        total_facturado: facInfo.totalFacturado,
        fecha_facturacion: facInfo.fechaUltimaFactura,
        UUID: facInfo.uuid,
        estatus_pagos: item.estatus_pagos ?? "",
        // Objeto completo original por si se requiere
        item: raw,
      };
    });

  const registrosVisibles = formatedSolicitudes;

  // ---------- HANDLERS NUEVOS ----------

  const handleDispersion = () => {
    console.log("hola");
  };

  const handleCsv = () => {
    console.log("hola");
  };

  const renderers: Record<
    string,
    React.FC<{ value: any; item: any; index: number }>
  > = {
    // 🔹 Renderer de selección (checkbox)
    seleccionar: ({ item }) => {
      // 👉 aquí item YA es la SolicitudProveedor original
      const raw: SolicitudProveedor | undefined = item;
      if (!raw) return null;

      // 🔑 Definimos una llave única para el mapa
      const key =
        raw.solicitud_proveedor?.id_solicitud_proveedor;

      const isSelected = key ? !!selectedSolicitudesMap[key] : false;

      return (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            if (!key) return;

            // 🧠 1) Actualizamos el objeto (mapa)
            setSelectedSolicitudesMap((prev) => {
              const next = { ...prev };
              if (e.target.checked) {
                next[key] = raw;
              } else {
                delete next[key];
              }
              return next;
            });

            // 📚 2) Mantenemos también el arreglo `solicitud`
            setSolicitud((prev) => {
              if (e.target.checked) {
                const exists = prev.some(
                  (s) =>
                    (s as any).id_solicitud === (raw as any).id_solicitud ||
                    (s as any).id === (raw as any).id
                );
                return exists ? prev : [...prev, raw];
              } else {
                return prev.filter(
                  (s) =>
                    (s as any).id_solicitud !== (raw as any).id_solicitud &&
                    (s as any).id !== (raw as any).id
                );
              }
            });
          }}
        />
      );
    },

    id_cliente: ({ value }) => (
      <span className="font-semibold text-sm">
        {value ? String(value).slice(0, 11).toUpperCase() : ""}
      </span>
    ),

    creado: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,

    codigo_hotel: ({ value }) => (
      <span className="font-semibold">{value ? value.toUpperCase() : ""}</span>
    ),

    check_in: ({ value }) => (
      <span title={value}>{formatDateSimple(value)}</span>
    ),

    check_out: ({ value }) => (
      <span title={value}>{formatDateSimple(value)}</span>
    ),

    costo_proveedor: ({ value, item }) => {
      const raw = item as ItemSolicitud;
      const monto = Number(value || 0);

      return (
        <div className="flex items-center gap-2">
          {/* Pill del monto */}
          <span
            title={String(value)}
            className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-800 border border-gray-200"
          >
            ${monto.toFixed(2)}
          </span>

          {/* Botón editar amigable que abre el mini modal */}
          <button
            type="button"
            className="inline-flex items-center px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-[11px] font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition"
            onClick={() => {
              const actual = isNaN(monto) ? "" : monto.toString();
              setEditError(null);
              setEditModal({
                open: true,
                item: raw,
                field: "costo_proveedor",
                value: actual,
              });
            }}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Editar
          </button>
        </div>
      );
    },

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

    // ----------- PAGO -----------
    estado_pago: ({ value }) => (
      <Pill
        text={(value ?? "—")
          .replace("pagado", "Pagado")
          .replace("enviado_a_pago", "Enviado a Pago")
          .toUpperCase()}
        tone={pagoTone3(value) as any}
      />
    ),

    monto_pagado_proveedor: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),

    fecha_real_pago: ({ value }) =>
      value ? (
        <span title={value}>{formatDateSimple(value)}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),

    // ----------- FACTURA -----------
    estado_factura_proveedor: ({ value }) => (
      <Pill
        text={(value || "—")
          .replace("facturado", "Facturado")
          .replace("parcial", "Parcial")
          .replace("pendiente", "Pendiente")
          .toUpperCase()}
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
        {value ? "CFDI: " + String(value).slice(0, 8) + "…" : "—"}
      </span>
    ),

    // ----------- SOLICITUD -----------
    fecha_de_pago: ({ value }) => {
      if (!value) {
        return <span className="text-gray-400">—</span>;
      }

      const colorClasses = getFechaPagoColor(value);

      return (
        <span
          title={value}
          className={`px-2 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}
        >
          {formatDateSimple(value)}
        </span>
      );
    },

    forma_de_pago_solicitada: ({ value }) => (
      <span className="font-semibold">
        {value
          ? value
            .replace("transfer", "Transferencia")
            .replace("card", "Tarjeta")
            .replace("cupon", "Cupón")
            .toUpperCase()
          : ""}
      </span>
    ),

    estatus_pagos: ({ value }) => (
      <Pill
        text={
          value
            ? value
              .replace("enviado_a_pago", "Enviado a Pago")
              .replace("pagado", "Pagado")
              .toUpperCase()
            : "—"
        }
        tone="blue"
      />
    ),
  };

  const handleFetchSolicitudesPago = () => {
    setLoading(true);
    fetchGetSolicitudesProveedores((data) => {
      const d: any = data?.data || {};
      console.log("solicitudes pago", d);

      setSolicitudesPago({
        todos: d.todos || [],
        spei_solicitado: d.spei_solicitado || [],
        pago_tdc: d.pago_tdc || [],
        cupon_enviado: d.cupon_enviado || [],
        pagada: d.pagada || [],
      });

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

        {/* Tabs de categorías */}
        {/* Categorías por estatus_pagos */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-300 pb-2">
          {(
            [
              {
                key: "all",
                label: "Todos",
                count: solicitudesPago.todos.length,
              },
              {
                key: "spei_solicitado",
                label: "SPEI solicitado",
                count: solicitudesPago.spei_solicitado.length,
              },
              {
                key: "pago_tdc",
                label: "Pago TDC",
                count: solicitudesPago.pago_tdc.length,
              },
              {
                key: "cupon_enviado",
                label: "Cupón enviado",
                count: solicitudesPago.cupon_enviado.length,
              },
              {
                key: "pagada",
                label: "Pagada",
                count: solicitudesPago.pagada.length,
              },
            ] as Array<{
              key: CategoriaEstatus | "all";
              label: string;
              count: number;
            }>
          ).map((btn) => {
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
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-blue-100 text-blue-700" : "bg-white border"
                    }`}
                >
                  {btn.count}
                </span>

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
              registros={registrosVisibles as any}
              renderers={renderers}
              defaultSort={defaultSort}
              getRowClassName={(row) => getFechaPagoRowClass(row.fecha_de_pago)}
              leyenda={`Mostrando ${registrosVisibles.length
                } registros (${categoria === "all"
                  ? "todas las categorías"
                  : `categoría: ${categoria}`
                })`}
            >
              {/* 🔹 Botones para subir CSV y layout */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleCsv}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Subir CSV
                </button>
                <button
                  type="button"
                  onClick={handleDispersion}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Generar dispersion
                </button>
              </div>
            </Table5>
          )}
        </div>
      </div>
      {editModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Editar{" "}
              {editModal.field === "costo_proveedor"
                ? "costo proveedor"
                : editModal.field === "razon_social"
                  ? "razón social"
                  : editModal.field === "rfc"
                    ? "RFC"
                    : ""}
            </h3>

            <p className="text-xs text-gray-500 mb-3">
              Ingresa el nuevo valor y guarda los cambios.
            </p>

            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={editModal.value}
              onChange={(e) => {
                setEditError(null);
                setEditModal((prev) => ({
                  ...prev,
                  value: e.target.value,
                }));
              }}
            />

            {editError && (
              <p className="text-xs text-red-600 mt-1">{editError}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={closeEditModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleConfirmEdit}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

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
