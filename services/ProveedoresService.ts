import { ApiResponse, ApiService } from "./ApiService";

export class ProveedoresService extends ApiService {
  private ENDPOINTS = {
    GET: {
      PROVEEDORES: "/",
      DATOS_FISCALES: "/detalles",
      DATA_FISCAL_ALL: "/fiscal",
      CUENTAS: "/cuentas",
      TYPE: "/proveedor",
    },
    PUT: {
      PROVEEDOR: "/",
      DATOS_FISCALES: "/datos_fiscales",
      CUENTAS: "/cuentas",
    },
    POST: {
      DATOS_FISCALES: "/datos_fiscales",
      CUENTAS: "/cuentas",
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
      id?: number;
      page?: number;
      size?: number;
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

  //CUENTAS
  public getCuentasByProveedor = async (
    id_proveedor: number
  ): Promise<ApiResponse<ProveedorCuenta[]>> =>
    this.get<ProveedorCuenta[]>({
      path: this.formatPath(this.ENDPOINTS.GET.CUENTAS),
      params: { id_proveedor },
    });

  public updateCuentasProveedor = async (
    body: ProveedorCuenta
  ): Promise<ApiResponse<ProveedorCuenta[]>> =>
    this.put({ path: this.formatPath(this.ENDPOINTS.PUT.CUENTAS), body });

  public createCuentasProveedor = async (
    body: Partial<ProveedorCuenta>
  ): Promise<ApiResponse<ProveedorCuenta[]>> =>
    this.post({ path: this.formatPath(this.ENDPOINTS.POST.CUENTAS), body });

  //PROVEEDOR TYPE
  public getProveedorType = async (
    params: Pick<Proveedor, "type" | "id">
  ): Promise<ApiResponse<ProveedorRentaCarroRaw>> =>
    this.get<ProveedorRentaCarroRaw>({
      path: this.formatPath(this.ENDPOINTS.GET.TYPE),
      params,
    });
}

//DATOS FISCALES

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
  ish: number;
  tua: number;
  iva: number;
  saneamiento: number;
  notas_tarifas_impuestos: string;
  type: "vuelo" | "renta_carro" | "hotel" | null;
  created_at: string;
  imagen: string | null;
  convenio: 0 | 1;
  intermediario: 0 | 1;
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
  auto?: ProveedorRentaCarro;
  vuelo?: ProveedorVuelo[];
}

export interface Proveedor
  extends Omit<
    ProveedorRaw,
    "convenio" | "estatus" | "internacional" | "bilingue" | "intermediario"
  > {
  convenio: boolean;
  estatus: boolean;
  internacional: boolean;
  bilingue: boolean;
  intermediario: boolean;
}

export const mapProveedor = (raw: ProveedorRaw): Proveedor => ({
  ...raw,
  convenio: toBoolean(raw.convenio),
  estatus: toBoolean(raw.estatus),
  internacional: toBoolean(raw.internacional),
  bilingue: toBoolean(raw.bilingue),
  intermediario: toBoolean(raw.intermediario),
});

//CUENTAS

export interface ProveedorCuenta {
  id: number;
  id_proveedor: number;
  cuenta: string;
  banco: string | null;
  titular: string | null;
  comentarios: string | null;
  alias: string | null;
}

//RENTAL CAR

export interface ProveedorRentaCarroRaw {
  is_sin_chofer?: 0 | 1;
  notas_sin_chofer?: string;
  is_con_chofer?: 0 | 1;
  notas_con_chofer?: string;
  is_chofer_bilingue?: 0 | 1;
  notas_chofer_bilingue?: string;
  incidencia?: string;
  notas_generales?: string;
}
export interface ProveedorRentaCarro
  extends Omit<
    ProveedorRentaCarroRaw,
    "is_chofer_bilingue" | "is_con_chofer" | "is_sin_chofer"
  > {
  is_sin_chofer?: boolean;
  is_con_chofer?: boolean;
  is_chofer_bilingue?: boolean;
}

export const mapProveedorRentaCarro = (
  raw: ProveedorRentaCarroRaw
): ProveedorRentaCarro => ({
  ...raw,
  is_sin_chofer: toBoolean(raw.is_sin_chofer),
  is_chofer_bilingue: toBoolean(raw.is_chofer_bilingue),
  is_con_chofer: toBoolean(raw.is_con_chofer),
});

//VUELO
export type ProveedorVuelo = {
  id: number;
  id_proveedor: number;
  tarifa: string | null;
  articulo_personal: string | null;
  equipaje_mano_o_carry_on: string | null;
  equipaje_documentado: string | null;
  servicios_adicionales: string | null;
};

//GENERAL

const keysToLower = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
  );
};

const toBoolean = (v: 0 | 1 | null): boolean => v === 1;
