"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/angel/components/molecules/Modal";
import Button from "@/components/atom/Button";
import { TextInput } from "@/components/atom/Input";
import { useVincularPagoFactura } from "@/angel/hooks/useVincularPagoFactura";

type VincularPagoFacturaModalProps = {
  open: boolean;
  onClose: () => void;
  rawId: string;
  onVinculado?: () => void;
};

export function VincularPagoFacturaModal({
  open,
  onClose,
  rawId,
  onVinculado,
}: VincularPagoFacturaModalProps) {
  const [uuid, setUuid] = useState("");
  const { vincular, loading, errorMensaje, limpiarError } =
    useVincularPagoFactura({ onVinculado });

  const handleClose = () => {
    if (loading) return;
    setUuid("");
    limpiarError();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uuid.trim() || loading) return;
    const ok = await vincular(rawId, uuid.trim());
    if (ok) handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Asignar a factura existente"
      className="max-w-md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-gray-700">
          Pago/saldo: <span className="font-mono">{rawId}</span>
        </p>
        <TextInput
          label="UUID fiscal de la factura"
          value={uuid}
          onChange={setUuid}
          placeholder="588aefa9-1b44-4973-82e4-d7f28ac463c1"
          disabled={loading}
        />
        {errorMensaje && (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-red-50 p-3 font-mono text-xs text-red-700">
            {errorMensaje}
          </pre>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!uuid.trim() || loading}
            loading={loading}
          >
            {loading ? "Asignando…" : "Asignar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
