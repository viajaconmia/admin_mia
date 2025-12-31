import { ApiResponse, ApiService } from "./ApiService";

export class ProveedoresService extends ApiService {
  private ENDPOINTS = {
    GET: {
      PROVEEDORES: "/",
      DATOS_FISCALES: "/detalles",
    },
    PUT: {
      PROVEEDOR: "/",
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

  public getDatosFiscales = async (id_proveedor): Promise<ApiResponse<{}[]>> =>
    this.get<{}[]>({
      path: this.formatPath(this.ENDPOINTS.GET.DATOS_FISCALES),
      params: { id_proveedor },
    });

  public updateProveedor = async (body: Partial<Proveedor> & { id: number }) =>
    this.put({ path: this.formatPath(this.ENDPOINTS.PUT.PROVEEDOR), body });
}

/**
 *
 * FIN DE CLASE
 *
 */

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

export interface Proveedor {
  id: number;

  proveedor: string;
  type: "vuelo" | "renta_carro" | null;
  createdAt: string;

  imagen: string | null;
  convenio: boolean;
  negociacion: string | null;
  vigenciaConvenio: string | null;
  estatus: boolean;
  internacional: boolean;
  notasInternacional: string | null;
  bilingue: boolean;
  notasBilingue: string | null;
  notasProveedor: string | null;

  estado: string | null;
  ciudad: string | null;
  codigoPostal: string | null;
  pais: string | null;
  calle: string | null;
  numero: string | null;
  colonia: string | null;
  municipio: string | null;

  contactosConvenio: string | null;
  formasSolicitarDisponibilidad: string | null;
  formasReservar: string | null;

  notasPagos: string | null;
  notasTipoPago: string | null;
  tipoPago: "credito" | "prepago" | null;
}
const toBoolean = (v: 0 | 1 | null): boolean => v === 1;

export const mapProveedor = (raw: ProveedorRaw): Proveedor => ({
  id: raw.id,

  proveedor: raw.proveedor,
  type: raw.type,
  createdAt: raw.created_at,

  imagen: raw.imagen,
  convenio: toBoolean(raw.convenio),
  negociacion: raw.negociacion,
  vigenciaConvenio: raw.vigencia_convenio,
  estatus: toBoolean(raw.estatus),
  internacional: toBoolean(raw.internacional),
  notasInternacional: raw.notas_internacional,
  bilingue: toBoolean(raw.bilingue),
  notasBilingue: raw.notas_bilingue,
  notasProveedor: raw.notas_proveedor,

  estado: raw.estado,
  ciudad: raw.ciudad,
  codigoPostal: raw.codigo_postal,
  pais: raw.pais,
  calle: raw.calle,
  numero: raw.numero,
  colonia: raw.colonia,
  municipio: raw.municipio,

  contactosConvenio: raw.contactos_convenio,
  formasSolicitarDisponibilidad: raw.formas_solicitar_disponibilidad,
  formasReservar: raw.formas_reservar,

  notasPagos: raw.notas_pagos,
  notasTipoPago: raw.notas_tipo_pago,
  tipoPago: raw.tipo_pago,
});
