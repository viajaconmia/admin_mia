"use client";
import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/angel/services/apiClient";
import { conciliacionService } from "@/angel/services/conciliacion";
import { useAlert } from "@/context/useAlert";
import { mensajeError } from "@/angel/lib/mensajeError";

export type DesasignarTarget = {
  id_factura_proveedor: string;
  id_solicitud: number;
};

export type MontoEditableCell = DesasignarTarget & { monto: number };

export type MontoField = "monto_facturado" | "monto_propina" | "monto_impsan";

export type MontoDraftValues = Record<MontoField, string>;

export type BuscarUuidFacturaRow = {
  codigo_confirmacion: string;
  id_solicitud: number;
  monto_facturado: MontoEditableCell;
  monto_propina: MontoEditableCell;
  monto_impsan: MontoEditableCell;
  monto_fac_total: number;
  estado: string;
  acciones: DesasignarTarget;
};

const MONTO_FIELDS: MontoField[] = [
  "monto_facturado",
  "monto_propina",
  "monto_impsan",
];

export function montoRowKey(target: DesasignarTarget): string {
  return `${target.id_factura_proveedor}__${target.id_solicitud}`;
}

export function useBuscarUuidFactura() {
  const [uuid, setUuid] = useState("");
  const [rows, setRows] = useState<BuscarUuidFacturaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [desasignandoId, setDesasignandoId] = useState<string | null>(null);
  const [montoDrafts, setMontoDrafts] = useState<Record<string, MontoDraftValues>>({});
  const [montoOriginal, setMontoOriginal] = useState<Record<string, MontoDraftValues>>({});
  const [guardandoMontoKey, setGuardandoMontoKey] = useState<string | null>(null);
  const { error, info, success } = useAlert();

  // Los renderers de la tabla (celdas editables) se memoizan para no perder
  // el foco del input en cada tecla: leen los drafts/original desde estos
  // refs (siempre al día) en vez de por closure sobre el state, así
  // hasCambios/guardarMonto no cambian de identidad en cada keystroke.
  const montoDraftsRef = useRef(montoDrafts);
  montoDraftsRef.current = montoDrafts;
  const montoOriginalRef = useRef(montoOriginal);
  montoOriginalRef.current = montoOriginal;

  const buscar = useCallback(() => {
    const value = uuid.trim();
    if (!value) {
      error("Escribe un UUID");
      return;
    }
    setLoading(true);

    conciliacionService
      .buscarUuidFactura(value)
      .then(({ data }) => {
        const nuevasFilas = (data ?? []).map((r) => {
          const target: DesasignarTarget = {
            id_factura_proveedor: String(r.id_factura_proveedor),
            id_solicitud: r.id_solicitud,
          };

          return {
            codigo_confirmacion: r.codigo_confirmacion,
            id_solicitud: r.id_solicitud,
            monto_facturado: {
              ...target,
              monto: Number(r.monto_facturado ?? 0) || 0,
            },
            monto_propina: {
              ...target,
              monto: Number(r.monto_propina ?? 0) || 0,
            },
            monto_impsan: {
              ...target,
              monto: Number(r.monto_impsan ?? 0) || 0,
            },
            monto_fac_total: Number(r.monto_facturado_final ?? 0) || 0,
            estado: r.estado ?? "",
            acciones: target,
          };
        });

        setRows(nuevasFilas);
        const drafts = Object.fromEntries(
          nuevasFilas.map((row) => [
            montoRowKey(row.acciones),
            {
              monto_facturado: String(row.monto_facturado.monto),
              monto_propina: String(row.monto_propina.monto),
              monto_impsan: String(row.monto_impsan.monto),
            },
          ]),
        );
        setMontoDrafts(drafts);
        setMontoOriginal(drafts);
      })
      .catch((err) => {
        setRows([]);
        setMontoDrafts({});
        setMontoOriginal({});
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

  const setMontoDraft = useCallback(
    (target: DesasignarTarget, campo: MontoField, value: string) => {
      const key = montoRowKey(target);
      setMontoDrafts((prev) => ({
        ...prev,
        [key]: { ...prev[key], [campo]: value },
      }));
    },
    [],
  );

  const hasCambios = useCallback((target: DesasignarTarget): boolean => {
    const key = montoRowKey(target);
    const draft = montoDraftsRef.current[key];
    const original = montoOriginalRef.current[key];
    if (!draft || !original) return false;
    return MONTO_FIELDS.some(
      (campo) => Number(draft[campo]) !== Number(original[campo]),
    );
  }, []);

  const guardarMonto = useCallback(
    (target: DesasignarTarget) => {
      const key = montoRowKey(target);
      const draft = montoDraftsRef.current[key];
      const original = montoOriginalRef.current[key];
      if (!draft || !original) return;

      const body: Record<string, number> = {};
      for (const campo of MONTO_FIELDS) {
        if (Number(draft[campo]) === Number(original[campo])) continue;
        const monto = Number(draft[campo]);
        if (!draft[campo] || Number.isNaN(monto) || monto < 0) {
          error("Los montos deben ser números mayores o iguales a 0");
          return;
        }
        body[campo] = monto;
      }

      if (Object.keys(body).length === 0) return;

      setGuardandoMontoKey(key);
      conciliacionService
        .editarPagoFactura(
          {
            id_factura: target.id_factura_proveedor,
            id_solicitud: target.id_solicitud,
          },
          body,
        )
        .then(() => {
          success("Cambios guardados");
          buscar();
        })
        .catch((err) => error(mensajeError(err, "Error al guardar los montos")))
        .finally(() => setGuardandoMontoKey(null));
    },
    [buscar, error, success],
  );

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
    setMontoDrafts({});
    setMontoOriginal({});
    setGuardandoMontoKey(null);
  }, []);

  return {
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
  };
}
