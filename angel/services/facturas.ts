import { TypeFilters } from "@/types";
import { FacturaFiltradaRaw } from "@/schemas/tables/facturas";
import { ApiResponse, createApiClient } from "./apiClient";

const facturaApi = createApiClient("/mia/factura");

export type ItemPendienteFacturar = {
  id_item: string;
  id_relacion: string;
  total: string;
  monto_facturado: string;
  monto_por_facturar: string;
  monto_asignar?: string;
};

export type ReservaSeleccion = {
  id_relacion: string;
  tipo: "completa" | "parcial";
  monto: string;
  items?: ItemPendienteFacturar[];
};

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

export const facturasService = {
  filtrarFacturas: (
    body: Partial<TypeFilters> & { page?: number; length?: number },
  ): Promise<ApiResponse<FacturaFiltradaRaw[]>> =>
    facturaApi.post<FacturaFiltradaRaw[]>("/filtrarFacturas", body),

  getReservasPendientesFacturar: (
    id_agente: string,
  ): Promise<ApiResponse<ReservaPendienteFacturar[]>> =>
    facturaApi.get<ReservaPendienteFacturar[]>(
      "/reservas_pendientes_facturar",
      { id_agente },
    ),

  getItemsPendientesFacturar: (
    id_relacion: string,
  ): Promise<ApiResponse<ItemPendienteFacturar[]>> =>
    facturaApi.get<ItemPendienteFacturar[]>("/items_pendientes_facturar", {
      id_relacion,
    }),
};
