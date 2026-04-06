// helpers/cfdiHelpers.ts
export const CFDI_USO_LABELS: Record<string, string> = {
  G01: "Adquisición de mercancías",
  G02: "Devoluciones, descuentos o bonificaciones",
  G03: "Gastos en general",
  I01: "Construcciones",
  I02: "Mobiliario y equipo de oficina por inversiones",
  I03: "Equipo de transporte",
  I04: "Equipo de cómputo y accesorios",
  I05: "Dados, troqueles, moldes, matrices y herramental",
  I06: "Comunicaciones telefónicas",
  I07: "Comunicaciones satelitales",
  I08: "Otra maquinaria y equipo",
  D01: "Honorarios médicos, dentales y gastos hospitalarios",
  D02: "Gastos médicos por incapacidad o discapacidad",
  D03: "Gastos funerales",
  D04: "Donativos",
  D05: "Intereses reales efectivamente pagados por créditos hipotecarios",
  D06: "Aportaciones voluntarias al SAR",
  D07: "Primas por seguros de gastos médicos",
  D08: "Gastos de transportación escolar obligatoria",
  D09: "Depósitos en cuentas para el ahorro, primas con base en planes de pensiones",
  D10: "Pagos por servicios educativos (colegiaturas)",
  S01: "Sin efectos fiscales",
  CP01: "Pagos",
  CN01: "Nómina",
};

export const CFDI_FORMA_PAGO_LABELS: Record<string, string> = {
  "01": "Efectivo",
  "02": "Cheque nominativo",
  "03": "Transferencia electrónica de fondos",
  "04": "Tarjeta de crédito",
  "05": "Monedero electrónico",
  "06": "Dinero electrónico",
  "08": "Vales de despensa",
  "12": "Dación en pago",
  "13": "Pago por subrogación",
  "14": "Pago por consignación",
  "15": "Condonación",
  "17": "Compensación",
  "23": "Novación",
  "24": "Confusión",
  "25": "Remisión de deuda",
  "26": "Prescripción o caducidad",
  "27": "A satisfacción del acreedor",
  "28": "Tarjeta de débito",
  "29": "Tarjeta de servicios",
  "30": "Aplicación de anticipos",
  "31": "Intermediario pagos",
  "99": "Por definir",
};

export const CFDI_METODO_PAGO_LABELS: Record<string, string> = {
  PUE: "Pago en una sola exhibición",
  PPD: "Pago en parcialidades o diferido",
};

export const formatSatValue = (value: any, catalog: Record<string, string>) => {
  const code = String(value ?? "").trim().toUpperCase();
  if (!code) return "—";
  return catalog[code] ? `${code} - ${catalog[code]}` : code;
};

export const parseNum = (v: any) => (v == null || v === "" ? 0 : Number(v));
export const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
export const normUpper = (s?: string | null) => (s ?? "").trim().toUpperCase();

export const EPS = 0.01;
export const isZero = (n: any) => Math.abs(Number(n) || 0) < EPS;

export const tryParseJson = (v: any) => {
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

export const normalizeToArray = (v: any): any[] => {
  const parsed = tryParseJson(v);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
};

// Extrae pagos reales aunque vengan como array, string JSON o mezclados
export const extractPagosAsociados = (raw: any): any[] => {
  const candidates: any[] = [];
  if (Array.isArray(raw?.pagos)) candidates.push(...raw.pagos);
  if (raw?.pagos_json != null) candidates.push(raw.pagos_json);
  if (raw?.dispersiones_json != null) candidates.push(raw.dispersiones_json);

  const out: any[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      out.push(...c.flatMap((x) => normalizeToArray(x)));
    } else {
      out.push(...normalizeToArray(c));
    }
  }
  return out.filter((p) => p && typeof p === "object" && Object.keys(p).length > 0);
};

export const hasPagosAsociados = (raw: any) => extractPagosAsociados(raw).length > 0;

// Facturas: soporta facturas, facturas_json, etc.
export const extractFacturas = (raw: any): any[] => {
  const candidates: any[] = [];
  if (Array.isArray(raw?.facturas)) candidates.push(raw.facturas);
  if (raw?.facturas_json != null) candidates.push(raw.facturas_json);
  if (raw?.facturas_proveedor_json != null) candidates.push(raw.facturas_proveedor_json);
  if (raw?.sp_obtener_pagos_proveedor?.facturas_json != null)
    candidates.push(raw.sp_obtener_pagos_proveedor.facturas_json);

  const out: any[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) out.push(...c.flatMap((x) => normalizeToArray(x)));
    else out.push(...normalizeToArray(c));
  }

  const limpias = out.filter((f) => f && typeof f === "object" && Object.keys(f).length > 0);
  const seen = new Set<string>();
  return limpias.filter((f, idx) => {
    const key = String(
      f?.uuid_factura ?? f?.uuid_cfdi ?? f?.uuid ?? f?.id_factura_proveedor ?? f?.url_pdf ?? f?.url_xml ?? `idx-${idx}`
    ).trim().toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const openFacturaFile = (url?: string | null) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

export const getFileNameFromUrl = (url?: string | null, fallback = "factura.pdf") => {
  if (!url) return fallback;
  try {
    const cleanUrl = url.split("?")[0];
    const last = cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
    return last || fallback;
  } catch {
    return fallback;
  }
};

export const downloadFacturaFile = async (url?: string | null, fallbackName = "factura.pdf") => {
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = getFileNameFromUrl(url, fallbackName);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("No se pudo descargar el archivo, abriendo en nueva pestaña", error);
    window.open(url, "_blank", "noopener,noreferrer");
  }
};