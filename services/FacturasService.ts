import { Factura } from "@/types/_types";
import { ApiResponse, ApiService } from "./ApiService";
import { TypeFilters } from "@/types";

export class FacturaService extends ApiService {
  private ENDPOINTS = {
    PUT: {
      PDF: "/documentos",
    },
    POST: {
      obtener_facturas: "/filtrarFacturas",
    },
    DELETE: {
      BY_ID: (id: string) => `/${id}`,
    },
  };
  private static instance: FacturaService;

  private constructor() {
    super("/mia/factura");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new FacturaService();
    }
    return this.instance;
  }

  public obtenerFacturas = async (
    body: TypeFilters & { page: number; length: number },
  ): Promise<ApiResponse<Factura[]>> =>
    this.post({
      path: this.formatPath(this.ENDPOINTS.POST.obtener_facturas),
      body,
    });

  public cancelarFactura = async (
    id: string,
    params: any,
  ): Promise<ApiResponse<any>> =>
    this.delete({
      path: this.formatPath(this.ENDPOINTS.DELETE.BY_ID(id)),
      params,
    });

  public actualizarDocumentosFacturas = async (body: {
    url: string;
    id: string;
  }): Promise<ApiResponse<string>> =>
    this.put<string>({ path: this.formatPath(this.ENDPOINTS.PUT.PDF), body });
}
