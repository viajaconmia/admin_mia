import { SolicitudProveedor } from "@/types";
import { SolicitudesPorFiltro } from "./types";

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

const extractId = (raw: any): string =>
  String(
    raw?.solicitud_proveedor?.id_solicitud_proveedor ??
      raw?.id_solicitud_proveedor ??
      "",
  ).trim();

export const dedupeSolicitudes = (arr: any[]): SolicitudProveedor[] => {
  const map = new Map<string, SolicitudProveedor>();
  for (const it of arr || []) {
    const id = extractId(it);
    if (!id) continue;
    if (!map.has(id)) map.set(id, it);
  }
  return Array.from(map.values());
};

export const normalizeApiBuckets = (data: any): SolicitudesPorFiltro => {
  if (Array.isArray(data)) {
    const spei: any[] = [], pago_tdc: any[] = [], pago_link: any[] = [],
      pendiente_credito: any[] = [], ap_credito: any[] = [], pagada: any[] = [],
      notificados: any[] = [], canceladas: any[] = [];
    for (const row of data) {
      const f = String(row?.filtro_pago ?? "").toLowerCase();
      if (f === "spei" || f === "spei_solicitado") spei.push(row);
      else if (f === "pago_tdc") pago_tdc.push(row);
      else if (f === "pago_link") pago_link.push(row);
      else if (f === "pendiente_credito" || f === "carta_enviada") pendiente_credito.push(row);
      else if (f === "ap_credito" || f === "carta_garantia") ap_credito.push(row);
      else if (f === "pagada") pagada.push(row);
      else if (f === "notificados") notificados.push(row);
      else if (f === "canceladas") canceladas.push(row);
    }
    const todos = dedupeSolicitudes([...spei, ...pago_tdc, ...pago_link, ...pendiente_credito, ...ap_credito, ...pagada, ...notificados, ...canceladas]);
    return { todos, spei, pago_tdc, pago_link, pendiente_credito, ap_credito, pagada, notificados, canceladas };
  }
  const spei = Array.isArray(data?.spei) ? data.spei : (Array.isArray(data?.spei_solicitado) ? data.spei_solicitado : []);
  const pago_tdc = Array.isArray(data?.pago_tdc) ? data.pago_tdc : [];
  const pago_link = Array.isArray(data?.pago_link) ? data.pago_link : [];
  const pendiente_credito = Array.isArray(data?.pendiente_credito) ? data.pendiente_credito : (Array.isArray(data?.carta_enviada) ? data.carta_enviada : []);
  const ap_credito = Array.isArray(data?.ap_credito) ? data.ap_credito : (Array.isArray(data?.carta_garantia) ? data.carta_garantia : []);
  const pagada = Array.isArray(data?.pagada) ? data.pagada : [];
  const notificados = Array.isArray(data?.notificados) ? data.notificados : [];
  const canceladas = Array.isArray(data?.canceladas) ? data.canceladas : [];
  const todos = dedupeSolicitudes([...spei, ...pago_tdc, ...pago_link, ...pendiente_credito, ...ap_credito, ...pagada, ...notificados, ...canceladas]);
  return { todos, spei, pago_tdc, pago_link, pendiente_credito, ap_credito, pagada, notificados, canceladas };
};
