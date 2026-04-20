"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Table5 } from "@/components/Table5";
import { useAlert } from "@/context/useAlert";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { URL, API_KEY } from "@/lib/constants/index";
import { CheckCircle, Unlink, FileText, RefreshCw } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type VistaReservas = "reservas_completas" | "reservas_ajustadas";

type ReservaRaw = { [key: string]: any };

type SelectedMap = Record<string, ReservaRaw>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getIdReserva = (raw: ReservaRaw, index: number): string =>
  String(
    raw?.id_reserva ??
      raw?.id_solicitud ??
      raw?.codigo_confirmacion ??
      index,
  );

// ─── Renderer checkbox ────────────────────────────────────────────────────────

const buildRenderers = (
  selectedMap: SelectedMap,
  onToggle: (raw: ReservaRaw, index: number) => void,
  vista: VistaReservas,
  onDesligar: (raw: ReservaRaw) => void,
  onAprobar: (raw: ReservaRaw) => void,
) => ({
  seleccionar: ({
    item,
    index,
  }: {
    value: any;
    item: ReservaRaw;
    index: number;
  }) => {
    const id = getIdReserva(item, index);
    const checked = !!selectedMap[id];
    return (
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item, index)}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
    );
  },

  acciones: ({
    item,
  }: {
    value: any;
    item: ReservaRaw;
    index: number;
  }) => {
    if (vista !== "reservas_ajustadas") return null;
    return (
      <div className="flex gap-1 items-center">
        <Button
          size="sm"
          variant="warning"
          icon={Unlink}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDesligar(item);
          }}
        >
          Desligar
        </Button>
        <Button
          size="sm"
          variant="primary"
          icon={CheckCircle}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onAprobar(item);
          }}
        >
          Aprobar
        </Button>
      </div>
    );
  },
});

// ─── Página principal ─────────────────────────────────────────────────────────

