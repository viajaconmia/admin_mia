"use client";
import { useCallback, useState } from "react";
import { ApiError } from "@/angel/services/apiClient";
import { conciliacionService } from "@/angel/services/conciliacion";
import { useAlert } from "@/context/useAlert";

// Algunos endpoints de este dominio devuelven { error, details } en vez de
// { message, data } en sus respuestas de error, así que apiClient no logra
// extraer el mensaje real del backend (ApiError.message cae al genérico
// "HTTP error: status: xxx"). Lo recuperamos desde el body crudo.
function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const raw = err.response as unknown as {
      error?: string;
      details?: string;
    } | null;
    return raw?.error || raw?.details || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export type DesasignarTarget = {
  id_factura_proveedor: string;
  id_solicitud: number;
};

export type BuscarUuidFacturaRow = {
  codigo_confirmacion: string;
  id_solicitud: number;
  monto: number;
  estado: string;
  acciones: DesasignarTarget;
};

export function useBuscarUuidFactura() {
  const [uuid, setUuid] = useState("");
  const [rows, setRows] = useState<BuscarUuidFacturaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [desasignandoId, setDesasignandoId] = useState<string | null>(null);
  const { error, info } = useAlert();

  const buscar = useCallback(() => {
    const value = uuid.trim();
    if (!value) {
      error("Escribe un UUID");
      return;
    }
    setLoading(true);

    conciliacionService
      .buscarUuidFactura(value)
      .then(({ data }) =>
        setRows(
          (data ?? []).map((r) => ({
            codigo_confirmacion: r.codigo_confirmacion,
            id_solicitud: r.id_solicitud,
            monto: Number(r.monto_facturado ?? r.monto_solicitado ?? 0) || 0,
            estado: r.estado ?? "",
            acciones: {
              id_factura_proveedor: String(r.id_factura_proveedor),
              id_solicitud: r.id_solicitud,
            },
          })),
        ),
      )
      .catch((err) => {
        setRows([]);
        if (err instanceof ApiError && err.status === 404) {
          info(
            mensajeError(err, "No se encontraron coincidencias para ese UUID."),
          );
          return;
        }
        error(mensajeError(err, "Error al buscar coincidencias por UUID"));
      })
      .finally(() => setLoading(false));
  }, [uuid, error, info]);

  const desasignar = useCallback(
    (target: DesasignarTarget, onSuccess?: () => void) => {
      setDesasignandoId(target.id_factura_proveedor);
      return conciliacionService
        .desasignarFactura({
          id_factura: target.id_factura_proveedor,
          id_solicitud: target.id_solicitud,
        })
        .then(() => {
          buscar();
          onSuccess?.();
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) {
            info(mensajeError(err, "Esa asignación ya no existe."));
            buscar();
            onSuccess?.();
            return;
          }
          error(mensajeError(err, "Error al desasignar"));
        })
        .finally(() => setDesasignandoId(null));
    },
    [buscar, error, info],
  );

  const reset = useCallback(() => {
    setUuid("");
    setRows([]);
    setLoading(false);
    setDesasignandoId(null);
  }, []);

  return {
    uuid,
    setUuid,
    rows,
    loading,
    desasignandoId,
    buscar,
    desasignar,
    reset,
  };
}
