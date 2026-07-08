import { API_KEY, URL as BASE_URL } from "@/lib/constants";
import { ApiResponse, ApiService } from "./ApiService";

export class ProveedoresService extends ApiService {
  private ENDPOINTS = {
    GET: {
      PROVEEDORES: "/",
      DATOS_FISCALES: "/detalles",
      DATA_FISCAL_ALL: "/fiscal",
      CUENTAS: "/cuentas",
      TYPE: "/proveedor",
      ARCHIVOS: "/archivos",
    },
    PUT: {
      PROVEEDOR: "/",
      DATOS_FISCALES: "/datos_fiscales",
      CUENTAS: "/cuentas",
      VUELO: "/vuelo",
    },
    POST: {
      DATOS_FISCALES: "/datos_fiscales",
      CUENTAS: "/cuentas",
    },
    DELETE: {
      DATOS_FISCALES: "/datos_fiscales",
      ARCHIVOS: "/archivos",
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
      proveedor?: string;
      status?: string;
      rfc?: string;
      negociacion?: string;
    } = {},
  ): Promise<ApiResponse<ProveedorRaw[]>> =>
    this.get<ProveedorRaw[]>({
      path: this.formatPath(this.ENDPOINTS.GET.PROVEEDORES),
      params: body,
    });

  public get_data_fiscal = async (
    id: number,
  ): Promise<ApiResponse<DatosFiscales>> => {
    const response = await this.get<DatosFiscales>({
      path: this.formatPath(this.ENDPOINTS.GET.DATA_FISCAL_ALL),
      params: { id },
    });

    console.log("========== GET_DATA_FISCAL ==========");
    console.log("ID:", id);
    console.log("DATA:", response.data);

    return response;
  };

  public getDatosFiscales = async (
    id_proveedor,
  ): Promise<ApiResponse<DatosFiscales[]>> => {
    const response = await this.get<DatosFiscales[]>({
      path: this.formatPath(this.ENDPOINTS.GET.DATOS_FISCALES),
      params: { id_proveedor },
    });

    console.log("========== GET_DATOS_FISCALES ==========");
    console.log("ID_PROVEEDOR:", id_proveedor);
    console.log("DATA:", response.data);

    response.data.forEach((item, index) => {
      console.log(`DATO_FISCAL ${index}:`, item);
    });

    return response;
  };

  public updateProveedor = async (body: Partial<Proveedor> & { id: number }) =>
    this.put({ path: this.formatPath(this.ENDPOINTS.PUT.PROVEEDOR), body });

  public crearFiscalData = async (
    body: Omit<DatosFiscales, "cuentas" | "id"> & { id_proveedor: number },
  ): Promise<ApiResponse<DatosFiscales[]>> =>
    this.post<DatosFiscales[]>({
      path: this.formatPath(this.ENDPOINTS.POST.DATOS_FISCALES),
      body: keysToLower(body),
    });

  public dropDataFiscal = async (id: number) => {
    this.delete({
      path: this.formatPath(this.ENDPOINTS.DELETE.DATOS_FISCALES),
      params: { id },
    });
  };

  public editarFiscalData = async (
    body: DatosFiscales & { id_proveedor: number },
  ): Promise<ApiResponse<DatosFiscales[]>> =>
    this.put<DatosFiscales[]>({
      path: this.formatPath(this.ENDPOINTS.PUT.DATOS_FISCALES),
      body: keysToLower(body),
    });

  //CUENTAS
  public getCuentasByProveedor = async (
    id_proveedor: number,
    incluir_inactivas = false,
  ): Promise<ApiResponse<ProveedorCuenta[]>> => {
    const response = await this.get<ProveedorCuenta[]>({
      path: this.formatPath(this.ENDPOINTS.GET.CUENTAS),
      params: {
        id_proveedor,
        incluir_inactivas: incluir_inactivas ? 1 : 0,
      },
    });

    console.log("========== GET_CUENTAS_BY_PROVEEDOR ==========");
    console.log("ID_PROVEEDOR:", id_proveedor);
    console.log("DATA:", response.data);

    response.data.forEach((item, index) => {
      console.log(`CUENTA ${index}:`, item);
    });

    return response;
  };

