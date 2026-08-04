import { TypeService } from "@/angel/lib/types";
import { ApiResponse, createApiClient } from "../apiClient";

const pagoProveedorApi = createApiClient("/v2/mia/pago_proveedor");

export type SolicitudProveedorRaw = {
  id_solicitud_proveedor: number;
  created_at: string;
  created_at_booking: string;
  comentarios_ops: string | null;
  estatus_pagos: string | null;
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
  checkin_inicio?: string;
  checkin_fin?: string;
  estatus_pagos?: string;
  bucket?: BucketReservas;
  includeFacturas?: boolean;
  page?: number;
  length?: number;
};

export type CuentaProveedorDispersion = {
  id: number;
  id_proveedor: number;
  cuenta: string | null;
  banco: string | null;
  titular: string | null;
  alias: string | null;
  tipo_cta: string | null;
  cta: string | null;
  active: number;
};

export type FacturaDispersionDetalle = {
  id_solicitud: number;
  id_factura: number;
  rfc: string | null;
  uuid: string | null;
  fecha_emision: string | null;
  subtotal: number;
  iva: number;
  total_factura: number;
  asignado: number;
};

export type SolicitudDispersionInfo = {
  id_solicitud_proveedor: number;
  created_at: string;
  monto_solicitado: number;
  saldo: number;
  saldo_dispersion: number;
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
  costo_total: number;
  markup: number;
  total: number;
  negociacion_proveedor: string | null;
  id_intermediario: number | null;
  intermediario: string | null;
  negociacion_intermediario: string | null;
  cuentas: CuentaProveedorDispersion[];
  facturas: FacturaDispersionDetalle[];
};

export const pagoProveedorService = {
  getReservas: (
    filtros?: FiltrosReservasProveedor,
  ): Promise<ApiResponse<SolicitudProveedorRaw[]>> =>
    pagoProveedorApi.get<SolicitudProveedorRaw[]>("/reservas", filtros ?? {}),

  getSolicitudesDispersion: (
    ids: number[],
  ): Promise<ApiResponse<SolicitudDispersionInfo[]>> =>
    pagoProveedorApi.post<SolicitudDispersionInfo[]>(
      "/solicitudes/dispersion",
      { ids },
    ),
};
