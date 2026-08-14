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

// SELECT * de vw_new_details_booking. Se deja el índice de más para tolerar
// columnas nuevas que agregue la vista sin romper el tipado.
export type ReservaComisionable = {
  id_relacion: string;
  id_viajero: string;
  id_solicitud_client: string;
  created_at: string;
  total: string;
  check_in: string;
  estado: string;
  tipo_cuarto_vuelo: string | null;
  check_out: string;
  costo_total: string;
  metodo_pago: string;
  id_agente: string;
  nombre_agente: string;
  nombre_viajero: string;
  id_booking: string;
  prefacturado: string;
  codigo_confirmacion: string;
  is_comisionable: 0 | 1;
  monto_comisionable: string;
  porcentaje_comisionable: string;
  comentarios_comisionables: string;
  comision_cobrada: 0 | 1;
  proveedor: string;
  id_proveedor: number;
  id_proveedor_service: string;
  negociacion_proveedor: string;
  type: string;
  id_intermediario: string | null;
  [key: string]: unknown;
};

export type FiltrosComisionables = {
  page?: number;
  length?: number;
  proveedor?: string;
  id_intermediario?: string;
  comision_cobrada?: string;
  comentarios_comisionables?: string;
  estado?: string;
  codigo_confirmacion?: string;
  [key: string]: unknown;
};

export type EditarComisionablesBody = {
  is_comisionable: 0 | 1;
  monto_comisionable: number | null;
  porcentaje_comisionable: number | null;
  comentarios_comisionables: string;
};

export type EditarComisionablesResponse = {
  id_booking: string;
  is_comisionable: 0 | 1;
  monto_comisionable: string | number | null;
  porcentaje_comisionable: string | number | null;
  comentarios_comisionables: string;
};

export const reservasService = {
  getSolicitudesPendientes: (): Promise<ApiResponse<SolicitudPendienteRaw[]>> =>
    reservasApi.get<SolicitudPendienteRaw[]>("/solicitudes/pendientes"),

  getComisionables: (
    filtros: FiltrosComisionables = {},
  ): Promise<ApiResponse<ReservaComisionable[]>> =>
    reservasApi.get<ReservaComisionable[]>("/comisionables", filtros),

  cobrarComision: (id_booking: string): Promise<ApiResponse<null>> =>
    reservasApi.patch<null>(`/comisionables/${id_booking}/cobrar`),

  editarComisionables: (
    id_booking: string,
    body: EditarComisionablesBody,
  ): Promise<ApiResponse<EditarComisionablesResponse>> =>
    reservasApi.patch<EditarComisionablesResponse>(
      `/comisionables/${id_booking}`,
      body,
    ),
};
