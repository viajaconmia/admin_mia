"use client";

import { Modal } from "@/angel/components/molecules/Modal";
import { fmtMoney } from "@/angel/lib/format/number";
import Button from "@/components/atom/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirmar: () => void;
  resumen: {
    cantidadItems: number;
    total: number;
    receptorNombre: string;
    receptorRfc: string;
  };
};

export function ConfirmarFacturaModal({ open, onClose, onConfirmar, resumen }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmar factura"
      className="max-w-md"
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirmar}>
            Confirmar
          </Button>
        </div>
      }
    >
      <p className="text-sm text-gray-700">
        Vas a facturar {resumen.cantidadItems} ítem(s) por {fmtMoney(resumen.total)} a{" "}
        {resumen.receptorNombre} (RFC {resumen.receptorRfc}).
      </p>
    </Modal>
  );
}
