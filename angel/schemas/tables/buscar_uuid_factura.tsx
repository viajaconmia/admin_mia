"use client";

import type { RefObject } from "react";
import Button from "@/components/atom/Button";
import { Loader2, Unlink } from "lucide-react";
import {
  TextRenderer,
  PrecioRenderer,
  GetBadgeRenderer,
  GetEditableMontoRenderer,
  Precio,
} from "@/v3/atom/TableItemsComponent";
import { type TotalFn } from "@/angel/components/atoms/TableCore";
import {
  montoRowKey,
  type BuscarUuidFacturaRow,
  type DesasignarTarget,
  type MontoDraftValues,
  type MontoEditableCell,
  type MontoField,
} from "@/angel/hooks/useBuscarUuidFactura";

type RendererOpts = {
  montoDraftsRef: RefObject<Record<string, MontoDraftValues>>;
  setMontoDraft: (
    target: DesasignarTarget,
    campo: MontoField,
    value: string,
  ) => void;
  hasCambios: (target: DesasignarTarget) => boolean;
  guardandoMontoKey: string | null;
  guardarMonto: (target: DesasignarTarget) => void;
  desasignandoId: string | null;
  onDesasignar: (target: DesasignarTarget) => void;
};

// Lee el draft desde el ref (no desde state) para que la identidad de este
// renderer se mantenga estable entre teclas — si cambiara en cada keystroke,
// TableCore lo trataría como un componente nuevo y el input perdería el foco.
const montoCellRenderer = (
  campo: MontoField,
  montoDraftsRef: RendererOpts["montoDraftsRef"],
  setMontoDraft: RendererOpts["setMontoDraft"],
) =>
  GetEditableMontoRenderer<MontoEditableCell>(
    (value) =>
      montoDraftsRef.current[montoRowKey(value)]?.[campo] ?? String(value.monto),
    (value, v) => setMontoDraft(value, campo, v),
  );

export const createBuscarUuidFacturaRenderers = ({
  montoDraftsRef,
  setMontoDraft,
  hasCambios,
  guardandoMontoKey,
  guardarMonto,
  desasignandoId,
  onDesasignar,
}: RendererOpts) => ({
  codigo_confirmacion: TextRenderer,
  id_solicitud: TextRenderer,
  monto_facturado: montoCellRenderer(
    "monto_facturado",
    montoDraftsRef,
    setMontoDraft,
  ),
  monto_propina: montoCellRenderer("monto_propina", montoDraftsRef, setMontoDraft),
  monto_impsan: montoCellRenderer("monto_impsan", montoDraftsRef, setMontoDraft),
  monto_fac_total: PrecioRenderer,
  estado: GetBadgeRenderer(),
  acciones: ({ value }: { value: DesasignarTarget }) => {
    const desasignando = desasignandoId === value.id_factura_proveedor;
    const guardando = guardandoMontoKey === montoRowKey(value);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => guardarMonto(value)}
          disabled={!hasCambios(value) || guardando}
        >
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          variant="warning"
          size="sm"
          icon={desasignando ? Loader2 : Unlink}
          disabled={desasignando}
          onClick={() => onDesasignar(value)}
        >
          {desasignando ? "Desasignando..." : "Desasignar"}
        </Button>
      </div>
    );
  },
});

const sumarMonto = (
  rows: BuscarUuidFacturaRow[],
  key: "monto_facturado" | "monto_propina" | "monto_impsan",
) => rows.reduce((acc, r) => acc + (Number(r[key]?.monto) || 0), 0);

export const createBuscarUuidFacturaTotales = (): Partial<
  Record<keyof BuscarUuidFacturaRow, TotalFn<BuscarUuidFacturaRow>>
> => ({
  monto_facturado: (rows) => (
    <Precio value={String(sumarMonto(rows, "monto_facturado"))} />
  ),
  monto_propina: (rows) => (
    <Precio value={String(sumarMonto(rows, "monto_propina"))} />
  ),
  monto_impsan: (rows) => (
    <Precio value={String(sumarMonto(rows, "monto_impsan"))} />
  ),
  monto_fac_total: (rows) => (
    <Precio
      value={String(rows.reduce((acc, r) => acc + (Number(r.monto_fac_total) || 0), 0))}
    />
  ),
});
