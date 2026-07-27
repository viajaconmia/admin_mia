import { TypeService } from "@/angel/lib/types";
import { ApiResponse, createApiClient } from "../apiClient";

const pagoProveedorApi = createApiClient("/v2/mia/pago_proveedor");

export type SolicitudProveedorRaw = {
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
  // Solo presentes cuando includeFacturas=true
  rfc?: string | null;
  uuid?: string | null;
  id_factura?: string | null;
  asignado_a_factura?: string | null;
  indice_factura?: number;
  total_facturas?: number;
};

export type BucketReservas =
  | "spei"
  | "pago_tdc"
  | "pago_link"
  | "pagada"
  | "notificados"
  | "canceladas"
  | "ap_credito"
  | "pendiente_credito";

export type FiltrosReservasProveedor = {
  notas_internas?: string;
  codigo_confirmacion?: string;
  cliente?: string;
  proveedor?: string;
  servicio?: TypeService;
  estado_solicitud?: string;
  estado_facturacion?: string;
  forma_pago?: "credit" | "contado";
  tipo_negociacion?: string;
  rfc?: string;
  uuid?: string;
  comentarios_ops?: string;
  comentarios_cxp?: string;
  fecha_inicio_creacion?: string;
  fecha_fin_creacion?: string;
  fecha_solicitud_inicio?: string;
  fecha_solicitud_fin?: string;
  bucket?: BucketReservas;
  includeFacturas?: boolean;
  page?: number;
  length?: number;
};

export type CuentaProveedor = {
  id: number;
  clabe: string | null;
  cuenta: string | null;
  banco: string;
  alias: string | null;
  id_proveedor: number;
  titular: string | null;
};

export type FacturaDispersion = {
  id_factura: string | null;
  monto_asignado: number;
};

export type DispersionItem = {
  id: string;
  id_proveedor: number;
  id_intermediario: number | null;
  codigo_confirmacion: string;
  proveedor: string;
  saldo_dispersion: number;
  check_out: string | null;
  factura: FacturaDispersion | null;
};

type DispersionSolicitudPayload = {
  id_solicitud: string;
  id_solicitud_proveedor: string;
  id_pago: null;
  id_proveedor: number;
  clave_proveedor: string;
  cuenta_de_deposito: string;
  id_proveedor_cuenta: number;
  tipo_cuenta: string;
  costo_proveedor: string;
  codigo_hotel: null;
  fecha_pago: string | null;
  id_factura: string | null;
};

export type DispersionBody = {
  id_dispersion: string;
  referencia_numerica: string;
  motivo_pago: string;
  layoutUrl: string;
  solicitudes: DispersionSolicitudPayload[];
};

export const pagoProveedorService = {
  getReservas: (
    filtros?: FiltrosReservasProveedor,
  ): Promise<ApiResponse<SolicitudProveedorRaw[]>> =>
    pagoProveedorApi.get<SolicitudProveedorRaw[]>("/reservas", filtros ?? {}),

  getCuentas: (ids: string[]): Promise<ApiResponse<CuentaProveedor[]>> =>
    pagoProveedorApi.post<CuentaProveedor[]>("/cuentas", { id_proveedor: ids }),

  dispersar: (
    body: DispersionBody,
  ): Promise<ApiResponse<{ id_pagos: string[] }>> =>
    pagoProveedorApi.post<{ id_pagos: string[] }>("/dispersion", body),
};
