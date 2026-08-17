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
  monto_propina?: string | null;
  monto_impsan?: string | null;
  indice_factura?: number;
  total_facturas?: number;
  // Solo presentes cuando includePagos=true
  codigo_dispersion?: string | null;
  url_pdf?: string | null;
  monto?: string | null;
  indice_pago?: number;
  total_pagos?: number;
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
  // rfc/uuid requieren includeFacturas=true para tener efecto (misma
  // dependencia que con_dispersion con includePagos, ver abajo).
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
  // No combinar con includeFacturas=true salvo que se necesite explícitamente:
  // el backend hace producto cruzado factura × pago por solicitud.
  includePagos?: boolean;
  // Solo solicitudes con pago_proveedores.id_pago_dispersion != NULL.
  // Requiere includePagos=true para tener efecto (misma lógica que rfc/uuid
  // con includeFacturas).
  con_dispersion?: boolean;
  // "pago_created_at" ordena por pago_proveedores.created_at. desc ya es el
  // default del backend si se omite order_dir, pero se manda explícito para
  // que el query string documente la intención por sí solo.
  order_by?: "pago_created_at";
  order_dir?: "asc" | "desc";
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

// Debe reflejar el ALLOWED_FIELDS de pagoProveedoresSolicitudes.service.js.
// Agregar un campo aquí solo tiene sentido si el backend ya lo agregó a su
// allowlist (si no, responde 400).
export type EditarSolicitudValores = {
  notas_internas?: string;
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

  // PATCH /v2/mia/pago_proveedor/solicitudes?id_solicitud_proveedor=X
  // Un id por llamada; el body solo debe traer campos de EditarSolicitudValores
  // (el backend valida contra su allowlist y rechaza cualquier otro con 400).
  editarSolicitud: (
    id: string,
    valores: EditarSolicitudValores,
  ): Promise<ApiResponse<null>> =>
    pagoProveedorApi.patch<null>(
      `/solicitudes?id_solicitud_proveedor=${encodeURIComponent(id)}`,
      valores,
    ),
};
