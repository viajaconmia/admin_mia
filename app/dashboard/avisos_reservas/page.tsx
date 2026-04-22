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
import { CheckSquare, Square, CheckCircle2, Unlink, FileText } from "lucide-react";

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

  const clearSelection = useCallback(() => setSelectedMap({}), []);

  const handleAction = useCallback(
    async (endpoint: "prefacturar" | "desligar" | "aprobar") => {
      if (!selectedIds.length) {
        showNotification("info", "Selecciona al menos 1 aviso");
        return;
      }
      setActionLoading(true);
      postAvisosReservasAction(endpoint, selectedIds, (data) => {
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
    [selectedIds, showNotification, clearSelection, handleFetch],
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
        return {
          seleccionar: rowId,
          ...row,
          item: row,
        };
      });
  }, [avisos, searchTerm]);

  const renderers = useMemo(
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

  const customColumns = useMemo(() => {
    if (!avisos.length) return ["seleccionar"];
    const keys = Object.keys(avisos[0]).filter((k) => k !== "item");
    return ["seleccionar", ...keys];
  }, [avisos]);

  return (
    <div className="h-fit">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 my-4">
        Avisos de Reservas
      </h1>

      <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {/* Buscador */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Barra de selección */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs text-slate-600">
            {selectedCount > 0
              ? `Seleccionados: ${selectedCount}`
              : "Sin selección"}
          </span>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <Table5<AvisoReserva>
            registros={registros as any}
            renderers={renderers as any}
            customColumns={customColumns}
            respectCustomColumnOrder
            leyenda={`Mostrando ${registros.length} registros`}
            maxHeight="calc(100vh - 260px)"
            fillHeight
          >
            <Button
              onClick={() => handleAction("aprobar")}
              disabled={selectedCount === 0 || actionLoading}
              icon={CheckCircle2}
              variant="secondary"
              size="md"
              title={
                selectedCount === 0
                  ? "Selecciona al menos 1 aviso"
                  : `Aprobar (${selectedCount})`
              }
            >
              Aprobar{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>

            <Button
              onClick={() => handleAction("prefacturar")}
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
              onClick={() => handleAction("desligar")}
              disabled={selectedCount === 0 || actionLoading}
              icon={Unlink}
              variant="ghost"
              size="md"
              className={[
                "h-10 !rounded-xl px-3",
                "border border-rose-200 bg-white text-rose-700",
                "hover:bg-rose-50 hover:border-rose-300",
                "active:translate-y-[1px] transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
              title={
                selectedCount === 0
                  ? "Selecciona al menos 1 aviso"
                  : `Desligar (${selectedCount})`
              }
            >
              Desligar{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
          </Table5>
        )}
      </div>
    </div>
  );
}

export default App;
