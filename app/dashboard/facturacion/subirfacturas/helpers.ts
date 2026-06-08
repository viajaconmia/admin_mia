import { URL, API_KEY } from "@/lib/constants/index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Agente {
  id_agente: string;
  nombre_agente_completo: string;
  correo: string;
  rfc?: string;
  razon_social?: string;
}

export interface Pago {
  id_agente: string;
  raw_id: string;
  rawIds: any[];
  id_pago: string;
  pago_referencia: string;
  pago_concepto: string;
  pago_fecha_pago: string;
  metodo_de_pago: string;
  tipo_tarjeta?: string;
  tipo_de_tarjeta?: string;
  banco?: string;
  banco_tarjeta?: string;
  total: number;
  subtotal: number | null;
  impuestos: number | null;
  pendiente_por_cobrar: number;
  last_digits?: string;
  ult_digits?: number;
  autorizacion_stripe?: string;
  numero_autorizacion?: string;
  monto_por_facturar: any;
  monto: any;
  is_facturable: number;
  saldos: any[];
}

export type AsociacionSolicitudProveedor = {
  id_solicitud: string;
  id_proveedor: string;
  monto_asociar: string;
  raw?: any;
};

export interface FacturaErrors {
  clienteSeleccionado?: string;
  empresaSeleccionada?: string;
  archivoXML?: string;
  archivoPDF?: string;
}

// ─── Utilidades puras ─────────────────────────────────────────────────────────

export const toArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export const extractFirstEmail = (text?: string): string => {
  if (!text) return "";
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m?.[0] ?? "";
};

export const normalizeProveedoresAsAgentes = (res: any): Agente[] => {
  const arr = toArray(res);
  return arr
    .map((p: any) => ({
      id_agente: String(p?.id_proveedor ?? p?.id ?? ""),
      nombre_agente_completo: String(p?.proveedor ?? ""),
      correo: String(p?.correo ?? extractFirstEmail(p?.contactos_convenio) ?? ""),
      rfc: p?.rfc,
      razon_social: p?.razon_social,
    }))
    .filter((x) => x.id_agente && x.nombre_agente_completo);
};

export const safeNumStr = (raw: string) => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  return parts.length <= 1
    ? parts[0]
    : `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
};

export const getIdSolicitudFromRow = (row: any): string => {
  console.log(row.id_solicitud_proveedor, "000000000🔽🔽🔽🔽");
  return String(
    row?.id_solicitud_proveedor ??
      row?.row_id ??
      row?.id_solicitud ??
      row?.id_solicitud_pago_proveedor ??
      row?.id_solicitud_prov ??
      row?.id_solicitud_pp ??
      "",
  );
};

export const getIdProveedorFromRow = (row: any): string => {
  console.log(row, "🤬🤬🤬,informacion de hote");
  return String(row?.id_proveedor ?? row?.proveedor_id ?? row?.id ?? "");
};

export const getCodigoHotelFromRow = (row: any): string => {
  console.log(row, "🤬🤬🤬,informacion de hote");
  return String(row?.codigo_hotel ?? row?.proveedor_id ?? row?.id ?? "");
};

export const normalizeRfc = (value: any) =>
  String(value ?? "").trim().toUpperCase();

export const getResponseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await response.json().catch(() => null);
    return (
      json?.message ||
      json?.details ||
      json?.error ||
      (typeof json === "string" ? json : null) ||
      `Error ${response.status}`
    );
  }

  const text = await response.text().catch(() => "");
  return text || `Error ${response.status}`;
};

export const round2 = (n: any) => {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const normalizeCurrency = (value: any) =>
  String(value ?? "").trim().toUpperCase();

export const isMXNCurrency = (value: any) => {
  const c = normalizeCurrency(value);
  return (
    c === "MXN" || c === "MN" || c === "MXP" || c === "PESO" || c === "PESOS"
  );
};

export const getTipoCambioFactura = (facturaData: any) => {
  const moneda = normalizeCurrency(facturaData?.comprobante?.moneda || "MXN");
  const tc = Number(facturaData?.comprobante?.tipoCambio || 1);
  if (isMXNCurrency(moneda)) return 1;
  return Number.isFinite(tc) && tc > 0 ? tc : 0;
};

export const convertAmountToMXN = (
  amount: any,
  tipoCambio: number,
  applyConversion: boolean,
) => {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return 0;
  const factor = applyConversion ? Number(tipoCambio || 0) : 1;
  if (applyConversion && (!Number.isFinite(factor) || factor <= 0)) return 0;
  return round2(n * factor);
};

export const formatMoneyMXN = (value: any) => {
  const n = Number(value || 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
};

export const normalizeUUIDInput = (value: string) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(
      /[‐‑‒–—―−⁃﹘﹣－]/g,
      "-",
    )
    .replace(/\s+/g, "")
    .replace(/[^A-F0-9-]/g, "");

export const validateFacturaForm = (formData: {
  clienteSeleccionado: Agente | null;
  archivoXML: File | null;
  isProveedorBatch: boolean;
}): FacturaErrors => {
  const errors: FacturaErrors = {};

  if (!formData.isProveedorBatch) {
    if (!formData.clienteSeleccionado) {
      errors.clienteSeleccionado = "Debes seleccionar un cliente";
    }
  }

  if (!formData.archivoXML) {
    errors.archivoXML = "El archivo XML es requerido";
  }

  return errors;
};

// ─── API ──────────────────────────────────────────────────────────────────────

const AUTH = { "x-api-key": API_KEY };

export const getEmpresasDatosFiscales = async (agent_id: string) => {
  try {
    const response = await fetch(
      `${URL}/v1/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(agent_id)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json", ...AUTH },
      },
    );
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Error al obtener empresas con datos fiscales:", error);
    throw error;
  }
};

export const consultarFacturadoSolicitudes = async (idsSolicitud: string[]) => {
  const idsLimpios = Array.from(
    new Set(
      (idsSolicitud || []).map((id) => String(id ?? "").trim()).filter(Boolean),
    ),
  );

  if (!idsLimpios.length) return null;

  const params = new URLSearchParams();
  idsLimpios.forEach((id) => params.append("id_solicitud", id));

  const resp = await fetch(
    `${URL}/mia/pago_proveedor/consultar_facturado?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    },
  );

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Error consultando facturado: ${txt}`);
  }

  return await resp.json();
};

export const fetchDatosFiscalesProveedor = async (id_proveedor: string) => {
  const resp = await fetch(
    `${URL}/mia/pago_proveedor/datosFiscales?id_proveedor=${encodeURIComponent(id_proveedor)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    },
  );

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Error datos fiscales proveedor (${resp.status}): ${t}`);
  }

  const json = await resp.json();
  return Array.isArray(json?.data) ? json.data : [];
};
