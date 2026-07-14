import { ApiResponse, createApiClient } from "../apiClient";

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

export type AsignarItemsFacturaBody = {
  id_factura: string;
  seleccion: ReservaSeleccion[];
};

export const itemsFacturaService = {
  getItemsPendientesFacturar: (
    id_relacion: string,
  ): Promise<ApiResponse<ItemPendienteFacturar[]>> =>
    facturaApi.get<ItemPendienteFacturar[]>("/items/pendientes", { id_relacion }),

  asignarItemsFactura: (
    body: AsignarItemsFacturaBody,
  ): Promise<ApiResponse<unknown>> =>
    facturaApi.post<unknown>("/items/asignar", body),
};
