"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table5 } from "@/components/Table5";
import { Loader } from "@/components/atom/Loader";
import { DetalleModal, type ActionEndpoint } from "./detalle/avisos";
import Button from "@/components/atom/Button";
import {
  fetchGetAvisosReservas,
  fetchGetAvisosReservasEnviadas,
  postAvisosReservasAction,
  fetchGetAvisosReservasnotificadas,
  fetchGenerarLayaut,
} from "@/services/avisos_reservas";
import useApi from "@/hooks/useApi";
import { useAlert } from "@/context/useAlert";
import {
  CheckSquare,
  Square,
  FileText,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Download,
  DownloadCloud,
  Copy,
  Check,
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

function calcularNoches(checkIn: any, checkOut: any): string {
  if (!checkIn || !checkOut) return "";
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? String(diff) : "";
}

function buildCSV(reservas: any[], nombreAgente: string): string {
  const headers = [
    "CLIENTE",
    "HOTEL",
    "VIAJERO",
    "CHECK IN",
    "CHECK OUT",
    "NOCHES",
    "HABITACION",
    "TOTAL",
    "METODO DE PAGO",
  ];
  const rows = reservas.map((r) => {
    const checkIn = r["CHECK IN"] ?? "";
    const checkOut = r["CHECK OUT"] ?? "";
    const noches = r["NOCHES"] ?? calcularNoches(checkIn, checkOut);
    return [
      nombreAgente,
      r["HOTEL"] ?? "",
      r["VIAJERO"] ?? "",
      checkIn,
      checkOut,
      noches,
      r["HABITACION"] ?? "",
      r["TOTAL"] ?? "",
      r["METODO DE PAGO"] ?? "",
    ];
  });
  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}


function LayoutModal({
  agente,
  facturas,
  onClose,
}: {
  agente: string;
  facturas: any[];
  onClose: () => void;
}) {
  const { descargarFactura, descargarFacturaXML } = useApi();
  const layoutText = `${agente}\n\nGusto en saludarte, adjunto factura de las reservaciones que se realizaron por la plataforma VIAJA CON MIA, para que me apoyes con su ingreso y programación a pago por favor.\n\nMe confirmas de recibido por favor. Cualquier duda o comentario, estoy a tus órdenes.\n\nSaludos cordiales!!`;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(layoutText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDescargar = async (
    idFacturama: string,
    tipo: "pdf" | "xml",
    nombre: string,
  ) => {
    try {
      if (tipo === "pdf") {
        const obj = await descargarFactura(idFacturama);
        const a = document.createElement("a");
        a.href = `data:application/pdf;base64,${obj.Content}`;
        a.download = nombre.endsWith(".pdf") ? nombre : `${nombre}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      } else {
        const obj = await descargarFacturaXML(idFacturama);
        const a = document.createElement("a");
        a.href = `data:application/xml;base64,${obj.Content}`;
        a.download = nombre.endsWith(".xml") ? nombre : `${nombre}.xml`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
      }
    } catch {
      alert("Ha ocurrido un error al descargar la factura");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">Layout generado</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Texto del correo */}
          <div>
            <p className="text-xs text-gray-500 mb-2">
              El CSV se descargó. Copia el siguiente texto para tu correo:
            </p>
            <textarea
              readOnly
              rows={7}
              value={layoutText}
              className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none bg-gray-50 font-sans"
            />
          </div>

          {/* Facturas */}
          {facturas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Facturas</h3>
              <div className="space-y-2">
                {facturas.map((f, i) => (
                  <div
                    key={i}
                    className="border border-purple-200 rounded-lg bg-purple-50/30 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 text-purple-800">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-semibold">
                        Factura {i + 1}
                        {f.id_factura ? ` — ID ${f.id_factura}` : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {f.url_pdf ? (
                        <a
                          href={f.url_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
                        >
                          <FileText className="w-3 h-3" />
                          Ver PDF
                        </a>
                      ) : f.id_facturama ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleDescargar(
                              f.id_facturama,
                              "pdf",
                              `Factura-${f.id_factura || f.id_facturama}`,
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
                        >
                          <DownloadCloud className="w-3 h-3" />
                          Descargar PDF
                        </button>
                      ) : null}

                      {f.url_xml ? (
                        <a
                          href={f.url_xml}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
                        >
                          <FileText className="w-3 h-3" />
                          Ver XML
                        </a>
                      ) : f.id_facturama ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleDescargar(
                              f.id_facturama,
                              "xml",
                              `Factura-${f.id_factura || f.id_facturama}`,
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
                        >
                          <DownloadCloud className="w-3 h-3" />
                          Descargar XML
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar texto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { showNotification } = useAlert();

  const [avisos, setAvisos] = useState<AvisoReserva[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutData, setLayoutData] = useState<{ agente: string; facturas: any[] } | null>(null);
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

  const handleGenerarLayaut = useCallback(async () => {
    const items = Object.values(selectedMap);
    if (!items.length) {
      showNotification("info", "Selecciona al menos 1 aviso");
      return;
    }
    console.log(items,"😎😎😎😎")
    const id_relaciones = items.map((r) => r.id_relacion).filter(Boolean);
    const id_agente = items[0]?.agente;

    if (!id_agente) {
      showNotification("error", "No se encontró id_agente en los registros seleccionados");
      return;
    }

    setLayoutLoading(true);

    fetchGenerarLayaut(
      async (data) => {
        try {
          if (data?.error) {
            showNotification("error", data.error);
            return;
          }

          const { reservas = [], agente, facturas = [] } = data;
          const nombreAgente: string = agente?.nombre ?? "";

          // Descargar CSV
          const csv = buildCSV(reservas, nombreAgente);
          downloadCSV(
            csv,
            `layout_${nombreAgente.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`,
          );

          // Deduplicar facturas
          const seen = new Set<string>();
          const facturasUnicas = facturas.filter((f) => {
            const key = String(f.id_factura ?? "");
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          setLayoutData({ agente: nombreAgente, facturas: facturasUnicas });
        } finally {
          setLayoutLoading(false);
        }
      },
      { id_relaciones, id_agente },
    );
  }, [selectedMap, showNotification]);

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
                  {fuenteTabla === "enviadas" ? (
                    <Button
                      onClick={handleGenerarLayaut}
                      disabled={selectedCount === 0 || layoutLoading}
                      icon={Download}
                      variant="secondary"
                      size="md"
                      title={
                        selectedCount === 0
                          ? "Selecciona al menos 1 aviso"
                          : `Generar Layout (${selectedCount})`
                      }
                    >
                      {layoutLoading
                        ? "Generando..."
                        : `Generar Layout${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
                    </Button>
                  ) : (
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
                  )}

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

      {layoutData !== null && (
        <LayoutModal
          agente={layoutData.agente}
          facturas={layoutData.facturas}
          onClose={() => setLayoutData(null)}
        />
      )}
    </div>
  );
}

export default App;
