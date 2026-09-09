import { createApiClient } from "../apiClient";

const reporteAgenteApi = createApiClient("/v2/mia/factura/reservas");

export type AgentesReportFiltros = {
  id_agente?: string | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
};

export type AgenteReportRow = {
  id_booking: string;
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
  ticket_zoho: string | null;
  portal: string | null;
  orden_compra: string | null;
  cliente_solicitante_reserva: string | null;
  fecha_pago_ar: string | null;
  estatus_pago_ar: string | null;
  id_factura: string | null;
  uuid_crp: string | null;
  [key: string]: unknown;
};

export async function getReporteAgente(
  filtros: AgentesReportFiltros,
): Promise<AgenteReportRow[]> {
  const { data } = await reporteAgenteApi.get<AgenteReportRow[]>(
    "/reporte-agente",
    filtros,
  );
  return data ?? [];
}
