import { useState, useEffect, useCallback } from "react";
import { TypeFilters } from "@/types";
import {
  fetchGetSolicitudesFiltradas,
  fetchConteosRapidos,
  fetchBucketSolicitudes,
} from "@/services/pago_proveedor";
import { defaultFiltersSolicitudes2 } from "@/constant/solicitudConstants";
import { normalizeApiBuckets } from "../Components/dataUtils";
import { SolicitudesPorFiltro } from "../Components/types";
import { getIdSolProv } from "../Components/helpers";
export function useSolicitudesPago() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [bucketData, setBucketData] = useState<Partial<SolicitudesPorFiltro>>({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TypeFilters>(defaultFiltersSolicitudes2);
  const [limiteInput, setLimiteInput] = useState<string>("50");
  const [pag, setPag] = useState<number>(1);
  const [metaPag, setMetaPag] = useState<{ pag: number; limite: number; count: number } | null>(null);

  const fetchCounts = useCallback(async (filtersArg: TypeFilters) => {
    const data = await fetchConteosRapidos(filtersArg as Record<string, any>);
    setCounts(data);
  }, []);

  const fetchBucket = useCallback(
    async (
      bucket: string,
      filtersArg: TypeFilters,
      limiteArg: number | null,
      pagArg: number,
    ) => {
      setLoading(true);
      try {
        let json: any;

        if (bucket === "all") {
          await new Promise<void>((resolve) => {
            fetchGetSolicitudesFiltradas(
              (data) => {
                json = data;
                resolve();
              },
              filtersArg as Record<string, any>,
              limiteArg,
              pagArg,
            );
          });
          const b = normalizeApiBuckets(json?.data ?? {});
          setBucketData((prev) => ({ ...prev, todos: b.todos, ...b }));
        } else {
          json = await fetchBucketSolicitudes(
            bucket,
            filtersArg as Record<string, any>,
            limiteArg,
            pagArg,
          );
          const rows =
            normalizeApiBuckets(json?.data ?? {})[bucket as keyof SolicitudesPorFiltro] ?? [];
          setBucketData((prev) => ({ ...prev, [bucket]: rows }));
        }

        if (json?.meta) setMetaPag(json.meta);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Al cambiar filters: resetear datos y re-obtener conteos
  useEffect(() => {
    setBucketData({});
    setCounts({});
    fetchCounts(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

const moverSolicitudLocalmente = useCallback(
  (
    id_solicitud_proveedor: string | number,
    origen: string,
    destino: string,
    cambios: Record<string, any> = {},
  ) => {
    // Convertimos el ID a string para comparar siempre igual,
    // porque a veces puede venir como número y a veces como texto.
    const id = String(id_solicitud_proveedor ?? "").trim();

    if (!id) return;

    // Aquí guardamos temporalmente la solicitud que vamos a quitar
    // de AP Crédito, por si también queremos insertarla en otro bucket
    // que ya esté cargado en memoria.
    let solicitudMovida: any = null;

    // Esta función aplica los cambios nuevos a la fila.
    // Ejemplo:
    // forma_pago_solicitada = "transfer"
    // estado_solicitud = "TRANSFERENCIA_SOLICITADA"
    const aplicarCambios = (row: any) => ({
      ...row,
      solicitud_proveedor: {
        ...(row?.solicitud_proveedor ?? {}),
        ...cambios,
      },
    });

    setBucketData((prev) => {
      // Copiamos el estado actual para no mutarlo directamente.
      const next: any = { ...prev };

      // Tomamos las filas del bucket origen.
      // En esta tarea normalmente será "ap_credito".
      const origenRows = Array.isArray(next[origen]) ? next[origen] : [];

      // Quitamos la solicitud del bucket origen.
      next[origen] = origenRows.filter((row: any) => {
        const rowId = String(getIdSolProv(row) ?? "").trim();

        if (rowId === id) {
          // Guardamos la fila con sus cambios aplicados.
          solicitudMovida = aplicarCambios(row);

          // false significa: esta fila ya no se queda en AP Crédito.
          return false;
        }

        return true;
      });

      // Si el bucket "todos" está cargado, no quitamos la solicitud,
      // porque en "Todos" sigue existiendo. Solo actualizamos sus campos.
      if (Array.isArray(next.todos)) {
        next.todos = next.todos.map((row: any) => {
          const rowId = String(getIdSolProv(row) ?? "").trim();

          return rowId === id ? aplicarCambios(row) : row;
        });
      }

      // Si el bucket destino ya estaba cargado, agregamos ahí la solicitud.
      // Si no estaba cargado, no pasa nada; cuando entres a esa pestaña,
      // se va a consultar normalmente al backend.
      if (solicitudMovida && Array.isArray(next[destino])) {
        next[destino] = [
          solicitudMovida,
          ...next[destino].filter((row: any) => {
            const rowId = String(getIdSolProv(row) ?? "").trim();
            return rowId !== id;
          }),
        ];
      }

      return next;
    });

    // Actualizamos los contadores visuales de las pestañas.
    // Ejemplo:
    // AP Crédito baja 1
    // SPEI sube 1
    setCounts((prev) => {
      if (origen === destino) return prev;

      return {
        ...prev,
        [origen]: Math.max(Number(prev[origen] ?? 0) - 1, 0),
        [destino]: Number(prev[destino] ?? 0) + 1,
      };
    });
  },
  [],
);
  return {
  counts,
  bucketData,
  fetchBucket,

  // Permite mover una solicitud entre carpetas en pantalla,
  // sin llamar otra vez a fetchBucket y sin prender el loader azul.
  moverSolicitudLocalmente,

  loading,
  filters,
  setFilters,
  limiteInput,
  setLimiteInput,
  pag,
  setPag,
  metaPag,
};
}
