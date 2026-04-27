"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table5 } from "@/components/Table5";
import { Loader } from "@/components/atom/Loader";

// ── helpers ──────────────────────────────────────────────────────────────────
type CambioRow = { campo: string; anterior: any; nuevo: any };

function flattenCambios(cambios: any, prefix = ""): CambioRow[] {
  if (!cambios || typeof cambios !== "object") return [];
  const rows: CambioRow[] = [];
  for (const [key, val] of Object.entries(cambios)) {
    const campo = prefix ? `${prefix}.${key}` : key;
    const v = val as any;
    if (v && typeof v === "object" && "anterior" in v && "nuevo" in v) {
      rows.push({ campo, anterior: v.anterior, nuevo: v.nuevo });
    } else if (v && typeof v === "object") {
      rows.push(...flattenCambios(v, campo));
    }
  }
  return rows;
}

function flattenItemComparison(anterior: any, nuevo: any): CambioRow[] {
  const rows: CambioRow[] = [];
  const allKeys = new Set([
    ...Object.keys(anterior ?? {}),
    ...Object.keys(nuevo ?? {}),
  ]);
  for (const key of allKeys) {
    if (key === "impuestos") continue;
    const antVal = anterior?.[key];
    const nvoVal = nuevo?.[key];
    if (antVal !== null && typeof antVal === "object") {
      const subKeys = new Set([
        ...Object.keys(antVal ?? {}),
        ...Object.keys(nvoVal ?? {}),
      ]);
      for (const sub of subKeys) {
        if (antVal?.[sub] !== nvoVal?.[sub]) {
          rows.push({
            campo: `${key}.${sub}`,
            anterior: antVal?.[sub],
            nuevo: nvoVal?.[sub],
          });
        }
      }
    } else if (antVal !== nvoVal) {
      rows.push({ campo: key, anterior: antVal, nuevo: nvoVal });
    }
  }
  return rows;
}

function parseDetalle(raw: any): any {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw;
  return null;
}

