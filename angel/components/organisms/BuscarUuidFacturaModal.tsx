"use client";
import { Search, Loader2, Unlink } from "lucide-react";
import { Modal } from "@/angel/components/molecules/Modal";
import { TableCore } from "@/angel/components/atoms/TableCore";
import { TextInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import {
  TextRenderer,
  MonoRenderer,
  PrecioRenderer,
  Badge,
  Precio,
  MonoCell,
} from "@/v3/atom/TableItemsComponent";
import {
  useBuscarUuidFactura,
  type BuscarUuidFacturaRow,
  type DesasignarTarget,
} from "@/angel/hooks/useBuscarUuidFactura";
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
    buscar,
    desasignar,
    reset,
  } = useBuscarUuidFactura();

  const {
    factura,
    loading: facturaLoading,
    propina,
    setPropina,
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

  const totalConPropina = factura
    ? (Number(factura.total || 0) + Number(propina || 0)).toFixed(2)
    : null;

  const handleDesasignar = (target: DesasignarTarget) => {
    const ok = confirm(
      `¿Desasignar la factura de la solicitud ${target.id_solicitud}?`,
    );
    if (!ok) return;
    desasignar(target, () => {
      cargarFactura(uuid.trim());
      onSuccess?.();
    });
  };

  const renderers = {
    codigo_confirmacion: TextRenderer,
    uuid_factura: MonoRenderer,
    id_solicitud: TextRenderer,
    monto: PrecioRenderer,
    estado: ({ value }: { value: string }) =>
      value ? (
        <Badge
          label={value}
          style="bg-gray-100 text-gray-700 border border-gray-300"
        />
      ) : null,
    acciones: ({ value }: { value: DesasignarTarget }) => {
      const desasignando = desasignandoId === value.id_factura_proveedor;
      return (
        <Button
          variant="warning"
          size="sm"
          icon={desasignando ? Loader2 : Unlink}
          disabled={desasignando}
          onClick={() => handleDesasignar(value)}
        >
          {desasignando ? "Desasignando..." : "Desasignar"}
        </Button>
      );
    },
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Buscar factura por UUID"
      description="Ingresa el identificador único de la factura"
      className="max-w-3xl"
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
            <p className="font-semibold ">{factura.uuid_factura}</p>
            <div className="grid grid-cols-2 place-items-center gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <Precio value={factura.total} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total con propina</p>
                <Precio value={totalConPropina} />
              </div>
              <div className="flex items-end gap-2">
                <TextInput
                  label="Propina"
                  value={propina}
                  onChange={(v) =>
                    setPropina(quitarCeroIzquierdo(v.replace(/[^\d.]/g, "")))
                  }
                  onFocus={(e) => e.target.select()}
                  className="w-40"
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
        />
      </div>
    </Modal>
  );
}
