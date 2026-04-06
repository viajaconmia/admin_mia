// components/EditModal.tsx
import React from "react";
import { X } from "lucide-react";

export type EditableField =
  | "costo_proveedor"
  | "estatus_pagos"
  | "monto_solicitado"
  | "consolidado";

interface EditModalProps {
  open: boolean;
  idSolicitudProveedor: string;
  field: EditableField;
  value: string;
  onClose: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  open,
  idSolicitudProveedor,
  field,
  value,
  onClose,
  onSave,
  onValueChange,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 z-0" onClick={onClose} />
      <div
        className="relative z-10 w-[min(720px,92vw)] bg-white rounded-xl shadow-lg border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Editar campo</p>
            <p className="text-xs text-gray-500">
              id_solicitud_proveedor: {idSolicitudProveedor}
            </p>
            <p className="text-xs text-gray-500">Campo: {field}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div className="p-4">
          {field === "costo_proveedor" ? (
            <input
              type="number"
              step="0.01"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="0.00"
            />
          ) : (
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
            />
          )}

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              onClick={onSave}
            >
              Cambiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};