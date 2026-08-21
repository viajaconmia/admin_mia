"use client";

import {
  TextRenderer,
  MonoRenderer,
  PrecioRenderer,
  DateRenderer,
  DateTimeRenderer,
  BoldRenderer,
  PorcentajeRenderer,
  ServiceRenderer,
  GetBadgeRenderer,
  Precio,
} from "@/v3/atom/TableItemsComponent";
import { type TotalFn } from "@/angel/components/atoms/TableCore";
import { SolicitudProveedorRaw } from "@/angel/services/pago_proveedor";
import { TypeService } from "@/angel/lib/types";

export type { SolicitudProveedorRaw };

export type SolicitudProveedorItem = {
  _seleccion: string;
  type: TypeService;
  id: string;
  created_solicitud: string;
  created_reserva: string;
  codigo_confirmacion: string;
  cliente: string;
  estado_pago: string | null;
  proveedor: string;
  check_in: string | null;
  check_out: string | null;
  noches: number | null;
  fecha_solicitud: string | null;
  costo_total: string;
  markup: string;
  precio_venta: string;
  monto_solicitado: string;
  saldo: string;
  saldo_dispersion: number;
  asignado_a_factura?: string | null;
  monto_propina?: string | null;
  monto_impsan?: string | null;
  numero_factura?: string;
  estado_solicitud: string;
  estado_facturacion: string;
  forma_pago: "credit" | "contado";
  negociacion_proveedor: string | null;
  intermediario: string | null;
  // negociacion_intermediario: string | null;
  rfc?: string | null;
  uuid?: string | null;
  comentarios_ops: string | null;
  comentario_CXP: string | null;
  comentarios_fin: string | null;
  is_comisionable: string; // "1" | "0", para que GetBadgeRenderer haga el lookup
  monto_comisionable: string | null;
  porcentaje_comisionable: string | null;
  comentarios_comisionables: string | null;
  comision_cobrada: string; // "1" | "0"
};

const isNotFirstIndice = (raw: SolicitudProveedorRaw) =>
  raw.indice_factura != null && raw.indice_factura > 1;

export const mapSolicitud = (
  raw: SolicitudProveedorRaw,
): SolicitudProveedorItem => ({
  _seleccion: String(raw.id_solicitud_proveedor),
  type: raw.type,
  id: String(raw.id_solicitud_proveedor),
  created_solicitud: raw.created_at,
  created_reserva: raw.created_at_booking,
  estado_solicitud: raw.estado_solicitud,
  estado_pago: raw.estatus_pagos,
  fecha_solicitud: raw.fecha_solicitud,
  comentarios_fin: raw.notas_internas,
  codigo_confirmacion: raw.codigo_confirmacion,
  cliente: raw.cliente,
  proveedor: raw.proveedor,
  intermediario: raw.intermediario,
  negociacion_proveedor: raw.negociacion_proveedor,
  // negociacion_intermediario: raw.negociacion_intermediario,
  check_in: raw.check_in,
  check_out: raw.check_out,
  noches: raw.noches,
  costo_total: isNotFirstIndice(raw) ? "" : raw.costo_total,
  markup: isNotFirstIndice(raw) ? "" : raw.markup,
  precio_venta: isNotFirstIndice(raw) ? "" : raw.total,
  monto_solicitado: isNotFirstIndice(raw) ? "" : raw.monto_solicitado,
  saldo: isNotFirstIndice(raw) ? "" : raw.saldo,
  saldo_dispersion: Number(raw.saldo_dispersion || 0),
  estado_facturacion: raw.estado_facturacion,
  forma_pago: raw.forma_pago,
  rfc: raw.rfc,
  uuid: raw.uuid,
  monto_impsan: raw.monto_impsan,
  monto_propina: raw.monto_propina,
  asignado_a_factura: raw.asignado_a_factura,
  numero_factura: !(raw.total_facturas == null || raw.total_facturas === 0)
    ? `${raw.indice_factura} de ${raw.total_facturas}`
    : "",
  comentarios_ops: raw.comentarios_ops,
  comentario_CXP: raw.comentario_CXP,
  is_comisionable: String(raw.is_comisionable),
  monto_comisionable: raw.monto_comisionable,
  porcentaje_comisionable: raw.porcentaje_comisionable,
  comentarios_comisionables: raw.comentarios_comisionables,
  comision_cobrada: String(raw.comision_cobrada),
});

