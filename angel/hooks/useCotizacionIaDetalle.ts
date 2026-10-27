import { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/context/useAlert";
import {
  esUrlArchivoSegura,
  mensajeErrorCotizaciones,
  normalizarItems,
  normalizarTipos,
} from "@/angel/lib/cotizacionesIa";
import {
  CotizacionIaDetalleResponse,
  cotizacionesIaService,
} from "@/angel/services/cotizacionesIa";

export function useCotizacionIaDetalle(id: string) {
  const [detalle, setDetalle] = useState<CotizacionIaDetalleResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archivoAbriendo, setArchivoAbriendo] = useState<number | null>(null);
  const { error: notificarError } = useAlert();

  const cargar = useCallback(() => {
    setLoading(true);
    setError(null);
    cotizacionesIaService
      .obtener(id)
      .then(({ data }) => {
        if (!data) {
          setDetalle(null);
          return;
        }
        setDetalle({
          ...data,
          items: normalizarItems(data.items),
          tipos: normalizarTipos(data.tipos),
          archivos: data.archivos ?? [],
        });
      })
      .catch((err) => {
        setDetalle(null);
        setError(mensajeErrorCotizaciones(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /**
   * Pide la URL firmada (temporal) y la abre en una pestaña nueva. La pestaña se
   * abre de inmediato (antes del await) para que el navegador no la bloquee como
   * pop-up, y se redirige cuando llega la URL.
   */
  const abrirArchivo = useCallback(
    async (idArchivo: number) => {
      const ventana = window.open("", "_blank");
      setArchivoAbriendo(idArchivo);
      try {
        const { data } = await cotizacionesIaService.obtenerUrlArchivo(
          id,
          idArchivo,
        );
        if (!data?.url) throw new Error("No se recibió la URL del archivo.");
        if (!esUrlArchivoSegura(data.url)) {
          throw new Error("La URL del archivo no es válida; no se abrió.");
        }
        if (ventana) {
          ventana.opener = null;
          ventana.location.href = data.url;
        } else {
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      } catch (err) {
        ventana?.close();
        notificarError(mensajeErrorCotizaciones(err));
      } finally {
        setArchivoAbriendo(null);
      }
    },
    [id, notificarError],
  );

  return { detalle, loading, error, archivoAbriendo, abrirArchivo, refetch: cargar };
}
