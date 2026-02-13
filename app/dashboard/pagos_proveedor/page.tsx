"use client";

import React, { useEffect, useMemo, useState } from "react";
import Filters from "@/components/Filters";
import { calcularNoches, formatRoom, getPaymentBadge, getStageBadge, getStatusBadge, getWhoCreateBadge } from "@/helpers/utils";
import { Table5 } from "@/components/Table5";
import { TypeFilters, SolicitudProveedor } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { currentDate } from "@/lib/utils";
import { fetchGetSolicitudesProveedores1 } from "@/services/pago_proveedor";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { DispersionModal, SolicitudProveedorRaw } from "./Components/dispersion";
import { ComprobanteModal } from "./Components/comprobantes";
import { useNotification } from "@/context/useNotificacion";
import Button from "@/components/atom/Button";
import { Brush, File, Upload } from "lucide-react";
// ---------- HELPERS GENERALES ----------
const parseNum = (v: any) => (v == null ? 0 : Number(v));
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

// ---------- CATEGORÍAS (carpetas base) ----------
type CategoriaEstatus = "spei_solicitado" | "pago_tdc" | "cupon_enviado" | "pagada" | "otros";

// ✅ Nueva vista extra (no necesariamente viene del back)
type VistaCarpeta = CategoriaEstatus | "all" | "carta_garantia";

type SolicitudesPorFiltro = {
  spei_solicitado: SolicitudProveedor[];
  pago_tdc: SolicitudProveedor[];
  cupon_enviado: SolicitudProveedor[];
  pagada: SolicitudProveedor[];
  todos?: SolicitudProveedor[]; // lo armamos aquí
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
  filtro_pago?: string | null;
  cuenta_de_deposito?: string | null;
};

type DatosDispersion = {
  codigo_reservacion_hotel: string | null;
  costo_proveedor: number;
  id_solicitud: string | number | null;
  id_solicitud_proveedor: string | number | null;
  monto_solicitado: number;
  razon_social: string | null;
  cuenta_banco: string | null;
  rfc: string | null;
};

// --- Tabs UI helpers ---
type TabKey = VistaCarpeta;

const tabTheme: Record<
  TabKey,
  { ring: string; bg: string; text: string; border: string; dot: string; badge: string; badgeActive: string }
