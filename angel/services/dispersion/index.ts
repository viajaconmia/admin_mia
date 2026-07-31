import { TypeService } from "@/angel/lib/types";
import { ApiResponse, createApiClient } from "../apiClient";

const dispersionApi = createApiClient("/v2/mia/dispersion");

export type CrearDispersionSolicitud = {
  id_solicitud_proveedor: number;
  id_proveedor_cuenta: number;
  monto_dispersar: number;
  fecha_pago?: string | null;
  // informativos — el backend no los usa en lógica, los regresa tal cual
  id_solicitud?: string;
  id_proveedor?: number;
  clave_proveedor?: string;
  cuenta_de_deposito?: string;
  tipo_cuenta?: string;
  costo_proveedor?: number;
  codigo_hotel?: string | null;
};

export type CrearDispersionBody = {
  referencia_numerica?: string;
  motivo_pago?: string;
  layoutUrl?: string;
  solicitudes: CrearDispersionSolicitud[];
};

export type SolicitudDispersionProcesada = {
  id_pago: string;
  id_solicitud_proveedor: number;
  id_proveedor_cuenta: number;
  monto_dispersar: number;
  saldo_dispersion_db: number;
  fecha_pago: string | null;
  id_solicitud: string | null;
  id_proveedor: number | null;
  clave_proveedor: string | null;
  cuenta_de_deposito: string | null;
  tipo_cuenta: string | null;
  costo_proveedor: number | null;
  codigo_hotel: string | null;
};

export type CrearDispersionResponse = {
  id_dispersion: string;
  referencia_numerica: string | null;
  motivo_pago: string | null;
  layoutUrl: string | null;
  ids: number[];
  id_pagos: string[];
  solicitudes_procesadas: SolicitudDispersionProcesada[];
  correo_enviado: boolean;
};

export type FiltrosDispersion = {
  codigo_dispersion?: string;
  fecha_pago_inicio?: string;
  fecha_pago_fin?: string;
  id_proveedor_cuenta?: string;
  id_solicitud_proveedor?: string | number;
  page?: number;
  length?: number;
};

export type CuentaDispersion = {
  id: number;
  id_proveedor: number;
  cuenta: string | null;
  banco: string | null;
  titular: string | null;
  alias: string | null;
  tipo_cta: string | null;
  cta: string | null;
  email: string | null;
  url_caratula: string | null;
  comentarios: string | null;
  active: number;
  revision_pendiente: number;
  fecha_revision: string | null;
  revisado_por: string | null;
  cantidad_cambios: number;
  created_at: string;
  created_by: string | null;
  created_by_nombre: string | null;
  ultimo_cambio_at: string | null;
  updated_at: string;
};

export type DispersionItem = {
  id_solicitud_proveedor: number;
  created_at: string;
  monto_solicitado: string;
  saldo: string;
  saldo_dispersion: string;
  fecha_solicitud: string | null;
  estado_solicitud: string;
  estado_facturacion: string;
  forma_pago: "credit" | "contado";
  comentario_CXP: string | null;
  comentario_AP: string | null;
  comentario_ajuste: string | null;
  notas_internas: string | null;
  type: TypeService;
  cliente: string;
  codigo_confirmacion: string;
  id_proveedor: number;
  proveedor: string;
  check_in: string | null;
  check_out: string | null;
  noches: number | null;
  costo_total: string;
  markup: string;
  total: string;
  negociacion_proveedor: string | null;
  id_intermediario: number | null;
  intermediario: string | null;
  negociacion_intermediario: string | null;
  id_dispersion_pagos_proveedor: number;
  monto_pagado: string;
  codigo_dispersion: string;
  fecha_pago: string | null;
  fecha_update: string;
  url_comprobante: string | null;
  id_proveedor_cuenta: string;
  cuenta: CuentaDispersion | null;
};

export type PagarDispersionBody = {
  ids_dispersion: number[];
  url_pdf: string;
  concepto?: string;
};

export type PagarDispersionResponse = {
  ids_dispersion: number[];
  pagos_creados: number;
  url_pdf: string;
};

export const dispersionService = {
  crear: (
    body: CrearDispersionBody,
  ): Promise<ApiResponse<CrearDispersionResponse>> =>
    dispersionApi.post<CrearDispersionResponse>("", body),

  getDispersiones: (
    filtros?: FiltrosDispersion,
  ): Promise<ApiResponse<DispersionItem[]>> =>
    dispersionApi.get<DispersionItem[]>("/", filtros ?? {}),

  pagar: (
    body: PagarDispersionBody,
  ): Promise<ApiResponse<PagarDispersionResponse>> =>
    dispersionApi.post<PagarDispersionResponse>("/pagos", body),
};
