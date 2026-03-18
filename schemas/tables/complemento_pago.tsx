import Button from "@/components/atom/Button";
import { Saldo } from "@/types/database_tables";
import { DateTime, Precio } from "@/v3/atom/TableItemsComponent";

export type SaldoItem = Pick<Saldo, "banco_tarjeta" | "monto"> & {
  acciones: number;
  id_agente: string;
  creado_en: string;
  cliente: string;
  rfc: string;
};

export const mapSaldo = (pago: any): any => {
  return {
    agente: pago.agente,
    codigo_confirmacion: pago.codigo_confirmacion,
    fecha_creacion_factura: pago.fecha_creacion_factura,
    fecha_creacion_pago: pago.fecha_creacion_pago,
    fecha_creacion_reserva: pago.fecha_creacion_reserva,
    id_saldos: pago.id_saldos,
    monto: pago.monto,
    monto_pago_asignado_a_factura: pago.monto_pago_asignado_a_factura,
    tipo_servicio: pago.tipo_servicio,
    total_factura: pago.total_factura,
    total_reserva: pago.total_reserva,
    uuid_factura: pago.uuid_factura,
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
