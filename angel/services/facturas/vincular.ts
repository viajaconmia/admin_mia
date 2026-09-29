import { ApiResponse, createApiClient } from "../apiClient";

const facturaApi = createApiClient("/v2/mia/factura");

export type VincularPagoFacturaBody = {
  raw_id: string;
  uuid_factura: string;
};

export type VincularPagoFacturaResponse = {
  id_factura: string;
  raw_id: string;
  monto_aplicado: number;
  items_facturados: number;
};

export type DesvincularPagoFacturaBody = {
  /** id_pago ("pag-...") o id_saldos del saldo a favor */
  raw_id: string;
  /** id interno de la factura (no el uuid fiscal) */
  id_factura: string;
};

export type DesvincularPagoFacturaResponse = {
  id_factura: string;
  raw_id: string;
  desvinculado: boolean;
};

export const vincularPagoFacturaService = {
  desvincularPagoFactura: (
    body: DesvincularPagoFacturaBody,
  ): Promise<ApiResponse<DesvincularPagoFacturaResponse>> =>
    facturaApi.post<DesvincularPagoFacturaResponse>("/desvincular-pago", body),

  vincularPagoFactura: (
    body: VincularPagoFacturaBody,
  ): Promise<ApiResponse<VincularPagoFacturaResponse>> =>
    facturaApi.post<VincularPagoFacturaResponse>("/vincular-pago", body),
};
