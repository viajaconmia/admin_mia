import { SucursalDetails } from "@/components/template/GuardadoRapido";
import { ApiResponse, ApiService } from "./ApiService";

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

  public createProveedor = ({
    nombre,
    pais,
    rfc,
    telefono,
    email,
    sitio_web,
    type,
  }: {
    nombre: string;
    pais?: string;
    rfc?: string;
    telefono?: string;
    email?: string;
    sitio_web?: string;
    type: string;
  }): Promise<ApiResponse<Proveedor[]>> =>
    this.post<Proveedor[]>({
      path: this.formatPath(this.ENDPOINTS.PROVEEDORES.POST.PROVEEDORES),
      body: { nombre, pais, rfc, telefono, email, sitio_web, type },
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

  public createSucursal = (
    sucursal: SucursalDetails & { proveedor: Proveedor }
  ): Promise<ApiResponse<Sucursal[]>> =>
    this.post<Sucursal[]>({
      path: this.formatPath(this.ENDPOINTS.SUCURSAL.POST.SUCURSAL),
      body: sucursal,
    });
}

export type Proveedor = {
  creado_en: string;
  email: string | null;
  id: number;
  nombre: string;
  pais: string | null;
  rfc: string | null;
  sitio_web: string | null;
  telefono: string | null;
  type: "vuelo" | "renta_carro";
};

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
