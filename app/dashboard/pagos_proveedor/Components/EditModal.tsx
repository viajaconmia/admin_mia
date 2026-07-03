// components/EditModal.tsx
import React from "react";
import { X, AlertTriangle } from "lucide-react";

export type EditableField =
  | "costo_proveedor"
  | "estatus_pagos"
  | "monto_solicitado"
  | "consolidado"
  | "notas_internas"
  | "comentarios_Ap";

interface EditModalProps {
  open: boolean;
  idSolicitudProveedor: string;
  field: EditableField;
  value: string;
  onClose: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  // Solo para costo_proveedor
  originalValue?: number;
  comentarioAp?: string;
  onComentarioApChange?: (v: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  open,
  idSolicitudProveedor,
  field,
  value,
  onClose,
  onSave,
  onValueChange,
  originalValue,
  comentarioAp,
  onComentarioApChange,
}) => {
  if (!open) return null;

  const isLongTextField =
    field === "notas_internas" || field === "comentarios_Ap";

  const isCosto = field === "costo_proveedor";
  const newNum = Number(value);
  const diff = isCosto && originalValue != null ? newNum - originalValue : 0;
  const isOverLimit = isCosto && Math.abs(diff) > 50;
  const missingComment = isCosto && !(comentarioAp ?? "").trim();
  const canSave = !isOverLimit && !missingComment;
  const getFieldLabel = (field?: string | null) => {
    const labels: Record<string, string> = {
      comentarios_Ap: "Comentarios FIN",
      comentarios_sp: "Comentarios SP",
      comentarios_cxp: "Comentarios CXP",
      notas_internas: "Notas internas",
    };

    return labels[field || ""] || field || "";
  };

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
            <p className="text-xs text-gray-500">
              Campo: {getFieldLabel(field)}
            </p>
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

        <div className="p-4 space-y-3">
          {isCosto ? (
            <>
              {/* Valor original */}
              {originalValue != null && (
                <p className="text-xs text-gray-500">
                  Valor original:{" "}
                  <span className="font-semibold text-gray-700">
                    {originalValue.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  {"  "}— Límite: ±50
                </p>
              )}

              {/* Input nuevo valor */}
              <input
                type="number"
                step="0.01"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ${
                  isOverLimit
                    ? "border-red-300 focus:ring-red-100"
                    : "border-gray-200 focus:ring-blue-100"
                }`}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder="0.00"
              />

              {/* Feedback diferencia */}
              {originalValue != null && value !== "" && (
                <div
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
                    isOverLimit
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {isOverLimit && (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {diff > 0 ? "+" : ""}
                    {diff.toFixed(2)} respecto al original
                    {isOverLimit ? " — excede el límite de ±50" : " ✓"}
                  </span>
                </div>
              )}

              {/* Comentario AP obligatorio */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Motivo del ajuste <span className="text-red-500">*</span>
                  <span className="font-normal text-gray-400 ml-1">
                    (comentario AP)
                  </span>
                </label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-y"
                  value={comentarioAp ?? ""}
                  onChange={(e) => onComentarioApChange?.(e.target.value)}
                  placeholder="Explica por qué se hace el ajuste en el costo del proveedor..."
                />
                {missingComment && (
                  <p className="text-xs text-red-500 mt-1">
                    El motivo es obligatorio.
                  </p>
                )}
              </div>
            </>
          ) : isLongTextField ? (
            <textarea
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-y"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Escribe aquí..."
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
              disabled={isCosto && !canSave}
              className="px-3 py-2 rounded-lg text-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onSave}
              title={
                isCosto && isOverLimit
                  ? "El ajuste supera ±50"
                  : isCosto && missingComment
                    ? "Escribe el motivo del ajuste"
                    : undefined
              }
            >
              Cambiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
