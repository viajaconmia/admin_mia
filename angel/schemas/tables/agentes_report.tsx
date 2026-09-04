import {
  DateRenderer,
  GetBadgeRenderer,
  MonoRenderer,
  PrecioRenderer,
  TextRenderer,
} from "@/v3/atom/TableItemsComponent";
import type { CellRenderer } from "@/angel/components/atoms/TableCore";

export type ColumnaDisponible = { key: string; label: string };

/** Set y orden de columnas por default — igual al `customColumns` que usa hoy
 * la pantalla legacy (app/dashboard/detalles_facturas/page.tsx). Alimenta el
 * orden inicial de `useColumnConfig` y la lista que muestra `ColumnConfigPanel`. */
export const AGENTES_REPORT_COLUMNAS_DEFAULT: ColumnaDisponible[] = [
  { key: "viajero", label: "Viajero" },
  { key: "numero_empleado", label: "Número empleado" },
  { key: "host", label: "Hotel" },
  { key: "tipo_habitacion", label: "Tipo de habitación" },
  { key: "chin", label: "Check-in" },
  { key: "chout", label: "Check-out" },
  { key: "noches", label: "Noches" },
  { key: "tarifa_por_noche", label: "Tarifa por noche" },
  { key: "monto_total_por_estancia", label: "Monto total estancia" },
  { key: "fecha_emision", label: "Fecha de emisión" },
  { key: "estado_reserva", label: "Estado" },
  { key: "codigo_confirmacion", label: "Código confirmación" },
  { key: "folio", label: "Folio" },
  { key: "uuid_factura", label: "UUID factura" },
  { key: "booking_subtotal", label: "Subtotal" },
  { key: "booking_iva", label: "IVA" },
  { key: "booking_total", label: "Total" },
];

export function createAgentesReportRenderers(): Partial<
  Record<string, CellRenderer>
> {
  return {
    chin: DateRenderer,
    chout: DateRenderer,
    fecha_emision: DateRenderer,
    viajero: TextRenderer,
    host: TextRenderer,
    codigo_empleado: TextRenderer,
    numero_empleado: TextRenderer,
    tarifa_por_noche: PrecioRenderer,
    monto_total_por_estancia: PrecioRenderer,
    booking_subtotal: PrecioRenderer,
    booking_iva: PrecioRenderer,
    booking_total: PrecioRenderer,
    folio: MonoRenderer,
    codigo_confirmacion: MonoRenderer,
    uuid_factura: MonoRenderer,
    tipo_habitacion: GetBadgeRenderer({}, undefined, "bg-gray-100 text-gray-700"),
    estado_reserva: GetBadgeRenderer({
      confirmada: "bg-green-100 text-green-800",
      cancelada: "bg-red-100 text-red-800",
      pendiente: "bg-yellow-100 text-yellow-800",
      completada: "bg-blue-100 text-blue-800",
    }),
  };
}