  public updateCuentasProveedor = async (
    body: ProveedorCuenta,
    caratula?: File,
  ): Promise<ApiResponse<ProveedorCuenta[]>> => {
    if (caratula) {
      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (v !== null && v !== undefined) formData.append(k, String(v));
      });
      formData.append("caratula", caratula);
      const response = await fetch(`${BASE_URL}/mia/proveedores/cuentas`, {
        method: "PUT",
        headers: { "x-api-key": API_KEY },
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Error al actualizar la cuenta");
      }
      return response.json();
    }
    return this.put({ path: this.formatPath(this.ENDPOINTS.PUT.CUENTAS), body });
  };

  public createCuentasProveedor = async (
    body: Partial<ProveedorCuenta>,
    caratula?: File,
  ): Promise<ApiResponse<ProveedorCuenta[]>> => {
    if (caratula) {
      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (v !== null && v !== undefined) formData.append(k, String(v));
      });
      formData.append("caratula", caratula);
      const response = await fetch(`${BASE_URL}/mia/proveedores/cuentas`, {
        method: "POST",
        headers: { "x-api-key": API_KEY },
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Error al crear la cuenta");
      }
      return response.json();
    }
    return this.post({ path: this.formatPath(this.ENDPOINTS.POST.CUENTAS), body });
  };

  public deleteCuentaProveedor = async (
    id: number,
  ): Promise<ApiResponse<ProveedorCuenta[]>> =>
    this.delete<ProveedorCuenta[]>({
      path: this.formatPath(this.ENDPOINTS.DELETE.CUENTAS),
      params: { id },
    });

  //PROVEEDOR TYPE
  public getProveedorType = async (
    params: Pick<Proveedor, "type" | "id">,
  ): Promise<ApiResponse<ProveedorRentaCarroRaw>> =>
    this.get<ProveedorRentaCarroRaw>({
      path: this.formatPath(this.ENDPOINTS.GET.TYPE),
      params,
    });

  //VUELO
  public updateProveedorVuelo = async (
    body: ProveedorVuelo,
  ): Promise<ApiResponse<ProveedorVuelo[]>> =>
    this.put({ path: this.formatPath(this.ENDPOINTS.PUT.VUELO), body });

  public createProveedorVuelo = async (
    body: Omit<ProveedorVuelo, "id" | "created_at" | "updated_at">,
  ): Promise<ApiResponse<ProveedorVuelo[]>> =>
    this.post({ path: this.formatPath(this.ENDPOINTS.PUT.VUELO), body });

  //ARCHIVOS
  public getArchivos = async (
    id_proveedor: number,
  ): Promise<ApiResponse<ArchivoProveedor[]>> =>
    this.get<ArchivoProveedor[]>({
      path: this.formatPath(this.ENDPOINTS.GET.ARCHIVOS),
      params: { id_proveedor },
    });

  public uploadArchivo = async (
    id_proveedor: number,
    nombre: string,
    file: File,
  ): Promise<ApiResponse<ArchivoProveedor[]>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("nombre", nombre);
    formData.append("id_proveedor", String(id_proveedor));
    const response = await fetch(`${BASE_URL}/mia/proveedores/archivos`, {
      method: "POST",
      headers: { "x-api-key": API_KEY },
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Error al subir el archivo");
    }
    return response.json();
  };

  public deleteArchivo = async (
    id: number,
  ): Promise<ApiResponse<ArchivoProveedor[]>> =>
    this.delete<ArchivoProveedor[]>({
      path: this.formatPath(this.ENDPOINTS.DELETE.ARCHIVOS),
      params: { id },
    });
  public updateCuentaActive = async (
    id: number,
    active: number,
  ): Promise<ApiResponse<ProveedorCuenta[]>> => {
    return this.patch<ProveedorCuenta[]>({
      path: `/mia/pago_proveedor/cuentas/${id}/active`,
      body: { active },
    });
  };
}

//DATOS FISCALES

export interface DatosFiscales {
  id: number;
  rfc: string;
  alias: string | null;
  razon_social: string;
  numero_cuentas?: number;
  id_relacion: number;
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
  vencimiento_credito: number | null;
  rfcs: string | null;
  auto?: ProveedorRentaCarro;
  vuelo?: ProveedorVuelo[];
  hotel?: ProveedorHotel;
}

export interface Proveedor extends Omit<
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

//ARCHIVOS

export interface ArchivoProveedor {
  id: number;
  id_proveedor: number;
  nombre: string;
  url: string;
  mime_type: string | null;
  created_at: string;
}

//CUENTAS

export interface ProveedorCuenta {
  id: number;
  id_proveedor: number;
  cuenta: string;
  banco: string | null;
  titular: string | null;
  comentarios: string | null;
  alias: string | null;
  email: string | null;
  url_caratula: string | null;
  active: number;
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
export interface ProveedorRentaCarro extends Omit<
  ProveedorRentaCarroRaw,
  "is_chofer_bilingue" | "is_con_chofer" | "is_sin_chofer"
> {
  is_sin_chofer?: boolean;
  is_con_chofer?: boolean;
  is_chofer_bilingue?: boolean;
}

export const mapProveedorRentaCarro = (
  raw: ProveedorRentaCarroRaw,
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
  created_at?: string;
  updated_at?: string;
};

//HOTEL
export type ProveedorHotel = {
  comentarios: string;
  salones: string;
  mascotas: string;
  transportacion: string;
};

//GENERAL

const keysToLower = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value]),
  );
};

const toBoolean = (v: 0 | 1 | null): boolean => v === 1;
