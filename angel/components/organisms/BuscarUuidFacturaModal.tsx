"use client";
import { useCallback, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Modal } from "@/angel/components/molecules/Modal";
import { TableCore } from "@/angel/components/atoms/TableCore";
import { TextInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { Precio } from "@/v3/atom/TableItemsComponent";
import {
  useBuscarUuidFactura,
  type BuscarUuidFacturaRow,
  type DesasignarTarget,
} from "@/angel/hooks/useBuscarUuidFactura";
import {
  createBuscarUuidFacturaRenderers,
  createBuscarUuidFacturaTotales,
} from "@/angel/schemas/tables/buscar_uuid_factura";
import { useFacturaProveedor } from "@/angel/hooks/useFacturaProveedor";
import { quitarCeroIzquierdo } from "@/angel/lib/format/number";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BuscarUuidFacturaModal({ open, onClose, onSuccess }: Props) {
  const {
    uuid,
    setUuid,
    rows,
    loading,
    desasignandoId,
    montoDraftsRef,
    setMontoDraft,
    hasCambios,
    guardandoMontoKey,
    guardarMonto,
    buscar,
    desasignar,
    reset,
  } = useBuscarUuidFactura();

  const {
    factura,
    loading: facturaLoading,
    propina,
    setPropina,
    impsan,
    setImpsan,
    guardandoPropina,
    cargar: cargarFactura,
    guardarPropina,
    reset: resetFactura,
  } = useFacturaProveedor();

  const handleBuscar = () => {
    buscar();
    cargarFactura(uuid.trim());
  };

  const handleClose = () => {
    reset();
    resetFactura();
    onClose();
  };

  const totalFinal = factura
    ? (
        Number(factura.total || 0) +
        Number(propina || 0) +
        Number(impsan || 0)
      ).toFixed(2)
    : null;

  const handleDesasignar = useCallback(
    (target: DesasignarTarget) => {
      const ok = confirm(
        `¿Desasignar la factura de la solicitud ${target.id_solicitud}?`,
      );
      if (!ok) return;
      desasignar(target, () => {
        cargarFactura(uuid.trim());
        onSuccess?.();
      });
    },
    [desasignar, cargarFactura, uuid, onSuccess],
  );

  // Memoizado para que la identidad de los renderers no cambie en cada
  // render (ver nota en el schema) y los inputs de la tabla no pierdan foco.
  const renderers = useMemo(
    () =>
      createBuscarUuidFacturaRenderers({
        montoDraftsRef,
        setMontoDraft,
        hasCambios,
        guardandoMontoKey,
        guardarMonto,
        desasignandoId,
        onDesasignar: handleDesasignar,
      }),
    [
      montoDraftsRef,
      setMontoDraft,
      hasCambios,
      guardandoMontoKey,
      guardarMonto,
      desasignandoId,
      handleDesasignar,
    ],
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Buscar factura por UUID"
      description="Ingresa el identificador único de la factura"
      className="max-w-6xl"
    >
      <div className="space-y-4 p-2">
        <div className="flex gap-2">
          <TextInput
            value={uuid}
            onChange={setUuid}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBuscar();
            }}
            placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
            className="flex-1"
          />
          <Button
            onClick={handleBuscar}
            disabled={loading}
            icon={loading ? Loader2 : Search}
          >
            Buscar
          </Button>
        </div>

        {facturaLoading && (
          <p className="text-sm text-gray-500">Cargando factura...</p>
        )}

        {factura && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex justify-between w-full">
              <div className="flex gap-2 items-end">
                <p>Total de la factura:</p>
                <Precio value={factura.total} />
              </div>
              <div className="flex gap-2 items-end">
                <p>Total final:</p>
                <Precio value={totalFinal} />
              </div>
            </div>
            <div className="grid grid-cols-2 place-items-center gap-x-4 gap-y-2 text-sm">
              <div className="grid grid-cols-3 items-end col-span-2 w-full gap-4">
                <TextInput
                  label="Propina"
                  value={propina}
                  onChange={(v) =>
                    setPropina(quitarCeroIzquierdo(v.replace(/[^\d.]/g, "")))
                  }
                  onFocus={(e) => e.target.select()}
                />
                <TextInput
                  label="Impsan"
                  value={impsan}
                  onChange={(v) =>
                    setImpsan(quitarCeroIzquierdo(v.replace(/[^\d.]/g, "")))
                  }
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  size="sm"
                  onClick={guardarPropina}
                  disabled={guardandoPropina}
                >
                  {guardandoPropina ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <TableCore<BuscarUuidFacturaRow>
          registros={rows}
          renderers={renderers}
          totales={createBuscarUuidFacturaTotales()}
        />
      </div>
    </Modal>
  );
}
