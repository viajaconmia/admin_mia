"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table5 } from "@/components/Table5";
import { Loader } from "@/components/atom/Loader";
import Button from "@/components/atom/Button";
import {
  fetchGetAvisosReservas,
  fetchGetAvisosReservasEnviadas,
  postAvisosReservasAction,
  fetchGetAvisosReservasnotificadas,
} from "@/services/avisos_reservas";
import { useAlert } from "@/context/useAlert";
import {
  CheckSquare,
  Square,
  CheckCircle2,
  Unlink,
  FileText,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import FiltrosAvisosModal, {
  type AvisosFilters,
  EMPTY_AVISOS_FILTERS,
} from "./FiltrosAvisosModal";

const LIMIT = 50;

type AvisoReserva = {
  [key: string]: any;
};

type SelectedMap = Record<string, AvisoReserva>;

function getRowId(row: AvisoReserva, index: number): string {
  return String(
    row?.id ??
      row?.id_reserva ??
      row?.codigo_confirmacion ??
      row?.id_aviso ??
      index,
  );
}

const FILTER_LABELS: Record<keyof AvisosFilters, string> = {
  id_agente: "ID Agente",
  nombre_agente: "Nombre agente",
  hotel: "Hotel",
  codigo_reservacion: "Código reservación",
  traveler: "Viajero",
  tipo_hospedaje: "Tipo hospedaje",
};

function App() {
  const { showNotification } = useAlert();

  const [avisos, setAvisos] = useState<AvisoReserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMap, setSelectedMap] = useState<SelectedMap>({});

  // false = Prefacturar | true = Notificadas
  const [vistaNotificadas, setVistaNotificadas] = useState(false);

  // En prefacturar puedes cargar pendientes(default) o enviadas
  const [fuenteTabla, setFuenteTabla] = useState<"notificadas" | "default" | "enviadas">("default");

  // Filtros
  const [filters, setFilters] = useState<AvisosFilters>(EMPTY_AVISOS_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AvisosFilters>(EMPTY_AVISOS_FILTERS);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const selectedIds = useMemo(() => Object.keys(selectedMap), [selectedMap]);
  const selectedCount = selectedIds.length;

  const handleFetch = useCallback(
    (
      fuente: "notificadas" | "default" | "enviadas" = "default",
      filtersToUse: AvisosFilters = EMPTY_AVISOS_FILTERS,
      pageToUse = 1,
    ) => {
      setLoading(true);
      setFuenteTabla(fuente);

      const fetchFn =
        fuente === "enviadas"
          ? fetchGetAvisosReservasEnviadas
          : fuente === "notificadas"
            ? fetchGetAvisosReservasnotificadas
            : fetchGetAvisosReservas;

      fetchFn(
        (data) => {
          try {
            const rows: AvisoReserva[] = Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

            setAvisos(rows);
            setHasMore(rows.length >= LIMIT);
          } finally {
            setLoading(false);
          }
        },
        filtersToUse,
        pageToUse,
      );
    },
    [],
  );

  const clearSelection = useCallback(() => setSelectedMap({}), []);

  const handleAction = useCallback(
    async (
      endpoint: "prefacturar" | "desligar" | "aprobar",
      ids: string[],
    ) => {
      if (!ids.length) {
        showNotification("info", "Selecciona al menos 1 aviso");
        return;
      }

      setActionLoading(true);

      postAvisosReservasAction(endpoint, ids, (data) => {
        try {
          if (data?.error) {
            showNotification("error", data.error);
          } else {
            showNotification(
              "success",
              `${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} exitoso`,
            );

            clearSelection();

            if (vistaNotificadas) {
              handleFetch("notificadas", appliedFilters, page);
            } else {
              handleFetch(fuenteTabla, appliedFilters, page);
            }
          }
        } finally {
          setActionLoading(false);
        }
      });
    },
    [showNotification, clearSelection, handleFetch, vistaNotificadas, fuenteTabla, appliedFilters, page],
  );

  // Cargar automáticamente al cambiar entre Prefacturar y Notificadas
  useEffect(() => {
    setSelectedMap({});
    setSearchTerm("");
    setPage(1);

    if (vistaNotificadas) {
      handleFetch("notificadas", appliedFilters, 1);
    } else {
      handleFetch("default", appliedFilters, 1);
    }
  }, [vistaNotificadas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedMap({});
  }, [fuenteTabla, searchTerm]);

  const applyFilters = useCallback(() => {
    const next = { ...filters };
    setAppliedFilters(next);
    setShowFiltersModal(false);
    setPage(1);
    setSelectedMap({});
    const fuente = vistaNotificadas ? "notificadas" : fuenteTabla;
    handleFetch(fuente as any, next, 1);
  }, [filters, vistaNotificadas, fuenteTabla, handleFetch]);

  const clearAllFilters = useCallback(() => {
    setFilters(EMPTY_AVISOS_FILTERS);
    setAppliedFilters(EMPTY_AVISOS_FILTERS);
    setShowFiltersModal(false);
    setPage(1);
    setSelectedMap({});
    const fuente = vistaNotificadas ? "notificadas" : fuenteTabla;
    handleFetch(fuente as any, EMPTY_AVISOS_FILTERS, 1);
  }, [vistaNotificadas, fuenteTabla, handleFetch]);

  const goToPage = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      setSelectedMap({});
      const fuente = vistaNotificadas ? "notificadas" : fuenteTabla;
      handleFetch(fuente as any, appliedFilters, nextPage);
    },
    [vistaNotificadas, fuenteTabla, appliedFilters, handleFetch],
  );

  const activeAppliedFilters = useMemo(() => {
    return (Object.entries(appliedFilters) as [keyof AvisosFilters, string][])
      .map(([key, value]) => ({ key, label: FILTER_LABELS[key], value: String(value ?? "").trim() }))
      .filter((item) => item.value !== "");
  }, [appliedFilters]);

  const registros = useMemo(() => {
    const q = searchTerm.toUpperCase();

    return avisos
      .filter((row) => {
        if (!q) return true;
        return Object.values(row).some((v) =>
          String(v ?? "")
            .toUpperCase()
            .includes(q),
        );
      })
      .map((row, index) => {
        const rowId = getRowId(row, index);

        if (vistaNotificadas) {
          return {
            ...row,
            acciones: rowId,
            detalle: rowId,
            item: row,
          };
        }

        return {
          seleccionar: rowId,
          ...row,
          detalle: rowId,
          item: row,
        };
      });
  }, [avisos, searchTerm, vistaNotificadas]);

  const registrosSeleccionables = useMemo(() => {
    if (vistaNotificadas) return [];

    return registros.map((row, index) => ({
      id: getRowId(row.item ?? row, index),
      item: row.item ?? row,
    }));
  }, [registros, vistaNotificadas]);

  const allFilteredSelected =
    registrosSeleccionables.length > 0 &&
    registrosSeleccionables.every(({ id }) => Boolean(selectedMap[id]));

  const toggleSelectAllFiltered = useCallback(() => {
    setSelectedMap((prev) => {
      const next = { ...prev };

      if (allFilteredSelected) {
        registrosSeleccionables.forEach(({ id }) => {
          delete next[id];
        });
      } else {
        registrosSeleccionables.forEach(({ id, item }) => {
          next[id] = item;
        });
      }

      return next;
    });
  }, [allFilteredSelected, registrosSeleccionables]);

  const renderersPrefacturar = useMemo(
    () => ({
      seleccionar: ({
        value,
        item,
      }: {
        value: string;
        item: AvisoReserva;
        index: number;
      }) => {
        const id = value;
        const isSelected = Boolean(selectedMap[id]);

        return (
          <button
            onClick={() =>
              setSelectedMap((prev) => {
                const next = { ...prev };
                if (next[id]) {
                  delete next[id];
                } else {
                  next[id] = item;
                }
                return next;
              })
            }
            className="flex items-center justify-center w-full"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
        );
      },
    }),
    [selectedMap],
  );

  const renderersNotificadas = useMemo(
    () => ({
      acciones: ({
        value,
      }: {
        value: string;
        item: AvisoReserva;
        index: number;
      }) => {
        const id = value;
        return (
          <div className="flex items-center gap-1">
            <button
              disabled={actionLoading}
              onClick={() => handleAction("aprobar", [id])}
              title="Aprobar"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
              Aprobar
            </button>
            <button
              disabled={actionLoading}
              onClick={() => handleAction("desligar", [id])}
              title="Desligar"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors"
            >
              <Unlink className="w-3 h-3" />
              Desligar
            </button>
          </div>
        );
      },
    }),
    [actionLoading, handleAction],
  );

  const customColumns = useMemo(() => {
    if (!avisos.length) {
      return vistaNotificadas ? ["acciones", "detalle"] : ["seleccionar", "detalle"];
    }

    const keys = Object.keys(avisos[0]).filter((k) => k !== "item");

    if (vistaNotificadas) {
      return [...keys, "acciones", "detalle"];
    }

    return ["seleccionar", ...keys, "detalle"];
  }, [avisos, vistaNotificadas]);

  return (
    <div className="h-fit">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 my-4">
        Avisos de Reservas
      </h1>

      <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              onClick={() => goToPage(page)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              onClick={() => setShowFiltersModal(true)}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeAppliedFilters.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-blue-600 text-white">
                  {activeAppliedFilters.length}
                </span>
              )}
            </Button>

            {activeAppliedFilters.length > 0 && (
              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={clearAllFilters}
              >
                <X className="w-4 h-4" />
                Limpiar
              </Button>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none ml-2">
              <span
                className={`text-sm font-medium ${!vistaNotificadas ? "text-blue-700" : "text-gray-400"}`}
              >
                Prefacturar
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={vistaNotificadas}
                  onChange={(e) => setVistaNotificadas(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${vistaNotificadas ? "bg-blue-600" : "bg-gray-300"}`}
                />
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${vistaNotificadas ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
              <span
                className={`text-sm font-medium ${vistaNotificadas ? "text-blue-700" : "text-gray-400"}`}
              >
                Notificadas
              </span>
            </label>
          </div>
        </div>

        {/* Active filter chips */}
        {activeAppliedFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {activeAppliedFilters.map((item) => (
              <span
                key={item.key}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-gray-200 bg-gray-50 text-gray-700"
              >
                <span className="font-semibold">{item.label}:</span>
                <span>{item.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Prefacturar sub-toolbar */}
        {!vistaNotificadas && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                {selectedCount > 0
                  ? `Seleccionados: ${selectedCount}`
                  : "Sin selección"}
              </span>

              {registrosSeleccionables.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                >
                  {allFilteredSelected ? (
                    <>
                      <CheckSquare className="w-3 h-3" />
                      Quitar selección filtrada
                    </>
                  ) : (
                    <>
                      <Square className="w-3 h-3" />
                      Seleccionar todo lo filtrado
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <Loader />
        ) : (
          <Table5<AvisoReserva>
            registros={registros as any}
            renderers={
              vistaNotificadas
                ? (renderersNotificadas as any)
                : (renderersPrefacturar as any)
            }
            customColumns={customColumns}
            respectCustomColumnOrder
            maxHeight="calc(100vh - 340px)"
            fillHeight
          >
            <div className="flex items-center gap-2">
              {!vistaNotificadas && (
                <>
                  <Button
                    onClick={() => handleAction("prefacturar", selectedIds)}
                    disabled={selectedCount === 0 || actionLoading}
                    icon={FileText}
                    variant="secondary"
                    size="md"
                    title={
                      selectedCount === 0
                        ? "Selecciona al menos 1 aviso"
                        : `Prefacturar (${selectedCount})`
                    }
                  >
                    Prefacturar{selectedCount > 0 ? ` (${selectedCount})` : ""}
                  </Button>

                  <Button
                    onClick={() => {
                      setPage(1);
                      handleFetch("enviadas", appliedFilters, 1);
                    }}
                    disabled={loading}
                    variant={fuenteTabla === "enviadas" ? "primary" : "secondary"}
                    size="md"
                    title="Cargar avisos enviadas"
                  >
                    Enviadas
                  </Button>

                  <Button
                    onClick={() => {
                      setPage(1);
                      handleFetch("default", appliedFilters, 1);
                    }}
                    disabled={loading}
                    variant={fuenteTabla === "default" ? "primary" : "secondary"}
                    size="md"
                    title="Cargar avisos pendientes"
                  >
                    Pendientes
                  </Button>
                </>
              )}

              {/* Paginación */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => goToPage(page - 1)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600 px-2">Pág. {page}</span>
                <button
                  disabled={!hasMore || loading}
                  onClick={() => goToPage(page + 1)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Table5>
        )}
      </div>

      <FiltrosAvisosModal
        open={showFiltersModal}
        filters={filters}
        onChange={(field, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
        onApply={applyFilters}
        onClear={clearAllFilters}
        onClose={() => setShowFiltersModal(false)}
      />
    </div>
  );
}

export default App;
