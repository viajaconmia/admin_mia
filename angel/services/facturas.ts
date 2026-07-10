import { TypeFilters } from "@/types";
import { FacturaFiltradaRaw } from "@/schemas/tables/facturas";
import { ApiResponse, createApiClient } from "./apiClient";

const facturaApi = createApiClient("/mia/factura");
const facturasApi = createApiClient("/mia/facturas");

export type ReservaPendienteFacturar = {
  id_reserva: string;
  [key: string]: any;
};

export const facturasService = {
  filtrarFacturas: (
    body: Partial<TypeFilters> & { page?: number; length?: number },
  ): Promise<ApiResponse<FacturaFiltradaRaw[]>> =>
    facturaApi.post<FacturaFiltradaRaw[]>("/filtrarFacturas", body),

  getReservasPendientesFacturar: (
    id_agente: string,
  ): Promise<ApiResponse<ReservaPendienteFacturar[]>> =>
    facturasApi.get<ReservaPendienteFacturar[]>("/reservas_pendientes_facturar", { id_agente }),
};
