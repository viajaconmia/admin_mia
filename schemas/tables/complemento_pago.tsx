import Button from "@/components/atom/Button";
import { Saldo } from "@/types/database_tables";
import { DateTime, Precio } from "@/v3/atom/TableItemsComponent";

export type SaldoItem = Pick<Saldo, "banco_tarjeta" | "monto"> & {
  acciones: number;
  creado_en: string;
  cliente: string;
};

export const mapSaldo = (saldo: Saldo): SaldoItem => {
  return {
    cliente: saldo.nombre,
    banco_tarjeta: saldo.banco_tarjeta,
    monto: saldo.monto,
    creado_en: saldo.fecha_creacion,
    acciones: saldo.id_saldos,
  };
};

export const createRenderers = ({
  onVerDetalles,
}: {
  onVerDetalles: (id: number) => void;
}) => {
  return {
    monto: ({ value }: { value: string }) => <Precio value={value} />,
    creado_en: ({ value }: { value: string }) => <DateTime value={value} />,
    acciones: ({ value }: { value: number }) => (
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
