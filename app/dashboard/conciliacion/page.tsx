// app/conciliacion/page.tsx
"use client";



import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import {
  Filter,
  X,
  Search,
  Handshake,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
} from "lucide-react";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import SubirFactura from "@/app/dashboard/facturacion/subirfacturas/SubirFactura";
import ModalDetalle from "@/app/dashboard/conciliacion/compponents/detalles";
import { formatDate } from "@/helpers/formater";
import BuscarUuidFacturaModal from "@/app/dashboard/conciliacion/compponents/BuscarUuidFacturaModal";
import FiltrosConciliacionModal, {
  type ConciliacionFilters,
} from "@/app/dashboard/conciliacion/compponents/FiltrosReservaModal";

type AnyRow = Record<string, any>;

function formatMoney(n: any) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
}

const roundCents = (n: number) => Math.round(n * 100) / 100;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calcNoches(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) return 0;

  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  if (Number.isNaN(inD.getTime()) || Number.isNaN(outD.getTime())) return 0;

  const startUTC = Date.UTC(
    inD.getUTCFullYear(),
    inD.getUTCMonth(),
    inD.getUTCDate(),
  );
  const endUTC = Date.UTC(
    outD.getUTCFullYear(),
    outD.getUTCMonth(),
    outD.getUTCDate(),
  );

  const diffDays = Math.round((endUTC - startUTC) / MS_PER_DAY);
  return diffDays > 0 ? diffDays : 0;
}

function truncateText(v: any, max = 28) {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

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
  let conFecha = 0;

  for (const p of pagos) {
    solicitado += Number(p?.monto_solicitado ?? 0) || 0;
    pagado += Number(p?.monto_pagado ?? 0) || 0;
    if (p?.fecha_pago) conFecha += 1;
  }

  return { count: pagos.length, solicitado, pagado, conFecha };
}

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

  const label = (
    estatusPayload ||
    estadoSolicitud ||
    computed ||
    ""
  ).toString();

  return {
    label,
    estatusPayload,
    estadoSolicitud,
    filtroPago,
    ...stats,
  };
}

function getTipoPago(raw: any): string {
  const forma_pag = raw?.solicitud_proveedor?.forma_pago_solicitada;
  switch (forma_pag) {
    case "card":
      return "TARJETA";
    case "link":
      return "LINK_PAGO";
    case "transfer":
      return "TRANSFERENCIA";
    default:
      return String(forma_pag ?? "").toUpperCase();
  }
}

type TipoReservaInferida = "PREPAGO" | "CREDITO" | "";

function inferTipoReserva(raw: any): TipoReservaInferida {
  const isCredito = !!raw?.is_credito;
  return isCredito ? "CREDITO" : "PREPAGO";
}

function extractFacturasYPagosFromPFP(raw: any) {
  const v = raw?.pagos_facturas_proveedores_json;

  let arr: any[] = [];
  if (Array.isArray(v)) arr = v;
  else if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      arr = [];
    }
  }

  const id_facturas = Array.from(
    new Set(arr.map((x) => String(x?.id_factura ?? "").trim()).filter(Boolean)),
  );

  const id_pagos = Array.from(
    new Set(
      arr
        .map((x) => String(x?.id_pago_proveedor ?? x?.id_pago ?? "").trim())
        .filter(Boolean),
    ),
  );

  return { id_facturas, id_pagos };
}

type EstatusFacturaInferido = "FACTURADO" | "PARCIAL" | "PENDIENTE" | "";

function getEstatusFacturas(
  diferencia: any,
  costo_proveedor: any,
): EstatusFacturaInferido {
  const diff = Number(diferencia ?? 0) || 0;
  const costo = Number(costo_proveedor ?? 0) || 0;
  const EPS = 0.01;

  if (costo < EPS) return "";
  if (Math.abs(diff) < EPS) return "FACTURADO";
  if (Math.abs(diff - costo) < EPS) return "PENDIENTE";
  return "PARCIAL";
}

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
  const viajero = (
    raw?.nombre_viajero_completo ??
    raw?.nombre_viajero ??
    ""
  ).toString();

  const costo_proveedor =
    Number(raw?.solicitud_proveedor?.monto_solicitado ?? 0) || 0;
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

  const total_aplicable =
    raw?.facturas_proveedor?.facturas[0]?.monto_facturado ?? "";
  const impuestos = raw?.facturas_proveedor?.facturas[0]?.impuestos ?? "";
  const subtotal = raw?.facturas_proveedor?.facturas[0]?.subtotal ?? "";

  const baseFactura = total_facturado || 0;
  const diferencia = roundCents(
    roundCents(costo_proveedor) - roundCents(baseFactura),
  );

  const estatusFacturas =
    raw?.solicitud_proveedor?.estado_facturacion ??
    raw?.estado_facturacion ??
    getEstatusFacturas(diferencia, costo_proveedor);

  const tarjeta = raw?.tarjeta?.ultimos_4 ?? raw?.ultimos_4 ?? "";

  const razon_social = raw?.proveedor?.razon_social ?? "";
  const rfc = raw?.rfc_proveedor ?? raw?.proveedor?.rfc ?? raw?.rfc ?? "";
  const id_servicio = raw?.id_servicio ?? null;

  const asociaciones = extractFacturasYPagosFromPFP(raw);

  const consolidado =
    Number(
      raw?.consolidado ?? raw?.estatus_conciliado ?? raw?.conciliado ?? 0,
    ) || 0;

  const idIntermediario =
    raw?.id_inermediario ??
    raw?.id_intermediario ??
    raw?.informacion_completa?.id_intermediario ??
    null;

  const nombreIntermediario =
    raw?.intermediario ??
    raw?.nombre_intermediario ??
    raw?.informacion_completa?.intermediario ??
    "";

  const canalDeReservacion = idIntermediario
    ? "INTERMEDIARIO"
    : (raw?.canal_de_reservacion ?? "DIRECTO");

  return {
    seleccionar_reserva: "",
    row_id,
    id_solicitud_proveedor,
    id_proveedor,
    id_servicio,

    creado: raw?.created_at ?? null,
    hotel: hotel ? hotel.toUpperCase() : "",
    codigo_hotel: raw?.codigo_confirmacion ?? "",
    id_booking: raw?.id_booking ?? null,
    tipo_reserva_booking: raw?.tipo_reserva ?? "",
    id_confirmacion: raw?.id_confirmacion ?? "",
    viajero: viajero ? viajero.toUpperCase() : "",
    check_in: raw?.check_in ?? null,
    check_out: raw?.check_out ?? null,

    noches: nochesCalc,
    tipo_cuarto: raw?.room ?? "",

    costo_proveedor,
    markup,
    precio_de_venta,

    canal_de_reservacion: canalDeReservacion,
    nombre_intermediario: idIntermediario
      ? nombreIntermediario
      : (raw?.nombre_intermediario ?? ""),

    // tipo_de_reserva: tipoReserva,

    tarjeta,
    fecha_solicitud: raw?.fecha_solicitud,
    id_enviado: raw?.id_enviado ?? "",

    comentarios_ops: comentariosOps,
    comentarios_cxp: raw?.comentario_CXP ?? raw?.comentarios_cxp ?? "",
    comentario_ap:
      raw?.comentario_AP ?? raw?.solicitud_proveedor?.comentarios_Ap ?? "",
    usuario_creador: raw?.id_creador,
    detalles: raw,
    estado_solicitud: raw?.solicitud_proveedor?.estado_solicitud ?? "",
    estatus_facturas: estatusFacturas,
    estatus_pago: estatusPagoObj.label
      ? estatusPagoObj.label.toUpperCase()
      : "",
    __estatus_pago: estatusPagoObj,

    total_facturado,
    diferencia_costo_proveedor_vs_factura: diferencia,

    uuid_factura: raw?.uuid_factura ?? null,

    subir_factura: raw,
    acciones: "",

    total_aplicable,
    impuestos,
    subtotal,

    razon_social,
    rfc,
    consolidado,

    item: {
      id_solicitud_proveedor,
      diferencia_costo_proveedor_vs_factura: diferencia,
      asociaciones,
      informacion_completa: raw,
      id_proveedor,
    },

    informacion_completa: raw,
    __raw: raw,
  };
}

