import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Button from "@/components/atom/Button";
import {
  Badge,
  DateRenderer,
  GetBadgeRenderer,
  PorcentajeRenderer,
  PrecioRenderer,
  TextRenderer,
} from "@/v3/atom/TableItemsComponent";
import type { CellRenderer } from "@/angel/components/atoms/TableCore";
import type { ReservaComisionable } from "@/angel/services/reservas";

// Solo los campos que se piden ver en la tabla (básicos + comisión),
// renombrados/reordenados para que las columnas salgan como se pidió.
export type ComisionableRow = {
  _seleccion: string; // "" cuando la comisión ya está cobrada (no seleccionable)
  codigo_confirmacion: string;
  cliente: string;
  viajero: string;
  check_in: string;
  check_out: string;
  proveedor: string;
  intermediario: string | null;
  estado: string;
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
    _seleccion: row.comision_cobrada === 1 ? "" : row.id_booking,
    codigo_confirmacion: row.codigo_confirmacion,
    cliente: row.nombre_agente,
    viajero: row.nombre_viajero,
    check_in: row.check_in,
    check_out: row.check_out,
    proveedor: row.proveedor,
    intermediario: row.id_intermediario,
    estado: row.estado,
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
  toggleFila: (id: string) => void,
  estaSeleccionado: (id: string) => boolean,
  procesandoLote: boolean,
): Partial<Record<string, CellRenderer>> {
  return {
    _seleccion: ({ value }: { value: string }) =>
      value === "" ? (
        <div
          className="flex h-full w-full items-center justify-center"
          title="Comisión ya cobrada"
        >
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
      ) : (
        <div className="relative flex h-full w-full items-center justify-center">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-4 hover:cursor-pointer hover:bg-black/30 transition-colors rounded-full"
            onClick={() => toggleFila(value)}
          >
            <Checkbox
              checked={estaSeleccionado(value)}
              onCheckedChange={() => {}}
            />
          </div>
        </div>
      ),
    check_in: DateRenderer,
    check_out: DateRenderer,
    estado: GetBadgeRenderer({
      confirmada: "bg-green-50 text-green-700 border border-green-200",
      cancelada: "bg-red-50 text-red-700 border border-red-200",
    }),
    total: PrecioRenderer,
    costo_total: PrecioRenderer,
    monto_comisionable: PrecioRenderer,
    porcentaje_comisionable: PorcentajeRenderer,
    comentarios_comisionables: TextRenderer,
    is_comisionable: ({ value }: { value: 0 | 1 }) => (
      <Badge
        label={value === 1 ? "Sí" : "No"}
        style={
          value === 1
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-gray-100 text-gray-600 border border-gray-300"
        }
      />
    ),
    comision_cobrada: ({ value }: { value: 0 | 1 }) => (
      <Badge
        label={value === 1 ? "Cobrada" : "Pendiente"}
        style={
          value === 1
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }
      />
    ),
    acciones: ({ value }) => {
      const row = value as ReservaComisionable;
      const yaCobrada = row.comision_cobrada === 1;
      const cobrandoEsta = cobrandoId === row.id_booking;

      return (
        <Button
          size="sm"
          variant="primary"
          disabled={yaCobrada || cobrandoEsta || procesandoLote}
          loading={cobrandoEsta}
          onClick={() => onCobrar(row.id_booking)}
        >
          Comisión cobrada
        </Button>
      );
    },
  };
}
