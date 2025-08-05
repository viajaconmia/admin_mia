import { ApiResponse, ApiService } from "./ApiService";

export class BookingsService extends ApiService {
  private ENDPOINTS = {
    GET: {
      ITEMS: "/items",
    },
    PUT: {
      ITEMS: "/items",
    },
  };

  constructor() {
    super("/mia/reservas");
  }

  public obtenerItemsDeHospedaje = async (
    id_hospedaje: string
  ): Promise<ApiResponse<Item[]>> => {
    return this.get<Item[]>({
      path: this.formatPath(this.ENDPOINTS.GET.ITEMS),
      params: { id_hospedaje },
    });
  };
  public actualizarItems = async (items: (Item & { edit: boolean })[]) => {
    return this.put({
      path: this.formatPath(this.ENDPOINTS.PUT.ITEMS),
      body: { items },
    });
  };
}

export type Item = {
  id_item: string;
  id_catalogo_item: string | null;
  id_factura: string | null;
  total: string;
  subtotal: string;
  impuestos: string;
  is_facturado: number; // 0 o 1
  fecha_uso: string; // ISO date string
  id_hospedaje: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  costo_total: string;
  costo_subtotal: string;
  costo_impuestos: string;
  saldo: string;
  costo_iva: string;
};