type EditableField =
  | "comentarios_ops"
  | "comentarios_cxp"
  | "total_aplicable"
  | "impuestos"
  | "subtotal"
  | "costo_proveedor"
  | "codigo_confirmacion";

const MONEY_FIELDS: EditableField[] = [
  "total_aplicable",
  "impuestos",
  "subtotal",
  "costo_proveedor",
];

const TEXT_FIELDS: EditableField[] = ["codigo_confirmacion"];

const FIELD_TO_API: Record<string, string> = {
  comentarios_ops: "comentarios_ops",
  comentarios_cxp: "comentarios_cxp",
  total_aplicable: "total_aplicable",
  impuestos: "impuestos",
  subtotal: "subtotal",
  costo_proveedor: "monto_solicitado",
  codigo_confirmacion: "codigo_confirmacion",
};

type EditModalState = {
  open: boolean;
  rowId: string;
  idServicio: string | number | null;
  field: EditableField;
  value: string;
};

type ProveedorSeleccionado = {
  row_id: string;
  id_solicitud: string;
  id_proveedor: string;
  codigo_hotel?: string;
  razon_social?: string;
  viajero: string;
  hotel?:string;
};
function getStartOfMonthLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function getTodayLocalDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ConciliacionPage() {

  const router = useRouter(); // hace cambios en la url
  const pathName = usePathname(); // Lee la ruta
  const searchParams = useSearchParams(); // Lee parametros

  const EPS = 0.01;
  const isZero = (n: any) => Math.abs(Number(n) || 0) < EPS;

  const normUpper = (v: any) =>
    String(v ?? "")
      .trim()
      .toUpperCase();
  const normRfc = (v: any) =>
    String(v ?? "")
      .trim()
      .toUpperCase();

  const [isLoading, setIsLoading] = useState(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const [showSubirFactura, setShowSubirFactura] = useState(false);
  const [selectedForFactura, setSelectedForFactura] = useState<
    ProveedorSeleccionado[]
  >([]);
  const [facturaSelection, setFacturaSelection] = useState<
    Record<string, ProveedorSeleccionado>
  >({});

  const [todos, setTodos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const LIMIT = 100;
  const [hasMore, setHasMore] = useState(false);
  const [totalFiltrado, setTotalFiltrado] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const [draftEdits, setDraftEdits] = useState<Record<string, Partial<AnyRow>>>(
    {},
  );

  const endpoint = `${URL}/mia/pago_proveedor/solicitud_conciliacion`;
  const editEndpoint = `${URL}/mia/pago_proveedor/edit`;

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
    setFacturaSelection({});
  }, []);

  const EMPTY_FILTERS: ConciliacionFilters = {
    folio: "",
    cliente: "",
    viajero: "",
    hotel: "",
    estado_solicitud: "",
    estatus_pagos: "",
    estado_facturacion: "",
    created_start: "",
    created_end: "",
    check_in_start: "",
    check_in_end: "",
    check_out_start: "",
    check_out_end: "",
    canal_de_reservacion: "",
    nombre_intermediario: "",
    forma_pago_solicitada: "",
    reservante: "",
    comentario_AP: "",
    reserva_diferencia: "",
    id_cliente: "",
    etapa_reservacion: "",
    fecha_reserva_start: "",
    fecha_reserva_end: "",
    filtrar_fecha_por_reserva: "",

    comentarios: "",
    comentario_CXP: "",

    tipo_reserva_pago: "",
    pagos_parciales: "",
    metodo_pago_reserva: "",
  };

  type BuscarUuidMatchRow = {
    codigo_confirmacion: string;
    uuid_factura: string;
    id_solicitud: string | number;
    monto: number;
  };

  const [buscarUuidModal, setBuscarUuidModal] = useState<{
    open: boolean;
    loading: boolean;
    uuid_factura: string;
    rows: BuscarUuidMatchRow[];
  }>({
    open: false,
    loading: false,
    uuid_factura: "",
    rows: [],
  });

  const buscarUuidEndpoint = `${URL}/mia/pago_proveedor/buscaruuid`;

  const buscarUuid = useCallback(
    async (uuidParam?: string) => {
      const uuid = String(
        uuidParam ?? buscarUuidModal.uuid_factura ?? "",
      ).trim();

      if (!uuid) {
        alert("Escribe un UUID");
        return;
      }

      setBuscarUuidModal((prev) => ({
        ...prev,
        open: true,
        loading: true,
        uuid_factura: uuid,
        rows: [],
      }));

      try {
        const resp = await fetch(buscarUuidEndpoint, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify({ uuid_factura: uuid }),
        });

        const json = await resp.json().catch(() => null);

        if (!resp.ok) {
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);
        }

        const list = Array.isArray(json?.data) ? json.data : [];

        const rows: BuscarUuidMatchRow[] = list.map((r: any) => ({
          codigo_confirmacion: r?.codigo_confirmacion ?? "",
          uuid_factura: r?.uuid_factura ?? "",
          id_solicitud: r?.id_solicitud ?? "",
          monto: Number(r?.monto_facturado ?? r?.monto_solicitado ?? 0) || 0,
          estado: r.estado,
        }));

        setBuscarUuidModal({
          open: true,
          loading: false,
          uuid_factura: uuid,
          rows,
        });
      } catch (err: any) {
        console.error("❌ buscaruuid fail", err);

        setBuscarUuidModal((prev) => ({
          ...prev,
          open: true,
          loading: false,
          rows: [],
        }));

        alert(err?.message || "Error al buscar coincidencias por uuid");
      }
    },
    [buscarUuidEndpoint, buscarUuidModal.uuid_factura],
  );
  const closeBuscarUuidModal = useCallback(() => {
    setBuscarUuidModal({
      open: false,
      loading: false,
      uuid_factura: "",
      rows: [],
    });
  }, []);

  const openBuscarUuidModal = useCallback(() => {
    setBuscarUuidModal({
      open: true,
      loading: false,
      uuid_factura: "",
      rows: [],
    });
  }, []);

  const DEFAULT_OPEN_FILTERS: ConciliacionFilters = {
    ...EMPTY_FILTERS,
    check_out_start: getTodayLocalDate(),
    check_out_end: getTodayLocalDate(),
  };

  const FILTER_LABELS: Record<keyof ConciliacionFilters, string> = {
    folio: "Código de reservación",
    cliente: "Cliente",
    viajero: "Viajero",
    hotel: "Proveedor",
    estado_solicitud: "",
    estatus_pagos: "",
    estado_facturacion: "Estatus facturación",
    created_start: "Creado desde",
    created_end: "Creado hasta",
    check_in_start: "Check-in desde",
    check_in_end: "Check-in hasta",
    check_out_start: "Check-out desde",
    check_out_end: "Check-out hasta",
    id_cliente: "ID cliente",
    etapa_reservacion: "Etapa reservación",
    fecha_reserva_start: "Fecha reserva desde",
    fecha_reserva_end: "Fecha reserva hasta",
    filtrar_fecha_por_reserva: "Filtrar fecha por",
    canal_de_reservacion: "Canal de reservación",
    nombre_intermediario: "Nombre intermediario",
    forma_pago_solicitada: "Estatus de pago",

    reservante: "",
    comentario_AP: "",
    reserva_diferencia: "",

    comentarios: "Comentarios Ops",
    comentario_CXP: "Comentario CXP",

    tipo_reserva_pago: "Tipo reserva pago",
    pagos_parciales: "Pagos parciales",
    metodo_pago_reserva: "Método pago reserva",
  };

  function normalizeFiltersForRequest(
    incoming: ConciliacionFilters,
  ): ConciliacionFilters {
    return { ...incoming };
  }

  const getInitialFilters = (): ConciliacionFilters => {
    // Creamos un objeto con todos los filtros por defecto
    const next = { ...DEFAULT_OPEN_FILTERS };

    // Recorremos cada propiedad (key) del objeto
    (Object.keys(next) as (keyof ConciliacionFilters)[]).forEach((key) => {

      // Buscamos en la URL si existe un parámetro con ese nombre
      const v = searchParams.get(key);

      // Si existe, reemplazamos el valor por defecto
      if (v != null) next[key] = v;
    });

    // Regresamos el objeto final con los filtros
    return next;
  };

  


  const [filters, setFilters] =
    useState<ConciliacionFilters>(getInitialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ConciliacionFilters>(getInitialFilters);

  // const DATE_FILTER_KEYS: (keyof ConciliacionFilters)[] = [
  //   "created_start",
  //   "created_end",
  //   "check_in_start",
  //   "check_in_end",
  //   "check_out_start",
  //   "check_out_end",
  //   "fecha_reserva_start",
  //   "fecha_reserva_end",
  //   "filtrar_fecha_por_reserva",
  // ];

  const load = useCallback(
    async (overrideFilters: ConciliacionFilters, pageToLoad = 1) => {
      activeControllerRef.current?.abort();
      const controller = new AbortController();
      activeControllerRef.current = controller;

      setIsLoading(true);

      try {
        const params = new URLSearchParams();

        Object.entries(overrideFilters).forEach(([key, value]) => {
          const v = String(value ?? "").trim();
          if (!v) return;
          params.append(key, v);
          if (key === "estado_facturacion")
            params.append("estatus_facturacion", v);
        });

        params.set("page", String(pageToLoad));
        params.set("limit", String(LIMIT));

        const url = `${endpoint}?${params.toString()}`;

        const response = await fetch(url, {
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
        const list = Array.isArray(json?.data) ? json.data : [];

        setTodos(list);
        setPage(pageToLoad);
        setHasMore(json?.pagination?.has_more ?? list.length === LIMIT);
        if (json?.pagination?.total_filtrado != null) {
          setTotalFiltrado(Number(json.pagination.total_filtrado));
        }
        if (json?.pagination?.total_pages != null) {
          setTotalPages(Number(json.pagination.total_pages));
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Error cargando conciliación:", err);
        setTodos([]);
        setHasMore(false);
      } finally {
        if (activeControllerRef.current === controller) {
          setIsLoading(false);
          activeControllerRef.current = null;
        }
      }
    },
    [endpoint, LIMIT],
  );

  const refreshData = useCallback(() => {
    void load(appliedFilters, page);
  }, [load, appliedFilters, page]);

  // useEffect(() => {
  //   setAppliedFilters(DEFAULT_OPEN_FILTERS);
  //   void load(DEFAULT_OPEN_FILTERS);
  // }, [load]);

  const getSelectionKey = (rowOrValue: any, index?: number) => {
    if (typeof rowOrValue === "string" || typeof rowOrValue === "number") {
      const s = String(rowOrValue).trim();
      if (s !== "" && s !== "undefined" && s !== "null") return s;
    }

    const row =
      rowOrValue && typeof rowOrValue === "object" ? rowOrValue : null;

    const id =
      row?.id_solicitud_proveedor ??
      row?.row_id ??
      row?.__raw?.solicitud_proveedor?.id_solicitud_proveedor ??
      null;

    const clean = id != null ? String(id).trim() : "";
    if (clean !== "" && clean !== "undefined" && clean !== "null") return clean;

    return String(index ?? "");
  };

  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    rowId: "",
    idServicio: null,
    field: "comentarios_ops",
    value: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);




  const applyFilters = useCallback(() => {
    const next = { ...filters };
    setFilters(next)
    setAppliedFilters(next); // // Guarda oficialmente los filtros que se usarán para buscar
    setShowFiltersModal(false); // Cierra el modal

    const params = new URLSearchParams() // Crea un contenedor vacío para parámetros.
    Object.entries(next).forEach(([key, value]) => { // Recorre cada propiedad y su valor
      const v = String(value ?? "").trim(); // Convierte el valor a texto y elimina espacios al inicio y final
      if (v) params.set(key, v); // Le asigna el valor de v a la key  si v tiene contenido
    });
    router.replace(`${pathName}?${params.toString()}`); // // Actualiza la URL con los filtros sin recargar la página

    void load(next, 1) // Consulta los datos usando los filtros y la página 1

  }, [filters, load, pathName, router]); // Por que se agrega pathName y router?






  const clearAllFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSearchInput("");
    setShowFiltersModal(false);
    router.replace(pathName);
  }, [pathName, router]);

  const openEditModal = useCallback(
    (
      rowIdSolicitudProveedor: string,
      idServicio: any,
      field: EditableField,
      currentValue: any,
    ) => {
      setEditModal({
        open: true,
        rowId: String(rowIdSolicitudProveedor),
        idServicio: idServicio ?? null,
        field,
        value: currentValue == null ? "" : String(currentValue),
      });
    },
    [],
  );

  const closeEditModal = useCallback(() => {
    setEditModal((s) => ({ ...s, open: false }));
  }, []);

  const handleEdit = useCallback(
    async (
      rowIdSolicitudProveedor: string,
      field: EditableField | "consolidado",
      value: any,
    ) => {
      setDraftEdits((prev) => ({
        ...prev,
        [rowIdSolicitudProveedor]: {
          ...(prev[rowIdSolicitudProveedor] || {}),
          [field]: value,
        },
      }));

      const normalizedValue = MONEY_FIELDS.includes(field as EditableField)
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
        if (!resp.ok)
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);

        return true;
      } catch (err) {
        console.error("❌ edit fail", err);
        return false;
      }
    },
    [editEndpoint],
  );

  const saveEditModal = useCallback(async () => {
    const { rowId, field, value } = editModal;
    if (!rowId) return;

    setIsSavingEdit(true);
    const ok = await handleEdit(rowId, field, value);
    setIsSavingEdit(false);

    closeEditModal();

    if (ok && field === "costo_proveedor") {
      // El backend puede tardar en recalcular diferencia/estatus_facturas, lo
      // que puede sacar momentáneamente la fila de los filtros aplicados.
      // Actualizamos localmente para que la fila no desaparezca.
      const normalized = String(value).trim() === "" ? 0 : Number(value) || 0;

      setTodos((prev) =>
        prev.map((raw) => {
          const id =
            raw?.solicitud_proveedor?.id_solicitud_proveedor ??
            raw?.id_solicitud_proveedor ??
            null;
          if (String(id) !== String(rowId)) return raw;

          return {
            ...raw,
            solicitud_proveedor: {
              ...(raw?.solicitud_proveedor ?? {}),
              monto_solicitado: normalized,
            },
          };
        }),
      );
      return;
    }

    void load(appliedFilters);
  }, [editModal, handleEdit, closeEditModal, load, appliedFilters]);

  const filteredData = useMemo(() => {
    const q = (searchInput || "").toUpperCase().trim();

    const filteredItems = todos.filter((raw) => {
      if (!q) return true;

      const hotel = String(raw?.hotel ?? "").toUpperCase();
      const codigo = String(raw?.codigo_confirmacion ?? "").toUpperCase();
      const viajero = String(
        raw?.nombre_viajero_completo ?? raw?.nombre_viajero ?? "",
      ).toUpperCase();
      const proveedor = String(
        raw?.proveedor?.razon_social ?? raw?.razon_social ?? "",
      ).toUpperCase();
      const idServicio = String(raw?.id_servicio ?? "").toUpperCase();

      return (
        hotel.includes(q) ||
        codigo.includes(q) ||
        viajero.includes(q) ||
        proveedor.includes(q) ||
        idServicio.includes(q)
      );
    });

    return filteredItems.map((raw, i) => toConciliacionRow(raw, i));
  }, [todos, searchInput]);

  // Si la búsqueda local no encuentra resultados, llama la API con folio=searchInput
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastApiSearchRef = useRef<string>("");

  useEffect(() => {
    const q = searchInput.trim();

    if (!q) {
      lastApiSearchRef.current = "";
      return;
    }

    // Ya hay resultados locales o ya se buscó este término en la API → no hacer nada
    if (filteredData.length > 0) return;
    if (lastApiSearchRef.current === q) return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      lastApiSearchRef.current = q;
      void load({ ...appliedFilters, folio: q }, 1);
    }, 600);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput, filteredData.length, appliedFilters, load]);

  const cancelSolicitud = useCallback(
    async (id_solicitud_proveedor: string) => {
      const id = String(id_solicitud_proveedor ?? "").trim();
      if (!id) return false;

      const payload = {
        id_solicitud_proveedor: id,
        estado_solicitud: "CANCELADA",
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
        if (!resp.ok)
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);

        return true;
      } catch (err) {
        console.error("❌ cancelar solicitud fail", err);
        alert((err as any)?.message || "Error al cancelar la solicitud");
        return false;
      }
    },
    [editEndpoint],
  );

  const toggleFacturaSelection = useCallback((row: AnyRow) => {
    const rowId = String(getSelectionKey(row)).trim();
    const idSolicitud = String(row?.id_solicitud_proveedor ?? "").trim();
    const idProveedor = String(row?.id_proveedor ?? "").trim();

    if (!rowId || !idSolicitud || !idProveedor) {
      alert("Faltan datos para seleccionar la solicitud");
      return;
    }

    setFacturaSelection((prev) => {
      const exists = !!prev[rowId];

      if (exists) {
        const next = { ...prev };
        delete next[rowId];
        return next;
      }

      const current = Object.values(prev);
      if (current.length > 0) {
        const first = current[0];
        const sameProveedor =
          String(first.id_proveedor).trim() === String(idProveedor).trim();

        if (!sameProveedor) {
          alert("Solo puedes seleccionar solicitudes del mismo proveedor");
          return prev;
        }
      }

 

      return {
        ...prev,
        [rowId]: {
          row_id: rowId,
          id_solicitud: idSolicitud,
          id_proveedor: idProveedor,
          hotel: String(row?.informacion_completa.hotel ?? ""),
          codigo_hotel: String(row?.informacion_completa.codigo_confirmacion ?? ""),
          razon_social: String(row?.informacion_completa.razon_social ?? ""),
          viajero: String(row?.informacion_completa.viajero ?? ""),
        },
      };
    });
  }, []);

  const openSubirFacturaSingle = useCallback((item: AnyRow) => {
    const idSolicitud = String(item?.id_solicitud_proveedor ?? "").trim();
    const idProveedor = String(item?.id_proveedor ?? "").trim();

    if (!idSolicitud || !idProveedor) {
      alert("Falta id_solicitud o id_proveedor para subir factura");
      return;
    }
console.log("este es el item", item)
    setSelectedForFactura([
      {
        row_id: String(getSelectionKey(item)).trim(),
        id_solicitud: idSolicitud,
        id_proveedor: idProveedor,
        codigo_hotel: String(item?.informacion_completa.codigo_confirmacion ?? ""),
        razon_social: String(item?.informacion_completa.razon_social ?? ""),
        hotel: String(item?.informacion_completa.hotel ?? ""),
        viajero: String(item?.informacion_completa.viajero ?? ""),
      },
    ]);

    setShowSubirFactura(true);
  }, []);

  const openSubirFacturaSelected = useCallback(() => {
    const selected = Object.values(facturaSelection);

    if (selected.length === 0) {
      alert("No has seleccionado solicitudes");
      return;
    }

    const first = selected[0];
    const sameProvider = selected.every(
      (x) =>
        String(x.id_proveedor).trim() === String(first.id_proveedor).trim(),
    );

    if (!sameProvider) {
      alert(
        "Las solicitudes seleccionadas deben pertenecer al mismo proveedor",
      );
      return;
    }

    setSelectedForFactura(selected);
    setShowSubirFactura(true);
  }, [facturaSelection]);

  const solicitarPagoCredito = useCallback(
    async (row: AnyRow) => {
      const id = String(row?.id_solicitud_proveedor ?? "").trim();
      if (!id) return false;

      const ok = confirm(`¿Solicitar pago para la solicitud ${id}?`);
      if (!ok) return false;

      const payload = {
        id_solicitud_proveedor: id,
        estado_solicitud: "SOLICITADA",
        is_ajuste: 1,
        comentario_ajuste: "pago solicitado",
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
        if (!resp.ok)
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);

        await load(appliedFilters);
        return true;
      } catch (err: any) {
        console.error("❌ solicitar pago fail", err);
        alert(err?.message || "Error al solicitar el pago");
        return false;
      }
    },
    [editEndpoint, load, appliedFilters],
  );

  const activeAppliedFilters = useMemo(() => {
    return (
      Object.entries(appliedFilters) as [keyof ConciliacionFilters, string][]
    )
      .map(([key, value]) => ({
        key,
        label: FILTER_LABELS[key],
        value: String(value ?? "").trim(),
      }))
      .filter((item) => item.value !== "");
  }, [appliedFilters]);

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
      "estado_solicitud",
      "costo_proveedor",
      "markup",
      "seleccionar_reserva",
      "precio_de_venta",
      "canal_de_reservacion",
      "nombre_intermediario",
      "tipo_de_reserva",
      "tarjeta",
      "id_enviado",
      "comentarios_ops",
      "comentarios_cxp",
      "comentario_ap",
      "detalles",
      "estatus_facturas",
      "total_facturado",
      "diferencia_costo_proveedor_vs_factura",
      "subir_factura",
      "acciones",
      "usuario_creador",
      "fecha_solicitud",
    ],
    [],
  );

  const isPagadoRow = useCallback(
    (row: AnyRow) => {
      const label = normUpper(row?.estatus_pago);
      if (label === "PAGADO") return true;

      const stats = row?.__estatus_pago;
      const solicitado = Number(stats?.solicitado ?? 0) || 0;
      const pagado = Number(stats?.pagado ?? 0) || 0;
      if (solicitado > 0 && pagado >= solicitado - EPS) return true;

      return false;
    },
    [EPS],
  );

  const isConsolidadoRow = (row: AnyRow) => Number(row?.consolidado ?? 0) === 1;

  const handleConciliar = useCallback(
    async (row: AnyRow) => {
      const id = String(row?.id_solicitud_proveedor ?? "").trim();
      if (!id) return;

      const ok = confirm(`¿Conciliar (consolidado=1) la solicitud ${id}?`);
      if (!ok) return;

      const done = await handleEdit(id, "consolidado", 1);
      if (done) await load(appliedFilters);
    },
    [handleEdit, load],
  );

  const handleConciliarFacturacion = useCallback(
    async (row: AnyRow) => {
      const id = String(row?.id_solicitud_proveedor ?? "").trim();
      if (!id) return;

      const ok = confirm(
        `¿Marcar la solicitud ${id} como FACTURADO?\n\nLa diferencia entre pagado y facturado es menor a $5.`,
      );
      if (!ok) return;

      try {
        const resp = await fetch(editEndpoint, {
          method: "PATCH",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          body: JSON.stringify({
            id_solicitud_proveedor: id,
            estado_facturacion: "FACTURADO",
          }),
        });

        const json = await resp.json().catch(() => null);
        if (!resp.ok)
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);

        await load(appliedFilters, page);
      } catch (err: any) {
        console.error("❌ conciliar facturación fail", err);
        alert(err?.message || "Error al actualizar el estado de facturación");
      }
    },
    [editEndpoint, load, appliedFilters, page],
  );

  const getRowClassName = useCallback((row: AnyRow) => {
    const consolidado =
      Number(
        (row as any)?.consolidado ?? (row as any)?.__raw?.consolidado ?? 0,
      ) || 0;
    return consolidado === 1 ? "bg-blue-50" : "";
  }, []);

  const TOLERANCIA_FACTURA_PAGO = 20;

  const getFacturaPagoDiffInfo = useCallback((row: AnyRow) => {
    const pagado = Number(row?.__estatus_pago?.pagado ?? 0) || 0;

    const factura =
      (String(row?.total_aplicable ?? "").trim() !== ""
        ? Number(row?.total_aplicable)
        : 0) ||
      Number(row?.total_facturado ?? 0) ||
      0;

    const diff = roundCents(roundCents(factura) - roundCents(pagado));
    const ok = Math.abs(diff) <= TOLERANCIA_FACTURA_PAGO;

    return { factura, pagado, diff, ok };
  }, []);

  const getFacturaInfo = useCallback((row: AnyRow) => {
    const facturaPrincipal =
      row?.informacion_completa?.facturas_proveedor?.facturas?.[0] ?? null;

    const uuidFactura = String(
      facturaPrincipal?.uuid_factura ??
        row?.informacion_completa?.facturas_proveedor?.uuid_factura_principal ??
        row?.uuid_factura ??
        "",
    ).trim();

    const idFactura = String(
      facturaPrincipal?.id_factura ??
        row?.informacion_completa?.facturas_proveedor?.facturas?.[0]
          ?.id_factura ??
        "",
    ).trim();

    const montoFacturadoRaw = facturaPrincipal?.monto_facturado;

    const montoFacturadoNum = Number(montoFacturadoRaw);

    // ✅ cuenta como factura si hay uuid o id_factura
    const hasFactura = uuidFactura !== "" || idFactura !== "";

    // ✅ cuenta como "sí tiene monto" solo si es numérico y > 0
    const hasMontoFacturado =
      montoFacturadoRaw !== undefined &&
      montoFacturadoRaw !== null &&
      String(montoFacturadoRaw).trim() !== "" &&
      String(montoFacturadoRaw).trim().toLowerCase() !== "null" &&
      Number.isFinite(montoFacturadoNum) &&
      montoFacturadoNum > 0;

    return {
      hasFactura,
      hasMontoFacturado,
      uuidFactura,
      idFactura,
      montoFacturadoRaw,
      montoFacturadoNum,
    };
  }, []);

  const tableRenderers = useMemo<
    Record<string, React.FC<{ value: any; item: any; index: number }>>
  >(
    () => ({
      creado: ({ value }) => <span title={value}>{formatDate(value)}</span>,
      check_in: ({ value }) => <span title={value}>{formatDate(value)}</span>,
      check_out: ({ value }) => <span title={value}>{formatDate(value)}</span>,
      fecha_solicitud: ({ value }) => (
        <span title={value}>{formatDate(value)}</span>
      ),

      codigo_hotel: ({ value, item }) => {
        const rowId = getSelectionKey(item);
        const v = draftEdits[rowId]?.codigo_confirmacion ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold" title={String(v)}>
              {v ? String(v).toUpperCase() : ""}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              onClick={() =>
                openEditModal(
                  rowId,
                  item?.id_servicio,
                  "codigo_confirmacion",
                  v,
                )
              }
              title="Editar código de confirmación"
            >
              …
            </Button>
          </div>
        );
      },

      costo_proveedor: ({ value, item }) => {
        const rowId = getSelectionKey(item);
        const v = draftEdits[rowId]?.costo_proveedor ?? value ?? "";

        return (
          <div className="flex items-center gap-2">
            <span title={String(v)}>{formatMoney(v)}</span>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 px-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              onClick={() =>
                openEditModal(rowId, item?.id_servicio, "costo_proveedor", v)
              }
            >
              …
            </Button>
          </div>
        );
      },
      precio_de_venta: ({ value }) => (
        <span title={String(value)}>{formatMoney(value)}</span>
      ),

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
              onClick={() =>
                openEditModal(rowId, item?.id_servicio, "comentarios_ops", v)
              }
            >
              …
            </Button>
          </div>
        );
      },

      seleccionar_reserva: ({ item }) => {
        const diff =
          Number(item?.diferencia_costo_proveedor_vs_factura ?? 0) || 0;
        const facturaInfo = getFacturaInfo(item);

        if (facturaInfo.hasFactura && !facturaInfo.hasMontoFacturado) {
          return <span className="text-xs text-gray-300">—</span>;
        }

        // ✅ si la diferencia es 0 o negativa, no mostrar select
        if (diff <= 0) {
          return <span className="text-xs text-gray-300">—</span>;
        }

        const rowId = String(getSelectionKey(item)).trim();
        const checked = !!facturaSelection[rowId];

        return (
          <div className="flex items-center justify-center">
            <label className="inline-flex items-center justify-center cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600"
                checked={checked}
                onChange={() => toggleFacturaSelection(item)}
              />
            </label>
          </div>
        );
      },

      comentario_ap: ({ value }) => {
        const v = String(value ?? "").trim();
        return (
          <span className="text-xs" title={v || undefined}>
            {truncateText(v, 26)}
          </span>
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
              onClick={() =>
                openEditModal(rowId, item?.id_servicio, "comentarios_cxp", v)
              }
            >
              …
            </Button>
          </div>
        );
      },

      detalles: ({ item }) => {
        return (
          <Button
            variant="secondary"
            size="sm"
            className="px-2 py-1 text-xs border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            onClick={() => openDetalle(item)}
          >
            Detalles
          </Button>
        );
      },

      subir_factura: ({ item }) => {
        const diff =
          Number(item?.diferencia_costo_proveedor_vs_factura ?? 0) || 0;

        const facturaInfo = getFacturaInfo(item);

        if (isZero(diff))
          return <span className="text-xs text-gray-300">—</span>;

        return (
          <Button
            variant="secondary"
            size="sm"
            className="px-2 py-1 text-xs border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            onClick={() => openSubirFacturaSingle(item)}
          >
            Subir
          </Button>
        );
      },

      acciones: ({ item }) => {
        const row = item as AnyRow;

        const pagado = isPagadoRow(row);
        const consolidado = isConsolidadoRow(row);

        const { ok: okFacturaPago, diff } = getFacturaPagoDiffInfo(row);
        const mostrarConciliar = pagado && okFacturaPago;

        const diffCostoVsFactura = Math.abs(
          Number(
            Number(row?.diferencia_costo_proveedor_vs_factura ?? 0).toFixed(2),
          ),
        );
        const estadoFacturacion = normUpper(
          row?.informacion_completa.solicitud_proveedor?.estado_facturacion ??
            "",
        );
        const mostrarConciliarFacturacion =
          diffCostoVsFactura < 5 &&
          (estadoFacturacion == "parcial" || estadoFacturacion == "PARCIAL");

        const idSolProv = String(row?.id_solicitud_proveedor ?? "").trim();

        const estadoSolicitud = normUpper(
          row?.__raw?.solicitud_proveedor?.estado_solicitud ??
            row?.__raw?.estado_solicitud ??
            "",
        );

        const yaCancelada =
          estadoSolicitud === "CANCELADA" || estadoSolicitud.includes("CANCEL");

        const disableCancelar = yaCancelada || pagado;

        const formaPago = String(
          row?.informacion_completa?.solicitud_proveedor
            ?.forma_pago_solicitada ??
            row?.__raw?.forma_pago_solicitada ??
            "",
        ).toLowerCase();

        const esCredito = formaPago === "credit";

        const yaSolicitoPago =
          Number(
            row?.informacion_completa?.solicitud_proveedor?.is_ajuste ??
              row?.__raw?.is_ajuste ??
              0,
          ) === 1;

        const facturado =
          Number(row?.informacion_completa?.total_facturado_en_pfp) > 0;
        const disableSolicitarPago = yaSolicitoPago || !facturado;

        return (
          <div className="flex flex-wrap items-center gap-2">
            {mostrarConciliarFacturacion && (
              <Button
                variant="secondary"
                size="sm"
                className="px-2 py-1 text-xs border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                onClick={() => void handleConciliarFacturacion(row)}
                title={`Diferencia costo vs factura: $${diffCostoVsFactura.toFixed(2)} — marcar como FACTURADO`}
              >
                <span className="inline-flex items-center gap-1">
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden xl:inline">Conciliar</span>
                </span>
              </Button>
            )}

            {mostrarConciliar && (
              <Button
                variant="secondary"
                size="sm"
                className={[
                  "px-2 py-1 text-xs border",
                  consolidado
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
                ].join(" ")}
                disabled={consolidado}
                onClick={() => void handleConciliar(row)}
                title={
                  consolidado
                    ? "Ya está conciliado (consolidado=1)"
                    : `Conciliar (dif factura-pago: ${diff})`
                }
              >
                <span className="inline-flex items-center gap-1">
                  <Handshake className="w-4 h-4" />
                  <span className="hidden xl:inline">Conciliar</span>
                </span>
              </Button>
            )}

            {esCredito && (
              <Button
                variant="secondary"
                size="sm"
                className={[
                  "px-2 py-1 text-xs border",
                  disableSolicitarPago
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                ].join(" ")}
                disabled={disableSolicitarPago}
                onClick={() => {
                  if (disableSolicitarPago) return;
                  void solicitarPagoCredito(row);
                }}
                title={
                  yaSolicitoPago
                    ? "Ya fue solicitado (is_ajuste=1)"
                    : "Solicitar pago (is_ajuste=1 / comentario_ajuste='pago solicitado')"
                }
              >
                <span className="inline-flex items-center gap-1">
                  <Send className="w-4 h-4" />
                  <span className="hidden xl:inline">Solicitar pago</span>
                </span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              className={[
                "px-2 py-1 text-xs border",
                disableCancelar
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
              ].join(" ")}
              disabled={disableCancelar}
              onClick={async () => {
                if (disableCancelar) return;

                const ok = confirm(`¿Cancelar la solicitud ${idSolProv}?`);
                if (!ok) return;

                const done = await cancelSolicitud(idSolProv);
                if (done) await load(appliedFilters);
              }}
              title={
                yaCancelada
                  ? "Esta solicitud ya está cancelada"
                  : pagado
                    ? "No se puede cancelar una solicitud pagada"
                    : "Cancelar solicitud (estado_solicitud = CANCELADA)"
              }
            >
              <span className="inline-flex items-center gap-1">
                <X className="w-4 h-4" />
                <span className="hidden xl:inline">Cancelar</span>
              </span>
            </Button>
          </div>
        );
      },

      total_facturado: ({ value }) => (
        <span title={String(value)}>{formatMoney(value)}</span>
      ),

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

      estatus_facturas: ({ value }) => {
        const v = String(value ?? "").toUpperCase();
        const styles: Record<string, string> = {
          FACTURADO: "text-green-700 bg-green-50 border-green-200",
          COMPLETADO: "text-green-700 bg-green-50 border-green-200",
          PARCIAL: "text-amber-700 bg-amber-50 border-amber-200",
          PENDIENTE: "text-red-700 bg-red-50 border-red-200",
        };
        const cls = styles[v] ?? "text-gray-600 bg-gray-50 border-gray-200";
        if (!v) return <span className="text-xs text-gray-300">—</span>;
        return (
          <span
            className={`font-semibold border px-2 py-1 rounded-full text-xs whitespace-nowrap ${cls}`}
          >
            {v}
          </span>
        );
      },

      id_enviado: ({ value }) => {
        const v = String(value ?? "").trim();
        if (!v || v.includes("https://img-proveedores-mia.s3.amazonaws"))
          return <span className="text-xs text-gray-300">—</span>;
        return <span className="text-xs">{v}</span>;
      },

      uuid_factura: ({ value }) => (
        <span className="font-mono text-xs" title={value || ""}>
          {value ? String(value).slice(0, 8) + "…" : "—"}
        </span>
      ),
    }),
    [
      draftEdits,
      openEditModal,
      openDetalle,
      solicitarPagoCredito,
      isPagadoRow,
      handleConciliar,
      cancelSolicitud,
      load,
      getFacturaInfo,

      facturaSelection,
      toggleFacturaSelection,
      openSubirFacturaSingle,
      handleConciliarFacturacion,
    ],
  );

  const defaultSort = useMemo(() => ({ key: "creado", sort: false }), []);

  const selectedFacturaItems = useMemo(
    () => Object.values(facturaSelection),
    [facturaSelection],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Conciliación
        </h1>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por código confirmación, proveedor, viajero..."
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={() => setShowFiltersModal(true)}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>

              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={clearAllFilters}
              >
                <X className="w-4 h-4" />
                Limpiar
              </Button>

              <Button
                variant="secondary"
                size="md"
                className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
                onClick={applyFilters}
              >
                <Search className="w-4 h-4" />
                Aplicar filtros
              </Button>
              <Button
                variant="secondary"
                size="md"
                className={[
                  "border text-gray-800",
                  selectedFacturaItems.length === 0
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800",
                ].join(" ")}
                onClick={openSubirFacturaSelected}
                disabled={selectedFacturaItems.length === 0}
              >
                <span className="inline-flex items-center gap-2">
                  <span>Facturar seleccionadas</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-white/80 border border-current">
                    {selectedFacturaItems.length}
                  </span>
                </span>
              </Button>
            </div>
          </div>

          <FiltrosConciliacionModal
            open={showFiltersModal}
            filters={filters}
            onChange={(field, value) =>
              setFilters((prev) => ({
                ...prev,
                [field]: value,
              }))
            }
            onApply={applyFilters}
            onClear={clearAllFilters}
            onClose={() => setShowFiltersModal(false)}
          />
          {(searchInput.trim() || activeAppliedFilters.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchInput.trim() !== "" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-sky-200 bg-sky-50 text-sky-700">
                  <span className="font-semibold">Búsqueda:</span>
                  <span>{searchInput.trim()}</span>
                </span>
              )}

              {activeAppliedFilters.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-gray-200 bg-gray-50 text-gray-700"
                >
                  <span className="font-semibold">{item.label}:</span>
                  <span>{item.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
          <Table5<any>
            registros={filteredData as any}
            renderers={tableRenderers}
            defaultSort={defaultSort as any}
            leyenda={`Mostrando ${filteredData.length} registros`}
            customColumns={customColumns}
            fillHeight
            maxHeight="calc(100vh - 220px)"
            getRowClassName={getRowClassName as any}
            headerRenderers={{
              estado_solicitud: () => <span>ESTATUS PAGO</span>,
              hotel: () => <span>PROVEEDOR</span>,
            }}
          >
            <Button
              variant="secondary"
              size="md"
              className="border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800"
              onClick={openBuscarUuidModal}
            >
              <Search className="w-4 h-4" />
              Buscar UUID
            </Button>

            {/* Total solicitudes filtradas */}
            {totalFiltrado != null && (
              <span className="text-xs text-gray-500 px-2 border border-gray-200 rounded-md bg-gray-50 h-8 flex items-center whitespace-nowrap">
                Total:{" "}
                <span className="font-semibold text-gray-700 ml-1">
                  {totalFiltrado.toLocaleString("es-MX")}
                </span>
                {totalPages != null && totalPages > 1 && (
                  <span className="ml-1 text-gray-400">
                    ({totalPages} págs.)
                  </span>
                )}
              </span>
            )}

            {/* Paginación */}
            <div className="flex items-center gap-1 ml-2">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => void load(appliedFilters, page - 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2 min-w-[60px] text-center">
                Pág. {page}
              </span>
              <button
                disabled={!hasMore || isLoading}
                onClick={() => void load(appliedFilters, page + 1)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </Table5>
        </div>

        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 z-0"
              onClick={closeEditModal}
            />

            <div
              className="relative z-10 w-[min(720px,92vw)] bg-white rounded-xl shadow-lg border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Editar campo
                  </p>
                  <p className="text-xs text-gray-500">
                    id_solicitud_proveedor: {editModal.rowId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Campo: {editModal.field}
                  </p>
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
                {editModal.field === "comentarios_ops" ||
                editModal.field === "comentarios_cxp" ? (
                  <textarea
                    className="w-full min-h-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) =>
                      setEditModal((s) => ({ ...s, value: e.target.value }))
                    }
                    placeholder="Escribe el texto completo..."
                  />
                ) : TEXT_FIELDS.includes(editModal.field) ? (
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) =>
                      setEditModal((s) => ({ ...s, value: e.target.value }))
                    }
                    placeholder="Código de confirmación"
                  />
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    value={editModal.value}
                    onChange={(e) =>
                      setEditModal((s) => ({ ...s, value: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                )}

                {isSavingEdit ? (
                  <div className="mt-3 flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        )}

        {showSubirFactura && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800"></h2>
                <button
                  onClick={closeSubirFactura}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <SubirFactura
                  proveedoresData={selectedForFactura}
                  id_proveedor={
                    selectedForFactura.length === 1
                      ? selectedForFactura[0]?.id_proveedor
                      : undefined
                  }
                  autoOpen={true}
                  onSuccess={() => {
                    closeSubirFactura();
                    void load(appliedFilters, page);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {detalleOpen && (
          <ModalDetalle
            solicitud={detalleSolicitud}
            onClose={closeDetalle}
            onSuccess={() => void load(appliedFilters, page)}
          />
        )}
        <BuscarUuidFacturaModal
          open={buscarUuidModal.open}
          loading={buscarUuidModal.loading}
          uuidFactura={buscarUuidModal.uuid_factura}
          rows={buscarUuidModal.rows}
          onClose={closeBuscarUuidModal}
          onUuidChange={(value) =>
            setBuscarUuidModal((prev) => ({
              ...prev,
              uuid_factura: value,
            }))
          }
          onSearch={() => void buscarUuid()}
        />
        {isLoading && (
          <div className="text-sm text-gray-500 px-2">
            Cargando información...
          </div>
        )}
      </div>
    </div>
  );
}
