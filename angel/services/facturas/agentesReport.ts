import { API_KEY, BACK_URL } from "@/angel/lib/env";

export type AgentesReportFiltros = {
  id_agente?: string | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
};

export type AgenteReportRow = {
  viajero: string;
  numero_empleado: string | null;
  codigo_empleado: string | null;
  host: string;
  tipo_habitacion: string;
  chin: string;
  chout: string;
  noches: number;
  tarifa_por_noche: string;
  monto_total_por_estancia: string;
  fecha_emision: string;
  estado_reserva: string;
  codigo_confirmacion: string;
  folio: string;
  uuid_factura: string;
  booking_subtotal: string;
  booking_iva: string;
  booking_total: string;
  [key: string]: unknown;
};

/**
 * TODO(pendiente): migrar a un endpoint v2 — ver angel/PENDIENTES.md.
 *
 * Mismo endpoint legacy que usa hoy app/dashboard/detalles_facturas/page.tsx.
 * Fetch directo (no createApiClient) porque el envelope de respuesta no
 * garantiza {message, data} — se replica la misma validación que ya hace
 * esa pantalla (Array.isArray(json?.data)).
 */
export async function getAgentesReportFac(
  filtros: AgentesReportFiltros,
): Promise<AgenteReportRow[]> {
  const qs = new URLSearchParams();
  if (filtros.id_agente) qs.set("id_agente", filtros.id_agente);
  if (filtros.fecha_desde) qs.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) qs.set("fecha_hasta", filtros.fecha_hasta);

  const res = await fetch(
    `${BACK_URL}/v1/mia/factura/agentes_report_fac?${qs.toString()}`,
    {
      headers: {
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
  }

  const arr = Array.isArray(json?.data) ? json.data : null;
  if (!arr) {
    throw new Error("Respuesta inválida: no existe data.data (json.data).");
  }
  if (arr?.[0]?.error || arr?.[1]?.error) {
    throw new Error("Error al cargar los datos (SP retornó error).");
  }

  return arr;
}
