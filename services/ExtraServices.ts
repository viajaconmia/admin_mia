import { SucursalDetails } from "@/components/template/GuardadoRapido";
import { ApiResponse, ApiService } from "./ApiService";
import { Proveedor } from "./ProveedoresService";

export class ExtraService extends ApiService {
  private ENDPOINTS = {
    PROVEEDORES: {
      GET: {
        PROVEEDORES: "/proveedores/",
      },
      POST: {
        PROVEEDORES: "/proveedores/",
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
    AGENTES: {
      GET: {
        EMPRESAS: "/agentes/empresas-con-datos-fiscales",
      },
    },
    HOTELES: {
      GET: {
        PERMITIDOS: "/hoteles/allowed",
        COTIZACION: "/hoteles/cotizacion",
      },
      POST: {
        PRIORIDAD: "/hoteles/prioridad",
      },
      PATCH: {
        PRIORIDAD: "/hoteles/prioridad",
      },
    },
    SUCURSAL: {
      POST: {
        SUCURSAL: "/proveedores/sucursal",
      },
      GET: {
        SUCURSAL: "/proveedores/sucursal",
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

  public getHotelesCotizacion = (params: {
    checkin: string;
    checkout: string;
    id_hotel?: string;
    ciudad?: string;
    hotel?: string;
    cp?: string;
    lat?: number;
    lng?: number;
  }): Promise<ApiResponse<any[]>> =>
    this.get<any[]>({
      path: this.formatPath(this.ENDPOINTS.HOTELES.GET.COTIZACION),
      params,
    });

  public editHotelPrioridad = (
    id: number,
    body: Partial<{ zona: string; priority: number; is_allowed: number }>,
  ): Promise<ApiResponse<void>> =>
    this.patch<void>({
      path: this.formatPath(`${this.ENDPOINTS.HOTELES.PATCH.PRIORIDAD}/${id}`),
      body,
    });

  public setHotelPrioridad = (body: {
    id_agente: string;
    id_hotel: string;
    zona: string;
    priority: number;
  }): Promise<ApiResponse<void>> =>
    this.post<void>({
      path: this.formatPath(this.ENDPOINTS.HOTELES.POST.PRIORIDAD),
      body,
    });

  public getHotelesPermitidos = (
    params?: any,
  ): Promise<ApiResponse<HotelPermitidoDTO[]>> =>
    this.get<HotelPermitidoDTO[]>({
      path: this.formatPath(this.ENDPOINTS.HOTELES.GET.PERMITIDOS),
      params,
    });

  public getProveedores = (): Promise<ApiResponse<Proveedor[]>> =>
    this.get<Proveedor[]>({
      path: this.formatPath(this.ENDPOINTS.PROVEEDORES.GET.PROVEEDORES),
    });
  public getProveedoresCarros = (): Promise<ApiResponse<Proveedor[]>> =>
    this.get<Proveedor[]>({
      path: this.formatPath(this.ENDPOINTS.PROVEEDORES.GET.PROVEEDORES),
      params: { type: "renta_carro" },
    });
  public getAerolineas = (): Promise<ApiResponse<Proveedor[]>> =>
    this.get<Proveedor[]>({
      path: this.formatPath(this.ENDPOINTS.PROVEEDORES.GET.PROVEEDORES),
      params: { type: "vuelo" },
    });
  public getSucursales = (): Promise<ApiResponse<Sucursal[]>> =>
    this.get<Sucursal[]>({
      path: this.formatPath(this.ENDPOINTS.SUCURSAL.GET.SUCURSAL),
    });

  public getEmpresas = (id_agente: string): Promise<ApiResponse<Empresa[]>> =>
    this.get({
      path: this.formatPath(this.ENDPOINTS.AGENTES.GET.EMPRESAS),
      params: { id_agente },
    });

  public createProveedor = (body: {
    nombre: string;
    pais?: string;
    rfc?: string;
    telefono?: string;
    email?: string;
    sitio_web?: string;
    type: string;
    intermediario?: boolean;
  }): Promise<ApiResponse<Proveedor[]>> =>
    this.post<Proveedor[]>({
      path: this.formatPath(this.ENDPOINTS.PROVEEDORES.POST.PROVEEDORES),
      body,
    });

  public getAeropuerto = (): Promise<ApiResponse<Aeropuerto[]>> =>
    this.get<Aeropuerto[]>({
      path: this.formatPath(this.ENDPOINTS.AEROPUERTO.GET.AEROPUERTO),
    });

  public createAeropuerto = (
    codigo: string,
    ubicacion: string,
  ): Promise<ApiResponse<Aeropuerto[]>> =>
    this.post<Aeropuerto[]>({
      path: this.formatPath(this.ENDPOINTS.AEROPUERTO.POST.AEROPUERTO),
      body: { codigo, ubicacion },
    });

  public createSucursal = (
    sucursal: SucursalDetails & { proveedor: Proveedor },
  ): Promise<ApiResponse<Sucursal[]>> =>
    this.post<Sucursal[]>({
      path: this.formatPath(this.ENDPOINTS.SUCURSAL.POST.SUCURSAL),
      body: sucursal,
    });
}

export type Aeropuerto = {
  codigo: string;
  id: number;
  nombre: string;
};

export type HorarioPeriod = {
  open: {
    day: number;
    time: string;
    hours: number;
    minutes: number;
    nextDate: number;
  };
  close: {
    day: number;
    time: string;
    hours: number;
    minutes: number;
    nextDate: number;
  };
};

export type Horario = {
  periods: HorarioPeriod[];
  open_now: boolean;
  weekday_text: string[];
} | null;

export type Sucursal = {
  id_sucursal: string;
  id_proveedor: number;
  nombre: string;
  calle: string | null;
  colonia: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  estado: string | null;
  pais: string | null;
  latitud: string | null;
  longitud: string | null;
  telefono: string | null;
  activo: number;
  horario: Horario;
  created_at: string;
  direccion: string | null;
};

export type Sucursales = Sucursal[];

export interface Empresa {
  id_empresa: string;
  razon_social: string;
  tipo_persona: "fisica" | "moral";
  nombre_comercial: string;

  // Dirección empresa
  empresa_direccion: string;
  empresa_municipio: string;
  empresa_estado: string;
  empresa_cp: string;
  empresa_colonia: string;

  // Datos fiscales
  id_datos_fiscales: string;
  rfc: string;
  calle: string;
  colonia: string;
  estado: string;
  municipio: string;
  codigo_postal_fiscal: string;
  regimen_fiscal: string;
  razon_social_df: string;

  datos_fiscales_created_at: string;
  datos_fiscales_updated_at: string;

  // Relación agente
  id_agente: string;
  empresa_agente_created_at: string;
  empresa_agente_updated_at: string;

  // Usuario / contacto
  nombre: string;

  created_at: string;
  updated_at: string;

  // Crédito
  tiene_credito: 0 | 1;
  monto_credito: number | null;

  // Otros
  codigo_postal: string;
  active: 0 | 1;
  rn: number;
}

export type HotelPermitido = Omit<
  HotelPermitidoDTO,
  "is_allowed" | "activo" | "precio_sencilla"
> & {
  is_allowed: boolean;
  activo: boolean;
  precio_sencilla: number;
};

export type HotelPermitidoDTO = {
  id: number;
  id_agente: string;
  cliente_nombre: string;
  nombre_comercial: string;
  razon_social: string;
  rfc: string;
  zona: string;
  priority: number;
  is_allowed: number;
  id_hotel: string;
  hotel_nombre: string;
  estado: string;
  Ciudad_Zona: string;
  tipo_hospedaje: string;
  calificacion: number | null;
  score_operaciones: number;
  precio_sencilla: string;
  activo: number;
};

export const mapHotelPermitido = (dto: HotelPermitidoDTO): HotelPermitido => {
  return {
    ...dto,
    is_allowed: dto.is_allowed === 1,
    activo: dto.activo === 1,
    precio_sencilla: Number(dto.precio_sencilla),
  };
};
