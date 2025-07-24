'use client';

import { on } from "node:events";
import { use, useEffect } from "react";

interface ConfirmacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseVistaPrevia: () => void;
  onConfirm: () => void;
  onSaveOnly: () => void;
}

export default function ConfirmacionModal({
  isOpen,
  onClose,
  onCloseVistaPrevia,
  onConfirm,
  onSaveOnly,

}: ConfirmacionModalProps) {
  if (!isOpen) return null;
  const handleSaveOnly = () => {
    alert('Factura guardada exitosamente');
    onClose(); // Cierra el modal
    onCloseVistaPrevia(); // Cierra la vista previa
  }

  // useEffect(() => {
  //   if()
  // },[isOpen]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              handleSaveOnly();
              onCloseVistaPrevia();
            }}
            className="px-4 py-2 rounded bg-green-500 text-white hover:bg-red-600 transition-colors"
          >Solo guardar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Sí, aplicar
          </button>
        </div>
      </div>
    </div>
  );
}