"use client";

import { useEffect } from "react";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";
import { TablaCompleta } from "@/angel/components/organisms/TablaCompleta";
import { FiltrosPanel } from "@/angel/components/molecules/FiltrosPanel";
import { SelectFilter } from "@/angel/components/atoms/SelectFilter";
import { FilterInput } from "@/component/atom/FilterInput";
import { AccionesSeleccion } from "@/angel/components/molecules/AccionesSeleccion";
import { useSeleccionTabla } from "@/angel/hooks/useSeleccionTabla";
import { useComisionables } from "@/angel/hooks/useComisionables";
import {
  type ComisionableRow,
  mapComisionable,
  createComisionablesRenderers,
} from "./_components/schema";
import Button from "@/components/atom/Button";

const OPCIONES_COBRADA = [
  { label: "Cobrada", value: "1" },
  { label: "Pendiente", value: "0" },
];

const OPCIONES_ESTADO = [
  { label: "Confirmada", value: "Confirmada" },
  { label: "Cancelada", value: "Cancelada" },
];

export default function ComisionablesPage() {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.COMISIONABLES);

  const {
    registros,
    loading,
    paginacion,
    filtros,
    actualizarFiltro,
    cobrandoId,
    procesandoLote,
    progresoLote,
    fetchComisionables,
    cobrarComision,
    cobrarComisionesEnLote,
  } = useComisionables();

  const { seleccionados, toggleFila, limpiar, estaSeleccionado, toggleTodos } =
    useSeleccionTabla<ComisionableRow>((item) => item._seleccion);

  // Los filtros solo resetean la paginación (adentro del hook); la selección
  // vive aquí (useSeleccionTabla), así que se limpia por separado.
  useEffect(() => {
    limpiar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const filas = registros.map(mapComisionable);
  // Las filas con comisión ya cobrada llegan con _seleccion === "" (ver
  // schema) y no muestran checkbox, así que nunca terminan en `seleccionados`.
  const filasSeleccionables = filas.filter((f) => f._seleccion !== "");

  const itemsSeleccionados = filas.filter((f) =>
    estaSeleccionado(f._seleccion),
  );
  const idsCobrables = itemsSeleccionados.map((f) => f._seleccion);

  const renderers = createComisionablesRenderers(
    cobrarComision,
    cobrandoId,
    toggleFila,
    estaSeleccionado,
    procesandoLote,
  );

  const handleProcesarLote = () => {
    if (idsCobrables.length === 0) return;
    cobrarComisionesEnLote(idsCobrables).then(() => limpiar());
  };

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Comisionables
      </h1>

      <FiltrosPanel
        cols={5}
        always={
          <>
            <FilterInput
              type="text"
              onChange={actualizarFiltro}
              propiedad="proveedor"
              value={filtros.proveedor || null}
              label="Proveedor"
            />
            <FilterInput
              type="text"
              onChange={actualizarFiltro}
              propiedad="codigo_confirmacion"
              value={filtros.codigo_confirmacion || null}
              label="Codigo de confirmación"
            />
            <SelectFilter
              onChange={actualizarFiltro}
              propiedad="estado"
              value={filtros.estado || null}
              label="Estado de la reserva"
              options={OPCIONES_ESTADO}
            />
            <SelectFilter
              onChange={actualizarFiltro}
              propiedad="comision_cobrada"
              value={filtros.comision_cobrada || null}
              label="Comisión cobrada"
              options={OPCIONES_COBRADA}
            />
            <FilterInput
              type="text"
              onChange={actualizarFiltro}
              propiedad="comentarios_comisionables"
              value={filtros.comentarios_comisionables || null}
              label="Comentarios"
            />
          </>
        }
      />

      <TablaCompleta
        paginacion={paginacion}
        irAPagina={fetchComisionables}
        onRefresh={() => fetchComisionables()}
        registros={filas}
        rowClassName={(i) =>
          estaSeleccionado(i._seleccion) ? "bg-blue-100" : ""
        }
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
              onClick={() => toggleTodos(filasSeleccionables)}
              variant="secondary"
              size="sm"
              disabled={filasSeleccionables.length === 0}
            >
              {seleccionados.length === filasSeleccionables.length
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
