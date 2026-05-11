import { ApiResponse, ApiService } from "./ApiService";

export interface HotelFicha {
  id: string;
  nombre: string;
  estado: string;
  zona: string;
  [key: string]: any;
}

export interface ReservaCiudadZona {
  ciudad: string;
  zona: string;
  total_reservas: number;
  [key: string]: any;
}

export interface ResumenAgente {
  tipo_negociacion: { tipo: string; total: number }[];
  estado_reserva: { estado: string; total: number }[];
  gasto_mensual: { mes: string; total: number }[];
}

export class AgentesService extends ApiService {
  private ENDPOINTS = {
    GET: {
      HOTELES_CIUDAD_ZONA: "/hoteles-ciudad-zona",
      RESERVAS_CIUDAD_ZONA: "/reservas-ciudad-zona",
      RESUMEN_TIPO_NEGOCIACION: "/resumen/tipo-negociacion",
      RESUMEN_ESTADO_RESERVA: "/resumen/estado-reserva",
      RESUMEN_GASTO_MENSUAL: "/resumen/gasto-mensual",
    },
  };

  private static instance: AgentesService;

  private constructor() {
    super("/v1/mia/agentes/ficha");
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
    zona: string
  ): Promise<ApiResponse<HotelFicha[]>> =>
    this.get<HotelFicha[]>({
      path: this.formatPath(this.ENDPOINTS.GET.HOTELES_CIUDAD_ZONA),
      params: { id_agente, estado, zona },
    });

  public getReservasCiudadZona = async (
    id_agente: string,
    estado: string
  ): Promise<ApiResponse<ReservaCiudadZona[]>> =>
    this.get<ReservaCiudadZona[]>({
      path: this.formatPath(this.ENDPOINTS.GET.RESERVAS_CIUDAD_ZONA),
      params: { id_agente, estado },
    });

  public getResumen = async (
    id_agente: string
  ): Promise<ApiResponse<ResumenAgente>> => {
    const [tipoNegociacion, estadoReserva, gastoMensual] = await Promise.all([
      this.get<{ tipo: string; total: number }[]>({
        path: this.formatPath(this.ENDPOINTS.GET.RESUMEN_TIPO_NEGOCIACION),
        params: { id_agente },
      }),
      this.get<{ estado: string; total: number }[]>({
        path: this.formatPath(this.ENDPOINTS.GET.RESUMEN_ESTADO_RESERVA),
        params: { id_agente },
      }),
      this.get<{ mes: string; total: number }[]>({
        path: this.formatPath(this.ENDPOINTS.GET.RESUMEN_GASTO_MENSUAL),
        params: { id_agente },
      }),
    ]);

    return {
      message: "Resumen obtenido correctamente",
      data: {
        tipo_negociacion: tipoNegociacion.data ?? [],
        estado_reserva: estadoReserva.data ?? [],
        gasto_mensual: gastoMensual.data ?? [],
      },
    };
  };
}
