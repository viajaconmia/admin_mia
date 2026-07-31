import { ApiResponse, createApiClient } from "../apiClient";

const reservasApi = createApiClient("/v2/mia/reservas");

export type SolicitudPendienteRaw = {
  id_solicitud: string;
  id_servicio: string;
  id_agente: string;
  id_hospedaje: string | null;
  id_hotel_solicitud: string;
  id_hotel_reserva: string | null;
  id_viajero_solicitud: string;
  id_viajero_reserva: string | null;
  id_booking: string | null;
  id_pago: string | null;
  id_credito: string | null;
  id_factura: string | null;
  id_facturama: string | null;
  status_solicitud: string;
  status_reserva: string | null;
  etapa_reservacion: string;
  created_at_solicitud: string;
  created_at_reserva: string | null;
  updated_at: string | null;
  check_in: string | null;
  check_out: string | null;
  check_in_solicitud: string | null;
  check_out_solicitud: string | null;
  hotel_solicitud: string;
  hotel_reserva: string | null;
  room: string;
  tipo_cuarto: string | null;
  codigo_reservacion_hotel: string | null;
  confirmation_code: string;
  nuevo_incluye_desayuno: string | null;
  total_solicitud: string;
  total: string | null;
  costo_total: string | null;
  nombre_cliente: string;
  correo: string;
  telefono: string | null;
  rfc: string | null;
  tipo_persona: string;
  nombre_viajero_solicitud: string;
  nombre_viajero_reservacion: string | null;
  quien_reservó: string;
  metodo_pago_dinamico: string;
  comments: string | null;
};

export const reservasService = {
  getSolicitudesPendientes: (): Promise<ApiResponse<SolicitudPendienteRaw[]>> =>
    reservasApi.get<SolicitudPendienteRaw[]>("/solicitudes/pendientes"),
};
