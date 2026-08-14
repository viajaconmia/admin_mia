"use client";

import { useEffect } from "react";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";
import { TablaCompleta } from "@/angel/components/organisms/TablaCompleta";
import { AccionesSeleccion } from "@/angel/components/molecules/AccionesSeleccion";
import { useSeleccionTabla } from "@/angel/hooks/useSeleccionTabla";
import { useComisionables } from "@/angel/hooks/useComisionables";
import {
  type ComisionableRow,
  mapComisionable,
  createComisionablesRenderers,
} from "./_components/schema";
import Button from "@/components/atom/Button";

export default function ComisionablesPage() {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.COMISIONABLES);

  const {
    registros,
    loading,
    paginacion,
    cobrandoId,
    procesandoLote,
    progresoLote,
    fetchComisionables,
    cobrarComision,
    cobrarComisionesEnLote,
  } = useComisionables();

  const { seleccionados, toggleFila, limpiar, estaSeleccionado, toggleTodos } =
    useSeleccionTabla<ComisionableRow>((item) => item._seleccion);

  useEffect(() => {
    fetchComisionables(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filas = registros.map(mapComisionable);

  const itemsSeleccionados = filas.filter((f) =>
    estaSeleccionado(f._seleccion),
  );
  const idsCobrables = itemsSeleccionados
    .filter((f) => f.acciones.comision_cobrada === 0)
    .map((f) => f._seleccion);

  const renderers = createComisionablesRenderers(
    cobrarComision,
    cobrandoId,
    toggleFila,
    estaSeleccionado,
    procesandoLote,
  );

  const handleProcesarLote = () => {
    if (idsCobrables.length === 0) return;

    if (idsCobrables.length < itemsSeleccionados.length) {
      const continuar = confirm(
        `${itemsSeleccionados.length - idsCobrables.length} de las reservas seleccionadas ya tienen la comisión cobrada y se van a omitir.\n\n¿Deseas continuar marcando las ${idsCobrables.length} restantes?`,
      );
      if (!continuar) return;
    }

    cobrarComisionesEnLote(idsCobrables).then(() => limpiar());
  };

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Comisionables
      </h1>
      <TablaCompleta
        paginacion={paginacion}
        irAPagina={fetchComisionables}
        onRefresh={() => fetchComisionables()}
        registros={filas}
        rowClassName={(i) => (estaSeleccionado(i._seleccion) ? "bg-blue-100" : "")}
        loading={loading}
        renderers={renderers}
        label={`Mostrando ${registros.length} registros`}
      />

      <AccionesSeleccion count={seleccionados.length} onLimpiar={limpiar}>
        {procesandoLote && progresoLote ? (
          <div className="flex items-center gap-3 text-white text-sm">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${(progresoLote.actual / progresoLote.total) * 100}%`,
                }}
              />
            </div>
            <span className="whitespace-nowrap">
              Procesando {progresoLote.actual}/{progresoLote.total}...
            </span>
          </div>
        ) : (
          <>
            <Button
              onClick={() => toggleTodos(filas)}
              variant="secondary"
              size="sm"
            >
              {seleccionados.length === filas.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </Button>
            <Button
              onClick={handleProcesarLote}
              disabled={idsCobrables.length === 0}
              variant="secondary"
              size="sm"
            >
              Marcar comisiones cobradas ({idsCobrables.length})
            </Button>
          </>
        )}
      </AccionesSeleccion>
    </div>
  );
}
