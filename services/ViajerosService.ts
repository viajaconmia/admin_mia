import { ApiResponse, ApiService } from "./ApiService";

export class ViajerosService extends ApiService {
  private ENDPOINTS = {
    GET: {
      OBTENER_VIAJERO_POR_AGENTE: "/by-agente",
    },
  };
  static instancia: ViajerosService = null;

  constructor() {
    super("/mia/viajeros");
  }

  public static getInstance() {
    if (!this.instancia) {
      this.instancia = new ViajerosService();
    }
    return this.instancia;
  }

  public obtenerViajerosPorAgente = async (
    id_agente: string
  ): Promise<ApiResponse<ViajeroService[]>> =>
    this.get<ViajeroService[]>({
      path: this.formatPath(this.ENDPOINTS.GET.OBTENER_VIAJERO_POR_AGENTE),
      params: { id: id_agente },
    });
}

export interface ViajeroService {
  id_agente: string;
  id_viajero: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo: string;
  fecha_nacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  created_at: string;
  updated_at: string;
  nacionalidad: string | null;
  numero_pasaporte: string | null;
  numero_empleado: string | null;
  activo: number;
  is_user: number;
  nombre_completo: string;
}
