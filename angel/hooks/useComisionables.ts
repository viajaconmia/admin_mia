"use client";
import { useCallback, useState } from "react";
import {
  reservasService,
  type ReservaComisionable,
} from "@/angel/services/reservas";
import { ApiError } from "@/angel/services/apiClient";
import { usePaginacion } from "@/angel/hooks/usePaginacion";
import { useAlert } from "@/context/useAlert";
import { mensajeError } from "@/angel/lib/mensajeError";

const PAGE_SIZE = 50;

export function useComisionables() {
  const [registros, setRegistros] = useState<ReservaComisionable[]>([]);
  const [loading, setLoading] = useState(false);
  const [cobrandoId, setCobrandoId] = useState<string | null>(null);
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
      setCobrandoId(id_booking);
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
        .finally(() => setCobrandoId(null));
    },
    [fetchComisionables, error, success],
  );

  return {
    registros,
    loading,
    paginacion,
    cobrandoId,
    fetchComisionables,
    cobrarComision,
  };
}
