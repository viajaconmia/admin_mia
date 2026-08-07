import { ApiResponse, createApiClient } from "../apiClient";

const conciliacionApi = createApiClient("/v2/mia/pago_proveedor");

export type BuscarUuidFacturaItem = {
  monto_facturado: number;
  monto_solicitado: number;
  uuid_factura: string;
  id_factura_proveedor: number;
  id_booking: number;
  codigo_confirmacion: string;
  estado: string;
  id_solicitud: number;
};

export type DesasignarFacturaParams = {
  id_factura: string;
  id_solicitud: number;
};

export type DesasignarFacturaResponse = {
  id: number;
  id_solicitud: number;
  id_factura: string;
  monto_facturado: number;
  monto_pago: number;
};

// Todas las columnas de vw_saldos_facturas_proveedores para esa factura
// (saldos + detalle completo). Tipamos los campos que ya usamos; puede traer
// más columnas de la vista que todavía no consumimos.
export type FacturaProveedorDetalle = {
  id_factura: string;
  uuid_factura: string;
  total: string;
  propina: string;
  total_con_propina: string;
  monto_facturado: string;
  restante_por_facturar: string;
  [key: string]: unknown;
};

export const conciliacionService = {
  buscarUuidFactura: (
    uuid_factura: string,
  ): Promise<ApiResponse<BuscarUuidFacturaItem[]>> =>
    conciliacionApi.get<BuscarUuidFacturaItem[]>("/facturas/solicitudes", {
      uuid_factura,
    }),

  desasignarFactura: (
    params: DesasignarFacturaParams,
  ): Promise<ApiResponse<DesasignarFacturaResponse>> =>
    conciliacionApi.delete<DesasignarFacturaResponse>(
      "/facturas/solicitudes",
      params,
    ),

  getFacturaByUuid: (
    uuid_factura: string,
  ): Promise<ApiResponse<FacturaProveedorDetalle>> =>
    conciliacionApi.get<FacturaProveedorDetalle>("/facturas", {
      uuid_factura,
    }),
};
