import { TypeFilters } from "@/types";
import { FacturaFiltradaRaw } from "@/schemas/tables/facturas";
import { ApiResponse, createApiClient } from "../apiClient";
import { reservasFacturaService } from "./reservas";
import { itemsFacturaService } from "./items";

export * from "./reservas";
export * from "./items";

const facturaApi = createApiClient("/mia/factura");

export const facturasService = {
  filtrarFacturas: (
    body: Partial<TypeFilters> & { page?: number; length?: number },
  ): Promise<ApiResponse<FacturaFiltradaRaw[]>> =>
    facturaApi.post<FacturaFiltradaRaw[]>("/filtrar", body),

  ...reservasFacturaService,
  ...itemsFacturaService,
};
