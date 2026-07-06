import { ApiResponse, ApiService } from "./ApiService";

export type BuscarUuidItem = {
  id: number;
  uuid_factura: string;
  id_factura_proveedor: string;
  id_booking: string;
  codigo_confirmacion: string;
  estado: string;
  id_solicitud: number;
  monto_facturado: string;
  monto_solicitado: string;
};

export type EliminarPagoFacturaData = {
  id_factura: string;
  id_solicitud: number;
  monto_facturado: string;
  monto_pago: string;
};

export class ConciliacionService extends ApiService {
  private static instance: ConciliacionService | null = null;

  private ENDPOINTS = {
    POST: {
      buscarUuid: "/buscaruuid",
    },
    DELETE: {
      pagoFacturaProveedor: "/pago_factura_proveedor",
    },
  };

  constructor() {
    super("/mia/pago_proveedor");
  }

  public static getInstance(): ConciliacionService {
    if (!this.instance) {
      this.instance = new ConciliacionService();
    }
    return this.instance;
  }

  public buscarUuid = async (
    uuid_factura: string,
  ): Promise<ApiResponse<BuscarUuidItem[]>> =>
    this.post<BuscarUuidItem[]>({
      path: this.formatPath(this.ENDPOINTS.POST.buscarUuid),
      body: { uuid_factura },
    });

  public eliminarPagoFacturaProveedor = async (payload: {
    id_factura: string;
    id_solicitud: number;
  }): Promise<ApiResponse<EliminarPagoFacturaData>> =>
    this.request<EliminarPagoFacturaData>(
      "DELETE",
      this.formatPath(this.ENDPOINTS.DELETE.pagoFacturaProveedor),
      payload,
    );
}
