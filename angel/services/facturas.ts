import { TypeFilters } from "@/types";
import { FacturaFiltradaRaw } from "@/schemas/tables/facturas";
import { ApiResponse, createApiClient } from "./apiClient";

const api = createApiClient("/mia/factura");

export const facturasService = {
  filtrarFacturas: (
    body: Partial<TypeFilters> & { page?: number; length?: number },
  ): Promise<ApiResponse<FacturaFiltradaRaw[]>> =>
    api.post<FacturaFiltradaRaw[]>("/filtrarFacturas", body),
};
