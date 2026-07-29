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
  created_at: string;
  codigo_confirmacion: string;
  cliente: string;
  proveedor: string;
  check_in: string | null;
  check_out: string | null;
  noches: number | null;
  fecha_solicitud: string | null;
  monto_solicitado: string;
  costo_total: string;
  markup: string;
  total: string;
  saldo: string;
  saldo_dispersion: number;
  asignado_a_factura?: string | null;
  numero_factura?: string;
  estado_solicitud: string;
  estado_facturacion: string;
  forma_pago: "credit" | "contado";
  negociacion_proveedor: string | null;
  intermediario: string | null;
  negociacion_intermediario: string | null;
  rfc?: string | null;
  uuid?: string | null;
  comentario_CXP: string | null;
  comentario_AP: string | null;
  comentario_ajuste: string | null;
  notas_internas: string | null;
};

const isNotFirstIndice = (raw: SolicitudProveedorRaw) =>
  raw.indice_factura != null && raw.indice_factura > 1;

export const mapSolicitud = (
  raw: SolicitudProveedorRaw,
): SolicitudProveedorItem => ({
  _seleccion: String(raw.id_solicitud_proveedor),
  type: raw.type,
  id: String(raw.id_solicitud_proveedor),
  created_at: raw.created_at,
  estado_solicitud: raw.estado_solicitud,
  fecha_solicitud: raw.fecha_solicitud,
  codigo_confirmacion: raw.codigo_confirmacion,
  cliente: raw.cliente,
  proveedor: raw.proveedor,
  intermediario: raw.intermediario,
  negociacion_proveedor: raw.negociacion_proveedor,
  negociacion_intermediario: raw.negociacion_intermediario,
  check_in: raw.check_in,
  check_out: raw.check_out,
  noches: raw.noches,
  monto_solicitado: isNotFirstIndice(raw) ? "" : raw.monto_solicitado,
  costo_total: isNotFirstIndice(raw) ? "" : raw.costo_total,
  markup: isNotFirstIndice(raw) ? "" : raw.markup,
  total: isNotFirstIndice(raw) ? "" : raw.total,
  saldo: isNotFirstIndice(raw) ? "" : raw.saldo,
  saldo_dispersion: Number(raw.saldo_dispersion || 0),
  estado_facturacion: raw.estado_facturacion,
  forma_pago: raw.forma_pago,
  rfc: raw.rfc,
  uuid: raw.uuid,
  asignado_a_factura: raw.asignado_a_factura,
  numero_factura: !(raw.total_facturas == null || raw.total_facturas === 0)
    ? `${raw.indice_factura} de ${raw.total_facturas}`
    : "",
  comentario_CXP: raw.comentario_CXP,
  comentario_AP: raw.comentario_AP,
  comentario_ajuste: raw.comentario_ajuste,
  notas_internas: raw.notas_internas,
});

export const createSolicitudRenderers = () => ({
  type: ServiceRenderer,
  id: MonoRenderer,
  created_at: DateTimeRenderer,
  codigo_confirmacion: BoldRenderer,
  cliente: TextRenderer,
  proveedor: BoldRenderer,
  check_in: DateRenderer,
  check_out: DateRenderer,
  numero_factura: MonoRenderer,
  negociacion_proveedor: TextRenderer,
  intermediario: TextRenderer,
  negociacion_intermediario: TextRenderer,
  rfc: MonoRenderer,
  uuid: MonoRenderer,
  comentario_CXP: TextRenderer,
  comentario_AP: TextRenderer,
  comentario_ajuste: TextRenderer,
  notas_internas: TextRenderer,
  fecha_solicitud: DateRenderer,
  monto_solicitado: PrecioRenderer,
  costo_total: PrecioRenderer,
  markup: PorcentajeRenderer,
  total: PrecioRenderer,
  saldo: PrecioRenderer,
  saldo_dispersion: PrecioRenderer,
  asignado_a_factura: PrecioRenderer,
  noches: TextRenderer,
  estado_solicitud: GetBadgeRenderer(ESTADO_SOLICITUD_STYLES),
  estado_facturacion: GetBadgeRenderer(ESTADO_FACTURACION_STYLES),
  forma_pago: GetBadgeRenderer(FORMA_PAGO_STYLES, (v) =>
    v === "credit" ? "Crédito" : "Contado",
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
  total: (rows) => <Precio value={String(sumar(rows, "total"))} />,
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

const FORMA_PAGO_STYLES: Record<string, string> = {
  credit: "bg-blue-100 text-blue-700 border border-blue-300",
  contado: "bg-green-100 text-green-700 border border-green-300",
};

const ESTADO_FACTURACION_STYLES: Record<string, string> = {
  facturado: "bg-green-100 text-green-700 border border-green-300",
  pendiente: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  parcial: "bg-blue-100 text-blue-700 border border-blue-300",
};
