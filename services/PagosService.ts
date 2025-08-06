import { ApiResponse, ApiService } from "./ApiService";

export class PagosService extends ApiService {
  private static instance: PagosService = null;
  private ENDPOINTS = {
    PUT: {
      actualizarYRegresarSaldo: "/precio-contado-regresar-saldo",
    },
  };

  constructor() {
    super("/mia/pagos");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new PagosService();
    }
    return this.instance;
  }

  public actualizarContadoRegresarSaldo = async (body: {
    id_agente: string;
    id_servicio: string;
    diferencia: number;
    id_booking: string;
    id_hospedaje: string;
    precio_actualizado: number;
    id_pago: string;
  }): Promise<ApiResponse<{ message: string }>> =>
    this.put<{ message: string }>({
      path: this.formatPath(this.ENDPOINTS.PUT.actualizarYRegresarSaldo),
      body,
    });
}
