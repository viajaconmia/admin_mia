import { TypeService } from "@/angel/lib/types";
import { ApiResponse, createApiClient } from "../apiClient";

const pagoProveedorApi = createApiClient("/v2/mia/pago_proveedor");

export type SolicitudProveedorRaw = {
  type: TypeService;
  id_solicitud_proveedor: string;
  created_at: string;
  monto_solicitado: string;
  saldo: string;
  saldo_dispersion: string;
  fecha_solicitud: string | null;
  estado_solicitud: string;
  estado_facturacion: string;
  forma_pago: "credit" | "contado";
  cliente: string;
  codigo_confirmacion: string;
  id_proveedor: string;
  proveedor: string;
  check_in: string | null;
  check_out: string | null;
  noches: number | null;
  costo_total: string;
  markup: string;
  total: string;
  negociacion_proveedor: string | null;
  id_intermediario: string | null;
  intermediario: string | null;
  negociacion_intermediario: string | null;
  comentario_CXP: string | null;
  comentario_AP: string | null;
  comentario_ajuste: string | null;
  notas_internas: string | null;
  rfc: string | null;
  uuid: string | null;
  asignado_a_factura: string | null;
};

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
  page?: number;
  length?: number;
};

export const pagoProveedorService = {
  getReservas: (
    filtros?: FiltrosReservasProveedor,
  ): Promise<ApiResponse<SolicitudProveedorRaw[]>> =>
    pagoProveedorApi.get<SolicitudProveedorRaw[]>("/reservas", filtros ?? {}),
};
