"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table5 } from "@/components/Table5";
import { Loader } from "@/components/atom/Loader";
import Button from "@/components/atom/Button";
import {
  fetchGetAvisosReservas,
  postAvisosReservasAction,
} from "@/services/avisos_reservas";
import { useAlert } from "@/context/useAlert";
import {
  CheckSquare,
  Square,
  CheckCircle2,
  Unlink,
  FileText,
  Search,
} from "lucide-react";
import ModalDetalle from "@/app/dashboard/conciliacion/detalles";

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

function App() {
  const { showNotification } = useAlert();

  const [avisos, setAvisos] = useState<AvisoReserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMap, setSelectedMap] = useState<SelectedMap>({});
  const [solicitudDetalle, setSolicitudDetalle] = useState<string | null>(null);

  // false = Prefacturar (default) | true = Notificadas
  const [vistaNotificadas, setVistaNotificadas] = useState(false);

  const selectedIds = useMemo(() => Object.keys(selectedMap), [selectedMap]);
  const selectedCount = selectedIds.length;

  const handleFetch = useCallback(() => {
    setLoading(true);
    fetchGetAvisosReservas((data) => {
      try {
        const rows: AvisoReserva[] = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setAvisos(rows);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  // Limpiar selección al cambiar de pantalla
  useEffect(() => {
    setSelectedMap({});
  }, [vistaNotificadas]);

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
            handleFetch();
          }
        } finally {
          setActionLoading(false);
        }
      });
    },
    [showNotification, clearSelection, handleFetch],
  );

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

  const detalleRenderer = {
    detalle: ({
      item,
    }: {
      value: string;
      item: AvisoReserva;
      index: number;
    }) => (
      <button
        onClick={() => setSolicitudDetalle(getRowId(item, 0))}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
        title="Ver detalle"
      >
        <Search className="w-3 h-3" />
        Detalle
      </button>
    ),
  };

  // ---- Renderers vista Prefacturar ----
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
      ...detalleRenderer,
    }),
    [selectedMap, setSolicitudDetalle],
  );

  // ---- Renderers vista Notificadas ----
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
      ...detalleRenderer,
    }),
    [actionLoading, handleAction, setSolicitudDetalle],
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
        {/* Cabecera: buscador + toggle vista */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Toggle de pantalla */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
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

        {/* Barra de selección + acciones bulk (solo en vista Prefacturar) */}
        {!vistaNotificadas && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs text-slate-600">
              {selectedCount > 0
                ? `Seleccionados: ${selectedCount}`
                : "Sin selección"}
            </span>
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
            leyenda={`Mostrando ${registros.length} registros`}
            maxHeight="calc(100vh - 280px)"
            fillHeight
          >
            {/* Botón masivo solo en vista Prefacturar */}
            {!vistaNotificadas && (
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
            )}
          </Table5>
        )}
      </div>

      {solicitudDetalle !== null && (
        <ModalDetalle
          id_solicitud_proveedor={solicitudDetalle}
          onClose={() => setSolicitudDetalle(null)}
        />
      )}
    </div>
  );
}

export default App;
