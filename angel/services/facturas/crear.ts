import { ApiResponse, createApiClient } from "../apiClient";
import { CfdiPayload } from "../../lib/cfdi/payload";

const facturaApiV1 = createApiClient("/v1/mia/factura");

export type PagoAsociado = { raw_id: string; monto: number };

export type CrearFacturaMultiplesPagosBody = {
  cfdi: CfdiPayload["cfdi"];
  info_user: CfdiPayload["info_user"];
  datos_empresa: { rfc: string; id_empresa: string };
  pagos_asociados: PagoAsociado[];
};

export type CrearFacturaMultiplesPagosResponse = {
  id_factura: string;
  source: "facturama" | "body";
  total_factura: number;
  total_vinculado: number;
  diferencia: number;
  facturama?: {
    Id: string;
    Uuid: string;
    links: { pdf: string | null; xml: string | null };
  };
};

export const crearFacturaService = {
  crearFacturaMultiplesPagos: (
    body: CrearFacturaMultiplesPagosBody,
  ): Promise<ApiResponse<CrearFacturaMultiplesPagosResponse>> =>
    facturaApiV1.post<CrearFacturaMultiplesPagosResponse>(
      "/CrearFacturasMultiplesPagos",
      body,
    ),
};