> = {
  all: {
    ring: "focus:ring-blue-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-blue-500",
    badge: "bg-slate-50 text-slate-600 border-slate-200",
    badgeActive: "bg-blue-50 text-blue-700 border-blue-200",
  },
  spei_solicitado: {
    ring: "focus:ring-cyan-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-800 border-cyan-200",
    badgeActive: "bg-cyan-100 text-cyan-900 border-cyan-300",
  },
  pago_tdc: {
    ring: "focus:ring-indigo-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
    badgeActive: "bg-indigo-100 text-indigo-900 border-indigo-300",
  },
  cupon_enviado: {
    ring: "focus:ring-amber-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    badgeActive: "bg-amber-100 text-amber-950 border-amber-300",
  },
  carta_garantia: {
    ring: "focus:ring-violet-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-800 border-violet-200",
    badgeActive: "bg-violet-100 text-violet-900 border-violet-300",
  },
  pagada: {
    ring: "focus:ring-emerald-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    badgeActive: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
};

const tabBase =
  "relative select-none group !rounded-xl border px-3 py-2 " +
  "transition-all duration-200 " +
  "hover:-translate-y-[1px] active:translate-y-0 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2";

function getTabClass(key: TabKey, active: boolean) {
  const t = tabTheme[key];
  // Activo: tint + borde + sombra suave
  const activeCls = active
    ? `bg-gradient-to-b from-white to-slate-50 border-slate-300 shadow-sm`
    : `${t.bg} ${t.border} hover:border-slate-300 hover:bg-slate-50`;

  return `${tabBase} ${t.ring} ${activeCls}`;
}

function getActiveUnderline(key: TabKey) {
  // underline suave con el color de la carpeta
  const dot = tabTheme[key].dot;
  // map rápido: bg-* => shadow con tono aproximado usando ring/border
  // (Tailwind no permite "shadow-cyan-500/20" por defecto en todos los setups,
  // así que mantenemos un underline sólido + blur usando bg)
  return (
    <span className="absolute -bottom-[2px] left-2 right-2 h-[3px] rounded-full bg-slate-900/0">
      <span className={`block h-full rounded-full ${dot} opacity-80 blur-[0.2px]`} />
    </span>
  );
}


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
    <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${tones[tone] || tones.gray}`}>
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
  estado === "facturado" ? "green" : estado === "parcial" ? "yellow" : estado === "pendiente" ? "red" : "gray";

const formatDateSimple = (date: string | Date) => {
  if (!date) return "—";
  const localDate = new Date(date);
  return localDate.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// -----helper para asignar color en fechas ----
const getFechaPagoColor = (dateStr?: string | Date | null | number) => {
  if (!dateStr || dateStr == 0.0) return "";
  const pagoDate = new Date(dateStr);
  if (isNaN(pagoDate.getTime())) return "";

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const pagoSinHora = new Date(pagoDate.getFullYear(), pagoDate.getMonth(), pagoDate.getDate());

  const diffMs = pagoSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "bg-red-100 text-red-800 border-red-300";
  if (diffDays <= 2) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
};

const getFechaPagoRowClass = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";

  const pagoDate = new Date(dateStr);
  if (isNaN(pagoDate.getTime())) return "";

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const pagoSinHora = new Date(pagoDate.getFullYear(), pagoDate.getMonth(), pagoDate.getDate());

  const diffMs = pagoSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "bg-red-200";
  if (diffDays <= 2) return "bg-yellow-200";
  return "bg-green-200";
};

// ---------- INFO DE PAGOS / FACTURAS ----------
function getPagoInfo(item: ItemSolicitud) {
  const pagos = (item?.pagos || []).slice().sort((a, b) => {
    const da = new Date(a.fecha_pago || a.creado_en || 0).getTime();
    const db = new Date(b.fecha_pago || b.creado_en || 0).getTime();
    return db - da;
  });

  const pendientePago = Number(item?.solicitud_proveedor?.saldo ?? 0);
  const montoSolicitado = Number(item?.solicitud_proveedor?.monto_solicitado ?? 0);

  const totalPagado = pagos.reduce((acc, p) => acc + parseNum(p.monto_pagado ?? 0), 0);

  const fechas = pagos
    .map((p) => p.fecha_pago || p.creado_en)
    .filter(Boolean)
    .map((f) => new Date(f!));

  const fechaUltimoPago = fechas.length ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString() : "";

  let estado_pago = "";
  if (pendientePago === 0) estado_pago = "Pagado";
  else if (pendientePago !== 0 && pendientePago !== montoSolicitado) estado_pago = "Parcial";
  else estado_pago = "Pendiente";

  return { estado_pago, totalPagado, fechaUltimoPago, pendientePago };
}

function getFacturaInfo(item: ItemSolicitud) {
  const facturas = item?.facturas || [];
  if (!facturas.length) {
    return {
      estado: (item?.solicitud_proveedor?.estado_facturacion as string) || "sin factura",
      totalFacturado: 0,
      fechaUltimaFactura: "",
      uuid: "",
    };
  }

  const totalFacturado = facturas.reduce((acc, f) => acc + parseNum(f.monto_facturado), 0);

  const hayPendiente = facturas.some((f) => (f.estado_factura || "").toLowerCase() === "pendiente");
  const todasEmitidas = facturas.every((f) => (f.estado_factura || "").toLowerCase() === "emitida");

  let estado: "parcial" | "facturado" | string = "parcial";
  if (todasEmitidas) estado = "facturado";
  if (!todasEmitidas && !hayPendiente) estado = (facturas[0].estado_factura || "").toLowerCase();

  const fechas = facturas
    .map((f) => f.fecha_factura)
    .filter(Boolean)
    .map((f) => new Date(f!));

  const fechaUltimaFactura = fechas.length ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString() : "";
  const uuid = facturas[0]?.uuid_cfdi || "";

  return { estado, totalFacturado, fechaUltimaFactura, uuid };
}

// ---------- DEFAULTS ----------
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

// ✅ Carta garantía: ajusta aquí si tu negocio la detecta con otro criterio
const isCartaGarantia = (s: SolicitudProveedor) => {
  const forma = norm((s as any)?.solicitud_proveedor?.forma_pago_solicitada);
  const filtro = norm((s as any)?.filtro_pago);
  // común: "credit" = carta garantía (según tu enum del SP)
  return forma === "credit" || filtro === "carta_garantia" || filtro === "carta garantia";
};

function App() {
  const [solicitudesPago, setSolicitudesPago] = useState<SolicitudesPorFiltro>({
    todos: [],
    spei_solicitado: [],
    pago_tdc: [],
    cupon_enviado: [],
    pagada: [],
  });

  const [showDispersionModal, setShowDispersionModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);

  const { showNotification } = useNotification();
  const { hasAccess } = usePermiso();

  const [solicitudesSeleccionadasModal, setSolicitudesSeleccionadasModal] = useState<SolicitudProveedorRaw[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersSolicitudes);

  // tabs / carpeta activa
  const [categoria, setCategoria] = useState<VistaCarpeta>("all");

  // selección
  const [solicitud, setSolicitud] = useState<SolicitudProveedor[]>([]);
  type SelectedSolicitudesMap = Record<string, SolicitudProveedor>;
  const [selectedSolicitudesMap, setSelectedSolicitudesMap] = useState<SelectedSolicitudesMap>({});
  const [datosDispersion, setDatosDispersion] = useState<DatosDispersion[]>([]);

  hasAccess(PERMISOS.VISTAS.PROVEEDOR_PAGOS);

  const selectedCount = solicitud.length;

  const mergeAll = (d: Partial<SolicitudesPorFiltro>) => {
    const arr = [...(d.spei_solicitado ?? []), ...(d.pago_tdc ?? []), ...(d.cupon_enviado ?? []), ...(d.pagada ?? [])];

    const map = new Map<string, SolicitudProveedor>();
    for (const it of arr) {
      const key = String((it as any).id_solicitud ?? (it as any).id ?? it.solicitud_proveedor?.id_solicitud_proveedor ?? "");
      if (!key) continue;
      if (!map.has(key)) map.set(key, it);
    }
    return Array.from(map.values());
  };

  const handleFetchSolicitudesPago = () => {
    setLoading(true);

    fetchGetSolicitudesProveedores1((data) => {
      const d: any = data?.data || {};

      const spei_solicitado = d.spei_solicitado || [];
      const pago_tdc = d.pago_tdc || [];
      const cupon_enviado = d.cupon_enviado || [];
      const pagada = d.pagada || [];

      const todos = mergeAll({ spei_solicitado, pago_tdc, cupon_enviado, pagada });

      setSolicitudesPago({
        spei_solicitado,
        pago_tdc,
        cupon_enviado,
        pagada,
        todos,
      });

      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchSolicitudesPago();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ✅ Derivados para tabs extra
  const cartaGarantiaList = useMemo(() => {
    const all = solicitudesPago.todos ?? [];
    return all.filter(isCartaGarantia);
  }, [solicitudesPago.todos]);

  // ✅ (recomendado) limpiar selección al cambiar de carpeta
  useEffect(() => {
    setSelectedSolicitudesMap({});
    setSolicitud([]);
    setDatosDispersion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  // ------- Lista base por carpeta -------
  const baseList: SolicitudProveedor[] =
    categoria === "all"
      ? solicitudesPago.todos ?? []
      : categoria === "spei_solicitado"
      ? solicitudesPago.spei_solicitado
      : categoria === "pago_tdc"
      ? solicitudesPago.pago_tdc
      : categoria === "cupon_enviado"
      ? solicitudesPago.cupon_enviado
      : categoria === "carta_garantia"
      ? cartaGarantiaList
      : solicitudesPago.pagada;

  // 1) filtro extra (si aún lo quieres)
  const filteredSolicitudes = baseList.filter((item) => {
    // aquí podrías poner filtros secundarios futuros si quieres
    return true;
  });

  // 2) búsqueda + mapeo a registros de tabla
  const formatedSolicitudes = filteredSolicitudes
    .filter((item) => {
      const q = (searchTerm || "").toUpperCase();
      return (
        item.hotel?.toUpperCase().includes(q) ||
        item.nombre_agente_completo?.toUpperCase().includes(q) ||
        (item.nombre_viajero_completo || item.nombre_viajero || "").toUpperCase().includes(q)
      );
    })
    .map((raw) => {
      const item = raw as ItemSolicitud;
      const pagoInfo = getPagoInfo(item);
      const facInfo = getFacturaInfo(item);

      return {
        seleccionar: "",
        filtro_pago: (item as any).filtro_pago ?? "",

        // reserva
        codigo_hotel: item.codigo_reservacion_hotel,
        creado: item.created_at,
        hotel: (item.hotel || "").toUpperCase(),
        razon_social: item.proveedor?.razon_social,
        rfc: item.proveedor?.rfc,
        viajero: (item.nombre_viajero_completo || item.nombre_viajero || "").toUpperCase(),
        check_in: item.check_in,
        check_out: item.check_out,
        noches: calcularNoches(item.check_in, item.check_out),
        habitacion: formatRoom(item.room),
        costo_proveedor: Number(item.costo_total) || 0,
        markup: ((Number(item.total || 0) - Number(item.costo_total || 0)) / Number(item.total || 0)) * 100,
        precio_de_venta: parseFloat(item.total),
        metodo_de_pago: item.id_credito ? "credito" : "contado",
        etapa_reservacion: item.estado_reserva,
        estado: item.status,
        reservante: item.id_usuario_generador ? "Cliente" : "Operaciones",

        // cliente
        id_cliente: item.id_agente,
        cliente: (item.nombre_agente_completo || "").toUpperCase(),

        // solicitud / pagos / facturación
        fecha_de_pago: item.solicitud_proveedor?.fecha_solicitud,
        forma_de_pago_solicitada: item.solicitud_proveedor?.forma_pago_solicitada,
        digitos_tajeta: item.tarjeta?.ultimos_4,
        banco: item.tarjeta?.banco_emisor,
        tipo_tarjeta: item.tarjeta?.tipo_tarjeta,

        // ✅ CXP comments (solo lectura)
        comentarios_cxp: (item as any).comentario_CXP ?? (item as any).comments_cxp ?? "",

        // pago proveedor
        estado_pago: pagoInfo.estado_pago,
        pendiente_a_pagar: pagoInfo.pendientePago,
        monto_pagado_proveedor: pagoInfo.totalPagado,
        fecha_pagado: pagoInfo.fechaUltimoPago,

        // factura
        estado_factura_proveedor: facInfo.estado,
        total_facturado: facInfo.totalFacturado,
        fecha_facturacion: facInfo.fechaUltimaFactura,
        UUID: facInfo.uuid,

        estatus_pagos: item.estatus_pagos ?? "",

        // raw
        item: raw,
      };
    });

  const registrosVisibles = formatedSolicitudes;

  // ---------- HANDLERS ----------
  const handleDispersion = () => {
    if (!solicitud.length) {
      showNotification("info", "No hay solicitudes seleccionadas para dispersión");
      return;
    }

    const seleccion = solicitud.map((s) => {
      const anyS = s as any;

      return {
        id_solicitud: anyS.id_solicitud ?? anyS.id ?? "",
        id_pago: anyS.id_pago ?? null,
        hotel: s.hotel ?? null,
        codigo_reservacion_hotel: s.codigo_reservacion_hotel ?? null,
        costo_total: s.costo_total ?? s.solicitud_proveedor?.monto_solicitado ?? "0",
        check_out: s.check_out ?? null,
        codigo_dispersion: anyS.codigo_dispersion ?? null,
        cuenta_de_deposito: (s as any).cuenta_de_deposito ?? null,

        solicitud_proveedor: s.solicitud_proveedor
          ? {
              id_solicitud_proveedor: s.solicitud_proveedor.id_solicitud_proveedor,
              fecha_solicitud: s.solicitud_proveedor.fecha_solicitud ?? null,
              monto_solicitado: s.solicitud_proveedor.monto_solicitado ?? null,
            }
          : null,

        razon_social: s.proveedor?.razon_social ?? null,
        rfc: s.proveedor?.rfc ?? null,
      } as SolicitudProveedorRaw;
    });

    setSolicitudesSeleccionadasModal(seleccion);
    setShowDispersionModal(true);
  };

  const handleCsv = () => setShowComprobanteModal(true);

  const clearSelection = () => {
    setSelectedSolicitudesMap({});
    setSolicitud([]);
    setDatosDispersion([]);
  };

  // ---------- RENDERERS ----------
  const renderers: Record<string, React.FC<{ value: any; item: any; index: number }>> = {
    seleccionar: ({ item, index }) => {
      const row = item as any;
      const raw: SolicitudProveedor | undefined = (row.item as SolicitudProveedor) || row;
      if (!raw) return null;

      const tieneDispersion =
        !!(raw as any).codigo_dispersion ||
        !!raw.solicitud_proveedor?.codigo_dispersion ||
        Number(raw.solicitud_proveedor?.saldo ?? 0) <= 0;

      const key = String(
        (raw as any).id_solicitud ?? (raw as any).id ?? raw.solicitud_proveedor?.id_solicitud_proveedor ?? index
      );

      const isSelected = !!selectedSolicitudesMap[key];

      // ✅ si estás en carpeta pagada, ocultamos checkbox
      if (categoria === "pagada") return <span className="text-gray-300">—</span>;

      if (tieneDispersion) {
        return <input type="checkbox" checked={false} disabled title="Esta solicitud ya tiene código de dispersión / saldo 0" />;
      }

      return (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            setSelectedSolicitudesMap((prev) => {
              const next = { ...prev };
              if (e.target.checked) next[key] = raw;
              else delete next[key];
              return next;
            });

            setSolicitud((prev) => {
              const rawId = (raw as any).id_solicitud ?? (raw as any).id;
              if (e.target.checked) return [...prev, raw];
              return prev.filter((s) => ((s as any).id_solicitud ?? (s as any).id) !== rawId);
            });

            setDatosDispersion((prev) => {
              const idSolProv = raw.solicitud_proveedor?.id_solicitud_proveedor ?? null;
              const idSol = (raw as any).id_solicitud ?? (raw as any).id ?? null;

              if (e.target.checked) {
                const nuevo: DatosDispersion = {
                  codigo_reservacion_hotel: raw.codigo_reservacion_hotel ?? null,
                  costo_proveedor: Number((raw as any).costo_total) || 0,
                  id_solicitud: idSol,
                  id_solicitud_proveedor: idSolProv,
                  monto_solicitado: Number(raw.solicitud_proveedor?.monto_solicitado) || 0,
                  razon_social: raw.proveedor?.razon_social ?? null,
                  rfc: raw.proveedor?.rfc ?? null,
                  cuenta_banco: (raw as any).cuenta_de_deposito ?? null,
                };

                const exists = prev.some((d) => d.id_solicitud === nuevo.id_solicitud);
                return exists ? prev : [...prev, nuevo];
              } else {
                return prev.filter((d) => d.id_solicitud !== idSol);
              }
            });
          }}
        />
      );
    },

    id_cliente: ({ value }) => (
      <span className="font-semibold text-sm">{value ? String(value).slice(0, 11).toUpperCase() : ""}</span>
    ),

    creado: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,

    codigo_hotel: ({ value }) => <span className="font-semibold">{value ? String(value).toUpperCase() : ""}</span>,

    check_in: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,

    check_out: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,

    costo_proveedor: ({ value }) => {
      const monto = Number(value || 0);
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-800 border border-gray-200">
          ${monto.toFixed(2)}
        </span>
      );
    },

    // ✅ comentarios CXP SOLO LECTURA (sin editar)
    comentarios_cxp: ({ value }) => {
      const texto = String(value ?? "").trim();
      const preview = texto.length > 34 ? texto.slice(0, 34) + "…" : texto;

      return (
        <span className="text-xs text-gray-800" title={texto || "—"}>
          {texto ? preview : <span className="text-gray-400">—</span>}
        </span>
      );
    },

    markup: ({ value }) => (
      <span
        className={`font-semibold border px-2 py-1 rounded-full ${
          value == "Infinity"
            ? "text-gray-700 bg-gray-100 border-gray-300"
            : value > 0
            ? "text-green-600 bg-green-100 border-green-300"
            : "text-red-600 bg-red-100 border-red-300"
        }`}
      >
        {value == "Infinity" ? "0%" : `${Number(value).toFixed(2)}%`}
      </span>
    ),

    precio_de_venta: ({ value }) => <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>,

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

    monto_pagado_proveedor: ({ value }) => <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>,

    fecha_pagado: ({ value }) =>
      value ? <span title={value}>{formatDateSimple(value)}</span> : <span className="text-gray-400">—</span>,

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

    total_facturado: ({ value }) => <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>,

    fecha_facturacion: ({ value }) =>
      value ? <span title={value}>{formatDateSimple(value)}</span> : <span className="text-gray-400">—</span>,

    UUID: ({ value }) => (
      <span className="font-mono text-xs" title={value}>
        {value ? "CFDI: " + String(value).slice(0, 8) + "…" : "—"}
      </span>
    ),

    // ----------- SOLICITUD -----------
    fecha_de_pago: ({ value }) => {
      if (!value) return <span className="text-gray-400">—</span>;
      const colorClasses = getFechaPagoColor(value);
      return (
        <span title={value} className={`px-2 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}>
          {formatDateSimple(value)}
        </span>
      );
    },

    pendiente_a_pagar: ({ value }) => <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>,

    forma_de_pago_solicitada: ({ value }) => (
      <span className="font-semibold">
        {value
          ? String(value)
              .replace("transfer", "Transferencia")
              .replace("card", "Tarjeta")
              .replace("cupon", "Cupón")
              .replace("credit", "Carta garantía")
              .toUpperCase()
          : ""}
      </span>
    ),

    estatus_pagos: ({ value }) => (
      <Pill
        text={
          value
            ? String(value).replace("enviado_a_pago", "Enviado a Pago").replace("pagado", "Pagado").toUpperCase()
            : "—"
        }
        tone="blue"
      />
    ),
  };

  // ---------- Tabs config (carpetas) ----------
  const tabs = useMemo(
    () =>
      [
        { key: "all", label: "Todos", count: (solicitudesPago.todos ?? []).length },
        { key: "spei_solicitado", label: "SPEI", count: solicitudesPago.spei_solicitado.length },
        { key: "pago_tdc", label: "Pago TDC", count: solicitudesPago.pago_tdc.length },
        { key: "cupon_enviado", label: "Cupón", count: solicitudesPago.cupon_enviado.length },
        { key: "carta_garantia", label: "Carta garantía", count: cartaGarantiaList.length }, // ✅ NUEVA
        { key: "pagada", label: "Pagada", count: solicitudesPago.pagada.length },
      ] as Array<{ key: VistaCarpeta; label: string; count: number }>,
    [solicitudesPago, cartaGarantiaList]
  );

  

  return (
    <div className="h-fit">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 my-4">Pagos a proveedor</h1>

      <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <Filters defaultFilters={filters} onFilter={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        {/* Tabs tipo carpetas (minimalista) */}
        {/* Tabs tipo carpetas (mejorados) */}
<div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-3">
  {tabs.map((btn) => {
    const isActive = categoria === btn.key;
    const theme = tabTheme[btn.key];

    return (
      <Button
        key={btn.key}
        onClick={() => setCategoria(btn.key)}
        variant="ghost"
        size="md"
        className={getTabClass(btn.key, isActive)}
      >
        {/* Dot color */}
        <span className={`mr-2 h-2.5 w-2.5 rounded-full ${theme.dot} shadow-sm`} />

        {/* Label */}
        <span className={`font-semibold ${isActive ? "text-slate-900" : theme.text}`}>
          {btn.label}
        </span>

        {/* Badge count */}
        <span
          className={
            "ml-2 text-[11px] px-2 py-0.5 rounded-full border font-semibold " +
            (isActive ? theme.badgeActive : theme.badge)
          }
        >
          {btn.count}
        </span>

        {/* Active underline */}
        {isActive && getActiveUnderline(btn.key)}
      </Button>
    );
  })}
</div>


        {/* Barra de acciones minimalista */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs text-slate-600">
            {categoria === "pagada" ? "Carpeta pagada (sin selección)" : selectedCount > 0 ? `Seleccionadas: ${selectedCount}` : "Sin selección"}
          </div>

          <div className="flex gap-2">
            
          </div>
        </div>

        <div>
          {loading ? (
            <Loader />
          ) : (
            <Table5<ItemSolicitud>
              
              registros={registrosVisibles as any}
              renderers={renderers}
              defaultSort={defaultSort}
              getRowClassName={(row) => {
                if (categoria === "pagada") return "";
                if ((row as any).filtro_pago === "pagada") return "";
                return getFechaPagoRowClass(row.pendiente_a_pagar <= 0 ? "" : row.fecha_de_pago);
              }}
              leyenda={`Mostrando ${registrosVisibles.length} registros (${
                categoria === "all" ? "todas" : categoria === "carta_garantia" ? "carta garantía" : `categoría: ${categoria}`
              })`}
            >
              <Button
              onClick={handleCsv}
              icon={Upload}
            >
              Subir Comprobante
            </Button>

            <Button
              onClick={handleDispersion}
              disabled={categoria === "pagada" || selectedCount === 0}
              variant="secondary"
              icon={File}
            >
              Generar dispersión
            </Button>

            {selectedCount > 0 && categoria !== "pagada" && (
              <Button
                onClick={clearSelection}
                variant="ghost"
                icon={Brush}
              >
                Limpiar
              </Button>
            )}
            </Table5>
          )}
        </div>
      </div>

      {showDispersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <DispersionModal
            solicitudesSeleccionadas={solicitudesSeleccionadasModal}
            onClose={() => setShowDispersionModal(false)}
            onSubmit={async (payload) => {
              console.log("Payload de dispersión listo para API:", payload);
              setShowDispersionModal(false);
            }}
          />
        </div>
      )}

      {showComprobanteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <ComprobanteModal
            onClose={() => setShowComprobanteModal(false)}
            onSubmit={async (payload) => {
              console.log("Payload de comprobante listo para API:", payload);
              setShowComprobanteModal(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
