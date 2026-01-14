import { ApiResponse, ApiService } from "./ApiService";

export class ProveedoresService extends ApiService {
  private ENDPOINTS = {
    GET: {
      PROVEEDORES: "/",
      DATOS_FISCALES: "/detalles",
      DATA_FISCAL_ALL: "/fiscal",
    },
    PUT: {
      PROVEEDOR: "/",
      DATOS_FISCALES: "/datos_fiscales",
    },
    POST: {
      DATOS_FISCALES: "/datos_fiscales",
    },
  };
  static instancia: ProveedoresService = null;

  constructor() {
    super("/mia/proveedores");
  }

  public static getInstance() {
    if (!this.instancia) {
      this.instancia = new ProveedoresService();
    }
    return this.instancia;
  }

  public getProveedores = async (
    body: {
      type?: string;
      id?: string;
    } = {}
  ): Promise<ApiResponse<ProveedorRaw[]>> =>
    this.get<ProveedorRaw[]>({
      path: this.formatPath(this.ENDPOINTS.GET.PROVEEDORES),
      params: body,
    });

  public get_data_fiscal = async (
    id: number
  ): Promise<ApiResponse<DatosFiscales>> =>
    this.get({
      path: this.formatPath(this.ENDPOINTS.GET.DATA_FISCAL_ALL),
      params: { id },
    });

  public getDatosFiscales = async (
    id_proveedor
  ): Promise<ApiResponse<DatosFiscales[]>> =>
    this.get<DatosFiscales[]>({
      path: this.formatPath(this.ENDPOINTS.GET.DATOS_FISCALES),
      params: { id_proveedor },
    });

  public updateProveedor = async (body: Partial<Proveedor> & { id: number }) =>
    this.put({ path: this.formatPath(this.ENDPOINTS.PUT.PROVEEDOR), body });

  public crearFiscalData = async (
    body: Omit<DatosFiscales, "cuentas" | "id"> & { id_proveedor: number }
  ): Promise<ApiResponse<DatosFiscales[]>> =>
    this.post<DatosFiscales[]>({
      path: this.formatPath(this.ENDPOINTS.POST.DATOS_FISCALES),
      body: keysToLower(body),
    });

  public editarFiscalData = async (
    body: DatosFiscales & { id_proveedor: number }
  ): Promise<ApiResponse<DatosFiscales[]>> =>
    this.put<DatosFiscales[]>({
      path: this.formatPath(this.ENDPOINTS.PUT.DATOS_FISCALES),
      body: keysToLower(body),
    });
}

const keysToLower = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
  );
};

/**
 *
 * FIN DE CLASE
 *
 */
export interface DatosFiscales {
  id: number;
  rfc: string;
  alias: string | null;
  razon_social: string;
  numero_cuentas?: number;
  cuentas?: {}[];
}

export interface ProveedorRaw {
  id: number;
  proveedor: string;
  type: "vuelo" | "renta_carro" | null;
  created_at: string;
  imagen: string | null;
  convenio: 0 | 1;
  negociacion: string | null;
  vigencia_convenio: string | null;
  estatus: 0 | 1;
  internacional: 0 | 1;
  notas_internacional: string | null;
  bilingue: 0 | 1;
  notas_bilingue: string | null;
  notas_proveedor: string | null;
  estado: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  pais: string | null;
  calle: string | null;
  numero: string | null;
  colonia: string | null;
  municipio: string | null;
  contactos_convenio: string | null;
  formas_solicitar_disponibilidad: string | null;
  formas_reservar: string | null;
  notas_pagos: string | null;
  notas_tipo_pago: string | null;
  tipo_pago: "credito" | "prepago" | null;
}

// Ahora Proveedor es idéntico en nombres a Raw, pero con tipos de JS (boolean)
export interface Proveedor
  extends Omit<
    ProveedorRaw,
    "convenio" | "estatus" | "internacional" | "bilingue"
  > {
  convenio: boolean;
  estatus: boolean;
  internacional: boolean;
  bilingue: boolean;
}

const toBoolean = (v: 0 | 1 | null): boolean => v === 1;

export const mapProveedor = (raw: ProveedorRaw): Proveedor => ({
  ...raw, // Copiamos todo lo que es igual (strings, nulls, id)
  convenio: toBoolean(raw.convenio),
  estatus: toBoolean(raw.estatus),
  internacional: toBoolean(raw.internacional),
  bilingue: toBoolean(raw.bilingue),
});
