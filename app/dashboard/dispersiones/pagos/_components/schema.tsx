"use client";

import {
  Badge,
  TextRenderer,
  MonoRenderer,
  PrecioRenderer,
  DateRenderer,
  DateTimeRenderer,
  BoldRenderer,
  PorcentajeRenderer,
  ServiceRenderer,
  GetBadgeRenderer,
} from "@/v3/atom/TableItemsComponent";
import { SolicitudProveedorRaw } from "@/angel/services/pago_proveedor";
// import { TypeService } from "@/angel/lib/types";

// Misma idea que app/dashboard/reservas_proveedor/_components/schema.tsx
// (indice_factura/total_facturas), solo que aquí la fila se repite por pago
// (includePagos=true) en vez de por factura.

export type PagoProveedorItem = {
  // type: TypeService;
  id: string;
  // created_solicitud: string;
  // created_reserva: string;
  codigo_confirmacion: string;
  // cliente: string;
  proveedor: string;
  check_in: string | null;
  check_out: string | null;
  // noches: number | null;
  fecha_solicitud: string | null;
  // costo_total: string;
  // markup: string;
  // precio_venta: string;
  // monto_solicitado: string;
  // saldo: string;
  // saldo_dispersion: number;
  // estado_solicitud: string;
  // estado_facturacion: string;
  estado_pago: string | null;
  // forma_pago: "credit" | "contado";
  // negociacion_proveedor: string | null;
  intermediario: string | null;
  codigo_dispersion: string;
  numero_pago: string;
  monto_pago: string;
  comprobante: string | null;
  // comentarios_ops: string | null;
  // comentario_CXP: string | null;
  // comentarios_fin: string | null;
};

const isNotFirstIndicePago = (raw: SolicitudProveedorRaw) =>
  raw.indice_pago != null && raw.indice_pago > 1;

export const mapPago = (raw: SolicitudProveedorRaw): PagoProveedorItem => ({
  // type: raw.type,
  id: String(raw.id_solicitud_proveedor),
  // created_solicitud: raw.created_at,
  // created_reserva: raw.created_at_booking,
  codigo_dispersion: raw.codigo_dispersion ?? "",
  // estado_solicitud: raw.estado_solicitud,
  estado_pago: raw.estatus_pagos,
  fecha_solicitud: raw.fecha_solicitud,
  // comentarios_fin: raw.notas_internas,
  codigo_confirmacion: raw.codigo_confirmacion,
  // cliente: raw.cliente,
  proveedor: raw.proveedor,
  intermediario: raw.intermediario,
  // negociacion_proveedor: raw.negociacion_proveedor,
  check_in: raw.check_in,
  check_out: raw.check_out,
  // noches: raw.noches,
  // costo_total: isNotFirstIndicePago(raw) ? "" : raw.costo_total,
  // markup: isNotFirstIndicePago(raw) ? "" : raw.markup,
  // precio_venta: isNotFirstIndicePago(raw) ? "" : raw.total,
  // monto_solicitado: isNotFirstIndicePago(raw) ? "" : raw.monto_solicitado,
  // saldo: isNotFirstIndicePago(raw) ? "" : raw.saldo,
  // saldo_dispersion: Number(raw.saldo_dispersion || 0),
  // estado_facturacion: raw.estado_facturacion,
  // forma_pago: raw.forma_pago,
  monto_pago: raw.monto ?? "",
  numero_pago: !(raw.total_pagos == null || raw.total_pagos === 0)
    ? `${raw.indice_pago} de ${raw.total_pagos}`
    : "",
  comprobante: raw.url_pdf ?? null,
  // comentarios_ops: raw.comentarios_ops,
  // comentario_CXP: raw.comentario_CXP,
});

export const createPagoRenderers = () => ({
  type: ServiceRenderer,
  id: MonoRenderer,
  created_solicitud: DateTimeRenderer,
  created_reserva: DateTimeRenderer,
  codigo_confirmacion: BoldRenderer,
  cliente: TextRenderer,
  proveedor: BoldRenderer,
  check_in: DateRenderer,
  check_out: DateRenderer,
  noches: TextRenderer,
  fecha_solicitud: DateRenderer,
  monto_solicitado: PrecioRenderer,
  costo_total: PrecioRenderer,
  markup: PorcentajeRenderer,
  precio_venta: PrecioRenderer,
  saldo: PrecioRenderer,
  saldo_dispersion: PrecioRenderer,
  negociacion_proveedor: TextRenderer,
  intermediario: TextRenderer,
  codigo_dispersion: ({ value }: { value: string }) =>
    value ? (
      <Badge
        label={value}
        style="bg-blue-100 text-blue-700 border border-blue-300"
      />
    ) : null,
  numero_pago: MonoRenderer,
  monto_pago: PrecioRenderer,
  comprobante: ({ value }: { value: string | null }) =>
    value ? (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-xs font-medium"
      >
        Ver
      </a>
    ) : (
      <span className="text-gray-400 text-xs">Pendiente</span>
    ),
  comentarios_ops: TextRenderer,
  comentario_CXP: TextRenderer,
  comentarios_fin: TextRenderer,
  estado_pago: GetBadgeRenderer(ESTADO_PAGO_STYLES),
  estado_solicitud: GetBadgeRenderer(ESTADO_SOLICITUD_STYLES),
  estado_facturacion: GetBadgeRenderer(ESTADO_FACTURACION_STYLES),
  forma_pago: GetBadgeRenderer(FORMA_PAGO_STYLES, (v) =>
    v === "credit" ? "Crédito" : "Contado",
  ),
});

// Mismos estilos que reservas_proveedor/_components/schema.tsx — duplicados
// a propósito en vez de importados entre rutas; son 4 tablas de lookup
// chicas y de bajo riesgo de desincronizarse. Si molesta la duplicación,
// se pueden mover a un lugar compartido dentro de angel/.
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
