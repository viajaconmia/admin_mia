import { ApiResponse, createApiClient } from "../apiClient";

const conciliacionApi = createApiClient("/v2/mia/pago_proveedor");

export type BuscarUuidFacturaItem = {
  monto_facturado: number;
  monto_propina: number;
  monto_impsan: number;
  monto_facturado_final: number;
  monto_solicitado: number;
  uuid_factura: string;
  id_factura_proveedor: number;
  id_booking: number;
  codigo_confirmacion: string;
  estado: string;
  id_solicitud: number;
};

export type EditarPagoFacturaParams = {
  id_factura: string;
  id_solicitud: number;
};

export type EditarPagoFacturaBody = Partial<{
  monto_facturado: number;
  monto_propina: number;
  monto_impsan: number;
}>;

export type EditarPagoFacturaResponse = {
  id_factura: string;
  id_solicitud: number;
  [key: string]: unknown;
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

// Todas las columnas de la factura de proveedor (saldos + detalle completo).
// Tipamos los campos que ya usamos; puede traer más columnas que todavía no
// consumimos.
export type FacturaProveedorDetalle = {
  id_factura_proveedor: string;
  uuid_cfdi: string;
  total: string;
  total_final: string;
  propina: string | null;
  propina_aplicada: string | null;
  impsan: string | null;
  monto_facturado: string;
  [key: string]: unknown;
};

export type EditarPropinaImpsanResponse = {
  id_factura_proveedor: string;
  propina: number;
  impsan: number;
};

export const conciliacionService = {
  buscarUuidFactura: (
    uuid_factura: string,
  ): Promise<ApiResponse<BuscarUuidFacturaItem[]>> =>
    conciliacionApi.get<BuscarUuidFacturaItem[]>("/facturas/solicitudes", {
      uuid_factura,
    }),

  editarPagoFactura: (
    params: EditarPagoFacturaParams,
    body: EditarPagoFacturaBody,
  ): Promise<ApiResponse<EditarPagoFacturaResponse>> =>
    conciliacionApi.put<EditarPagoFacturaResponse>(
      `/facturas/solicitudes?id_factura=${encodeURIComponent(params.id_factura)}&id_solicitud=${params.id_solicitud}`,
      body,
    ),

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

  editarPropinaImpsan: (
    id_factura_proveedor: string,
    body: { propina: number; impsan: number },
  ): Promise<ApiResponse<EditarPropinaImpsanResponse>> =>
    conciliacionApi.put<EditarPropinaImpsanResponse>(
      `/facturas?id_factura_proveedor=${encodeURIComponent(id_factura_proveedor)}`,
      body,
    ),
};
