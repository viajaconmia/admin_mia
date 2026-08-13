import Button from "@/components/atom/Button";
import {
  DateRenderer,
  PorcentajeRenderer,
  PrecioRenderer,
  TextRenderer,
} from "@/v3/atom/TableItemsComponent";
import type { CellRenderer } from "@/angel/components/atoms/TableCore";
import type { ReservaComisionable } from "@/angel/services/reservas";

// Solo los campos que se piden ver en la tabla (básicos + comisión),
// renombrados/reordenados para que las columnas salgan como se pidió.
export type ComisionableRow = {
  codigo_confirmacion: string;
  cliente: string;
  viajero: string;
  check_in: string;
  check_out: string;
  proveedor: string;
  intermediario: string | null;
  total: string;
  costo_total: string;
  is_comisionable: 0 | 1;
  monto_comisionable: string;
  porcentaje_comisionable: string;
  comentarios_comisionables: string;
  comision_cobrada: 0 | 1;
  acciones: ReservaComisionable;
};

export function mapComisionable(row: ReservaComisionable): ComisionableRow {
  return {
    codigo_confirmacion: row.codigo_confirmacion,
    cliente: row.nombre_agente,
    viajero: row.nombre_viajero,
    check_in: row.check_in,
    check_out: row.check_out,
    proveedor: row.proveedor,
    intermediario: row.id_intermediario,
    total: row.total,
    costo_total: row.costo_total,
    is_comisionable: row.is_comisionable,
    monto_comisionable: row.monto_comisionable,
    porcentaje_comisionable: row.porcentaje_comisionable,
    comentarios_comisionables: row.comentarios_comisionables,
    comision_cobrada: row.comision_cobrada,
    acciones: row,
  };
}

export function createComisionablesRenderers(
  onCobrar: (id_booking: string) => void,
  cobrandoId: string | null,
): Partial<Record<string, CellRenderer>> {
  return {
    check_in: DateRenderer,
    check_out: DateRenderer,
    total: PrecioRenderer,
    costo_total: PrecioRenderer,
    monto_comisionable: PrecioRenderer,
    porcentaje_comisionable: PorcentajeRenderer,
    comentarios_comisionables: TextRenderer,
    is_comisionable: ({ value }) => (value === 1 ? "Sí" : "No"),
    comision_cobrada: ({ value }) => (value === 1 ? "Cobrada" : "Pendiente"),
    acciones: ({ value }) => {
      const row = value as ReservaComisionable;
      const yaCobrada = row.comision_cobrada === 1;
      const cobrandoEsta = cobrandoId === row.id_booking;

      return (
        <Button
          size="sm"
          variant="primary"
          disabled={yaCobrada || cobrandoEsta}
          loading={cobrandoEsta}
          onClick={() => onCobrar(row.id_booking)}
        >
          Comisión cobrada
        </Button>
      );
    },
  };
}
