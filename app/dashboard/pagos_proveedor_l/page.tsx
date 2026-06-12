"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { fetchSolicitudesLu } from "@/services/pago_proveedor";
import { OtrosMetodosPagoModal } from "@/app/dashboard/pagos_proveedor/Components/OtrosMetodosPagoModal";
import ModalDetalle from "@/app/dashboard/conciliacion/detalles";
import { calcularNoches } from "@/helpers/utils";
import { formatDate } from "@/helpers/formater";
import { RefreshCw, Upload, X, Eye, ZoomIn, ZoomOut, Bell } from "lucide-react";
import Link from "next/link";
import { Loader } from "@/components/atom/Loader";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "dispersion" | "pagado_transferencia";

type SolicitudRow = {
  id_solicitud_proveedor: string;
  proveedor: string;
  codigo_confirmacion: string;
  costo_proveedor: number;
  monto_solicitado: number;
  cliente: string;
  precio_de_venta: number;
  check_in: string | null;
  check_out: string | null;
  noches: number;
  markup: number;
  banco: string | null;
  cuenta: string | null;
  titular_cuenta: string | null;
  caratula: string | null;
  estatus: string;
  codigo_dispersion: string | null;
  revision_pendiente: number | null;
  raw: any;
};

type SolicitudSeleccionada = {
  id_solicitud_proveedor: string;
  monto_solicitado: number;
  monto_pagado: string;
  codigo_confirmacion?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n: number) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const GROUP_COLOR = {
  bg: "bg-blue-200",
  border: "border-l-blue-400",
  badge: "bg-blue-100 text-blue-700 border-blue-200",
  headerBadge: "bg-blue-600 text-white border-blue-700",
};


