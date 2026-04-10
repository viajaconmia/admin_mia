"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Filters from "@/components/Filters";
import { VistaCarpeta,CarpetasTabs } from "./Components/CarpetasTabs";
import {
  parseNum,
  norm,
  normUpper,
  EPS,
  isZero, 
  extractPagosAsociados,
  hasPagosAsociados,
  extractFacturas,
} from "@/helpers/cfdiHelpers"; 
import { EditModal, EditableField } from "./Components/EditModal";   
import { createSolicitudesRenderers } from "./Components/renders";
import {
  calcularNoches,
  formatRoom,
} from "@/helpers/utils";
import { Table5 } from "@/components/Table5";
import { TypeFilters, SolicitudProveedor } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { fetchGetSolicitudesProveedores1 } from "@/services/pago_proveedor";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import {OtrosMetodosPagoModal} from "./Components/OtrosMetodosPagoModal";
import {
  DispersionModal,
  SolicitudProveedorRaw,
} from "./Components/dispersion";
import {ComprobanteModal } from "./Components/comprobantes";
import { useAlert } from "@/context/useAlert";
import Button from "@/components/atom/Button";
import {
  Brush,
  File,
  Upload,
} from "lucide-react";
import { URL, API_KEY } from "@/lib/constants/index";
import {
  defaultSort,
  defaultFiltersSolicitudes,
  FIELD_TO_API,
} from "@/constant/solicitudConstants"; 

const tryParseJson = (v: any) => {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return v;
  if (!(s.startsWith("{") || s.startsWith("["))) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
};

const normalizeToArray = (v: any): any[] => {
  const parsed = tryParseJson(v);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
};

const getMontoSolicitado = (raw: any) =>
  parseNum(raw?.solicitud_proveedor?.monto_solicitado ?? raw?.monto_solicitado);

const getSaldo = (raw: any) =>
  parseNum(raw?.solicitud_proveedor?.saldo ?? raw?.saldo);

const getComentarioSistema = (raw: any) =>
  String(
    raw?.comentario_sistema ??
      raw?.solicitud_proveedor?.comentario_sistema ??
      raw?.solicitud_proveedor?.comentario_ajuste ??
      raw?.comentario_ajuste ??
      raw?.solicitud_proveedor?.comentarios ??
      "",
  ).trim();

const getFormaPago = (raw: any) =>
  norm(
    raw?.solicitud_proveedor?.forma_pago_solicitada ??
      raw?.forma_pago_solicitada,
  );

const getIdSolProv = (raw: any, index?: number) =>
  String(
    raw?.solicitud_proveedor?.id_solicitud_proveedor ??
      raw?.id_solicitud_proveedor ??
      index ??
      "",
  ).trim();

const getTotalFacturadoLike = (raw: any) => {
  // 1) si viene ya calculado
  const direct = parseNum(
    (raw as any)?.total_facturado ??
      (raw as any)?.monto_facturado ??
      (raw as any)?.total_facturado_en_pfp,
  );
  if (direct > 0) return direct;

  // 2) si viene como facturas array/json
  const facturas = extractFacturas(raw);
  if (!facturas.length) return 0;

  return facturas.reduce(
    (acc, f) =>
      acc + parseNum(f?.monto_facturado ?? f?.total ?? f?.importe ?? 0),
    0,
  );
};

const isPagado = (raw: any) => {
  const saldo = getSaldo(raw);
  const estatus = norm(raw?.estatus_pagos ?? "");
  if (estatus === "pagado") return true;
  if (isZero(saldo)) return true;

  // fallback: si hay pagos con fecha o monto >= solicitado, lo consideramos pagado
  const montoSolicitado = getMontoSolicitado(raw);
  const pagos = extractPagosAsociados(raw);
  const totalPagado = pagos.reduce(
    (acc, p) => acc + parseNum(p?.monto_pagado ?? 0),
    0,
  );
  if (montoSolicitado > 0 && totalPagado >= montoSolicitado - EPS) return true;

  return false;
};

type SolicitudSeleccionadaComprobante = {
  id_solicitud_proveedor: string;
  monto_solicitado: number;
  monto_pagado: string;
};

// ---------- CATEGORÍAS (carpetas base) ----------
type CategoriaEstatus =
  | "spei"
  | "pago_tdc"
  | "pago_link"
  | "pendiente_credito"
  | "ap_credito"
  | "pagada"
  | "notificados"
  | "canceladas";


type SolicitudesPorFiltro = Record<CategoriaEstatus, SolicitudProveedor[]> & {
  todos: SolicitudProveedor[];
};