function App() {
  const { showNotification } = useAlert();

  const [vista, setVista] = useState<VistaReservas>("reservas_completas");
  const [reservas, setReservas] = useState<ReservaRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMap, setSelectedMap] = useState<SelectedMap>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${URL}/mia/avisos_reservas/reservas`, {
        method:"GET",
        headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      const json = await resp.json().catch(() => null);
      const data = json?.data ?? json;
      setReservas(Array.isArray(data) ? data : []);
    } catch {
      showNotification("error", "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  }, [vista, showNotification]);

  useEffect(() => {
    fetchReservas();
    setSelectedMap({});
    setSearchTerm("");
  }, [vista]);

  // ── Selección ──────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((raw: ReservaRaw, index: number) => {
    const id = getIdReserva(raw, index);
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = raw;
      }
      return next;
    });
  }, []);

  const selectedItems = useMemo(
    () => Object.values(selectedMap),
    [selectedMap],
  );
  const selectedCount = selectedItems.length;

  const clearSelection = useCallback(() => setSelectedMap({}), []);

  // ── Acciones bulk ──────────────────────────────────────────────────────────

  const callAction = useCallback(
    async (endpoint: string, ids: string[], label: string) => {
      setActionLoading(true);
      try {
        const resp = await fetch(`${URL}/mia/avisos_reservas/${endpoint}`, {
          method: "GET",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok)
          throw new Error(json?.message || `Error HTTP: ${resp.status}`);
        showNotification("success", `${label} aplicado correctamente`);
        clearSelection();
        fetchReservas();
      } catch (err: any) {
        showNotification("error", err?.message || `Error al ${label}`);
      } finally {
        setActionLoading(false);
      }
    },
    [showNotification, clearSelection, fetchReservas],
  );

  const handlePrefacturar = useCallback(() => {
    if (!selectedCount) {
      showNotification("info", "Selecciona al menos una reserva");
      return;
    }
    const ids = selectedItems.map((r, i) => getIdReserva(r, i));
    callAction("prefacturar", ids, "Prefacturar");
  }, [selectedCount, selectedItems, callAction, showNotification]);

  const handleDesligarBulk = useCallback(() => {
    if (!selectedCount) {
      showNotification("info", "Selecciona al menos una reserva");
      return;
    }
    const ids = selectedItems.map((r, i) => getIdReserva(r, i));
    callAction("desligar", ids, "Desligar");
  }, [selectedCount, selectedItems, callAction, showNotification]);

  const handleAprobarBulk = useCallback(() => {
    if (!selectedCount) {
      showNotification("info", "Selecciona al menos una reserva");
      return;
    }
    const ids = selectedItems.map((r, i) => getIdReserva(r, i));
    callAction("aprobar", ids, "Aprobar");
  }, [selectedCount, selectedItems, callAction, showNotification]);

  // ── Acciones por fila ──────────────────────────────────────────────────────

  const handleDesligarRow = useCallback(
    (raw: ReservaRaw) => {
      const id = getIdReserva(raw, 0);
      callAction("desligar", [id], "Desligar");
    },
    [callAction],
  );

  const handleAprobarRow = useCallback(
    (raw: ReservaRaw) => {
      const id = getIdReserva(raw, 0);
      callAction("aprobar", [id], "Aprobar");
    },
    [callAction],
  );

  // ── Filtro de búsqueda ─────────────────────────────────────────────────────

  const filteredReservas = useMemo(() => {
    const q = searchTerm.trim().toUpperCase();
    if (!q) return reservas;
    return reservas.filter((r) =>
      Object.values(r).some((v) =>
        String(v ?? "")
          .toUpperCase()
          .includes(q),
      ),
    );
  }, [reservas, searchTerm]);

  // ── Registros para Table5 ──────────────────────────────────────────────────

  const registros = useMemo(
    () =>
      filteredReservas.map((r) => ({
        seleccionar: "",
        ...r,
        ...(vista === "reservas_ajustadas" ? { acciones: "" } : {}),
        item: r,
      })),
    [filteredReservas, vista],
  );

  const customColumns = useMemo<string[]>(() => {
    if (!registros.length) return ["seleccionar"];
    const base = Object.keys(registros[0]).filter(
      (k) => k !== "item" && k !== "acciones" && k !== "seleccionar",
    );
    return [
      "seleccionar",
      ...base,
      ...(vista === "reservas_ajustadas" ? ["acciones"] : []),
    ];
  }, [registros, vista]);

  // ── Renderers ──────────────────────────────────────────────────────────────

  const renderers = useMemo(
    () =>
      buildRenderers(
        selectedMap,
        toggleSelect,
        vista,
        handleDesligarRow,
        handleAprobarRow,
      ),
    [selectedMap, toggleSelect, vista, handleDesligarRow, handleAprobarRow],
  );

  // ── UI ─────────────────────────────────────────────────────────────────────

  const vistaMeta: Record<VistaReservas, { description: string }> = {
    reservas_completas: {
      description: "Reservas listas para asignar estatus de prefacturación",
    },
    reservas_ajustadas: {
      description:
        "Reservas editadas con facturas o pagos ligados — aprueba o desliga",
    },
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Avisos de Reservas
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {vistaMeta[vista].description}
          </p>
        </div>

        {/* Select de vista */}
        <select
          value={vista}
          onChange={(e) => setVista(e.target.value as VistaReservas)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          <option value="reservas_completas">Reservas Completas</option>
          <option value="reservas_ajustadas">Reservas Ajustadas</option>
        </select>
      </div>

      {/* ── Barra de herramientas ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Búsqueda */}
        <input
          type="text"
          placeholder="Buscar reserva…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />

        {/* Contador de selección */}
        {selectedCount > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">
            {selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchReservas}
            disabled={loading}
            loading={loading}
          >
            Actualizar
          </Button>

          {/* ── Caso 1: Prefacturación ── */}
          {vista === "reservas_completas" && (
            <Button
              size="sm"
              variant="primary"
              icon={FileText}
              onClick={handlePrefacturar}
              disabled={selectedCount === 0 || actionLoading}
              loading={actionLoading}
              title={
                selectedCount === 0
                  ? "Selecciona al menos una reserva"
                  : undefined
              }
            >
              Prefacturar{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
          )}

          {/* ── Caso 2: Desligar / Aprobar ── */}
          {vista === "reservas_ajustadas" && (
            <>
              <Button
                size="sm"
                variant="warning"
                icon={Unlink}
                onClick={handleDesligarBulk}
                disabled={selectedCount === 0 || actionLoading}
                loading={actionLoading}
                title={
                  selectedCount === 0
                    ? "Selecciona al menos una reserva"
                    : undefined
                }
              >
                Desligar{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>

              <Button
                size="sm"
                variant="primary"
                icon={CheckCircle}
                onClick={handleAprobarBulk}
                disabled={selectedCount === 0 || actionLoading}
                loading={actionLoading}
                title={
                  selectedCount === 0
                    ? "Selecciona al menos una reserva"
                    : undefined
                }
              >
                Aprobar{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <Table5
          registros={registros}
          renderers={renderers as any}
          customColumns={customColumns}
          respectCustomColumnOrder
          maxHeight="calc(100vh - 16rem)"
          horizontalScroll
          leyenda={`${filteredReservas.length} registro${filteredReservas.length !== 1 ? "s" : ""}`}
          exportButton
        />
      )}
    </div>
  );
}

export default App;
