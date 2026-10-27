import { ApiError } from "@/angel/services/apiClient";
import type {
  CotizacionIaEstado,
  CotizacionIaOrigenEntrada,
  QuoteItem,
  QuoteServiceType,
} from "@/angel/services/cotizacionesIa";

// ======================================================
// ETIQUETAS
// ======================================================

export const TIPO_SERVICIO_LABEL: Record<QuoteServiceType, string> = {
  flight: "Vuelo",
  car_rental: "Renta de auto",
  hotel: "Hotel",
  bus: "Autobús",
};

export const ESTADO_LABEL: Record<CotizacionIaEstado, string> = {
  nueva: "Nueva",
  en_proceso: "En proceso",
  cotizada: "Cotizada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

export const ESTADO_STYLE: Record<CotizacionIaEstado, string> = {
  nueva: "bg-blue-100 text-blue-700 border border-blue-300",
  en_proceso: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  cotizada: "bg-green-100 text-green-700 border border-green-300",
  cerrada: "bg-gray-100 text-gray-600 border border-gray-300",
  cancelada: "bg-red-100 text-red-700 border border-red-300",
};

export const ORIGEN_ENTRADA_LABEL: Record<CotizacionIaOrigenEntrada, string> = {
  texto: "Texto (chat con MIA)",
  pdf: "PDF",
  imagen: "Imagen",
  csv: "CSV",
  excel: "Excel",
  mixto: "Varios archivos",
};

// Los FilterInput de tipo "select" trabajan con texto: se muestran las etiquetas
// y se convierten de vuelta al código que espera el backend.
export const ESTADOS_FILTRO = Object.entries(ESTADO_LABEL).map(
  ([codigo, label]) => ({ codigo: codigo as CotizacionIaEstado, label }),
);

export const TIPOS_FILTRO = Object.entries(TIPO_SERVICIO_LABEL).map(
  ([codigo, label]) => ({ codigo: codigo as QuoteServiceType, label }),
);

const TIPOS_VALIDOS = new Set<string>(Object.keys(TIPO_SERVICIO_LABEL));

export const etiquetaEstado = (estado: string): string =>
  ESTADO_LABEL[estado as CotizacionIaEstado] ?? estado;

export const etiquetaTipo = (tipo: string): string =>
  TIPO_SERVICIO_LABEL[tipo as QuoteServiceType] ?? tipo;

// ======================================================
// NORMALIZACIÓN (el backend guarda `tipos` como CSV y `items` como JSON)
// ======================================================

export function normalizarTipos(raw: unknown): QuoteServiceType[] {
  const lista = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [];
  return lista
    .map((t) => String(t).trim())
    .filter((t): t is QuoteServiceType => TIPOS_VALIDOS.has(t));
}

export function normalizarItems(raw: unknown): QuoteItem[] {
  let lista: unknown = raw;
  if (typeof raw === "string") {
    try {
      lista = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(lista)) return [];
  return lista.filter(
    (it): it is QuoteItem =>
      !!it && typeof it === "object" && TIPOS_VALIDOS.has((it as QuoteItem).type),
  );
}

// ======================================================
// FORMATO
// ======================================================

/** "2026-11-15" (o ISO completo) → "15 nov 2026", sin desfase de zona horaria. */
export function fechaLegible(iso?: string | null): string {
  if (!iso) return "";
  const [anio, mes, dia] = iso.split("T")[0].split("-");
  if (!anio || !mes || !dia) return iso;
  return new Date(Number(anio), Number(mes) - 1, Number(dia)).toLocaleDateString(
    "es-MX",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

export function fechaHoraLegible(iso?: string | null): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function tamanoLegible(bytes?: number | null): string {
  if (bytes == null || isNaN(Number(bytes))) return "";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ======================================================
// ITEMS → campos legibles (solo los que vienen con dato; nunca precios)
// ======================================================

export type CampoLegible = { label: string; value: string };

const TIPO_VIAJE_LABEL: Record<string, string> = {
  oneway: "Solo ida",
  roundtrip: "Redondo",
  multicity: "Multidestino",
};

const conHora = (fecha?: string, hora?: string): string =>
  [fechaLegible(fecha), hora].filter(Boolean).join(" · ");

export function camposDeItem(item: QuoteItem): CampoLegible[] {
  const campos: Array<[string, string | undefined]> = [];

  switch (item.type) {
    case "flight":
      campos.push(
        ["Tipo de viaje", item.tripType ? TIPO_VIAJE_LABEL[item.tripType] : undefined],
        ["Origen", item.origin],
        ["Destino", item.destination],
        ["Salida", fechaLegible(item.departureDate)],
        ["Regreso", fechaLegible(item.returnDate)],
        ["Aerolínea", item.airline],
        ["Clase", item.cabin],
        ["Número de vuelo", item.flightNumber],
      );
      break;
    case "car_rental":
      campos.push(
        ["Recoger en", item.pickupLocation],
        ["Devolver en", item.dropoffLocation],
        ["Recogida", conHora(item.pickupDate, item.pickupTime)],
        ["Devolución", conHora(item.dropoffDate, item.dropoffTime)],
        ["Categoría", item.carCategory],
        [
          "Con chofer",
          item.withDriver == null ? undefined : item.withDriver ? "Sí" : "No",
        ],
      );
      break;
    case "hotel":
      campos.push(
        ["Ciudad", item.city],
        ["Hotel", item.hotelName],
        ["Check-in", fechaLegible(item.checkIn)],
        ["Check-out", fechaLegible(item.checkOut)],
        ["Habitaciones", item.rooms != null ? String(item.rooms) : undefined],
        ["Tipo de habitación", item.roomType],
        ["Huéspedes", item.guests != null ? String(item.guests) : undefined],
      );
      break;
    case "bus":
      campos.push(
        ["Origen", item.origin],
        ["Destino", item.destination],
        ["Salida", fechaLegible(item.departureDate)],
        ["Regreso", fechaLegible(item.returnDate)],
        ["Línea", item.busLine],
        ["Clase de servicio", item.serviceClass],
      );
      break;
  }

  campos.push(
    ["Viajeros", item.travelers != null ? String(item.travelers) : undefined],
    [
      "Nombres de viajeros",
      item.travelerNames?.length ? item.travelerNames.join(", ") : undefined,
    ],
    ["Notas", item.notes],
  );

  return campos
    .filter((c): c is [string, string] => !!c[1])
    .map(([label, value]) => ({ label, value }));
}

// ======================================================
// ERRORES
// ======================================================

/**
 * `verificarPermiso` de bacl responde 404 (sin `error.code`) cuando falta sesión
 * o permiso, igual que cuando el recurso no existe; el mensaje debe cubrir ambos.
 */
export function mensajeErrorCotizaciones(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404 && !err.response?.error?.code) {
      return "No tienes acceso a este recurso o no existe.";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Ocurrió un error inesperado.";
}

/**
 * La URL firmada llega del backend, pero se valida antes de abrirla: solo https
 * (o http://localhost fuera de producción), nunca esquemas como javascript: o data:.
 */
export function esUrlArchivoSegura(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return true;
    return (
      process.env.NODE_ENV !== "production" &&
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}
