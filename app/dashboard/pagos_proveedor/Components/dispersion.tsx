"use client";

import React, { useState } from "react";
import { Send, X, Info } from "lucide-react";

export type SolicitudProveedorRaw = {
  id_solicitud: string;
  id_pago?: string | null;
  hotel?: string | null;
  codigo_reservacion_hotel?: string | null;
  costo_total?: string | null;
  check_out?: string | null;
  codigo_dispersion?: string | null;
  razon_social?: string | null;    // ⬅ nuevo
  rfc?: string | null;
  solicitud_proveedor?: {
    id_solicitud_proveedor: number | string;
    fecha_solicitud?: string | null;
    monto_solicitado?: string | null;
  } | null;
};

type DispersionModalProps = {
  solicitudesSeleccionadas: SolicitudProveedorRaw[];
  onClose: () => void;
  onSubmit: (payload: {
    id_dispersion: string;
    solicitudes: Array<{
      id_solicitud: string;
      id_solicitud_proveedor: number | string | null;
      id_pago?: string | null;
      costo_proveedor: number;
      codigo_hotel: string | null;
      fecha_pago: string | null;
    }>;
  }) => Promise<void> | void;
};

export const DispersionModal: React.FC<DispersionModalProps> = ({
  solicitudesSeleccionadas,
  onClose,
  onSubmit,
}) => {
  const [idDispersion, setIdDispersion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!idDispersion.trim()) {
      setFormError("El ID de dispersión es obligatorio.");
      return;
    }

    if (solicitudesSeleccionadas.length === 0) {
      setFormError("No hay solicitudes seleccionadas para dispersar.");
      return;
    }

    const payload = {
      id_dispersion: idDispersion.trim(),
      solicitudes: solicitudesSeleccionadas.map((s) => {
        const costoProveedorStr =
          s.costo_total ??
          s.solicitud_proveedor?.monto_solicitado ??
          "0";

        const costoProveedor = Number(costoProveedorStr) || 0;

        const fechaPago =
          s.solicitud_proveedor?.fecha_solicitud ?? s.check_out ?? null;

        const codigoHotel = s.codigo_reservacion_hotel ?? null;

        return {
          id_solicitud: s.id_solicitud,
          id_solicitud_proveedor:
            s.solicitud_proveedor?.id_solicitud_proveedor ?? null,
          id_pago: s.id_pago ?? null,
          costo_proveedor: costoProveedor,
          codigo_hotel: codigoHotel,
          fecha_pago: fechaPago,
        };
      }),
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setFormError(
        "Ocurrió un error al guardar la dispersión. Intenta nuevamente."
      );
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="h-fit w-[95vw] max-w-xl relative bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Banner de info / error */}
        <div className="sticky top-0 z-10">
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">
                Crear dispersión
              </h3>
              <p className="text-xs text-blue-700">
                Asigna un <span className="font-semibold">ID de dispersión</span>{" "}
                que se aplicará a todos los pagos seleccionados.
              </p>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex gap-3 items-start">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  ¡Ocurrió un error!
                </h3>
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Resumen de seleccionados */}
          <div className="border border-slate-200 rounded-xl bg-slate-50 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Solicitudes seleccionadas
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {solicitudesSeleccionadas.length} elemento
                {solicitudesSeleccionadas.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {solicitudesSeleccionadas.map((s, idx) => {
                const costoProveedor =
                  s.costo_total ??
                  s.solicitud_proveedor?.monto_solicitado ??
                  "0.00";
                const fechaPago =
                  s.solicitud_proveedor?.fecha_solicitud ?? s.check_out;

                return (
                  <div
                    key={`${s.id_solicitud}-${idx}`}  // 🔥 clave única
                    className="border border-slate-200 bg-white rounded-lg px-3 py-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800">
                          {s.hotel ?? "Hotel sin nombre"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Código hotel:{" "}
                          <span className="font-mono">
                            {s.codigo_reservacion_hotel ?? "-"}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          ID solicitud proveedor:{" "}
                          <span className="font-mono">
                            {s.solicitud_proveedor?.id_solicitud_proveedor ?? "-"}
                          </span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-slate-600">
                        <p>
                          Costo proveedor:{" "}
                          <span className="font-semibold text-slate-800">
                            ${Number(costoProveedor).toFixed(2)}
                          </span>
                        </p>
                        <p>Fecha pago: {formatDate(fechaPago)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">
                          Proveedor:{" "}
                          <span className="font-semibold">
                            {s.razon_social ?? "Sin razón social"}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          RFC: <span className="font-mono">{s.rfc ?? "-"}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {solicitudesSeleccionadas.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No hay solicitudes seleccionadas.
                </p>
              )}
            </div>
          </div>

          {/* Campo ID de dispersión */}
          <div className="space-y-1">
            <label
              htmlFor="id-dispersion"
              className="block text-sm font-medium text-slate-700"
            >
              ID de dispersión
            </label>
            <input
              id="id-dispersion"
              type="text"
              value={idDispersion}
              onChange={(e) => setIdDispersion(e.target.value)}
              placeholder="Ej. DISP-2025-001"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              Este identificador se asignará a todos los pagos seleccionados.
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || solicitudesSeleccionadas.length === 0}
              className={`w-full sm:flex-1 flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 ${isSubmitting || solicitudesSeleccionadas.length === 0
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Crear dispersión
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-6 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 text-sm bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
