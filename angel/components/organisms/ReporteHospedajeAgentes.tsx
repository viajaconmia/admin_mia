"use client";
import { useCallback, useMemo, useState } from "react";
import { FileDown, RefreshCcw, Settings2 } from "lucide-react";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { FilterInput } from "@/component/atom/FilterInput";
import { FiltrosPanel } from "@/angel/components/molecules/FiltrosPanel";
import { SelectFilter } from "@/angel/components/atoms/SelectFilter";
import { TableCore } from "@/angel/components/atoms/TableCore";
import { ColumnConfigPanel } from "@/angel/components/molecules/ColumnConfigPanel";
import { useClientes } from "@/angel/context/ClientesContext";
import { useAgentesReportData } from "@/angel/hooks/useAgentesReportData";
import { useColumnConfig } from "@/angel/hooks/useColumnConfig";
import { reordenarColumnas } from "@/angel/lib/reordenarColumnas";
import { exportColumnasVisibles } from "@/angel/lib/exportTable";
import { mensajeError } from "@/angel/lib/mensajeError";
import { useAlert } from "@/context/useAlert";
import {
  reservasService,
  type CampoEditableBooking,
} from "@/angel/services/reservas";
import {
  AGENTES_REPORT_COLUMNAS_DEFAULT,
  createAgentesReportRenderers,
} from "@/angel/schemas/tables/agentes_report";

// id_booking viaja en cada fila para poder editar los campos de bookings,
// pero no es información que deba mostrarse como columna.
const COLUMNAS_SIEMPRE_OCULTAS = ["id_booking"];

const TABLE_KEY = "reporte_hospedaje_agentes";
const COLUMNAS_DEFAULT = AGENTES_REPORT_COLUMNAS_DEFAULT.map((c) => c.key);

const TZ = "America/Mexico_City";
const DAY_MS = 24 * 60 * 60 * 1000;

const fmtYYYYMMDD_TZ = (d: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const da = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${da}`;
};

const defaultFechaHasta = () => fmtYYYYMMDD_TZ(new Date());
const defaultFechaDesde = () => fmtYYYYMMDD_TZ(new Date(Date.now() - 7 * DAY_MS));

export function ReporteHospedajeAgentes() {
  const { clientes } = useClientes();
  const [idAgente, setIdAgente] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState(defaultFechaDesde());
  const [fechaHasta, setFechaHasta] = useState(defaultFechaHasta());
  const [panelAbierto, setPanelAbierto] = useState(false);

  const filtrosActuales = {
    id_agente: idAgente,
    fecha_desde: fechaDesde || null,
    fecha_hasta: fechaHasta || null,
  };

  const { rows, loading, error, fetchReporte, actualizarFila } =
    useAgentesReportData(filtrosActuales);
  const columnConfig = useColumnConfig(TABLE_KEY, COLUMNAS_DEFAULT);
  const { error: mostrarError } = useAlert();

  const handleEditarCampo = useCallback(
    async (id_booking: string, campo: CampoEditableBooking, valor: string) => {
      try {
        const { data } = await reservasService.editarCamposBooking(id_booking, {
          [campo]: valor,
        });
        actualizarFila(id_booking, {
          [campo]: data?.[campo] ?? (valor === "" ? null : valor),
        });
        return true;
      } catch (err) {
        mostrarError(mensajeError(err, "No se pudo guardar el cambio"));
        return false;
      }
    },
    [actualizarFila, mostrarError],
  );

  const renderers = useMemo(
    () => createAgentesReportRenderers(handleEditarCampo),
    [handleEditarCampo],
  );
  const clienteOptions = useMemo(
    () => clientes.map((c) => ({ label: c.nombre, value: c.id_agente })),
    [clientes],
  );

  const registrosOrdenados = reordenarColumnas(rows, columnConfig.orden);

  const handleExportar = () => {
    const columnasVisibles = columnConfig.orden.filter(
      (key) => !columnConfig.ocultas.includes(key),
    );
    exportColumnasVisibles(rows, columnasVisibles, "reporte_hospedaje.csv");
  };

  return (
    <div className="flex flex-col gap-4">
      <FiltrosPanel
        cols={3}
        always={
          <>
            <SelectFilter
              label="Cliente"
              propiedad="id_agente"
              value={idAgente}
              onChange={(value) => setIdAgente(value)}
              options={clienteOptions}
            />
            <FilterInput
              type="date"
              label="Fecha inicio"
              propiedad="fecha_desde"
              value={fechaDesde}
              onChange={(value) => setFechaDesde(value || "")}
            />
            <FilterInput
              type="date"
              label="Fecha fin"
              propiedad="fecha_hasta"
              value={fechaHasta}
              onChange={(value) => setFechaHasta(value || "")}
            />
          </>
        }
      />

      <div className="flex flex-col gap-4 bg-white rounded-lg p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-500">
            Registros: {rows.length}
          </span>

          {loading && (
            <div className="flex items-center gap-2">
              <Loader size="sm" />
              Cargando...
            </div>
          )}

          {error && <span className="text-sm text-red-600">{error}</span>}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={Settings2}
              onClick={() => setPanelAbierto(true)}
            >
              Configurar columnas
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={FileDown}
              onClick={handleExportar}
              disabled={rows.length === 0}
            >
              Exportar CSV
            </Button>
            <Button
              size="sm"
              icon={RefreshCcw}
              onClick={() => fetchReporte(filtrosActuales)}
              disabled={loading}
            >
              Consultar
            </Button>
          </div>
        </div>

        <TableCore
          registros={registrosOrdenados}
          renderers={renderers}
          hiddenKeys={[...columnConfig.ocultas, ...COLUMNAS_SIEMPRE_OCULTAS]}
          maxHeight="calc(100vh - 320px)"
        />
      </div>

      <ColumnConfigPanel
        open={panelAbierto}
        onClose={() => setPanelAbierto(false)}
        columnas={AGENTES_REPORT_COLUMNAS_DEFAULT}
        orden={columnConfig.orden}
        ocultas={columnConfig.ocultas}
        onMover={columnConfig.moverColumna}
        onToggleOculta={columnConfig.toggleOculta}
        configs={columnConfig.configs}
        activoId={columnConfig.activoId}
        onGuardar={columnConfig.guardar}
        onAplicar={columnConfig.aplicar}
        onEliminar={columnConfig.eliminar}
        onRestaurarDefault={columnConfig.restaurarDefault}
      />
    </div>
  );
}
