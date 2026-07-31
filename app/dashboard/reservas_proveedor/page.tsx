"use client";

import { useEffect, useReducer } from "react";
import {
  pagoProveedorService,
  FiltrosReservasProveedor,
  type BucketReservas,
} from "@/angel/services/pago_proveedor";
import { TablaCompleta } from "@/angel/components/organisms/TablaCompleta";
import { FilterInput } from "@/component/atom/FilterInput";
import { SelectFilter } from "@/angel/components/atoms/SelectFilter";
import { FiltrosPanel } from "@/angel/components/molecules/FiltrosPanel";
import { AccionesSeleccion } from "@/angel/components/molecules/AccionesSeleccion";
import { useSeleccionTabla } from "@/angel/hooks/useSeleccionTabla";
import { usePaginacion } from "@/angel/hooks/usePaginacion";
import { useAlert } from "@/context/useAlert";
import { GetSeleccionRenderer } from "@/v3/atom/TableItemsComponent";
import {
  SolicitudProveedorItem,
  mapSolicitud,
  createSolicitudRenderers,
  createSolicitudTotales,
} from "./_components/schema";
import {
  EditarSeleccionModal,
  type CampoEdicion,
} from "@/angel/components/molecules/EditarSeleccionModal";
import { DispersionModal } from "@/angel/components/organisms/DispersionModal";
import Button from "@/components/atom/Button";
import { useFile } from "@/hooks/useFile";
import { Download } from "lucide-react";

// ─── Reducer ────────────────────────────────────────────────────────────────

type Modales = { edicion: boolean; dispersion: boolean };
type LoadingModales = { edicion: boolean; dispersion: boolean };

type PageState = {
  solicitudes: SolicitudProveedorItem[];
  loading: boolean;
  filtros: FiltrosReservasProveedor;
  modales: Modales;
  loadingModales: LoadingModales;
};

type PageAction =
  | { type: "solicitudes/set"; payload: SolicitudProveedorItem[] }
  | { type: "loading/set"; payload: boolean }
  | {
      type: "filtros/update";
      key: keyof FiltrosReservasProveedor;
      value: string;
    }
  | { type: "filtros/delete"; key: keyof FiltrosReservasProveedor }
  | { type: "modal/abrir"; modal: keyof Modales }
  | { type: "modal/cerrar"; modal: keyof Modales }
  | { type: "modal/setLoading"; modal: keyof LoadingModales; payload: boolean };

const INITIAL_STATE: PageState = {
  solicitudes: [],
  loading: false,
  filtros: {},
  modales: { edicion: false, dispersion: false },
  loadingModales: { edicion: false, dispersion: false },
};

function reducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "solicitudes/set":
      return { ...state, solicitudes: action.payload };
    case "loading/set":
      return { ...state, loading: action.payload };
    case "filtros/update":
      return {
        ...state,
        filtros: { ...state.filtros, [action.key]: action.value },
      };
    case "filtros/delete": {
      const next = { ...state.filtros };
      delete next[action.key];
      return { ...state, filtros: next };
    }
    case "modal/abrir":
      return { ...state, modales: { ...state.modales, [action.modal]: true } };
    case "modal/cerrar":
      return { ...state, modales: { ...state.modales, [action.modal]: false } };
    case "modal/setLoading":
      return {
        ...state,
        loadingModales: {
          ...state.loadingModales,
          [action.modal]: action.payload,
        },
      };
    default:
      return state;
  }
}

