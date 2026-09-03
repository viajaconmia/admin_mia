import { ApiResponse, createApiClient } from "../apiClient";

const facturaApi = createApiClient("/v2/mia/factura");

export type EnvioFactura = {
  id_envio: number;
  id_factura: string;
  correo_destino: string;
  id_usuario: string;
  nombre_usuario: string;
  fecha_envio: string;
};

export type EnviarCorreoFacturaBody = {
  id_factura: string;
  correo_destino: string;
};

export type EnviarCorreoFacturaResponse = {
  facturama: unknown;
};

export const envioFacturaService = {
  enviarCorreoFactura: (
    body: EnviarCorreoFacturaBody,
  ): Promise<ApiResponse<EnviarCorreoFacturaResponse>> =>
    facturaApi.post<EnviarCorreoFacturaResponse>("/envio/enviar", body),

  getHistorialEnvios: (params: {
    id_factura: string;
    page?: number;
    length?: number;
  }): Promise<ApiResponse<EnvioFactura[]>> =>
    facturaApi.get<EnvioFactura[]>("/envio/historial", params),
};
