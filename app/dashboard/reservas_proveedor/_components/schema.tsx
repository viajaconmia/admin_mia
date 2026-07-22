"use client";

import { DateTime, Precio, Badge, TextCell, MonoCell } from "@/v3/atom/TableItemsComponent";
import { SolicitudProveedorRaw } from "@/angel/services/pago_proveedor";
import { TypeService } from "@/angel/lib/types";
import { ServiceIcon } from "@/component/atom/ItemTable";

export type { SolicitudProveedorRaw };

export type SolicitudProveedorItem = {
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
  saldo_dispersion: string;
  asignado_a_factura: string | null;
  estado_solicitud: string;
  estado_facturacion: string;
  forma_pago: "credit" | "contado";
  negociacion_proveedor: string | null;
  intermediario: string | null;
  negociacion_intermediario: string | null;
  rfc: string | null;
  uuid: string | null;
  comentario_CXP: string | null;
  comentario_AP: string | null;
  comentario_ajuste: string | null;
  notas_internas: string | null;
};

export const mapSolicitud = (
  raw: SolicitudProveedorRaw,
): SolicitudProveedorItem => ({
  type: raw.type,
  id: raw.id_solicitud_proveedor,
  created_at: raw.created_at,
  codigo_confirmacion: raw.codigo_confirmacion,
  cliente: raw.cliente,
  proveedor: raw.proveedor,
  check_in: raw.check_in,
  check_out: raw.check_out,
  noches: raw.noches,
  fecha_solicitud: raw.fecha_solicitud,
  monto_solicitado: raw.monto_solicitado,
  costo_total: raw.costo_total,
  markup: raw.markup,
  total: raw.total,
  saldo: raw.saldo,
  saldo_dispersion: raw.saldo_dispersion,
  asignado_a_factura: raw.asignado_a_factura,
  estado_solicitud: raw.estado_solicitud,
  estado_facturacion: raw.estado_facturacion,
  forma_pago: raw.forma_pago,
  negociacion_proveedor: raw.negociacion_proveedor,
  intermediario: raw.intermediario,
  negociacion_intermediario: raw.negociacion_intermediario,
  rfc: raw.rfc,
  uuid: raw.uuid,
  comentario_CXP: raw.comentario_CXP,
  comentario_AP: raw.comentario_AP,
  comentario_ajuste: raw.comentario_ajuste,
  notas_internas: raw.notas_internas,
});

const ESTADO_SOLICITUD_STYLES: Record<string, string> = {
  "pagado link":              "bg-green-100 text-green-700 border border-green-300",
  "pagado tarjeta":           "bg-green-100 text-green-700 border border-green-300",
  "pagado transferencia":     "bg-green-100 text-green-700 border border-green-300",
  cancelada:                  "bg-red-100 text-red-700 border border-red-300",
  transferencia_solicitada:   "bg-amber-100 text-amber-700 border border-amber-300",
  "cupon enviado":            "bg-blue-100 text-blue-700 border border-blue-300",
  carta_enviada:              "bg-blue-100 text-blue-700 border border-blue-300",
  solicitada:                 "bg-yellow-100 text-yellow-700 border border-yellow-300",
  dispersion:                 "bg-purple-100 text-purple-700 border border-purple-300",
};

const ESTADO_FACTURACION_STYLES: Record<string, string> = {
  facturado: "bg-green-100 text-green-700 border border-green-300",
  pendiente: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  parcial:   "bg-blue-100 text-blue-700 border border-blue-300",
};

const DEFAULT_BADGE = "bg-gray-100 text-gray-600 border border-gray-300";


export const createSolicitudRenderers = () => ({
  type: ({ value }: { value: TypeService }) => <ServiceIcon type={value} />,

  id: ({ value }: { value: string }) => <MonoCell value={value} />,

  created_at: ({ value }: { value: string }) => <DateTime value={value} />,

  codigo_confirmacion: ({ value }: { value: string }) => (
    <span className="font-mono text-sm font-semibold">{value ?? "—"}</span>
  ),

  cliente: ({ value }: { value: string }) => (
    <span className="font-medium text-gray-900">{value ?? "—"}</span>
  ),

  proveedor: ({ value }: { value: string }) => <TextCell value={value} />,

  check_in: ({ value }: { value: string | null }) => (
    <DateTime value={value} hideTime />
  ),

  check_out: ({ value }: { value: string | null }) => (
    <DateTime value={value} hideTime />
  ),

  noches: ({ value }: { value: number | null }) => (
    <span className="text-sm text-gray-700">
      {value != null ? `${value}` : "—"}
    </span>
  ),

  fecha_solicitud: ({ value }: { value: string | null }) => (
    <DateTime value={value} hideTime />
  ),

  monto_solicitado: ({ value }: { value: string }) => <Precio value={value} />,

  costo_total: ({ value }: { value: string }) => <Precio value={value} />,

  markup: ({ value }: { value: string }) => (
    <span className="text-sm text-gray-700">
      {value != null ? `${parseFloat(value).toFixed(2)}%` : "—"}
    </span>
  ),

  total: ({ value }: { value: string }) => (
    <span className="font-semibold text-blue-700 text-sm">
      <Precio value={value} />
    </span>
  ),

  saldo: ({ value }: { value: string }) => <Precio value={value} />,

  saldo_dispersion: ({ value }: { value: string }) => <Precio value={value} />,

  asignado_a_factura: ({ value }: { value: string | null }) => (
    <Precio value={value ?? "0"} />
  ),

  estado_solicitud: ({ value }: { value: string }) => (
    <Badge
      label={value ?? "—"}
      style={ESTADO_SOLICITUD_STYLES[value?.toLowerCase()] ?? DEFAULT_BADGE}
    />
  ),

  estado_facturacion: ({ value }: { value: string }) => (
    <Badge
      label={value ?? "—"}
      style={ESTADO_FACTURACION_STYLES[value?.toLowerCase()] ?? DEFAULT_BADGE}
    />
  ),

  forma_pago: ({ value }: { value: "credit" | "contado" }) => (
    <Badge
      label={value === "credit" ? "Crédito" : "Contado"}
      style={
        value === "credit"
          ? "bg-blue-100 text-blue-700 border border-blue-300"
          : "bg-green-100 text-green-700 border border-green-300"
      }
    />
  ),

  negociacion_proveedor: ({ value }: { value: string | null }) => (
    <TextCell value={value} />
  ),

  intermediario: ({ value }: { value: string | null }) => (
    <TextCell value={value} />
  ),

  negociacion_intermediario: ({ value }: { value: string | null }) => (
    <TextCell value={value} />
  ),

  rfc: ({ value }: { value: string | null }) => <MonoCell value={value} />,

  uuid: ({ value }: { value: string | null }) => <MonoCell value={value} />,

  comentario_CXP: ({ value }: { value: string | null }) => (
    <TextCell value={value} />
  ),

  comentario_AP: ({ value }: { value: string | null }) => (
    <TextCell value={value} />
  ),

  comentario_ajuste: ({ value }: { value: string | null }) => (
    <TextCell value={value} />
  ),

  notas_internas: ({ value }: { value: string | null }) => (
    <TextCell value={value} />
  ),
});
