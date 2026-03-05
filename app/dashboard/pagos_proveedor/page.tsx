"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { fetchGetSolicitudesProveedores1 } from "@/services/pago_proveedor";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import {
  DispersionModal,
  SolicitudProveedorRaw,
} from "./Components/dispersion";
import MetodoPagoModal from "@/app/dashboard/pagos_proveedor/Components/MetodoPagoModal";
import { ComprobanteModal } from "./Components/comprobantes";
import { useAlert } from "@/context/useAlert";
import Button from "@/components/atom/Button";
import {
  Brush,
  File,
  Upload,
  X,
  Maximize2,
  CheckCircle2,
  Handshake,
  Eye,
  Ban,
} from "lucide-react";
import { URL, API_KEY } from "@/lib/constants/index";
import PaymentMethodSelector from "./Components/PaymentMethodSelector";

// ---------- HELPERS GENERALES ----------
const parseNum = (v: any) => (v == null || v === "" ? 0 : Number(v));
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
const normUpper = (s?: string | null) => (s ?? "").trim().toUpperCase();

const EPS = 0.01;
const isZero = (n: any) => Math.abs(Number(n) || 0) < EPS;

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

// Extrae pagos “reales” aunque vengan como: array, string JSON, o mezclados
const extractPagosAsociados = (raw: any): any[] => {
  // Back actual manda `pagos` como array que contiene dispersiones_json y pagos_json mezclados
  // y/o podría venir `pagos_json` / `dispersiones_json` directo en rest.
  const candidates: any[] = [];

  if (Array.isArray(raw?.pagos)) candidates.push(...raw.pagos);
  if (raw?.pagos_json != null) candidates.push(raw.pagos_json);
  if (raw?.dispersiones_json != null) candidates.push(raw.dispersiones_json);

  // Aplana y parsea strings JSON
  const out: any[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      out.push(...c.flatMap((x) => normalizeToArray(x)));
    } else {
      out.push(...normalizeToArray(c));
    }
  }

  // Filtra basura (objetos vacíos)
  return out.filter(
    (p) => p && typeof p === "object" && Object.keys(p).length > 0,
  );
};

const hasPagosAsociados = (raw: any) => extractPagosAsociados(raw).length > 0;

// Facturas: soporta `facturas`, `facturas_json`, etc.
const extractFacturas = (raw: any): any[] => {
  const candidates: any[] = [];
  if (Array.isArray((raw as any)?.facturas))
    candidates.push((raw as any).facturas);
  if ((raw as any)?.facturas_json != null)
    candidates.push((raw as any).facturas_json);
  if ((raw as any)?.facturas_proveedor_json != null)
    candidates.push((raw as any).facturas_proveedor_json);

  const out: any[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) out.push(...c.flatMap((x) => normalizeToArray(x)));
    else out.push(...normalizeToArray(c));
  }
  return out.filter(
    (f) => f && typeof f === "object" && Object.keys(f).length > 0,
  );
};

const getMontoSolicitado = (raw: any) =>
  parseNum(raw?.solicitud_proveedor?.monto_solicitado ?? raw?.monto_solicitado);

const getSaldo = (raw: any) =>
  parseNum(raw?.solicitud_proveedor?.saldo ?? raw?.saldo);

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

// ---------- CATEGORÍAS (carpetas base) ----------
type CategoriaEstatus =
  | "spei"
  | "pago_tdc"
  | "pago_link"
  | "carta_enviada"
  | "carta_garantia"
  | "pagada";

type VistaCarpeta = CategoriaEstatus | "all";

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

// --- Tabs UI helpers ---
type TabKey = VistaCarpeta;

const tabTheme: Record<
  TabKey,
  {
    ring: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    badge: string;
    badgeActive: string;
  }
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
  spei: {
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
  pago_link: {
    ring: "focus:ring-amber-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    badgeActive: "bg-amber-100 text-amber-950 border-amber-300",
  },
  carta_enviada: {
    ring: "focus:ring-violet-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-800 border-violet-200",
    badgeActive: "bg-violet-100 text-violet-900 border-violet-300",
  },
  carta_garantia: {
    ring: "focus:ring-emerald-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    badgeActive: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  pagada: {
    ring: "focus:ring-green-500",
    bg: "bg-white",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-800 border-green-200",
    badgeActive: "bg-green-100 text-green-900 border-green-300",
  },
};