// ─── Fin Reducer ────────────────────────────────────────────────────────────
// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReservasProveedorPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const { seleccionados, toggleFila, limpiar, estaSeleccionado, toggleTodos } =
    useSeleccionTabla<SolicitudProveedorItem>((item) => item._seleccion);
  const { paginacion, actualizarDesdeMetadata, resetear } =
    usePaginacion(PAGE_SIZE);
  const { error } = useAlert();
  const { csv, loadingFile, setLoadingFile } = useFile();

  const itemsSeleccionados = state.solicitudes.filter((s) =>
    estaSeleccionado(s._seleccion),
  );

  const puedeDispersionar =
    itemsSeleccionados.length > 0 &&
    itemsSeleccionados.every((s) =>
      ["DISPERSION", "TRANSFERENCIA_SOLICITADA"].includes(s.estado_solicitud),
    );

  const renderers = {
    _seleccion: GetSeleccionRenderer(toggleFila, estaSeleccionado),
    ...createSolicitudRenderers(),
  };

  useEffect(() => {
    resetear();
  }, [state.filtros]);

  const fetchSolicitudes = (page: number = paginacion.page) => {
    dispatch({ type: "loading/set", payload: true });
    pagoProveedorService
      .getReservas({
        ...state.filtros,
        page,
        length: PAGE_SIZE,
        includeFacturas: true,
      })
      .then(({ data, metadata }) => {
        dispatch({
          type: "solicitudes/set",
          payload: (data ?? []).map(mapSolicitud),
        });
        actualizarDesdeMetadata(metadata?.total || 0, page);
        limpiar();
      })
      .catch((er) => error(er.message || "Error al obtener las reservas"))
      .finally(() => dispatch({ type: "loading/set", payload: false }));
  };

  const handleDescargarCsv = () => {
    setLoadingFile(true);
    pagoProveedorService
      .getReservas({
        ...state.filtros,
        includeFacturas: true,
      })
      .then(({ data }) => {
        csv(
          (data ?? []).map(mapSolicitud),
          `reservas_proveedor_${new Date().toISOString().split("T")[0]}.csv`,
        );
      })
      .catch((er) => error(er.message || "Error al descargar el CSV"))
      .finally(() => setLoadingFile(false));
  };

  const handleFilterChange = (
    value: string | null,
    key: keyof FiltrosReservasProveedor,
  ) => {
    if (value == null) {
      dispatch({ type: "filtros/delete", key });
    } else {
      dispatch({ type: "filtros/update", key, value });
    }
  };

  const handleDispersar = () => {
    if (itemsSeleccionados.some((i) => i.saldo_dispersion <= 0)) {
      const codigosSinSaldo = itemsSeleccionados
        .filter((i) => i.saldo_dispersion <= 0)
        .map((i) => i.codigo_confirmacion);

      const continuar = confirm(
        `Algunas reservas ya fueron completamente dispersadas (o su saldo es negativo), si quieres dispersarlas de nuevo necesitas cancelar una dispersión.\n\n¿Deseas continuar con las otras reservas?\n\nEstas reservas son las que vamos a quitar de la dispersión:\n${codigosSinSaldo.join(",\n")}`,
      );

      if (!continuar) return;
    }

    if (itemsSeleccionados.every((i) => i.saldo_dispersion <= 0)) {
      error(
        "Ninguna de las reservas seleccionadas tiene saldo disponible para dispersar.",
      );
      return;
    }

    dispatch({ type: "modal/abrir", modal: "dispersion" });
  };

  const handleEditarMasivo = (_valores: Record<string, string>) => {
    error("Función de edición masiva no implementada aún");
  };

  return (
    <div className="space-y-4 bg-white">
      <FiltrosPanel
        always={
          <>
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="codigo_confirmacion"
              value={state.filtros.codigo_confirmacion || null}
              label="Confirmación"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="proveedor"
              value={state.filtros.proveedor || null}
              label="Proveedor"
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="estado_solicitud"
              value={state.filtros.estado_solicitud || null}
              label="Estado solicitud"
              options={[
                "PAGADO LINK",
                "PAGADO TARJETA",
                "PAGADO TRANSFERENCIA",
                "CANCELADA",
                "TRANSFERENCIA_SOLICITADA",
                "CUPON ENVIADO",
                "CARTA_ENVIADA",
                "SOLICITADA",
                "DISPERSION",
              ]}
            />
            <SelectFilter
              onChange={handleFilterChange}
              propiedad="bucket"
              value={state.filtros.bucket || null}
              label="Pestaña"
              options={BUCKET_OPTIONS}
            />
          </>
        }
        extra={
          <>
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="cliente"
              value={state.filtros.cliente || null}
              label="Agente / Cliente"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="rfc"
              value={state.filtros.rfc || null}
              label="RFC"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="uuid"
              value={state.filtros.uuid || null}
              label="UUID"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="tipo_negociacion"
              value={state.filtros.tipo_negociacion || null}
              label="Tipo negociación"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="notas_internas"
              value={state.filtros.notas_internas || null}
              label="Notas internas"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="comentarios_ops"
              value={state.filtros.comentarios_ops || null}
              label="Comentarios OPS"
            />
            <FilterInput
              type="text"
              onChange={handleFilterChange}
              propiedad="comentarios_cxp"
              value={state.filtros.comentarios_cxp || null}
              label="Comentarios CXP"
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="servicio"
              value={state.filtros.servicio || null}
              label="Tipo de servicio"
              options={["flyght", "car_rental", "hotel"]}
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="estado_facturacion"
              value={state.filtros.estado_facturacion || null}
              label="Estado facturación"
              options={["pendiente", "facturado", "parcial"]}
            />
            <FilterInput
              type="select"
              onChange={handleFilterChange}
              propiedad="forma_pago"
              value={state.filtros.forma_pago || null}
              label="Forma de pago"
              options={["credit", "contado"]}
            />
            <FilterInput
              type="date"
              onChange={handleFilterChange}
              propiedad="fecha_inicio_creacion"
              value={state.filtros.fecha_inicio_creacion || null}
              label="Creación desde"
            />
            <FilterInput
              type="date"
              onChange={handleFilterChange}
              propiedad="fecha_fin_creacion"
              value={state.filtros.fecha_fin_creacion || null}
              label="Creación hasta"
            />
            <FilterInput
              type="date"
              onChange={handleFilterChange}
              propiedad="fecha_solicitud_inicio"
              value={state.filtros.fecha_solicitud_inicio || null}
              label="Solicitud desde"
            />
            <FilterInput
              type="date"
              onChange={handleFilterChange}
              propiedad="fecha_solicitud_fin"
              value={state.filtros.fecha_solicitud_fin || null}
              label="Solicitud hasta"
            />
          </>
        }
      />

      <TablaCompleta<SolicitudProveedorItem>
        paginacion={paginacion}
        irAPagina={fetchSolicitudes}
        onRefresh={fetchSolicitudes}
        registros={state.solicitudes}
        rowClassName={(i) => (estaSeleccionado(i.id) ? "bg-blue-100" : "")}
        label={`Mostrando ${state.solicitudes.length} registros`}
        loading={state.loading}
        renderers={renderers}
        totales={createSolicitudTotales()}
      >
        <Button
          onClick={handleDescargarCsv}
          variant="secondary"
          size="sm"
          icon={Download}
          disabled={loadingFile}
        >
          {loadingFile ? "Descargando..." : "Descargar CSV"}
        </Button>
      </TablaCompleta>

      <AccionesSeleccion count={seleccionados.length} onLimpiar={limpiar}>
        <Button
          onClick={() => toggleTodos(state.solicitudes)}
          variant="secondary"
          size="sm"
        >
          {seleccionados.length === state.solicitudes.length
            ? "Deseleccionar todos"
            : "Seleccionar todos"}
        </Button>
        <Button
          onClick={handleDispersar}
          disabled={!puedeDispersionar}
          variant="secondary"
          size="sm"
        >
          Dispersar
        </Button>
        <Button
          onClick={() => dispatch({ type: "modal/abrir", modal: "edicion" })}
          variant="secondary"
          size="sm"
        >
          Editar notas
        </Button>
      </AccionesSeleccion>

      <EditarSeleccionModal
        open={state.modales.edicion}
        onClose={() => dispatch({ type: "modal/cerrar", modal: "edicion" })}
        count={itemsSeleccionados.length}
        campos={CAMPOS_EDICION_SOLICITUD}
        onConfirmar={handleEditarMasivo}
        loading={state.loadingModales.edicion}
      />

      <DispersionModal
        open={state.modales.dispersion}
        onClose={() => dispatch({ type: "modal/cerrar", modal: "dispersion" })}
        onSuccess={() => {
          dispatch({ type: "modal/cerrar", modal: "dispersion" });
          limpiar();
          fetchSolicitudes(1);
        }}
        ids={[
          ...new Set(
            itemsSeleccionados
              .filter((i) => i.saldo_dispersion > 0)
              .map((i) => i.id),
          ),
        ]}
      />
    </div>
  );
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

const CAMPOS_EDICION_SOLICITUD: CampoEdicion[] = [
  { key: "notas_internas", label: "Notas internas", type: "textarea", rows: 4 },
];

const BUCKET_OPTIONS: { label: string; value: BucketReservas }[] = [
  { value: "spei", label: "SPEI" },
  { value: "pago_tdc", label: "Pago TDC" },
  { value: "pago_link", label: "Pago Link" },
  { value: "pagada", label: "Pagada" },
  { value: "notificados", label: "Notificados" },
  { value: "canceladas", label: "Canceladas" },
  { value: "ap_credito", label: "AP Crédito" },
  { value: "pendiente_credito", label: "Pendiente Crédito" },
];