// ---------- TIPOS DE ITEM ----------
type ItemSolicitud = SolicitudProveedor & {
  pagos?: any[];
  facturas?: any[];
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

// ---------- UI HELPERS ----------
const Pill = ({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "green" | "yellow" | "red" | "blue";
}) => {
  const tones: Record<string, string> = {
    gray: "bg-gray-50 text-gray-700 border-gray-200 shadow-sm",
    green: "bg-green-50 text-green-700 border-green-200 shadow-sm",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm",
    red: "bg-red-50 text-red-700 border-red-200 shadow-sm",
    blue: "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${tones[tone] || tones.gray}`}
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


// -----helper para asignar color en fechas ----
const getFechaPagoColor = (dateStr?: string | Date | null | number) => {
  if (!dateStr || dateStr == 0.0) return "";
  const pagoDate = new Date(dateStr as any);
  if (isNaN(pagoDate.getTime())) return "";

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const pagoSinHora = new Date(
    pagoDate.getFullYear(),
    pagoDate.getMonth(),
    pagoDate.getDate(),
  );

  const diffMs = pagoSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "bg-red-100 text-red-800 border-red-300";
  if (diffDays <= 2) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
};

// ---------- INFO DE PAGOS / FACTURAS ----------
function getPagoInfoFromRaw(raw: any) {
  const pagos = extractPagosAsociados(raw)
    .slice()
    .sort((a, b) => {
      const da = new Date(a.fecha_pago || a.creado_en || 0).getTime();
      const db = new Date(b.fecha_pago || b.creado_en || 0).getTime();
      return db - da;
    });

  const pendientePago = getSaldo(raw);
  const montoSolicitado = getMontoSolicitado(raw);
  const totalPagado = pagos.reduce(
    (acc, p) => acc + parseNum(p.monto_pagado ?? 0),
    0,
  );

  const fechas = pagos
    .map((p) => p.fecha_pago || p.creado_en)
    .filter(Boolean)
    .map((f) => new Date(f));

  const fechaUltimoPago = fechas.length
    ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString()
    : "";

  let estado_pago = "";
  if (isZero(pendientePago)) estado_pago = "Pagado";
  else if (
    !isZero(pendientePago) &&
    !isZero(montoSolicitado) &&
    pendientePago !== montoSolicitado
  )
    estado_pago = "Parcial";
  else estado_pago = "Pendiente";

  return { estado_pago, totalPagado, fechaUltimoPago, pendientePago };
}

function getFacturaInfoFromRaw(raw: any) {
  const montoSolicitado = getMontoSolicitado(raw);
  const totalFacturado = getTotalFacturadoLike(raw);
  const porFacturar = Math.max(0, montoSolicitado - totalFacturado);

  let estado: "parcial" | "facturado" | "pendiente" | "sin factura" =
    "sin factura";
  if (montoSolicitado > 0) {
    if (porFacturar <= EPS) estado = "facturado";
    else if (totalFacturado > EPS) estado = "parcial";
    else estado = "pendiente";
  }

  // UUID (si existe en facturas)
  const facturas = extractFacturas(raw);
  const uuid =
  facturas?.[0]?.uuid_factura ||
  facturas?.[0]?.uuid_cfdi ||
  facturas?.[0]?.uuid ||
  (raw as any)?.uuid_factura ||
  (raw as any)?.uuid_cfdi ||
  "";

  // Fecha última factura
  const fechas = facturas
    .map((f) => f.fecha_factura || f.fecha_emision || f.created_at)
    .filter(Boolean)
    .map((f) => new Date(f));

  const fechaUltimaFactura = fechas.length
    ? new Date(Math.max(...fechas.map((d) => d.getTime()))).toISOString()
    : "";

  return { estado, totalFacturado, porFacturar, fechaUltimaFactura, uuid };
}

// ---------- PATCH / EDIT ----------

type ComprobantePagoFlowState = {
  open: boolean;
  raw: any | null;
  id_solicitud_proveedor: string;
};

type MetodoPagoPopoverProps = {
  idSolProv: string;
  currentMethod: string;
  onSetMethod: (nextMethod: "transfer" | "card") => Promise<boolean>;
  onSetCard: (data: { id_tarjeta_solicitada: string | null }) => Promise<boolean>;
};

const getSolicitudSemaforoRowClass = ({
  categoria,
  fechaSolicitud,
  pagado,
  consolidado,
}: {
  categoria: string;
  fechaSolicitud?: string | Date | null;
  pagado: boolean;
  consolidado: number;
}) => {
  // ✅ consolidado manda sobre todo
  if (Number(consolidado) === 1) return "bg-blue-100";

  // ✅ si ya está pagado, sin color
  if (pagado) return "";

  // ✅ solo aplica a SPEI y Pago TDC
  if (categoria !== "spei" && categoria !== "pago_tdc") return "";

  if (!fechaSolicitud) return "";

  const fecha = new Date(fechaSolicitud as any);
  if (isNaN(fecha.getTime())) return "";

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fechaSinHora = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  );

  const diffMs = fechaSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // 🔴 ya pasó
  if (diffDays < 0) return "bg-red-200";

  // 🟡 hoy o hasta 3 días
  if (diffDays <= 3) return "bg-yellow-200";

  // 🟢 más de 3 días
  return "bg-green-200";
};

const getEstadoSolicitudPagado = (
  raw: any,
  categoria: string,
):
  | "PAGADO TARJETA"
  | "PAGADO TRANSFERENCIA"
  | "PAGADO LINK"
  | null => {
  const estadoActual = normUpper(
    raw?.solicitud_proveedor?.estado_solicitud ?? raw?.estado_solicitud ?? "",
  );

  if (
    estadoActual === "PAGADO TARJETA" ||
    estadoActual === "PAGADO TRANSFERENCIA" ||
    estadoActual === "PAGADO LINK"
  ) {
    return estadoActual;
  }

  const forma = norm(
    raw?.solicitud_proveedor?.forma_pago_solicitada ??
      raw?.forma_pago_solicitada ??
      "",
  );

  if (categoria === "pago_link" || forma === "link") return "PAGADO LINK";
  if (categoria === "pago_tdc" || forma === "card") return "PAGADO TARJETA";
  if (categoria === "spei" || forma === "transfer")
    return "PAGADO TRANSFERENCIA";

  return null;
};

const getConciliacionInfo = (raw: any) => {
  const pagoInfo = getPagoInfoFromRaw(raw);
  const facturaInfo = getFacturaInfoFromRaw(raw);

  const totalPagado = Number(pagoInfo?.totalPagado ?? 0);
  const totalFacturado = Number(facturaInfo?.totalFacturado ?? 0);
  const diferencia = Math.abs(totalPagado - totalFacturado);

  return {
    totalPagado,
    totalFacturado,
    diferencia,
    puedeConciliar: diferencia < 20,
  };
};


function App() {
  const { showNotification } = useAlert();
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.PROVEEDOR_PAGOS);

const editEndpoint = `${URL}/mia/pago_proveedor/edit`;

const [solicitudesPago, setSolicitudesPago] = useState<SolicitudesPorFiltro>({
  todos: [],
  spei: [],
  pago_tdc: [],
  pago_link: [],
  pendiente_credito: [],
  ap_credito: [],
  pagada: [],
  notificados: [],
  canceladas: [], 
});

  const [showDispersionModal, setShowDispersionModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [showComprobanteModal2, setShowComprobanteModal2] = useState(false);

  const [solicitudesSeleccionadasModal, setSolicitudesSeleccionadasModal] =
    useState<SolicitudProveedorRaw[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes,
  );

  // tabs / carpeta activa
  const [categoria, setCategoria] = useState<VistaCarpeta>("all");

  // selección
  const [solicitud, setSolicitud] = useState<SolicitudProveedor[]>([]);
  type SelectedSolicitudesMap = Record<string, SolicitudProveedor>;
  const [selectedSolicitudesMap, setSelectedSolicitudesMap] =
    useState<SelectedSolicitudesMap>({});
  const [datosDispersion, setDatosDispersion] = useState<DatosDispersion[]>([]);

  const selectedCount = solicitud.length;
const canSelect = categoria !== "pagada" && categoria !== "canceladas";
  const canDispersion = canSelect && selectedCount > 0;

  const solicitudesSeleccionadasComprobante = useMemo<SolicitudSeleccionadaComprobante[]>(
  () =>
    solicitud
      .map((raw) => {
        const id_solicitud_proveedor = getIdSolProv(raw);
        const monto_solicitado = getMontoSolicitado(raw);

        return {
          id_solicitud_proveedor,
          monto_solicitado,
          monto_pagado: Number(monto_solicitado || 0).toFixed(2),
        };
      })
      .filter((row) => row.id_solicitud_proveedor),
  [solicitud],
);

  const dispersionDisabledReason =
  categoria === "pagada"
    ? "En carpeta pagada no se puede generar dispersión"
    : categoria === "canceladas"
      ? "En carpeta canceladas no se puede generar dispersión"
      : selectedCount === 0
        ? "Selecciona al menos 1 solicitud"
        : "";

  const clearDisabledReason =
    !canSelect || selectedCount === 0 ? "No hay selección para limpiar" : "";

  // ---- Modal de edición ----
  const [editModal, setEditModal] = useState<{
    open: boolean;
    id_solicitud_proveedor: string;
    field: EditableField;
    value: string;
  }>({
    open: false,
    id_solicitud_proveedor: "",
    field: "costo_proveedor",
    value: "",
  });

  const openEditModal = useCallback(
    (raw: any, field: EditableField, currentValue: any) => {
      const idSolProv = getIdSolProv(raw);
      setEditModal({
        open: true,
        id_solicitud_proveedor: idSolProv,
        field,
        value: currentValue == null ? "" : String(currentValue),
      });
    },
    [],
  );

    const closeEditModal = useCallback(
    () => setEditModal((s) => ({ ...s, open: false })),
    [],
  );

  const patchSolicitudProveedor = useCallback(
    async (id_solicitud_proveedor: string, field: string, value: any) => {
      const apiField = (FIELD_TO_API as any)[field] ?? field;

      const needsNumber = [
        "costo_total",
        "monto_solicitado",
        "consolidado",
      ].includes(apiField);


      const normalizedValue = needsNumber
      ? String(value).trim() === ""
        ? null
        : Number(value)
      : String(value).trim() === ""
        ? null
        : value;


      const payload = { id_solicitud_proveedor, [apiField]: normalizedValue };

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

        showNotification("success", "Actualizado correctamente");
        return true;
      } catch (err: any) {
        console.error("❌ patch fail", err);
        showNotification("error", err?.message || "Error al actualizar");
        return false;
      }
    },
    [editEndpoint, showNotification],
  );

  const saveEditModal = useCallback(async () => {
    const { id_solicitud_proveedor, field, value } = editModal;
    if (!id_solicitud_proveedor) return;

    const ok = await patchSolicitudProveedor(
      id_solicitud_proveedor,
      field,
      value,
    );
    if (ok) {
      closeEditModal();
      handleFetchSolicitudesPago();
    }
  }, [editModal, patchSolicitudProveedor, closeEditModal]);

  const normalizeApiToAll = (data: any): SolicitudProveedor[] => {
    // back puede venir como {todos:[...]} o dividido {spei_solicitado,...}
    if (Array.isArray(data?.todos)) return data.todos;

    const arr = [
      ...(data?.spei_solicitado ?? []),
      ...(data?.pago_tdc ?? []),
      ...(data?.cupon_enviado ?? []),
      ...(data?.ap_credito ?? []),
      ...(data?.notificados??[]),
      ...(data?.pagada ?? []),
    ].filter(Boolean);

    // dedupe por id_solicitud_proveedor
    const map = new Map<string, any>();
    for (const it of arr) {
      const id = getIdSolProv(it);
      if (!id) continue;
      if (!map.has(id)) map.set(id, it);
    }
    return Array.from(map.values());
  };

const dedupeSolicitudes = (arr: any[]): SolicitudProveedor[] => {
  const map = new Map<string, SolicitudProveedor>();

  for (const it of arr || []) {
    const id = getIdSolProv(it);
    if (!id) continue;
    if (!map.has(id)) map.set(id, it);
  }

  return Array.from(map.values());
};

const patchSolicitudProveedorFields = useCallback(
  async (id_solicitud_proveedor: string, fields: Record<string, any>) => {
    const payload = {
      id_solicitud_proveedor,
      ...fields,
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

      showNotification("success", "Actualizado correctamente");
      return true;
    } catch (err: any) {
      console.error("❌ patch fail", err);
      showNotification("error", err?.message || "Error al actualizar");
      return false;
    }
  },
  [editEndpoint, showNotification],
);

const normalizeApiBuckets = (data: any) => {
  const spei = Array.isArray(data?.spei_solicitado) ? data.spei_solicitado : [];
  const pago_tdc = Array.isArray(data?.pago_tdc) ? data.pago_tdc : [];
  const pago_link = Array.isArray(data?.pago_link) ? data.pago_link : [];
  const pendiente_credito = Array.isArray(data?.carta_enviada) ? data.carta_enviada : [];
  const ap_credito = Array.isArray(data?.carta_garantia) ? data.carta_garantia : [];
  const pagada = Array.isArray(data?.pagada) ? data.pagada : [];
  const notificados = Array.isArray(data?.notificados) ? data.notificados : [];
  const canceladas = Array.isArray(data?.canceladas) ? data.canceladas : [];

  const todos = dedupeSolicitudes([
    ...spei,
    ...pago_tdc,
    ...pago_link,
    ...pendiente_credito,
    ...ap_credito,
    ...pagada,
    ...notificados,
    ...canceladas,
  ]);

  return {
    todos,
    spei,
    pago_tdc,
    pago_link,
    pendiente_credito,
    ap_credito,
    pagada,
    notificados,
    canceladas,
  };
};

const handleFetchSolicitudesPago = useCallback(() => {
  setLoading(true);

  fetchGetSolicitudesProveedores1((data) => {
    try {
      const apiData = data?.data || {};

      const buckets = normalizeApiBuckets(apiData);

      setSolicitudesPago({
        todos: buckets.todos,
        spei: buckets.spei,
        pago_tdc: buckets.pago_tdc,
        pago_link: buckets.pago_link,
        pendiente_credito: buckets.pendiente_credito,
        ap_credito: buckets.ap_credito,
        pagada: buckets.pagada,
        notificados: buckets.notificados,
        canceladas: buckets.canceladas,
      });
    } finally {
      setLoading(false);
    }
  });
}, []);

  useEffect(() => {
    handleFetchSolicitudesPago();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ✅ limpiar selección al cambiar de carpeta
  useEffect(() => {
    setSelectedSolicitudesMap({});
    setSolicitud([]);
    setDatosDispersion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria]);

  // ------- Lista base por carpeta -------
const baseList: SolicitudProveedor[] =
  categoria === "all"
    ? solicitudesPago.todos
    : categoria === "spei"
      ? solicitudesPago.spei
      : categoria === "pago_tdc"
        ? solicitudesPago.pago_tdc
        : categoria === "pago_link"
          ? solicitudesPago.pago_link
          : categoria === "pendiente_credito"
            ? solicitudesPago.pendiente_credito
            : categoria === "ap_credito"
              ? solicitudesPago.ap_credito
              : categoria === "pagada"
                ? solicitudesPago.pagada
                : categoria === "notificados"
                  ? solicitudesPago.notificados
                  : solicitudesPago.canceladas;

  // 1) filtro extra (si aún lo quieres)
  const filteredSolicitudes = baseList.filter(() => true);

  // 2) búsqueda + mapeo a registros de tabla
  const formatedSolicitudes = filteredSolicitudes
    .filter((item) => {
  const q = (searchTerm || "").toUpperCase();
  
  // Existing fields
  const hotel = (item.hotel || "").toUpperCase();
  const agente = (item.nombre_agente_completo || "").toUpperCase();
  const viajero = (item.nombre_viajero_completo || item.nombre_viajero || "").toUpperCase();
  const idSolicitud = String((item as any)?.solicitud_proveedor?.id_solicitud_proveedor ?? "").toUpperCase();
  
  // New fields
  const codigoConfirmacion = (item.codigo_confirmacion || "").toUpperCase();
  
  // Extract UUID from facturas
  let uuidFactura = "";
  const facturas = extractFacturas(item);
  if (facturas.length) {
    uuidFactura = (
      facturas[0].uuid_factura ||
      facturas[0].uuid_cfdi ||
      facturas[0].uuid ||
      ""
    ).toUpperCase();
  }
  
  return (
    hotel.includes(q) ||
    agente.includes(q) ||
    viajero.includes(q) ||
    idSolicitud.includes(q) ||
    codigoConfirmacion.includes(q) ||
    uuidFactura.includes(q)
  );
})
    .map((raw) => {
      const item = raw as ItemSolicitud;

      const id_solicitud_proveedor = getIdSolProv(item);
      const forma = getFormaPago(item);
      const montoSolicitado = getMontoSolicitado(item);
      const saldo = getSaldo(item);

      const pagoInfo = getPagoInfoFromRaw(item);
      const facInfo = getFacturaInfoFromRaw(item);

      const porFacturar = facInfo.porFacturar;

      return {
  // ✅ columnas “SP base”
  id_solicitud_proveedor,
  fecha_de_pago: item.solicitud_proveedor?.fecha_solicitud,
  monto_solicitado: montoSolicitado,
  saldo: saldo,
  forma_pago_solicitada: forma,
  id_tarjeta_solicitada:
    item?.solicitud_proveedor?.id_tarjeta_solicitada ?? null,
  usuario_solicitante:
    item?.solicitud_proveedor?.usuario_solicitante ?? "",
  usuario_generador: item?.solicitud_proveedor?.usuario_generador ?? "",
  comentarios_sp: item?.solicitud_proveedor?.comentarios ?? "",
  notas_internas:
    item?.solicitud_proveedor?.notas_internas ??
    (item as any)?.notas_internas ??
    "",

  comentarios_Ap:
    item?.solicitud_proveedor?.comentarios_Ap ??
    (item as any)?.comentarios_Ap ??
    (item as any)?.comentarios_ap ??
    "",
  estado_solicitud: item?.solicitud_proveedor?.estado_solicitud ?? "",
  estado_facturacion: item?.solicitud_proveedor?.estado_facturacion ?? "",
  estatus_pagos: item?.estatus_pagos ?? "",
  comentario_sistema: getComentarioSistema(item),

  // UI
  seleccionar: "",
  carpeta: categoria,
  facturas_acciones: "",

  // reserva
  codigo_confirmacion: item.codigo_confirmacion,
  creado: item.created_at,
  proveedor: (item.hotel || "").toUpperCase(),
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
  costo_proveedor: Number((item as any).costo_total) || 0,
  markup:
    ((Number(item.total || 0) - Number((item as any).costo_total || 0)) /
      Number(item.total || 0)) *
    100,
  precio_de_venta: parseFloat(item.total),
  metodo_de_pago: item.id_credito ? "credito" : "contado",
  etapa_reservacion: item.estado_reserva,
  estado: item.status,
  reservante: item.id_usuario_generador ? "Cliente" : "Operaciones",

  // cliente
  id_cliente: item.id_agente,
  cliente: (item.nombre_agente_completo || "").toUpperCase(),

  // solicitud / pagos / facturación (UX)
  forma_de_pago_solicitada:
    item.solicitud_proveedor?.forma_pago_solicitada,
  digitos_tajeta: item.tarjeta?.ultimos_4,
  banco: item.tarjeta?.banco_emisor,
  tipo_tarjeta: item.tarjeta?.tipo_tarjeta,

  comentarios_cxp:
    (item as any).comentario_CXP ?? (item as any).comments_cxp ?? "",

  estado_pago: pagoInfo.estado_pago,
  pendiente_a_pagar: pagoInfo.pendientePago,
  monto_pagado_proveedor: pagoInfo.totalPagado,
  fecha_pagado: pagoInfo.fechaUltimoPago,

  estado_factura_proveedor: facInfo.estado,
  total_facturado: facInfo.totalFacturado,
  monto_por_facturar: porFacturar,
  fecha_facturacion: facInfo.fechaUltimaFactura,
  UUID: facInfo.uuid,
  uso_cfdi_factura: "",
forma_pago_factura: "",
metodo_pago_factura: "",
moneda_factura: "",

  acciones: "",
  item: raw,
};
    });

  const registrosVisibles = formatedSolicitudes;

const getProveedorCuentas = (raw: any) => {
  const cuentas = normalizeToArray(
    raw?.cuentas_proveedor ??
      raw?.proveedor?.cuentas ??
      raw?.proveedor?.cuentas_proveedor ??
      []
  );

  return cuentas.filter(
    (c) => c && typeof c === "object" && Object.keys(c).length > 0
  );
};

  // ---------- HANDLERS ----------
  const handleDispersion = () => {
  if (!solicitud.length) {
    showNotification(
      "info",
      "No hay solicitudes seleccionadas para dispersión",
    );
    return;
  }

  const seleccion = solicitud.map((s) => {
    const anyS = s as any;
    const cuentasProveedor = getProveedorCuentas(s);
    const cuentaDefault = cuentasProveedor[0] ?? null;

    const idProveedor =
      anyS.id_proveedor ??
      anyS.proveedor?.id ??
      null;

    return {
      id_solicitud: anyS.id_solicitud ?? anyS.id ?? "",
      id_pago: anyS.id_pago ?? null,
      id_proveedor: idProveedor,
      hotel: s.hotel ?? null,
      codigo_reservacion_hotel: s.codigo_reservacion_hotel ?? null,
      costo_total:
        s.costo_total ?? s.solicitud_proveedor?.monto_solicitado ?? "0",
      check_out: s.check_out ?? null,
      codigo_dispersion: anyS.codigo_dispersion ?? null,

      // cuentas del proveedor
      cuentas_proveedor: cuentasProveedor,
      cuenta_de_deposito:
        anyS.cuenta_de_deposito ??
        cuentaDefault?.cuenta ??
        null,

      tipo_cuenta:
        anyS.tipo_cuenta ??
        (cuentaDefault?.cuenta?.length === 18 ? "Cta Clabe" : "Cta"),

      clave_proveedor:
        idProveedor != null ? String(idProveedor) : null,

      solicitud_proveedor: s.solicitud_proveedor
        ? {
            id_solicitud_proveedor:
              s.solicitud_proveedor.id_solicitud_proveedor,
            fecha_solicitud: s.solicitud_proveedor.fecha_solicitud ?? null,
            monto_solicitado: s.solicitud_proveedor.monto_solicitado ?? null,
            saldo: (s.solicitud_proveedor as any)?.saldo ?? null,
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
  const handleCsvnospei = () => setShowComprobanteModal2(true);

const clearSelection = useCallback(() => {
  setSelectedSolicitudesMap({});
  setSolicitud([]);
  setDatosDispersion([]);
}, []);

  // ---------- COLUMNAS (para orden estable + mostrar SP) ----------
const customColumns = useMemo(() => {
  const cols = [
    "seleccionar",
    "id_solicitud_proveedor",
    "fecha_solicitud",
    "monto_solicitado",
    "saldo",
    "forma_pago_solicitada",
    "estatus_pagos",
    "estado_solicitud",
    "estado_facturacion",
    "usuario_solicitante",
    "usuario_generador",
    "comentarios_sp",
    "notas_internas",
    "comentarios_Ap",

    "codigo_confirmacion",
    "creado",
    "proveedor",
    "viajero",
    "check_in",
    "check_out",
    "noches",
    "habitacion",
    "costo_proveedor",
    "markup",
    "precio_de_venta",
    "razon_social",
    "rfc",

    "estado_pago",
    "pendiente_a_pagar",
    "monto_pagado_proveedor",
    "fecha_pagado",
    "estado_factura_proveedor",
    "total_facturado",
    "monto_por_facturar",
    "fecha_facturacion",
    "UUID",
    "uso_cfdi_factura",
    "forma_pago_factura",
    "metodo_pago_factura",
    "moneda_factura",
    "facturas_acciones",
    "fecha_de_pago",

    "comentarios_cxp",
  ];

  if (categoria === "notificados") {
    cols.push("comentario_sistema");
  }

  cols.push("acciones");
  return cols;
}, [categoria]);

const marcarSolicitudPagada = useCallback(
  async (raw: any) => {
    const idSolProv = getIdSolProv(raw);
    if (!idSolProv) return false;

    const estadoSolicitudPagado = getEstadoSolicitudPagado(raw, categoria);

    if (!estadoSolicitudPagado) {
      showNotification(
        "error",
        "No se pudo determinar el estado_solicitud de pagado para esta solicitud.",
      );
      return false;
    }

    const ok = await patchSolicitudProveedorFields(idSolProv, {
      estatus_pagos: "pagado",
      estado_solicitud: estadoSolicitudPagado,
    });

    if (ok) {
      clearSelection();
      handleFetchSolicitudesPago();
    }

    return ok;
  },
  [
    categoria,
    patchSolicitudProveedorFields,
    clearSelection,
    handleFetchSolicitudesPago,
    showNotification,
  ],
);

const cancelSolicitud = useCallback(
  async (id_solicitud_proveedor: string) => {
    const id = String(id_solicitud_proveedor ?? "").trim();
    if (!id) return false;

    // ✅ Reusa tu PATCH genérico
    const ok = await patchSolicitudProveedor(id, "estado_solicitud", "CANCELADA");

    if (ok) {
      clearSelection();
      handleFetchSolicitudesPago();
    }

    return ok;
  },
  [patchSolicitudProveedor, clearSelection, handleFetchSolicitudesPago],
);

const conciliarSolicitud = useCallback(
  async (raw: any) => {
    const idSolProv = getIdSolProv(raw);
    if (!idSolProv) return false;

    const { diferencia, totalPagado, totalFacturado, puedeConciliar } =
      getConciliacionInfo(raw);

    if (!puedeConciliar) {
      showNotification(
        "error",
        `No se puede conciliar. Diferencia actual: $${diferencia.toFixed(
          2,
        )}. Pagado: $${totalPagado.toFixed(
          2,
        )} / Facturado: $${totalFacturado.toFixed(2)}.`,
      );
      return false;
    }

    const okConfirm = window.confirm(
      `¿Conciliar la solicitud ${idSolProv}?\n\n` +
        `Pagado: $${totalPagado.toFixed(2)}\n` +
        `Facturado: $${totalFacturado.toFixed(2)}\n` +
        `Diferencia: $${diferencia.toFixed(2)}`
    );

    if (!okConfirm) return false;

    const ok = await patchSolicitudProveedor(idSolProv, "consolidado", 1);

    if (ok) {
      clearSelection();
      handleFetchSolicitudesPago();
    }

    return ok;
  },
  [patchSolicitudProveedor, clearSelection, handleFetchSolicitudesPago, showNotification],
);

const marcarNotificadoPagado = useCallback(
  async (id_solicitud_proveedor: string, pagado: 0 | 1) => {
    const id = String(id_solicitud_proveedor ?? "").trim();
    if (!id) return false;

    const ok = await patchSolicitudProveedorFields(id, {
      estado_solicitud: "CANCELADA",
      pagado,
    });

    if (ok) {
      clearSelection();
      handleFetchSolicitudesPago();
    }

    return ok;
  },
  [patchSolicitudProveedorFields, clearSelection, handleFetchSolicitudesPago],
);
  // ---------- RENDERERS ----------
  const renderers = useMemo(
  () =>
    createSolicitudesRenderers({
      categoria,
      selectedSolicitudesMap,
      setSelectedSolicitudesMap,
      setSolicitud,
      setDatosDispersion,

      getIdSolProv,
      getFormaPago,
      getSaldo,
      isPagado,
      hasPagosAsociados,

      pagoTone3,
      facturaTone,

      openEditModal,
      patchSolicitudProveedor,
      handleFetchSolicitudesPago,
      marcarSolicitudPagada,
      cancelSolicitud,
      conciliarSolicitud,
      marcarNotificadoPagado,
      getEstadoSolicitudPagado,
      getConciliacionInfo,
    }),
  [
    categoria,
    selectedSolicitudesMap,
    setSelectedSolicitudesMap,
    setSolicitud,
    setDatosDispersion,
    openEditModal,
    patchSolicitudProveedor,
    handleFetchSolicitudesPago,
    marcarSolicitudPagada,
    cancelSolicitud,
    conciliarSolicitud,
    marcarNotificadoPagado,
  ]
);

  // ---------- Tabs config (carpetas) ----------
  const tabs = useMemo(
    () =>
      [
        { key: "all", label: "Todos", count: solicitudesPago.todos.length },
        { key: "spei", label: "SPEI", count: solicitudesPago.spei.length },
        { key: "pago_tdc", label: "Pago TDC", count: solicitudesPago.pago_tdc.length },
        { key: "pago_link", label: "Pago Link", count: solicitudesPago.pago_link.length },
        { key: "pendiente_credito", label: "Pendiente credito", count: solicitudesPago.pendiente_credito.length },
        { key: "ap_credito", label: "Ap Credito", count: solicitudesPago.ap_credito.length },
        { key: "pagada", label: "Pagada", count: solicitudesPago.pagada.length },
        { key: "notificados", label: "Notificados", count: solicitudesPago.notificados.length },
        { key: "canceladas", label: "Canceladas", count: solicitudesPago.canceladas.length },
      ] as Array<{ key: VistaCarpeta; label: string; count: number }>,
    [solicitudesPago],
  );

  return (
    <div className="h-fit">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 my-4">
        Pagos a proveedor
      </h1>

      <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <Filters
          defaultFilters={filters}
          onFilter={setFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <CarpetasTabs
          activeTab={categoria}
          onTabChange={setCategoria}
          tabs={tabs}
        />

        {/* Barra de acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs text-slate-600">
            {categoria === "pagada"
  ? "Carpeta pagada (sin selección)"
  : categoria === "canceladas"
    ? "Carpeta canceladas (sin selección)"
              : selectedCount > 0
                ? `Seleccionadas: ${selectedCount}`
                : "Sin selección"}
          </div>

          <div className="flex gap-2">
            {/* espacio por si agregas acciones nuevas */}
          </div>
        </div>

        <div>
          {loading ? (
            <Loader />
          ) : (
            <Table5<ItemSolicitud>
              registros={registrosVisibles as any}
              renderers={renderers}
              defaultSort={defaultSort as any}
              customColumns={customColumns}
getRowClassName={(row) => {
  const raw = (row as any)?.item ?? row;

  const consolidado = Number(
    (raw as any)?.consolidado ??
      (raw as any)?.estatus_conciliado ??
      (raw as any)?.conciliado ??
      0,
  );

  const pagado = isPagado(raw);

  const fechaSolicitud =
    raw?.solicitud_proveedor?.fecha_solicitud ??
    (row as any)?.fecha_solicitud ??
    null;

  return getSolicitudSemaforoRowClass({
    categoria,
    fechaSolicitud,
    pagado,
    consolidado,
  });
}}
              leyenda={`Mostrando ${registrosVisibles.length} registros (${categoria === "all" ? "todas" : `categoría: ${categoria}`})`}
            >
              {/* Subir comprobante (secundario) */}
              <Button
                onClick={handleCsv}
                icon={Upload}
                variant="ghost"
                size="md"
                className={[
                  "h-10 !rounded-xl px-3",
                  "border border-slate-200 bg-white text-slate-800",
                  "shadow-sm hover:shadow",
                  "hover:bg-slate-50 hover:border-slate-300",
                  "active:translate-y-[1px] transition-all",
                  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                ].join(" ")}
                title="Subir comprobante"
              >
                Subir comprobante
              </Button>

              <Button
                onClick={handleCsvnospei}
                icon={Upload}
                variant="ghost"
                size="md"
                className={[
                  "h-10 !rounded-xl px-3",
                  "border border-slate-200 bg-white text-slate-800",
                  "shadow-sm hover:shadow",
                  "hover:bg-slate-50 hover:border-slate-300",
                  "active:translate-y-[1px] transition-all",
                  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                ].join(" ")}
                title="Subir comprobante"
              >
                Subir comprobante no spei
              </Button>

              {/* Generar dispersión */}
              <Button
                onClick={handleDispersion}
                disabled={!canDispersion}
                icon={File}
                variant="secondary"
                size="md"
                title={
                  dispersionDisabledReason ||
                  `Generar dispersión (${selectedCount})`
                }
              >
                Generar dispersión
                {selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>

              {/* Limpiar */}
              <Button
                onClick={clearSelection}
                disabled={!canSelect || selectedCount === 0}
                icon={Brush}
                variant="ghost"
                size="md"
                className={[
                  "h-10 !rounded-xl px-3",
                  "border border-rose-200 bg-white text-rose-700",
                  "hover:bg-rose-50 hover:border-rose-300",
                  "active:translate-y-[1px] transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2",
                ].join(" ")}
                title={
                  clearDisabledReason || `Limpiar selección (${selectedCount})`
                }
              >
                Limpiar
              </Button>
            </Table5>
          )}
        </div>
      </div>

      {/* MODAL EDIT (costo proveedor) */}
      <EditModal
        open={editModal.open}
        idSolicitudProveedor={editModal.id_solicitud_proveedor}
        field={editModal.field}
        value={editModal.value}
        onClose={closeEditModal}
        onSave={saveEditModal}
        onValueChange={(value) =>
          setEditModal((prev) => ({ ...prev, value }))
        }
      />

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
      {showComprobanteModal2 && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <OtrosMetodosPagoModal
      selectedSolicitudes={solicitudesSeleccionadasComprobante}
      onClose={() => setShowComprobanteModal2(false)}
      onSubmit={async (payload) => {
        console.log("Payload de comprobante listo para API:", payload);
        setShowComprobanteModal2(false);
      }}
    />
  </div>
)}
    </div>
  );
}

export default App;
