"use client";
import { useCallback, useState } from "react";
import {
  reservasService,
  type ReservaComisionable,
} from "@/angel/services/reservas";
import { ApiError } from "@/angel/services/apiClient";
import { usePaginacion } from "@/angel/hooks/usePaginacion";
import { useProcesoEnLote } from "@/angel/hooks/useProcesoEnLote";
import { useAlert } from "@/context/useAlert";
import { mensajeError } from "@/angel/lib/mensajeError";

const PAGE_SIZE = 50;

export function useComisionables() {
  const [registros, setRegistros] = useState<ReservaComisionable[]>([]);
  const [loading, setLoading] = useState(false);
  const [cobrandoIndividualId, setCobrandoIndividualId] = useState<string | null>(null);
  const { paginacion, actualizarDesdeMetadata } = usePaginacion(PAGE_SIZE);
  const { error, success } = useAlert();

  const fetchComisionables = useCallback(
    (page: number = paginacion.page) => {
      setLoading(true);
      reservasService
        .getComisionables({ page, length: PAGE_SIZE })
        .then(({ data, metadata }) => {
          setRegistros(data ?? []);
          actualizarDesdeMetadata(metadata?.total || 0, page);
        })
        .catch((err) => error(mensajeError(err, "Error al obtener las comisiones")))
        .finally(() => setLoading(false));
    },
    [paginacion.page, actualizarDesdeMetadata, error],
  );

  const cobrarComision = useCallback(
    (id_booking: string) => {
      setCobrandoIndividualId(id_booking);
      reservasService
        .cobrarComision(id_booking)
        .then(() => {
          success("Comisión marcada como cobrada");
          fetchComisionables();
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) {
            error("Esa reserva ya no existe");
            return;
          }
          error(mensajeError(err, "Error al marcar la comisión como cobrada"));
        })
        .finally(() => setCobrandoIndividualId(null));
    },
    [fetchComisionables, error, success],
  );

  // Un 404 significa que la reserva ya no existe: se trata como no-error para
  // no cortar el resto del lote ni reportarlo como fallo (mismo criterio que
  // ya aplicaba el cobro individual).
  const ejecutarCobro = useCallback(async (id: string) => {
    try {
      await reservasService.cobrarComision(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return;
      throw err;
    }
  }, []);

  const {
    procesando: procesandoLote,
    progreso: progresoLote,
    itemActual: cobrandoLoteId,
    ejecutarLote,
  } = useProcesoEnLote<string>(ejecutarCobro);

  const cobrarComisionesEnLote = useCallback(
    async (ids: string[]) => {
      const resultados = await ejecutarLote(ids);
      fetchComisionables();

      const fallidos = resultados.filter((r) => !r.ok).length;
      const exitosos = resultados.length - fallidos;

      if (fallidos === 0) {
        success(`Se marcaron ${exitosos} comisiones como cobradas`);
      } else {
        error(`Se marcaron ${exitosos} comisiones, ${fallidos} fallaron`);
      }
    },
    [ejecutarLote, fetchComisionables, error, success],
  );

  return {
    registros,
    loading,
    paginacion,
    cobrandoId: cobrandoIndividualId ?? cobrandoLoteId,
    procesandoLote,
    progresoLote,
    fetchComisionables,
    cobrarComision,
    cobrarComisionesEnLote,
  };
}
