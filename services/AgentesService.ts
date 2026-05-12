import { ApiResponse, ApiService } from "./ApiService";

export interface HotelFicha {
  id_hotel: string;
  hotel: string;
  total_reservas: number;
  total_noches: string;
  gasto_total: string;
}

export interface ReservaCiudadZona {
  ciudad_zona: string;
  total_reservas: number;
  total_noches: string;
}

export interface TipoNegociacion {
  tipo_negociacion: string;
  total_reservas: number;
  total_noches: string;
}

export interface EstadoResumen {
  estado: string;
  total_reservas: number;
  total_noches: string;
}

export interface GastoMensual {
  mes: string;
  anio: number;
  numero_mes: number;
  total_reservas: number;
  gasto_total: string;
  noches: string;
}

export interface ResumenAgente {
  tipo_negociacion: TipoNegociacion[];
  estado: EstadoResumen[];
  gasto_mensual: GastoMensual[];
}

export class AgentesService extends ApiService {
  private ENDPOINTS = {
    GET: {
      HOTELES_CIUDAD_ZONA: "/hoteles-ciudad-zona",
      RESERVAS_CIUDAD_ZONA: "/reservas-ciudad-zona",
      RESUMEN_ESTADO_RESERVA: "/resumen",
    },
  };

  private static instance: AgentesService;

  private constructor() {
    super("/mia/agentes/ficha");
  }

  public static getInstance(): AgentesService {
    if (!this.instance) {
      this.instance = new AgentesService();
    }
    return this.instance;
  }

  public getHotelesCiudadZona = async (
    id_agente: string,
    estado: string,
    zona: string,
  ): Promise<ApiResponse<HotelFicha[]>> =>
    this.get<HotelFicha[]>({
      path: this.formatPath(this.ENDPOINTS.GET.HOTELES_CIUDAD_ZONA),
      params: { id_agente, estado, zona },
    });

  public getReservasCiudadZona = async (
    id_agente: string,
    estado: string,
  ): Promise<ApiResponse<ReservaCiudadZona[]>> =>
    this.get<ReservaCiudadZona[]>({
      path: this.formatPath(this.ENDPOINTS.GET.RESERVAS_CIUDAD_ZONA),
      params: { id_agente, estado },
    });

  public getResumen = async (
    id_agente: string,
  ): Promise<ApiResponse<ResumenAgente>> =>
    this.get<ResumenAgente>({
      path: this.formatPath(this.ENDPOINTS.GET.RESUMEN_ESTADO_RESERVA),
      params: { id_agente },
    });
}