const tabBase =
  "relative select-none group !rounded-xl border px-3 py-2 " +
  "transition-all duration-200 " +
  "hover:-translate-y-[1px] active:translate-y-0 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2";

function getTabClass(key: TabKey, active: boolean) {
  const t = tabTheme[key];
  const activeCls = active
    ? `bg-gradient-to-b from-white to-slate-50 border-slate-300 shadow-sm`
    : `${t.bg} ${t.border} hover:border-slate-300 hover:bg-slate-50`;
  return `${tabBase} ${t.ring} ${activeCls}`;
}

function getActiveUnderline(key: TabKey) {
  const dot = tabTheme[key].dot;
  return (
    <span className="absolute -bottom-[2px] left-2 right-2 h-[3px] rounded-full bg-slate-900/0">
      <span
        className={`block h-full rounded-full ${dot} opacity-80 blur-[0.2px]`}
      />
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

const formatDateSimple = (date: string | Date) => {
  if (!date) return "—";
  const localDate = new Date(date);
  if (Number.isNaN(localDate.getTime())) return "—";
  return localDate.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

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

const getFechaPagoRowClass = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";
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

  if (diffDays < 0) return "bg-red-200";
  if (diffDays <= 2) return "bg-yellow-200";
  return "bg-green-200";
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
    facturas?.[0]?.uuid_cfdi ||
    facturas?.[0]?.uuid ||
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

// ---------- PATCH / EDIT ----------
type EditableField =
  | "costo_proveedor"
  | "estatus_pagos"
  | "monto_solicitado"
  | "consolidado";
const FIELD_TO_API: Record<EditableField, string> = {
  costo_proveedor: "costo_total",
  estatus_pagos: "estatus_pagos",
  monto_solicitado: "monto_solicitado",
  consolidado: "consolidado",
};

type EditModalState = {
  open: boolean;
  id_solicitud_proveedor: string;
  field: EditableField;
  value: string;
};

const InlineMoneyEdit = ({
  id,
  value,
  disabled,
  onSave,
}: {
  id: string;
  value: number;
  disabled?: boolean;
  onSave: (next: number) => Promise<boolean>;
}) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value ?? 0));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!editing) setDraft(String(value ?? 0));
  }, [value, editing]);

  const commit = async () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) return;

    setSaving(true);
    const ok = await onSave(n);
    setSaving(false);

    if (ok) setEditing(false);
  };

  if (disabled) {
    return <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-md border border-transparent hover:border-slate-200"
        onClick={() => setEditing(true)}
        title="Editar monto solicitado"
      >
        <span>${Number(value || 0).toFixed(2)}</span>
        <span className="text-[10px] text-slate-500">✎</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        className="w-28 border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-200"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={saving}
        autoFocus
      />
      <button
        type="button"
        className="text-xs px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        onClick={() => void commit()}
        disabled={saving}
      >
        OK
      </button>
      <button
        type="button"
        className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
        onClick={() => setEditing(false)}
        disabled={saving}
      >
        Cancelar
      </button>
    </div>
  );
};

type MetodoPagoPopoverProps = {
  idSolProv: string;
  currentMethod: string;
  onSetMethod: (nextMethod: "transfer" | "card") => Promise<boolean>;
  onSetCard: (data: { id_tarjeta_solicitada: string | null }) => Promise<boolean>;
};


