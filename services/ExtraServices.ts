import { ApiResponse, ApiService } from "./ApiService";

export class ExtraService extends ApiService {
  private ENDPOINTS = {
    AEROLINEAS: {
      GET: {
        AEROLINEAS: "/aerolineas/",
      },
      POST: {
        AEROLINEAS: "/aerolineas/",
      },
    },
    AEROPUERTO: {
      GET: {
        AEROPUERTO: "/aeropuerto/",
      },
      POST: {
        AEROPUERTO: "/aeropuerto/",
      },
    },
  };
  private static instance: ExtraService;

  private constructor() {
    super("/mia");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ExtraService();
    }
    return this.instance;
  }

  public getAerolineas = (): Promise<ApiResponse<Aerolinea[]>> =>
    this.get<Aerolinea[]>({
      path: this.formatPath(this.ENDPOINTS.AEROLINEAS.GET.AEROLINEAS),
    });

  public createAerolinea = (
    nombre: string
  ): Promise<ApiResponse<Aerolinea[]>> =>
    this.post<Aerolinea[]>({
      path: this.formatPath(this.ENDPOINTS.AEROLINEAS.POST.AEROLINEAS),
      body: { nombre },
    });

  public getAeropuerto = (): Promise<ApiResponse<Aeropuerto[]>> =>
    this.get<Aeropuerto[]>({
      path: this.formatPath(this.ENDPOINTS.AEROPUERTO.GET.AEROPUERTO),
    });

  public createAeropuerto = (
    codigo: string,
    ubicacion: string
  ): Promise<ApiResponse<Aeropuerto[]>> =>
    this.post<Aeropuerto[]>({
      path: this.formatPath(this.ENDPOINTS.AEROPUERTO.POST.AEROPUERTO),
      body: { codigo, ubicacion },
    });
}

export interface Aerolinea {
  id: number;
  nombre: string;
  pais: string | null;
}

export type Aeropuerto = {
  codigo: string;
  id: number;
  nombre: string;
};
