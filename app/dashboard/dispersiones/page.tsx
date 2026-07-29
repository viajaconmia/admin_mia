"use client";

import { useEffect, useState } from "react";
import { dispersionService } from "@/angel/services/dispersion";
import { TablaCompleta } from "@/angel/components/organisms/TablaCompleta";
import { AccionesSeleccion } from "@/angel/components/molecules/AccionesSeleccion";
import { useSeleccionTabla } from "@/angel/hooks/useSeleccionTabla";
import { usePaginacion } from "@/angel/hooks/usePaginacion";
import { useAlert } from "@/context/useAlert";
import {
  DispersionRow,
  mapDispersion,
  createDispersionRenderers,
} from "./_components/schema";
import { SubirComprobanteDispersionModal } from "@/angel/components/organisms/SubirComprobanteDispersionModal";
import Button from "@/components/atom/Button";

const PAGE_SIZE = 100;

export default function DispersionesPage() {
  const [dispersiones, setDispersiones] = useState<DispersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalComprobante, setModalComprobante] = useState(false);

  const {
    seleccionados,
    toggleFila,
    limpiar,
    estaSeleccionado,
    seleccionarVarios,
    deseleccionarVarios,
  } = useSeleccionTabla<DispersionRow>((item) => item._seleccion);
  const { paginacion, actualizarDesdeMetadata } = usePaginacion(PAGE_SIZE);
  const { error } = useAlert();

  const fetchDispersiones = (page: number = paginacion.page) => {
    setLoading(true);
    dispersionService
      .getDispersiones({ page, length: PAGE_SIZE })
      .then(({ data, metadata }) => {
        setDispersiones((data ?? []).map(mapDispersion));
        actualizarDesdeMetadata(metadata?.total || 0, page);
        limpiar();
      })
      .catch((err) => error(err.message || "Error al obtener las dispersiones"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDispersiones(1);
  }, []);

  const seleccionarGrupo = (codigo: string) => {
    const ids = dispersiones
      .filter((d) => d.codigo_dispersion === codigo && d._seleccion !== "")
      .map((d) => d._seleccion);
    if (ids.length === 0) return;
    const todosSeleccionados = ids.every((id) => estaSeleccionado(id));
    if (todosSeleccionados) {
      deseleccionarVarios(ids);
    } else {
      seleccionarVarios(ids);
    }
  };

  const renderers = createDispersionRenderers(
    seleccionarGrupo,
    toggleFila,
    estaSeleccionado,
  );

  const totalSeleccionado = dispersiones
    .filter((d) => seleccionados.includes(d._seleccion))
    .reduce((sum, d) => sum + d.monto_solicitado, 0);

  return (
    <div className="space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Dispersiones</h1>
      </div>

      <TablaCompleta<DispersionRow>
        paginacion={paginacion}
        irAPagina={fetchDispersiones}
        onRefresh={() => fetchDispersiones(paginacion.page)}
        registros={dispersiones}
        label={`Mostrando ${dispersiones.length} registros`}
        loading={loading}
        renderers={renderers}
      />

      <AccionesSeleccion count={seleccionados.length} onLimpiar={limpiar}>
        <Button
          onClick={() => setModalComprobante(true)}
          variant="secondary"
          size="sm"
        >
          Subir comprobante
        </Button>
      </AccionesSeleccion>

      <SubirComprobanteDispersionModal
        open={modalComprobante}
        onClose={() => setModalComprobante(false)}
        onSuccess={() => {
          setModalComprobante(false);
          fetchDispersiones(1);
        }}
        ids={seleccionados.map(Number)}
        totalMonto={totalSeleccionado}
      />
    </div>
  );
}