const MetodoPagoPopover: React.FC<MetodoPagoPopoverProps> = ({
  idSolProv,
  currentMethod,
  onSetMethod,
  onSetCard,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
        onClick={() => setOpen((v) => !v)}
        title="Cambiar método de pago"
      >
        Método
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-[70] w-[280px] rounded-xl border border-slate-200 bg-white shadow-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-700">
              Solicitud: {idSolProv}
            </div>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>

          {/* ✅ aquí montamos tu selector SOLO cuando se abre */}
          <PaymentMethodSelector
            idSolProv={idSolProv}
            currentMethod={currentMethod}
            onSetMethod={async (next) => {
              const ok = await onSetMethod(next);
              // opcional: si cambian a transfer, puedes limpiar tarjeta en backend
              // if (ok && next === "transfer") await onSetCard({ id_tarjeta_solicitada: 0 }); // si tu back lo interpreta como null/clear
              if (ok) setOpen(false); // si quieres que se cierre al guardar método
              return ok;
            }}
            onSetCard={async (payload) => {
              const ok = await onSetCard(payload);
              if (ok) setOpen(false);
              return ok;
            }}
          />
        </div>
      )}
    </div>
  );
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
    carta_enviada: [],
    carta_garantia: [],
    pagada: [],
  });

  const [showDispersionModal, setShowDispersionModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);

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
  const canSelect = categoria !== "pagada"; // mantenemos tu regla
  const canDispersion = canSelect && selectedCount > 0;

  const dispersionDisabledReason =
    categoria === "pagada"
      ? "En carpeta pagada no se puede generar dispersión"
      : selectedCount === 0
        ? "Selecciona al menos 1 solicitud"
        : "";

  const clearDisabledReason =
    !canSelect || selectedCount === 0 ? "No hay selección para limpiar" : "";

  // ---- Modal de edición ----
  const [editModal, setEditModal] = useState<EditModalState>({
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
      // refresca
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
      ...(data?.carta_garantia ?? []),
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

  const handleFetchSolicitudesPago = useCallback(() => {
    setLoading(true);

    fetchGetSolicitudesProveedores1((data) => {
      const apiData = data?.data || {};
      const all = normalizeApiToAll(apiData);

      // --- reglas de carpetas (tu nueva especificación) ---
      const spei = all.filter(
        (it) => getFormaPago(it) === "transfer" && !hasPagosAsociados(it),
      );
      const pago_tdc = all.filter(
        (it) => getFormaPago(it) === "card" && !hasPagosAsociados(it),
      );
      const pago_link = all.filter(
        (it) => getFormaPago(it) === "link" && !hasPagosAsociados(it),
      );

      const creditAll = all.filter((it) => getFormaPago(it) === "credit");

      const carta_garantia = creditAll.filter((it) => {
        const montoSolicitado = getMontoSolicitado(it);
        const totalFacturado = getTotalFacturadoLike(it);
        const porFacturar = Math.max(0, montoSolicitado - totalFacturado);
        return porFacturar <= EPS && montoSolicitado > 0;
      });

      const carta_enviada = creditAll.filter((it) => {
        const montoSolicitado = getMontoSolicitado(it);
        const totalFacturado = getTotalFacturadoLike(it);
        const porFacturar = Math.max(0, montoSolicitado - totalFacturado);
        // “no tiene monto facturado” o “< solicitado” o “por facturar == solicitado”
        return porFacturar > EPS && montoSolicitado > 0;
      });

      const pagada = all.filter((it) => isPagado(it));

      const historico: SolicitudProveedor[] = []; // ✅ vacía por ahora

      setSolicitudesPago({
        todos: all,
        spei,
        pago_tdc,
        pago_link,
        carta_enviada,
        carta_garantia,
        pagada,
      });

      setLoading(false);
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
            : categoria === "carta_enviada"
              ? solicitudesPago.carta_enviada
              : categoria === "carta_garantia"
                ? solicitudesPago.carta_garantia
                : solicitudesPago.pagada; // ✅ aquí

  // 1) filtro extra (si aún lo quieres)
  const filteredSolicitudes = baseList.filter(() => true);

  // 2) búsqueda + mapeo a registros de tabla
  const formatedSolicitudes = filteredSolicitudes
    .filter((item) => {
      const q = (searchTerm || "").toUpperCase();
      return (
        (item.hotel || "").toUpperCase().includes(q) ||
        (item.nombre_agente_completo || "").toUpperCase().includes(q) ||
        (item.nombre_viajero_completo || item.nombre_viajero || "")
          .toUpperCase()
          .includes(q) ||
        String((item as any)?.solicitud_proveedor?.id_solicitud_proveedor ?? "")
          .toUpperCase()
          .includes(q)
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
        fecha_solicitud: item?.solicitud_proveedor?.fecha_solicitud ?? null,
        monto_solicitado: montoSolicitado,
        saldo: saldo,
        forma_pago_solicitada: forma,
        id_tarjeta_solicitada:
          item?.solicitud_proveedor?.id_tarjeta_solicitada ?? null,
        usuario_solicitante:
          item?.solicitud_proveedor?.usuario_solicitante ?? "",
        usuario_generador: item?.solicitud_proveedor?.usuario_generador ?? "",
        comentarios_sp: item?.solicitud_proveedor?.comentarios ?? "",
        estado_solicitud: item?.solicitud_proveedor?.estado_solicitud ?? "",
        estado_facturacion: item?.solicitud_proveedor?.estado_facturacion ?? "",
        estatus_pagos: item?.estatus_pagos ?? "",

        // UI
        seleccionar: "",
        carpeta: categoria,

        // reserva
        codigo_hotel: item.codigo_reservacion_hotel,
        creado: item.created_at,
        hotel: (item.hotel || "").toUpperCase(),
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
        fecha_de_pago: item.solicitud_proveedor?.fecha_solicitud,
        forma_de_pago_solicitada:
          item.solicitud_proveedor?.forma_pago_solicitada,
        digitos_tajeta: item.tarjeta?.ultimos_4,
        banco: item.tarjeta?.banco_emisor,
        tipo_tarjeta: item.tarjeta?.tipo_tarjeta,

        // ✅ CXP comments (solo lectura)
        comentarios_cxp:
          (item as any).comentario_CXP ?? (item as any).comments_cxp ?? "",

        // pago proveedor
        estado_pago: pagoInfo.estado_pago,
        pendiente_a_pagar: pagoInfo.pendientePago,
        monto_pagado_proveedor: pagoInfo.totalPagado,
        fecha_pagado: pagoInfo.fechaUltimoPago,

        // factura
        estado_factura_proveedor: facInfo.estado,
        total_facturado: facInfo.totalFacturado,
        monto_por_facturar: porFacturar,
        fecha_facturacion: facInfo.fechaUltimaFactura,
        UUID: facInfo.uuid,

        // acciones / raw
        acciones: "",

        // raw
        item: raw,
      };
    });

  const registrosVisibles = formatedSolicitudes;

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

      return {
        id_solicitud: anyS.id_solicitud ?? anyS.id ?? "",
        id_pago: anyS.id_pago ?? null,
        hotel: s.hotel ?? null,
        codigo_reservacion_hotel: s.codigo_reservacion_hotel ?? null,
        costo_total:
          s.costo_total ?? s.solicitud_proveedor?.monto_solicitado ?? "0",
        check_out: s.check_out ?? null,
        codigo_dispersion: anyS.codigo_dispersion ?? null,
        cuenta_de_deposito: (s as any).cuenta_de_deposito ?? null,

        solicitud_proveedor: s.solicitud_proveedor
          ? {
              id_solicitud_proveedor:
                s.solicitud_proveedor.id_solicitud_proveedor,
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

const clearSelection = useCallback(() => {
  setSelectedSolicitudesMap({});
  setSolicitud([]);
  setDatosDispersion([]);
}, []);

  // ---------- COLUMNAS (para orden estable + mostrar SP) ----------
  const customColumns = useMemo(
    () => [
      "seleccionar",

      // ✅ SP base / control
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

      // reserva/negocio
      "codigo_hotel",
      "creado",
      "hotel",
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

      // pagos / facturas
      "estado_pago",
      "pendiente_a_pagar",
      "monto_pagado_proveedor",
      "fecha_pagado",
      "estado_factura_proveedor",
      "total_facturado",
      "monto_por_facturar",
      "fecha_facturacion",
      "UUID",

      // tus campos actuales
      "comentarios_cxp",

      // ✅ acciones
      "acciones",
    ],
    [],
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
  // ---------- RENDERERS ----------
  const renderers: Record<
    string,
    React.FC<{ value: any; item: any; index: number }>
  > = {
    seleccionar: ({ item, index }) => {
      const row = item as any;
      const raw: SolicitudProveedor | undefined =
        (row.item as SolicitudProveedor) || row;
      // ✅ SOLO transfer puede seleccionarse (dispersión)
      const forma = getFormaPago(raw);
      const estadoSolicitud = normUpper(raw?.solicitud_proveedor?.estado_solicitud ?? "");
      const isCancelada = estadoSolicitud.includes("CANCEL");
      if (forma !== "transfer") {
        return (
          <span
            className="text-gray-300"
            title="Solo Transferencia se puede seleccionar"
          >
            —
          </span>
        );
      }
      if (isCancelada) {
  return (
    <span className="text-gray-300" title="Solicitud cancelada">
      —
    </span>
  );
}

      if (!raw) return null;

      // mejoramos “tieneDispersion” con pagos asociados
      const saldo = getSaldo(raw);
      const tieneDispersion = hasPagosAsociados(raw) || isZero(saldo);

      const key = String(
        (raw as any).id_solicitud ??
          (raw as any).id ??
          raw.solicitud_proveedor?.id_solicitud_proveedor ??
          index,
      );
      const isSelected = !!selectedSolicitudesMap[key];

      if (categoria === "pagada")
        return <span className="text-gray-300">—</span>;

      if (tieneDispersion) {
        return (
          <input
            type="checkbox"
            checked={false}
            disabled
            title="Esta solicitud ya tiene pagos/dispersiones asociadas o saldo 0"
          />
        );
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
              return prev.filter(
                (s) => ((s as any).id_solicitud ?? (s as any).id) !== rawId,
              );
            });

            setDatosDispersion((prev) => {
              const idSolProv =
                raw.solicitud_proveedor?.id_solicitud_proveedor ?? null;
              const idSol =
                (raw as any).id_solicitud ?? (raw as any).id ?? null;

              if (e.target.checked) {
                const nuevo: DatosDispersion = {
                  codigo_reservacion_hotel:
                    raw.codigo_reservacion_hotel ?? null,
                  costo_proveedor: Number((raw as any).costo_total) || 0,
                  id_solicitud: idSol,
                  id_solicitud_proveedor: idSolProv,
                  monto_solicitado:
                    Number(raw.solicitud_proveedor?.monto_solicitado) || 0,
                  razon_social: raw.proveedor?.razon_social ?? null,
                  rfc: raw.proveedor?.rfc ?? null,
                  cuenta_banco: (raw as any).cuenta_de_deposito ?? null,
                };

                const exists = prev.some(
                  (d) => d.id_solicitud === nuevo.id_solicitud,
                );
                return exists ? prev : [...prev, nuevo];
              } else {
                return prev.filter((d) => d.id_solicitud !== idSol);
              }
            });
          }}
        />
      );
    },

    id_solicitud_proveedor: ({ value }) => (
      <div className="px-1 py-0.5">
        <span className="font-mono text-xs" title={String(value)}>
          {String(value || "").slice(0, 10)}
        </span>
      </div>
    ),

    fecha_solicitud: ({ value }) => (
      <span title={value}>{formatDateSimple(value)}</span>
    ),

    monto_solicitado: ({ value, item }) => {
      const raw = (item as any)?.item ?? item;
      const id = getIdSolProv(raw);

      return (
        <InlineMoneyEdit
          id={id}
          value={Number(value || 0)}
          onSave={async (next) => {
            return await patchSolicitudProveedor(id, "monto_solicitado", next);
          }}
        />
      );
    },

    saldo: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),

    forma_pago_solicitada: ({ value }) => (
      <span className="font-semibold">
        {value
          ? String(value)
              .replace("transfer", "Transferencia")
              .replace("card", "Tarjeta")
              .replace("link", "Link")
              .replace("credit", "Carta garantía")
              .toUpperCase()
          : ""}
      </span>
    ),

    estatus_pagos: ({ value }) => (
      <Pill
        text={
          value
            ? String(value)
                .replace("enviado_a_pago", "Enviado a Pago")
                .replace("pagado", "Pagado")
                .toUpperCase()
            : "—"
        }
        tone="blue"
      />
    ),

    estado_solicitud: ({ value }) => (
      <span className="text-xs">{String(value ?? "—")}</span>
    ),
    estado_facturacion: ({ value }) => (
      <span className="text-xs">{String(value ?? "—")}</span>
    ),
    usuario_solicitante: ({ value }) => (
      <span className="text-xs">{String(value ?? "—")}</span>
    ),
    usuario_generador: ({ value }) => (
      <span className="text-xs">{String(value ?? "—")}</span>
    ),

    comentarios_sp: ({ value }) => {
      const t = String(value ?? "").trim();
      const prev = t.length > 40 ? t.slice(0, 40) + "…" : t;
      return (
        <span className="text-xs" title={t || "—"}>
          {t ? prev : <span className="text-gray-400">—</span>}
        </span>
      );
    },

    creado: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,
    codigo_hotel: ({ value }) => (
      <span className="font-semibold">
        {value ? String(value).toUpperCase() : ""}
      </span>
    ),
    check_in: ({ value }) => (
      <span title={value}>{formatDateSimple(value)}</span>
    ),
    check_out: ({ value }) => (
      <span title={value}>{formatDateSimple(value)}</span>
    ),

    costo_proveedor: ({ value }) => {
      const monto = Number(value || 0);
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-800 border border-gray-200">
          ${monto.toFixed(2)}
        </span>
      );
    },

    // ✅ comentarios CXP SOLO LECTURA
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

    pendiente_a_pagar: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),
    monto_pagado_proveedor: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),
    fecha_pagado: ({ value }) =>
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

    total_facturado: ({ value }) => (
      <span title={String(value)}>${Number(value || 0).toFixed(2)}</span>
    ),
    monto_por_facturar: ({ value }) => {
      const n = Number(value || 0);
      return (
        <span
          className={
            n <= EPS
              ? "text-green-700 font-semibold"
              : "text-amber-700 font-semibold"
          }
        >
          ${n.toFixed(2)}
        </span>
      );
    },
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

    // ✅ ACCIONES: 3 botones según reglas
    acciones: ({ item }) => {
      const row = item as any;
      const raw = row?.item ?? row;

      const idSolProv = getIdSolProv(raw);
      const forma = getFormaPago(raw);
      const pagado = isPagado(raw);

      // ✅ lee bien el estado (viene de raw.solicitud_proveedor o del row ya mapeado)
      const estadoSolicitud = normUpper(
        raw?.solicitud_proveedor?.estado_solicitud ??
          row?.estado_solicitud ??
          "",
      );
      const isCancelada = estadoSolicitud.includes("CANCEL");
      const cancelDisabled = pagado || isCancelada || categoria === "pagada";

      // ✅ si es CUPON, oculta acciones en todas las carpetas MENOS en carta_garantia
      if (estadoSolicitud.includes("CUPON") && categoria !== "carta_garantia")
        return null;

      const costoActual = Number((raw as any)?.costo_total ?? 0) || 0;

      return (
        <div className="flex items-center gap-2">
          {/* ✅ MÉTODO SOLO PARA carta_garantia */}
          {categoria === "carta_garantia" && (
          <MetodoPagoModal
            idSolProv={idSolProv}
            currentMethod={forma}
            currentCardId={raw?.solicitud_proveedor?.id_tarjeta_solicitada ?? null}
            onSetMethod={async (next) => {
              const ok = await patchSolicitudProveedor(idSolProv, "forma_pago_solicitada", next);
              if (ok) handleFetchSolicitudesPago();
              return ok;
            }}
            onSetCard={async ({ id_tarjeta_solicitada }) => {
              const ok = await patchSolicitudProveedor(idSolProv, "id_tarjeta_solicitada", id_tarjeta_solicitada);
              if (ok) handleFetchSolicitudesPago();
              return ok;
            }}
          />
          )}


          {/* Editar costo proveedor (SIEMPRE) */}
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            onClick={() => openEditModal(raw, "costo_proveedor", costoActual)}
            title="Editar costo proveedor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Costo</span>
          </button>

          {/* ✅ Cancelar (PATCH estado_solicitud=CANCELADA) */}
<button
  type="button"
  className={[
    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-sm",
    cancelDisabled
      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300",
  ].join(" ")}
  disabled={cancelDisabled}
  onClick={async () => {
    const okConfirm = window.confirm(
      `¿Seguro que deseas CANCELAR la solicitud ${idSolProv}?`,
    );
    if (!okConfirm) return;

    await cancelSolicitud(idSolProv);
  }}
  title={
    categoria === "pagada"
      ? "En carpeta pagada no se puede cancelar"
      : isCancelada
        ? "Ya está cancelada"
        : pagado
          ? "No se puede cancelar una solicitud pagada"
          : "Cancelar solicitud"
  }
>
  <Ban className="w-3.5 h-3.5" />
  <span>Cancelar</span>
</button>

          {/* Botón marcar pagado (solo si no es transfer) */}
          {forma !== "transfer" && (
            <button
              type="button"
              className={[
                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors shadow-sm",
                pagado
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300",
              ].join(" ")}
              disabled={pagado}
              onClick={async () => {
                /* ... */
              }}
              title={pagado ? "Ya está pagado" : "Marcar como pagado"}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagado</span>
            </button>
          )}

          {/* Conciliar (solo en pagados) */}
          {/* Botón conciliar (solo pagados) */}
          {pagado && (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm"
              onClick={async () => {
                /* ... */
              }}
              title="Conciliar (marca consolidado=1)"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Conciliar</span>
            </button>
          )}
        </div>
      );
    },

    // ✅ Mostrar TODOS los campos del SP (raw)

    // ----------- SOLICITUD -----------
    fecha_de_pago: ({ value }) => {
      if (!value) return <span className="text-gray-400">—</span>;
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
  };

  // ---------- Tabs config (carpetas) ----------
  const tabs = useMemo(
    () =>
      [
        { key: "all", label: "Todos", count: solicitudesPago.todos.length },
        { key: "spei", label: "SPEI", count: solicitudesPago.spei.length },
        {
          key: "pago_tdc",
          label: "Pago TDC",
          count: solicitudesPago.pago_tdc.length,
        },
        {
          key: "pago_link",
          label: "Pago Link",
          count: solicitudesPago.pago_link.length,
        },
        {
          key: "carta_enviada",
          label: "Carta enviada",
          count: solicitudesPago.carta_enviada.length,
        },
        {
          key: "carta_garantia",
          label: "Carta garantía",
          count: solicitudesPago.carta_garantia.length,
        },
        {
          key: "pagada",
          label: "Pagada",
          count: solicitudesPago.pagada.length,
        },
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

        {/* Tabs tipo carpetas */}
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
                <span
                  className={`mr-2 h-2.5 w-2.5 rounded-full ${theme.dot} shadow-sm`}
                />
                <span
                  className={`font-semibold ${isActive ? "text-slate-900" : theme.text}`}
                >
                  {btn.label}
                </span>
                <span
                  className={
                    "ml-2 text-[11px] px-2 py-0.5 rounded-full border font-semibold " +
                    (isActive ? theme.badgeActive : theme.badge)
                  }
                >
                  {btn.count}
                </span>
                {isActive && getActiveUnderline(btn.key)}
              </Button>
            );
          })}
        </div>

        {/* Barra de acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs text-slate-600">
            {categoria === "pagada"
              ? "Carpeta pagada (sin selección)"
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

                if (consolidado === 1) return "bg-blue-100"; // ✅ azul

                if (categoria === "pagada") return "";

                return getFechaPagoRowClass(
                  (row as any).pendiente_a_pagar <= 0
                    ? ""
                    : (row as any).fecha_solicitud,
                );
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
                  id_solicitud_proveedor: {editModal.id_solicitud_proveedor}
                </p>
                <p className="text-xs text-gray-500">
                  Campo: {editModal.field}
                </p>
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
              {editModal.field === "costo_proveedor" ? (
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
              ) : (
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  value={editModal.value}
                  onChange={(e) =>
                    setEditModal((s) => ({ ...s, value: e.target.value }))
                  }
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
                  onClick={() => void saveEditModal()}
                >
                  Cambiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