function formatVal(v: any): React.ReactNode {
  if (v === null || v === undefined)
    return <span className="text-gray-400 italic">—</span>;
  if (typeof v === "object")
    return (
      <pre className="text-xs whitespace-pre-wrap max-w-xs">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  return String(v);
}

function CambiosTable({ rows }: { rows: CambioRow[] }) {
  if (!rows.length) return null;
  return (
    <table className="text-xs w-full border-collapse rounded overflow-hidden">
      <thead>
        <tr>
          <th className="border border-gray-200 px-3 py-1 bg-gray-100 text-left font-semibold text-gray-600">
            Campo
          </th>
          <th className="border border-gray-200 px-3 py-1 bg-red-50 text-left font-semibold text-red-600">
            Anterior
          </th>
          <th className="border border-gray-200 px-3 py-1 bg-green-50 text-left font-semibold text-green-600">
            Nuevo
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ campo, anterior, nuevo }, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className="border border-gray-200 px-3 py-1 font-medium text-gray-700">
              {campo}
            </td>
            <td className="border border-gray-200 px-3 py-1 text-red-700">
              {formatVal(anterior)}
            </td>
            <td className="border border-gray-200 px-3 py-1 text-green-700">
              {formatVal(nuevo)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type ActionEndpoint = "prefacturar" | "desligar" | "aprobar" | "atendida";

function DetalleModal({
  row,
  onClose,
  onAction,
  actionLoading,
}: {
  row: AvisoReserva;
  onClose: () => void;
  onAction: (
    endpoint: ActionEndpoint,
    ids: { id_relacion: any; id_booking: any }[],
  ) => void;
  actionLoading: boolean;
}) {
  const detalle = parseDetalle(row.item?.detalle ?? row.detalle);
  const hasFactura = Boolean(detalle?.id_factura);
  const payload = [
    {
      id_relacion: row.item?.id_relacion,
      id_booking: row.item?.id_booking,
    },
  ];

  const cambios = detalle?.cambios ?? {};
  const { items: itemsCambios, ...otherCambios } = cambios;
  const cambiosRows = flattenCambios(otherCambios);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            Detalle de cambios
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
          {/* Meta chips */}
          {detalle && (
            <div className="flex flex-wrap gap-2 text-xs">
              {detalle.tipo && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  Tipo: <b>{detalle.tipo}</b>
                </span>
              )}
              {detalle.estatus && (
                <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md border border-orange-200">
                  Estatus: <b>{detalle.estatus}</b>
                </span>
              )}
              {detalle.prefacturado && (
                <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
                  Prefacturado: <b>{detalle.prefacturado}</b>
                </span>
              )}
              {detalle.id_factura && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                  ID Factura: <b>{detalle.id_factura}</b>
                </span>
              )}
              {detalle.id_confirmacion && (
                <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
                  Confirmación: <b>{detalle.id_confirmacion}</b>
                </span>
              )}
            </div>
          )}

          {/* Noches ajustadas */}
          {itemsCambios && Object.keys(itemsCambios).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Noches ajustadas
              </h3>
              <div className="space-y-3">
                {Object.entries(itemsCambios).map(
                  ([key, item]: [string, any]) => {
                    const ant = item?.anterior ?? {};
                    const nvo = item?.nuevo ?? {};
                    const rows = flattenItemComparison(ant, nvo);
                    return (
                      <div
                        key={key}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="px-3 py-2 bg-amber-50 border-b border-gray-200 text-xs font-semibold text-amber-800">
                          Noche {Number(key) + 1}
                        </div>
                        {rows.length > 0 ? (
                          <CambiosTable rows={rows} />
                        ) : (
                          <p className="text-xs text-gray-400 px-3 py-2">
                            Sin diferencias
                          </p>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Otros cambios */}
          {cambiosRows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Cambios en la reserva
              </h3>
              <CambiosTable rows={cambiosRows} />
            </div>
          )}

          {!detalle && (
            <p className="text-xs text-gray-500">Sin detalle disponible</p>
          )}

          {detalle &&
            !itemsCambios &&
            cambiosRows.length === 0 && (
              <p className="text-xs text-gray-400">Sin cambios registrados</p>
            )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          {hasFactura ? (
            <>
              <button
                disabled={actionLoading}
                onClick={() => {
                  onAction("aprobar", payload);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aprobar
              </button>
              <button
                disabled={actionLoading}
                onClick={() => {
                  onAction("desligar", payload);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Desligar
              </button>
            </>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => {
                onAction("atendida", payload);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Atendida
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
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
  Eye,
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
      row?.id_relacion ??
      row?.id_booking ??
      row?.codigo_confirmacion ??
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
  const [fuenteTabla, setFuenteTabla] = useState<
    "notificadas" | "default" | "enviadas"
  >("default");

  // Filtros
  const [filters, setFilters] = useState<AvisosFilters>(EMPTY_AVISOS_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AvisosFilters>(EMPTY_AVISOS_FILTERS);
  const [showFiltersModal, setShowFiltersModal] = useState(true);

  // Paginación
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Modal de detalle en vista Notificadas
  const [detailModalRow, setDetailModalRow] = useState<AvisoReserva | null>(
    null,
  );

  const selectedItems = useMemo(
    () =>
      Object.values(selectedMap).map((row: AvisoReserva) => ({
        id_relacion: row?.id_relacion,
        id_booking: row?.id_booking,
      })),
    [selectedMap],
  );

  const selectedCount = selectedItems.length;

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
      endpoint: ActionEndpoint,
      ids: { id_relacion: string | number; id_booking: string | number }[],
    ) => {
      if (!ids.length) {
        showNotification("info", "Selecciona al menos 1 aviso");
        return;
      }

      setActionLoading(true);

      postAvisosReservasAction(endpoint as any, ids, (data) => {
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
    [
      showNotification,
      clearSelection,
      handleFetch,
      vistaNotificadas,
      fuenteTabla,
      appliedFilters,
      page,
    ],
  );

  // Al cambiar entre Prefacturar y Notificadas solo recarga si ya hay filtros aplicados
  useEffect(() => {
    setSelectedMap({});
    setSearchTerm("");
    setPage(1);

    const hasFilters = Object.values(appliedFilters).some((v) => String(v ?? "").trim() !== "");
    if (!hasFilters) return;

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
    return (
      Object.entries(appliedFilters) as [keyof AvisosFilters, string][]
    )
      .map(([key, value]) => ({
        key,
        label: FILTER_LABELS[key],
        value: String(value ?? "").trim(),
      }))
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
          const id = String(row.id_notificacion ?? rowId);
          return {
            id,
            ver_detalle: id,
            codigo_confirmacion: row.codigo_confirmacion ?? "—",
            viajero: row.viajero ?? "—",
            agente: row.agente ?? "—",
            id_booking: row.id_booking ?? "—",
            proveedor: row.proveedor ?? "—",
            pendiente: rowId,
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
      ver_detalle: ({
        item,
      }: {
        value: string;
        item: AvisoReserva;
        index: number;
      }) => (
        <button
          onClick={() => setDetailModalRow(item)}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-blue-100 transition-colors"
          title="Ver cambios"
        >
          <Eye className="w-4 h-4 text-blue-500" />
        </button>
      ),
      pendiente: ({
        item,
      }: {
        value: string;
        item: AvisoReserva;
        index: number;
      }) => {
        const detalle = parseDetalle(item?.detalle);
        const hasFactura = Boolean(detalle?.id_factura);
        const payload = [
          {
            id_relacion: item?.id_relacion,
            id_booking: item?.id_booking,
          },
        ];

        if (hasFactura) {
          return (
            <div className="flex items-center gap-1">
              <button
                disabled={actionLoading}
                onClick={() => handleAction("aprobar", payload)}
                title="Aprobar"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                Aprobar
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction("desligar", payload)}
                title="Desligar"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                <Unlink className="w-3 h-3" />
                Desligar
              </button>
            </div>
          );
        }

        return (
          <button
            disabled={actionLoading}
            onClick={() => handleAction("atendida", payload)}
            title="Marcar como atendida"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" />
            Atendida
          </button>
        );
      },
    }),
    [actionLoading, handleAction],
  );

  const NOTIF_COLUMNS = [
    "ver_detalle",
    "codigo_confirmacion",
    "viajero",
    "agente",
    "id_booking",
    "proveedor",
    "pendiente",
  ];

  const customColumns = useMemo(() => {
    if (vistaNotificadas) return NOTIF_COLUMNS;

    if (!avisos.length) return ["seleccionar", "detalle"];

    const keys = Object.keys(avisos[0]).filter((k) => k !== "item");
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
            horizontalScroll
            maxHeight="calc(100vh - 340px)"
            fillHeight
          >
            <div className="flex items-center gap-2">
              {!vistaNotificadas && (
                <>
                  <Button
                    onClick={() => handleAction("prefacturar", selectedItems)}
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
        onChange={(field, value) =>
          setFilters((prev) => ({ ...prev, [field]: value }))
        }
        onApply={applyFilters}
        onClear={clearAllFilters}
        onClose={() => setShowFiltersModal(false)}
      />

      {detailModalRow && (
        <DetalleModal
          row={detailModalRow}
          onClose={() => setDetailModalRow(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

export default App;
