'use client';

import { useState } from 'react';

interface ConfirmacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export default function ConfirmacionModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Deseas aplicar tu factura?',
  message = 'Esta acción asignará la factura al cliente seleccionado.'
}: ConfirmacionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
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