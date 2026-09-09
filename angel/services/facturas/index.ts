import { TypeFilters } from "@/types";
import { FacturaFiltradaRaw } from "@/schemas/tables/facturas";
import { ApiResponse, createApiClient } from "../apiClient";
import { reservasFacturaService } from "./reservas";
import { itemsFacturaService } from "./items";
import { envioFacturaService, EnvioFactura } from "./envio";

export type DetalleFacturaResponse = {
  reservas: {
    monto_asignado: string;
    id_relacion: string;
    codigo_confirmacion: string;
    proveedor: string;
    nombre_agente: string;
    total: string;
    nombre_viajero: string;
  }[];
  saldos: {
    monto_asignado: string;
    id_saldos: number;
    metodo_pago: string;
    referencia: string | null;
    fecha_pago: string | null;
    monto: string;
    saldo: string;
    is_facturable: number;
    is_facturado: number;
    comprobante: string | null;
  }[];
  pagos: {
    monto_asignado: string;
    id_pago: string | null;
    metodo_de_pago: string | null;
    fecha_pago: string | null;
    total: string | null;
    estado: string | null;
    saldo_aplicado: string | null;
    link_pago: string | null;
  }[];
  envios: EnvioFactura[];
};

export * from "./reservas";
export * from "./items";
export * from "./envio";

const facturaApi = createApiClient("/v2/mia/factura");

export type CampoEditableFactura = "uuid_crp";

export type EditarFacturaBody = Partial<Record<CampoEditableFactura, string>>;

export type EditarFacturaResponse = { id_factura: string } & Partial<
  Record<CampoEditableFactura, string | null>
>;

export const facturasService = {
  filtrarFacturas: (
    body: Partial<TypeFilters> & { page?: number; length?: number },
  ): Promise<ApiResponse<FacturaFiltradaRaw[]>> =>
    facturaApi.post<FacturaFiltradaRaw[]>("/filtrar", body),

  getDetalleFactura: (
    id_factura: string,
  ): Promise<ApiResponse<DetalleFacturaResponse>> =>
    facturaApi.get<DetalleFacturaResponse>("/detalle", { id_factura }),

  editarFactura: (
    id_factura: string,
    body: EditarFacturaBody,
  ): Promise<ApiResponse<EditarFacturaResponse>> =>
    facturaApi.patch<EditarFacturaResponse>(`/${id_factura}`, body),

  ...reservasFacturaService,
  ...itemsFacturaService,
  ...envioFacturaService,
};
