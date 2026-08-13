"use client";
import { useCallback, useState } from "react";

export type ResultadoItemLote<T> = {
  item: T;
  ok: boolean;
  error?: unknown;
};

export type ProgresoLote = { actual: number; total: number } | null;

interface UseProcesoEnLoteOptions {
  /** Pausa entre llamadas (ms) para no saturar al backend. Default 1000ms. */
  delayMs?: number;
}

// Mecánica genérica de "recorrer una lista y llamar al backend de uno en uno,
// mostrando progreso" — no sabe nada del dominio. Qué hacer con un error en
// particular (ej. tratar un 404 como no-error) lo decide `ejecutar`, ya que
// aquí solo se captura para no cortar el resto del lote.
export function useProcesoEnLote<T>(
  ejecutar: (item: T) => Promise<void>,
  options: UseProcesoEnLoteOptions = {},
) {
  const { delayMs = 1000 } = options;
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState<ProgresoLote>(null);
  const [itemActual, setItemActual] = useState<T | null>(null);

  const ejecutarLote = useCallback(
    async (items: T[]): Promise<ResultadoItemLote<T>[]> => {
      if (items.length === 0 || procesando) return [];

      setProcesando(true);
      setProgreso({ actual: 0, total: items.length });

      const resultados: ResultadoItemLote<T>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setItemActual(item);

        try {
          await ejecutar(item);
          resultados.push({ item, ok: true });
        } catch (error) {
          resultados.push({ item, ok: false, error });
        }

        setProgreso({ actual: i + 1, total: items.length });

        if (i < items.length - 1 && delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      setItemActual(null);
      setProgreso(null);
      setProcesando(false);

      return resultados;
    },
    [ejecutar, procesando, delayMs],
  );

  return { procesando, progreso, itemActual, ejecutarLote };
}