const mapLuRow = (raw: any): SolicitudRow => {
  const check_in = raw?.["CHECK IN"] ?? null;
  const check_out = raw?.["CHECK OUT"] ?? null;
  const costo_proveedor = Number(raw?.["COSTO PROV."] ?? 0);
  const precio_de_venta = Number(raw?.["PX VENTA"] ?? 0);

  return {
    id_solicitud_proveedor: String(raw?.["ID SOL."] ?? ""),
    proveedor: String(raw?.["PROVEEDOR"] ?? "").toUpperCase(),
    codigo_confirmacion: raw?.["CÓD. CONFIRM."] ?? "—",
    costo_proveedor,
    monto_solicitado: Number(raw?.["MONTO SOL."] ?? 0),
    cliente: String(raw?.["CLIENTE"] ?? "").toUpperCase(),
    precio_de_venta,
    check_in,
    check_out,
    noches: calcularNoches(check_in, check_out),
    markup: costo_proveedor > 0
      ? ((precio_de_venta - costo_proveedor) / costo_proveedor) * 100
      : 0,
    banco: raw?.["banco"] ?? null,
    cuenta: raw?.["cuenta"] ?? null,
    titular_cuenta: raw?.["titular"] ?? null,
    caratula: raw?.["url_caratula"] ?? null,
    estatus: String(raw?.["ESTATUS"] ?? "—").toUpperCase(),
    codigo_dispersion: raw?.["codigo_dispersion"] ?? raw?.["CÓDIGO DISPERSIÓN"] ?? null,
    revision_pendiente: raw?.["revision_pendiente"] ?? null,
    raw,
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useSolicitudes(tab: Tab) {
  const [rows, setRows] = useState<SolicitudRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limite, setLimite] = useState("100");

  const fetchData = useCallback(
    async (_limiteArg?: string) => {
      setLoading(true);
      setError(null);
      try {
        const estado =
          tab === "dispersion" ? "Dispersion" : "PAGADO TRANSFERENCIA";

        const rawList = await fetchSolicitudesLu(estado);
        setRows(rawList.map(mapLuRow));
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar solicitudes");
      } finally {
        setLoading(false);
      } 
    },
    [tab],
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return { rows, loading, error, fetchData, limite, setLimite };
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ estatus }: { estatus: string }) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";
  const color = estatus.includes("DISPERS")
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : estatus.includes("PAGAD")
      ? "bg-green-50 text-green-700 border-green-200"
      : estatus.includes("CANCEL")
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-slate-50 text-slate-600 border-slate-200";
  return <span className={`${base} ${color}`}>{estatus || "—"}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PagosProveedorL() {
  const [tab, setTab] = useState<Tab>("dispersion");
  const { rows, loading, error, fetchData, limite, setLimite } =
    useSolicitudes(tab);

  const [selectedMap, setSelectedMap] = useState<Record<string, SolicitudRow>>({});
  const [pendingAction, setPendingAction] = useState<
    | { type: "row"; row: SolicitudRow; currentGroup: string; newGroup: string }
    | { type: "group"; groupRows: SolicitudRow[]; currentGroup: string; newGroup: string }
    | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [caratulaUrl, setCaratulaUrl] = useState<string | null>(null);
  const [revisionRow, setRevisionRow] = useState<SolicitudRow | null>(null);
  const [search, setSearch] = useState("");

  // Limpiar selección al cambiar tab
  useEffect(() => {
    setSelectedMap({});
    setSearch("");
  }, [tab]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.proveedor.includes(q) ||
        r.codigo_confirmacion.toUpperCase().includes(q) ||
        r.cliente.includes(q) ||
        r.id_solicitud_proveedor.includes(q) ||
        (r.codigo_dispersion ?? "").toUpperCase().includes(q),
    );
  }, [rows, search]);

  const groupedRows = useMemo(() => {
    const map = new Map<string, SolicitudRow[]>();
    for (const row of filteredRows) {
      const key = row.codigo_dispersion ?? "__sin_codigo__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).map(([codigo, rows]) => ({
      codigo,
      rows,
      total: rows.reduce((sum, r) => sum + r.monto_solicitado, 0),
    }));
  }, [filteredRows]);

  const isDispersion = tab === "dispersion";
  const selectedCount = Object.keys(selectedMap).length;


  const toggleRow = (row: SolicitudRow) => {
    const rowGroup = row.codigo_dispersion ?? "__sin_codigo__";
    const prevVals = Object.values(selectedMap);
    const prevGroup = prevVals.length > 0
      ? (prevVals[0].codigo_dispersion ?? "__sin_codigo__")
      : null;

    if (prevGroup !== null && prevGroup !== rowGroup) {
      setPendingAction({ type: "row", row, currentGroup: prevGroup, newGroup: rowGroup });
      return;
    }

    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[row.id_solicitud_proveedor]) {
        delete next[row.id_solicitud_proveedor];
      } else {
        next[row.id_solicitud_proveedor] = row;
      }
      return next;
    });
  };

  const toggleGroup = (groupRows: SolicitudRow[]) => {
    const groupCode = groupRows[0]?.codigo_dispersion ?? "__sin_codigo__";
    const prevVals = Object.values(selectedMap);
    const prevGroup = prevVals.length > 0
      ? (prevVals[0].codigo_dispersion ?? "__sin_codigo__")
      : null;

    const allInGroup = groupRows.every((r) => !!selectedMap[r.id_solicitud_proveedor]);
    if (allInGroup) {
      setSelectedMap((prev) => {
        const next = { ...prev };
        groupRows.forEach((r) => delete next[r.id_solicitud_proveedor]);
        return next;
      });
      return;
    }

    const hasOtherGroup = prevVals.some(
      (r) => (r.codigo_dispersion ?? "__sin_codigo__") !== groupCode,
    );
    if (prevGroup !== null && hasOtherGroup) {
      setPendingAction({ type: "group", groupRows, currentGroup: prevGroup, newGroup: groupCode });
      return;
    }

    setSelectedMap((prev) => {
      const next = { ...prev };
      groupRows.forEach((r) => { next[r.id_solicitud_proveedor] = r; });
      return next;
    });
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "row") {
      const { row } = pendingAction;
      setSelectedMap((prev) => ({ ...prev, [row.id_solicitud_proveedor]: row }));
    } else {
      const { groupRows } = pendingAction;
      setSelectedMap((prev) => {
        const next = { ...prev };
        groupRows.forEach((r) => { next[r.id_solicitud_proveedor] = r; });
        return next;
      });
    }
    setPendingAction(null);
  };

  const selectedSolicitudes = useMemo<SolicitudSeleccionada[]>(
    () =>
      Object.values(selectedMap).map((r) => ({
        id_solicitud_proveedor: r.id_solicitud_proveedor,
        monto_solicitado: r.monto_solicitado,
        monto_pagado: Number(r.monto_solicitado).toFixed(2),
        codigo_confirmacion: r.codigo_confirmacion,
      })),
    [selectedMap],
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Pagos a proveedor — Dispersión
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="flex gap-1 py-2">
          <TabBtn
            active={tab === "dispersion"}
            onClick={() => setTab("dispersion")}
          >
            Dispersión
          </TabBtn>
          <TabBtn
            active={tab === "pagado_transferencia"}
            onClick={() => setTab("pagado_transferencia")}
          >
            Pagado transferencia
          </TabBtn>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 bg-white border-b border-slate-100">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proveedor, folio, cliente…"
          className="flex-1 min-w-[180px] max-w-xs h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
        />

        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            className="w-20 h-9 px-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="100"
          />
          <button
            onClick={() => fetchData(limite)}
            disabled={loading}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Cargar</span>
          </button>
        </div>

        {/* Selección + limpiar + upload — solo en tab DISPERSION */}
        {isDispersion && (
          <>
            {selectedCount > 0 && (
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                {selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}
              </span>
            )}

            {selectedCount > 0 && (
              <button
                onClick={() => setSelectedMap({})}
                className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm hover:bg-rose-100 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}

            <button
              onClick={() => setShowModal(true)}
              className="h-9 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 flex items-center gap-1.5 ml-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              Subir comprobante
              {selectedCount > 0 && (
                <span className="font-semibold">({selectedCount})</span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 pt-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            {search
              ? "Sin resultados para esa búsqueda."
              : `No hay solicitudes en estado ${tab === "dispersion" ? "DISPERSION" : "PAGADO TRANSFERENCIA"}.`}
          </div>
        ) : (
          <>
            {/* ── Tabla desktop ─────────────────────────────────── */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-8" />
                    {isDispersion && <th className="w-8" />}
                    <Th>ID SOL.</Th>
                    <Th>CÓD. DISPERS.</Th>
                    <Th>PROVEEDOR</Th>
                    <Th>CÓD. CONFIRM.</Th>
                    <Th align="right">COSTO PROV.</Th>
                    <Th align="right">MONTO SOL.</Th>
                    <Th>CLIENTE</Th>
                    <Th align="right">PX VENTA</Th>
                    <Th align="center">CHECK IN</Th>
                    <Th align="center">CHECK OUT</Th>
                    <Th align="right">MARKUP</Th>
                    <Th>DATOS BANCARIOS</Th>
                    <Th align="center">CARÁTULA</Th>
                    <Th align="center">ESTATUS</Th>
                    {!isDispersion && <Th align="center">ACCIÓN</Th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedRows.map((group) => {
                    const color = group.codigo !== "__sin_codigo__" ? GROUP_COLOR : null;
                    return (
                      <React.Fragment key={group.codigo}>
                        {/* Group header row */}
                        {(() => {
                          const groupAllSelected = group.rows.every((r) => !!selectedMap[r.id_solicitud_proveedor]);
                          const groupSomeSelected = !groupAllSelected && group.rows.some((r) => !!selectedMap[r.id_solicitud_proveedor]);
                          return (
                            <tr className={`${color ? color.bg : "bg-slate-50"} border-t-2 ${color ? "border-blue-300" : "border-slate-200"}`}>
                              <td colSpan={20} className="px-4 py-2">
                                <div className="flex items-center gap-3">
                                  {isDispersion && (
                                    <input
                                      type="checkbox"
                                      checked={groupAllSelected}
                                      ref={(el) => { if (el) el.indeterminate = groupSomeSelected; }}
                                      onChange={() => toggleGroup(group.rows)}
                                      className="h-4 w-4 accent-blue-700 cursor-pointer shrink-0"
                                      title="Seleccionar todo el grupo"
                                    />
                                  )}
                                  {group.codigo !== "__sin_codigo__" ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${color ? color.headerBadge : "bg-slate-100 text-slate-700 border-slate-300"}`}>
                                      {group.codigo}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-slate-400 italic">Sin código</span>
                                  )}
                                  <span className={`text-[11px] ${color ? "text-blue-800" : "text-slate-500"}`}>
                                    {group.rows.length} solicitud{group.rows.length !== 1 ? "es" : ""}
                                    {groupSomeSelected && (
                                      <span className={`ml-1 font-medium ${color ? "text-blue-700" : "text-blue-600"}`}>
                                        · {group.rows.filter((r) => !!selectedMap[r.id_solicitud_proveedor]).length} seleccionada{group.rows.filter((r) => !!selectedMap[r.id_solicitud_proveedor]).length !== 1 ? "s" : ""}
                                      </span>
                                    )}
                                    {groupAllSelected && group.rows.length > 0 && (
                                      <span className={`ml-1 font-medium ${color ? "text-blue-700" : "text-blue-600"}`}>· todas seleccionadas</span>
                                    )}
                                  </span>
                                  <span className={`text-[11px] font-semibold ml-auto ${color ? "text-blue-900" : "text-slate-700"}`}>
                                    Total: {fmtMoney(group.total)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                        {/* Group rows */}
                        {group.rows.map((row) => {
                          const selected = !!selectedMap[row.id_solicitud_proveedor];
                          return (
                            <tr
                              key={`${row.id_solicitud_proveedor}-${row.codigo_dispersion}`}
                              className={`transition-colors border-l-4 ${color ? color.border : "border-l-transparent"} ${selected ? "bg-blue-100" : "bg-blue-50 hover:bg-blue-100"}`}
                            >
                              <td className="px-2 py-2.5 text-center w-8">
                                {row.revision_pendiente === 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setRevisionRow(row)}
                                    title="Revisión pendiente"
                                    className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-700 transition-colors"
                                  >
                                    <Bell className="w-3 h-3" />
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 border border-white" />
                                  </button>
                                )}
                              </td>
                              {isDispersion && (
                                <td className="px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleRow(row)}
                                    className="h-4 w-4 accent-blue-600 cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                                {row.id_solicitud_proveedor}
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                {row.codigo_dispersion ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color ? color.badge : "bg-slate-100 text-slate-700 border-slate-300"}`}>
                                    {row.codigo_dispersion}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td
                                className="px-3 py-2.5 text-slate-800 max-w-[150px] truncate"
                                title={row.proveedor}
                              >
                                {row.proveedor || "—"}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                                {row.codigo_confirmacion}
                              </td>
                              <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">
                                {fmtMoney(row.costo_proveedor)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                                {fmtMoney(row.monto_solicitado)}
                              </td>
                              <td
                                className="px-3 py-2.5 text-slate-700 max-w-[150px] truncate"
                                title={row.cliente}
                              >
                                {(row.cliente || "—").toUpperCase()}
                              </td>
                              <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">
                                {fmtMoney(row.precio_de_venta)}
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                                {formatDate(row.check_in)}
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                                {formatDate(row.check_out)}
                              </td>
                              <td
                                className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${row.markup >= 0 ? "text-green-700" : "text-red-600"}`}
                              >
                                {row.markup.toFixed(1)}%
                              </td>
                              <td className="px-3 py-2.5 max-w-[190px]">
                                {row.banco || row.cuenta || row.titular_cuenta ? (
                                  <div className="flex flex-col gap-0.5">
                                    {row.banco && (
                                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{row.banco}</span>
                                    )}
                                    {row.cuenta && (
                                      <span className="font-mono text-[11px] text-slate-800">{row.cuenta}</span>
                                    )}
                                    {row.titular_cuenta && (
                                      <span className="text-[10px] text-slate-500 truncate" title={row.titular_cuenta}>{row.titular_cuenta}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {row.caratula ? (
                                  <button
                                    type="button"
                                    onClick={() => setCaratulaUrl(row.caratula)}
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[11px] font-medium"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Ver
                                  </button>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <StatusBadge estatus={row.estatus} />
                              </td>
                              {!isDispersion && (
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setDetalleId(row.id_solicitud_proveedor)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Detalle
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Cards mobile / tablet ──────────────────────────── */}
            <div className="lg:hidden space-y-3">
              {groupedRows.map((group) => {
                const color = group.codigo !== "__sin_codigo__" ? GROUP_COLOR : null;
                const groupAllSelected = group.rows.every((r) => !!selectedMap[r.id_solicitud_proveedor]);
                const groupSomeSelected = !groupAllSelected && group.rows.some((r) => !!selectedMap[r.id_solicitud_proveedor]);
                return (
                  <div key={group.codigo}>
                    {/* Group header */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 ${color ? color.bg : "bg-slate-100"}`}>
                      {isDispersion && (
                        <input
                          type="checkbox"
                          checked={groupAllSelected}
                          ref={(el) => { if (el) el.indeterminate = groupSomeSelected; }}
                          onChange={() => toggleGroup(group.rows)}
                          className="h-4 w-4 accent-blue-700 cursor-pointer shrink-0"
                        />
                      )}
                      {group.codigo !== "__sin_codigo__" ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${color ? color.headerBadge : "bg-slate-100 text-slate-700 border-slate-300"}`}>
                          {group.codigo}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 italic">Sin código</span>
                      )}
                      <span className={`text-[11px] ${color ? "text-blue-800" : "text-slate-500"}`}>
                        {group.rows.length} solicitud{group.rows.length !== 1 ? "es" : ""}
                        {groupSomeSelected && (
                          <span className={`ml-1 font-medium ${color ? "text-blue-700" : "text-blue-600"}`}>
                            · {group.rows.filter((r) => !!selectedMap[r.id_solicitud_proveedor]).length} sel.
                          </span>
                        )}
                        {groupAllSelected && group.rows.length > 0 && (
                          <span className={`ml-1 font-medium ${color ? "text-blue-700" : "text-blue-600"}`}>· todas</span>
                        )}
                      </span>
                      <span className={`text-[11px] font-semibold ml-auto ${color ? "text-blue-900" : "text-slate-700"}`}>
                        {fmtMoney(group.total)}
                      </span>
                    </div>

                    {/* Group cards */}
                    <div className="space-y-2 mb-4">
                      {group.rows.map((row) => {
                        const selected = !!selectedMap[row.id_solicitud_proveedor];
                        return (
                          <div
                            key={`${row.id_solicitud_proveedor}-${row.codigo_dispersion}`}
                            className={`rounded-xl border-l-4 shadow-sm p-4 transition-colors ${color ? color.border : "border-l-transparent"} ${
                              selected ? "border-blue-300 bg-blue-100" : "border-blue-200 bg-blue-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {isDispersion && (
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleRow(row)}
                                  className="h-4 w-4 accent-blue-600 cursor-pointer mt-0.5 shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {row.proveedor || "—"}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <StatusBadge estatus={row.estatus} />
                                    {row.revision_pendiente === 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setRevisionRow(row)}
                                        title="Revisión pendiente"
                                        className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-700 transition-colors"
                                      >
                                        <Bell className="w-3 h-3" />
                                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 border border-white" />
                                      </button>
                                    )}
                                    {!isDispersion && (
                                      <button
                                        type="button"
                                        onClick={() => setDetalleId(row.id_solicitud_proveedor)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Detalle
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                  #{row.id_solicitud_proveedor}
                                  {row.codigo_confirmacion !== "—" && (
                                    <span className="ml-2 text-slate-400">· {row.codigo_confirmacion}</span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <CardField label="Cliente" value={row.cliente || "—"} />
                              <CardField label="Costo prov." value={fmtMoney(row.costo_proveedor)} />
                              <CardField label="Monto sol." value={fmtMoney(row.monto_solicitado)} bold />
                              <CardField label="Px venta" value={fmtMoney(row.precio_de_venta)} />
                              <CardField label="Check in" value={formatDate(row.check_in)} />
                              <CardField label="Check out" value={formatDate(row.check_out)} />
                              <CardField
                                label="Markup"
                                value={`${row.markup.toFixed(1)}%`}
                                className={row.markup >= 0 ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}
                              />
                              <CardField label="Noches" value={String(row.noches || "—")} />
                            </div>

                            {(row.banco || row.cuenta || row.titular_cuenta) && (
                              <div className="mt-2 px-2 py-1.5 bg-slate-100 rounded-md">
                                <p className="text-[10px] text-slate-500 mb-0.5">Datos bancarios</p>
                                {row.banco && (
                                  <p className="text-[10px] font-semibold text-slate-500 uppercase">{row.banco}</p>
                                )}
                                {row.cuenta && (
                                  <p className="text-xs font-mono text-slate-800">{row.cuenta}</p>
                                )}
                                {row.titular_cuenta && (
                                  <p className="text-[10px] text-slate-500">{row.titular_cuenta}</p>
                                )}
                              </div>
                            )}

                            {row.caratula && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => setCaratulaUrl(row.caratula)}
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  Ver carátula
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-slate-400 text-right">
              {filteredRows.length} registro
              {filteredRows.length !== 1 ? "s" : ""}
              {search ? ` (filtrados de ${rows.length})` : ""}
            </p>
          </>
        )}
      </div>

      {/* Modal subir comprobante — solo DISPERSION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <OtrosMetodosPagoModal
            selectedSolicitudes={selectedSolicitudes}
            onlyComprobante
            onClose={() => setShowModal(false)}
            onSubmit={async () => {
              setShowModal(false);
              setSelectedMap({});
              await fetchData(limite);
            }}
          />
        </div>
      )}

      {/* Modal detalle — solo PAGADO TRANSFERENCIA */}
      {detalleId !== null && (
        <ModalDetalle
          id_solicitud_proveedor={detalleId}
          onClose={() => setDetalleId(null)}
        />
      )}

      {/* Modal carátula */}
      {caratulaUrl && (
        <CaratulaModal url={caratulaUrl} onClose={() => setCaratulaUrl(null)} />
      )}

      {/* Modal revisión pendiente */}
      {revisionRow && (
        <RevisionPendienteModal
          row={revisionRow}
          onClose={() => setRevisionRow(null)}
        />
      )}

      {/* Modal confirmación dispersión mixta */}
      {pendingAction && (
        <ConfirmDispersionModal
          currentGroup={pendingAction.currentGroup}
          newGroup={pendingAction.newGroup}
          currentCount={Object.keys(selectedMap).length}
          addCount={pendingAction.type === "row" ? 1 : pendingAction.groupRows.length}
          onConfirm={confirmPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
        active
          ? "border-blue-600 text-blue-700 bg-blue-50"
          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={`px-3 py-3 font-semibold text-slate-600 whitespace-nowrap text-${align}`}
    >
      {children}
    </th>
  );
}

function CardField({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-xs text-slate-800 truncate ${bold ? "font-semibold" : ""} ${className ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function RevisionPendienteModal({ row, onClose }: { row: SolicitudRow; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Revisión pendiente</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Proveedor</p>
            <p className="text-sm font-semibold text-slate-800">{row.proveedor || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">ID Solicitud</p>
              <p className="text-sm font-mono text-slate-700">{row.id_solicitud_proveedor}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cód. confirmación</p>
              <p className="text-sm font-mono text-slate-700">{row.codigo_confirmacion}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Banco</p>
              <p className="text-sm text-slate-700">{row.banco || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Cuenta</p>
              <p className="text-sm font-mono text-slate-700">{row.cuenta || "—"}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            La cuenta bancaria de este proveedor requiere revisión. Verifica la información antes de realizar el pago.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
          <Link
            href="/dashboard/pagos_proveedor/informacion_de_la_cuenta"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
          >
            Ver información de cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}

function ConfirmDispersionModal({
  currentGroup,
  newGroup,
  currentCount,
  addCount,
  onConfirm,
  onCancel,
}: {
  currentGroup: string;
  newGroup: string;
  currentCount: number;
  addCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const fmt = (code: string) =>
    code === "__sin_codigo__" ? "Sin código" : code;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 bg-amber-50 flex items-center gap-2">
          <span className="text-amber-500 text-lg">⚠</span>
          <span className="text-sm font-semibold text-amber-800">
            Dispersión diferente
          </span>
        </div>

        <div className="px-5 py-4 space-y-3 text-sm text-slate-700">
          <p>
            Ya tienes{" "}
            <span className="font-semibold">
              {currentCount} solicitud{currentCount !== 1 ? "es" : ""}
            </span>{" "}
            seleccionadas de la dispersión{" "}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {fmt(currentGroup)}
            </span>
            .
          </p>
          <p>
            ¿Deseas agregar{" "}
            <span className="font-semibold">
              {addCount} solicitud{addCount !== 1 ? "es" : ""}
            </span>{" "}
            de la dispersión{" "}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
              {fmt(newGroup)}
            </span>{" "}
            a tu selección actual?
          </p>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function CaratulaModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-semibold text-slate-700">Carátula bancaria</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 w-10 text-center">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 3}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="overflow-auto flex-1 bg-slate-100 flex items-center justify-center p-4">
          <img
            src={url}
            alt="Carátula bancaria"
            style={{ transform: `scale(${scale})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
            className="max-w-full rounded shadow"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 flex justify-end">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Abrir en nueva pestaña
          </a>
        </div>
      </div>
    </div>
  );
}
