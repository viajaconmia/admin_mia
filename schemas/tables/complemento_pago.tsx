import Button from "@/components/atom/Button";
import { Saldo, SaldoFacturaItem } from "@/types/database_tables";
import { DateTime, Precio } from "@/v3/atom/TableItemsComponent";

export type SaldoItem = Pick<
  SaldoFacturaItem,
  "total" | "id_agente" | "agente" | "rfc" | "id_saldos"
> & {
  acciones: SaldoFacturaItem;
  cliente: string;
};

export const mapSaldo = (pago: SaldoFacturaItem): SaldoItem => {
  return {
    agente: pago.agente,
    id_agente: pago.id_agente,
    rfc: pago.rfc,
    total: pago.total,
    id_saldos: pago.id_saldos,
    cliente: pago.rfc,
    acciones: pago,
  };
};

export const createRenderers = ({
  onVerDetalles,
}: {
  onVerDetalles: (id: SaldoItem) => void;
}) => {
  return {
    monto: ({ value }: { value: string }) => <Precio value={value} />,
    total_factura: ({ value }: { value: string }) => <Precio value={value} />,
    total_reserva: ({ value }: { value: string }) => <Precio value={value} />,
    monto_pago_asignado_a_factura: ({ value }: { value: string }) => (
      <Precio value={value} />
    ),
    fecha_creacion_pago: ({ value }: { value: string }) => (
      <DateTime value={value} />
    ),
    fecha_creacion_reserva: ({ value }: { value: string }) => (
      <DateTime value={value} />
    ),
    fecha_creacion_factura: ({ value }: { value: string }) => (
      <DateTime value={value} />
    ),
    acciones: ({ value }: { value: SaldoItem }) => (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onVerDetalles(value)}
      >
        Ver detalle
      </Button>
    ),
  };
};
