import { ApiResponse, ApiService } from "./ApiService";

export class FacturaService extends ApiService {
  private ENDPOINTS = {
    PUT: {
      PDF: "/documentos",
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

  public actualizarDocumentosFacturas = async (body: {
    url: string;
    id: string;
  }): Promise<ApiResponse<string>> =>
    this.put<string>({ path: this.formatPath(this.ENDPOINTS.PUT.PDF), body });
}
