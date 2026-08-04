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
  createDispersionCard,
} from "./_components/schema";
import { SubirComprobanteDispersionModal } from "@/angel/components/organisms/SubirComprobanteDispersionModal";
import Button from "@/components/atom/Button";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { TextInput } from "@/components/atom/Input";
import { Search } from "lucide-react";
import { fmtMoney } from "@/angel/lib/format/number";

const PAGE_SIZE = 100;

export default function DispersionesPage() {
  const [dispersiones, setDispersiones] = useState<DispersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalComprobante, setModalComprobante] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const {
    seleccionados,
    toggleFila,
    limpiar,
    estaSeleccionado,
    seleccionarVarios,
    deseleccionarVarios,
  } = useSeleccionTabla<DispersionRow>((item) => item._seleccion);
  const { paginacion, actualizarDesdeMetadata } = usePaginacion(PAGE_SIZE);
  const { error, success } = useAlert();
  const { Can } = usePermiso();

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
  const renderCard = createDispersionCard(
    seleccionarGrupo,
    toggleFila,
    estaSeleccionado,
  );

  const totalSeleccionado = dispersiones
    .filter((d) => seleccionados.includes(d._seleccion))
    .reduce((sum, d) => sum + d.monto_solicitado, 0);

  const registrosFiltrados = (() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return dispersiones;
    return dispersiones.filter((d) =>
      [d.proveedor, d.cliente, d.codigo_confirmacion, d.codigo_dispersion].some(
        (campo) => campo?.toLowerCase().includes(term),
      ),
    );
  })();

  const handleEliminarDispersion = () => {
    const codigos = [
      ...new Set(
        dispersiones
          .filter((d) => seleccionados.includes(d._seleccion))
          .map((d) => d.codigo_dispersion),
      ),
    ];

    if (codigos.length !== 1) {
      error(
        "Selecciona únicamente las filas de una sola dispersión para eliminarla.",
      );
      return;
    }

    const codigo = codigos[0];
    const continuar = confirm(
      `Vas a eliminar la dispersión ${codigo}. Esto eliminará TODAS las solicitudes que dependen de esta dispersión, no solo la que estás seleccionando. ¿Deseas continuar?`,
    );
    if (!continuar) return;

    setLoadingEliminar(true);
    dispersionService
      .eliminarDispersion(codigo)
      .then(() => {
        success("Dispersión eliminada correctamente");
        limpiar();
        fetchDispersiones(1);
      })
      .catch((err) => error(err.message || "Error al eliminar la dispersión"))
      .finally(() => setLoadingEliminar(false));
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-md shadow-sm">
      <TablaCompleta<DispersionRow>
        paginacion={paginacion}
        irAPagina={fetchDispersiones}
        onRefresh={() => fetchDispersiones(paginacion.page)}
        registros={registrosFiltrados}
        loading={loading}
        renderers={renderers}
        renderCard={renderCard}
      >
        <div className="relative w-full flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <TextInput
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por proveedor, cliente, confirmación o dispersión"
            className="[&>input]:pl-9"
          />
        </div>
        <AccionesSeleccion count={seleccionados.length} onLimpiar={limpiar}>
          <span className="text-sm font-medium text-white/90 whitespace-nowrap ml-2">
            Total solicitado: {fmtMoney(totalSeleccionado)}
          </span>
          <div className="hidden h-4 w-px bg-white/20 sm:block" />
          <Button
            onClick={() => setModalComprobante(true)}
            variant="secondary"
            size="sm"
          >
            Subir comprobante
          </Button>
          <Can permiso={PERMISOS.COMPONENTES.BOTON.DISPERSION_ELIMINAR}>
            <Button
              onClick={handleEliminarDispersion}
              variant="warning"
              size="sm"
              disabled={loadingEliminar}
            >
              {loadingEliminar ? "Eliminando..." : "Eliminar dispersión"}
            </Button>
          </Can>
        </AccionesSeleccion>
      </TablaCompleta>

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
