import { ApiResponse, createApiClient } from "../apiClient";

const facturaApi = createApiClient("/v2/mia/factura");

export type ReservaPendienteFacturar = {
  id_relacion: string;
  codigo_confirmacion: string;
  proveedor: string;
  type: string;
  nombre_agente: string;
  metodo_pago: string;
  total: string;
  check_in: string;
  check_out: string;
  created_at: string;
  total_facturado: string;
  pendiente_facturar: string;
};

export type FiltrosReservasPendientes = {
  id_agente?: string;
};

export const reservasFacturaService = {
  getReservasPendientesFacturar: (
    filtros: FiltrosReservasPendientes,
  ): Promise<ApiResponse<ReservaPendienteFacturar[]>> =>
    facturaApi.get<ReservaPendienteFacturar[]>("/reservas/pendientes", filtros),
};
