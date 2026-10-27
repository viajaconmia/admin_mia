"use client";

import { useMemo } from "react";
import { CotizacionesIaFiltros } from "@/angel/components/molecules/CotizacionesIaFiltros";
import { TablaCompleta } from "@/angel/components/organisms/TablaCompleta";
import { useCotizacionesIa } from "@/angel/hooks/useCotizacionesIa";
import {
  createCotizacionIaRenderers,
  mapCotizacionIa,
} from "@/angel/schemas/tables/cotizaciones_ia";

export const CotizacionesIaLista = () => {
  const { rows, loading, error, paginacion, consultar, irAPagina } =
    useCotizacionesIa();

  const registros = useMemo(() => rows.map(mapCotizacionIa), [rows]);
  const renderers = useMemo(() => createCotizacionIaRenderers(), []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-sky-950">
          Cotizaciones de MIA
        </h1>
        <p className="text-sm text-gray-500">
          Solicitudes de cotización que los clientes armaron con la IA. Las
          cotiza y resuelve Operaciones; aquí solo se consultan.
        </p>
      </div>

      <CotizacionesIaFiltros loading={loading} onConsultar={consultar} />

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <TablaCompleta
        registros={registros}
        paginacion={paginacion}
        irAPagina={irAPagina}
        onRefresh={() => irAPagina()}
        loading={loading}
        renderers={renderers}
        maxHeight="60vh"
      />
    </div>
  );
};
