import { CorreoProcesado } from "@/types/database_tables";
import { ApiResponse, ApiService } from "./ApiService";

export type FiltrosCorreos = {
  page?: number;
  length?: number;
  id_correo?: string;
  subject?: string;
  status?: string;
  procesado?: string;
  startDate?: string;
  endDate?: string;
  filterType?: string;
};

export class CorreosService extends ApiService {
  static instancia: CorreosService = null;

  constructor() {
    super("/mia/cotizaciones"); // TODO: ajustar al path real del endpoint
  }

  public static getInstance() {
    if (!this.instancia) {
      this.instancia = new CorreosService();
    }
    return this.instancia;
  }

  public async obtenerCorreos(
    params: FiltrosCorreos,
  ): Promise<ApiResponse<CorreoProcesado[]>> {
    return this.get<CorreoProcesado[]>({
      path: this.formatPath("/correos-procesados"), // TODO: ajustar al path real
      params,
    });
  }
}
