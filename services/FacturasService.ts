import { Factura } from "@/types/_types";
import { ApiResponse, ApiService } from "./ApiService";
import { TypeFilters } from "@/types";

export class FacturaService extends ApiService {
  private ENDPOINTS = {
    GET: {
      obtener_facturas: "/",
      ACTUALIZAR_BY_ID: (id: string) => `/${id}`,
    },
    PUT: {
      PDF: "/documentos",
    },
    POST: {
      obtener_facturas: "/filtrarFacturas",
    },
    DELETE: {
      BY_ID: (id: string) => `/${id}`,
      ELIMINAR_RELACION: `/quitar_relacion`,
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

  public getFacturas = async (params: any): Promise<ApiResponse<Factura[]>> =>
    this.get({
      path: this.formatPath(this.ENDPOINTS.GET.obtener_facturas),
      params,
    });

  public eliminarRelacionFactura = async (
    id_factura: string,
  ): Promise<ApiResponse<Factura>> =>
    this.delete({
      path: this.formatPath(this.ENDPOINTS.DELETE.ELIMINAR_RELACION),
      params: { id_factura },
    });

  public actualizarFactura = async (
    id: string,
  ): Promise<ApiResponse<Factura>> =>
    this.get({
      path: this.formatPath(this.ENDPOINTS.GET.ACTUALIZAR_BY_ID(id)),
    });

  public obtenerFacturas = async (
    body: TypeFilters & { page?: number; length?: number },
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