export const createSolicitudRenderers = () => ({
  type: ServiceRenderer,
  id: MonoRenderer,
  created_solicitud: DateTimeRenderer,
  created_reserva: DateTimeRenderer,
  codigo_confirmacion: BoldRenderer,
  cliente: TextRenderer,
  proveedor: BoldRenderer,
  check_in: DateRenderer,
  check_out: DateRenderer,
  numero_factura: MonoRenderer,
  negociacion_proveedor: TextRenderer,
  intermediario: TextRenderer,
  rfc: MonoRenderer,
  uuid: MonoRenderer,
  comentarios_ops: TextRenderer,
  comentario_CXP: TextRenderer,
  comentarios_fin: TextRenderer,
  fecha_solicitud: DateRenderer,
  monto_solicitado: PrecioRenderer,
  costo_total: PrecioRenderer,
  markup: PorcentajeRenderer,
  precio_venta: PrecioRenderer,
  saldo: PrecioRenderer,
  saldo_dispersion: PrecioRenderer,
  asignado_a_factura: PrecioRenderer,
  monto_impsan: PrecioRenderer,
  monto_propina: PrecioRenderer,
  noches: TextRenderer,
  estado_pago: GetBadgeRenderer(ESTADO_PAGO_STYLES),
  estado_solicitud: GetBadgeRenderer(ESTADO_SOLICITUD_STYLES),
  estado_facturacion: GetBadgeRenderer(ESTADO_FACTURACION_STYLES),
  forma_pago: GetBadgeRenderer(FORMA_PAGO_STYLES, (v) =>
    v === "credit" ? "Crédito" : "Contado",
  ),
  monto_comisionable: PrecioRenderer,
  porcentaje_comisionable: PorcentajeRenderer,
  comentarios_comisionables: TextRenderer,
  is_comisionable: GetBadgeRenderer(IS_COMISIONABLE_STYLES, (v) =>
    v === "1" ? "Sí" : "No",
  ),
  comision_cobrada: GetBadgeRenderer(COMISION_COBRADA_STYLES, (v) =>
    v === "1" ? "Cobrada" : "Pendiente",
  ),
});

const sumar = (
  rows: SolicitudProveedorItem[],
  key: keyof SolicitudProveedorItem,
) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

export const createSolicitudTotales = (): Partial<
  Record<keyof SolicitudProveedorItem, TotalFn<SolicitudProveedorItem>>
> => ({
  monto_solicitado: (rows) => (
    <Precio value={String(sumar(rows, "monto_solicitado"))} />
  ),
  costo_total: (rows) => <Precio value={String(sumar(rows, "costo_total"))} />,
  precio_venta: (rows) => (
    <Precio value={String(sumar(rows, "precio_venta"))} />
  ),
  saldo: (rows) => <Precio value={String(sumar(rows, "saldo"))} />,
  saldo_dispersion: (rows) => (
    <Precio value={String(sumar(rows, "saldo_dispersion"))} />
  ),
});

const ESTADO_SOLICITUD_STYLES: Record<string, string> = {
  "pagado link": "bg-green-100 text-green-700 border border-green-300",
  "pagado tarjeta": "bg-green-100 text-green-700 border border-green-300",
  "pagado transferencia": "bg-green-100 text-green-700 border border-green-300",
  cancelada: "bg-red-100 text-red-700 border border-red-300",
  transferencia_solicitada:
    "bg-amber-100 text-amber-700 border border-amber-300",
  "cupon enviado": "bg-blue-100 text-blue-700 border border-blue-300",
  carta_enviada: "bg-blue-100 text-blue-700 border border-blue-300",
  solicitada: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  dispersion: "bg-purple-100 text-purple-700 border border-purple-300",
};

const ESTADO_PAGO_STYLES: Record<string, string> = {
  enviado_a_pago: "bg-green-100 text-green-700 border border-green-300",
  pagado: "bg-green-100 text-green-700 border border-green-300",
};

const FORMA_PAGO_STYLES: Record<string, string> = {
  credit: "bg-blue-100 text-blue-700 border border-blue-300",
  contado: "bg-green-100 text-green-700 border border-green-300",
};

const ESTADO_FACTURACION_STYLES: Record<string, string> = {
  facturado: "bg-green-100 text-green-700 border border-green-300",
  pendiente: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  parcial: "bg-blue-100 text-blue-700 border border-blue-300",
};

const IS_COMISIONABLE_STYLES: Record<string, string> = {
  "1": "bg-blue-50 text-blue-700 border border-blue-200",
  "0": "bg-gray-100 text-gray-600 border border-gray-300",
};

const COMISION_COBRADA_STYLES: Record<string, string> = {
  "1": "bg-green-50 text-green-700 border border-green-200",
  "0": "bg-amber-50 text-amber-700 border border-amber-200",
};
