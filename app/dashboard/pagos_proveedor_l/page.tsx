"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { URL as API_URL, HEADERS_API } from "@/lib/constants";
import { OtrosMetodosPagoModal } from "@/app/dashboard/pagos_proveedor/Components/OtrosMetodosPagoModal";
import { calcularNoches } from "@/helpers/utils";
import { getIdSolProv, getMontoSolicitado, getProveedorCuentas } from "@/app/dashboard/pagos_proveedor/Components/helpers";
import { ExternalLink, RefreshCw, Upload, X } from "lucide-react";
import { Loader } from "@/components/atom/Loader";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  datos_bancarios: string;
  caratula: string | null;
  estatus: string;
  raw: any;
};

type SolicitudSeleccionada = {
  id_solicitud_proveedor: string;
  monto_solicitado: number;
  monto_pagado: string;
  codigo_confirmacion?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

const getEstatus = (raw: any): string =>
  String(
    raw?.solicitud_proveedor?.estado_solicitud ??
    raw?.estado_solicitud ??
    raw?.estatus_pagos ??
    "—",
  ).toUpperCase();

const getDatosBancarios = (raw: any): string => {
  const cuentas = getProveedorCuentas(raw);
  if (!cuentas.length) return "—";
  const c = cuentas[0] as any;
  const cuenta = c?.cuenta ?? c?.clabe ?? c?.numero_cuenta ?? "";
  const banco = c?.banco ?? c?.banco_emisor ?? "";
  if (!cuenta) return "—";
  return [banco, cuenta].filter(Boolean).join(" · ");
};

const getCaratula = (raw: any): string | null => {
  const pagos: any[] = raw?.pagos ?? raw?.pago_proveedores ?? [];
  if (Array.isArray(pagos)) {
    for (const p of pagos) {
      if (p?.url_pdf) return p.url_pdf;
    }
  }
  return raw?.url_pdf ?? raw?.solicitud_proveedor?.url_pdf ?? null;
};

// ─── Hook fetch ───────────────────────────────────────────────────────────────

function useDispersionSolicitudes() {
  const [rows, setRows] = useState<SolicitudRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limite, setLimite] = useState("100");

  const fetchData = useCallback(async (limiteArg?: string) => {
    setLoading(true);
    setError(null);
    try {
      const lim = limiteArg ?? limite;
      const res = await fetch(
        `${API_URL}/mia/pago_proveedor/solicitud?estado_solicitud=DISPERSION&limite=${lim}`,
        { headers: HEADERS_API, credentials: "include" },
      );
      const json = await res.json();

      // La API puede devolver el array en data.spei, data.dispersion o data directamente
      const rawList: any[] =
        json?.data?.spei ??
        json?.data?.dispersion ??
        json?.data?.todos ??
        (Array.isArray(json?.data) ? json.data : []);

      const mapped: SolicitudRow[] = rawList.map((raw) => {
        const id_solicitud_proveedor = getIdSolProv(raw);
        const monto_solicitado = getMontoSolicitado(raw);
        const costo_proveedor = Number(raw?.costo_total ?? 0);
        const precio_de_venta = Number(raw?.total ?? 0);
        const markup =
          precio_de_venta > 0
            ? ((precio_de_venta - costo_proveedor) / precio_de_venta) * 100
            : 0;

        return {
          id_solicitud_proveedor,
          proveedor: (raw?.hotel ?? "").toUpperCase(),
          codigo_confirmacion: raw?.codigo_confirmacion ?? "—",
          costo_proveedor,
          monto_solicitado,
          cliente: (raw?.nombre_agente_completo ?? "").toUpperCase(),
          precio_de_venta,
          check_in: raw?.check_in ?? null,
          check_out: raw?.check_out ?? null,
          noches: calcularNoches(raw?.check_in, raw?.check_out),
          markup,
          datos_bancarios: getDatosBancarios(raw),
          caratula: getCaratula(raw),
          estatus: getEstatus(raw),
          raw,
        };
      });

      setRows(mapped);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, [limite]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rows, loading, error, fetchData, limite, setLimite };
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ estatus }: { estatus: string }) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";
  const color =
    estatus.includes("DISPERS") ? "bg-blue-50 text-blue-700 border-blue-200" :
    estatus.includes("PAGAD") ? "bg-green-50 text-green-700 border-green-200" :
    estatus.includes("CANCEL") ? "bg-red-50 text-red-700 border-red-200" :
    "bg-slate-50 text-slate-600 border-slate-200";
  return <span className={`${base} ${color}`}>{estatus || "—"}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PagosProveedorL() {
  const { rows, loading, error, fetchData, limite, setLimite } = useDispersionSolicitudes();

  const [selectedMap, setSelectedMap] = useState<Record<string, SolicitudRow>>({});
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.proveedor.includes(q) ||
        r.codigo_confirmacion.toUpperCase().includes(q) ||
        r.cliente.includes(q) ||
        r.id_solicitud_proveedor.includes(q),
    );
  }, [rows, search]);

  const allSelected = filteredRows.length > 0 && filteredRows.every((r) => !!selectedMap[r.id_solicitud_proveedor]);
  const selectedCount = Object.keys(selectedMap).length;

  const toggleRow = (row: SolicitudRow) => {
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

  const toggleAll = () => {
    if (allSelected) {
      setSelectedMap({});
    } else {
      const next: Record<string, SolicitudRow> = {};
      filteredRows.forEach((r) => { next[r.id_solicitud_proveedor] = r; });
      setSelectedMap(next);
    }
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
        <p className="text-xs text-slate-500 mt-0.5">
          Solicitudes en estado DISPERSION
        </p>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 bg-white border-b border-slate-100">
        {/* Búsqueda */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proveedor, folio, cliente…"
          className="flex-1 min-w-[180px] max-w-xs h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
        />

        {/* Límite */}
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
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Cargar</span>
          </button>
        </div>

        {/* Selección info */}
        {selectedCount > 0 && (
          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
            {selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Limpiar selección */}
        {selectedCount > 0 && (
          <button
            onClick={() => setSelectedMap({})}
            className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm hover:bg-rose-100 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}

        {/* Subir comprobante */}
        <button
          onClick={() => setShowModal(true)}
          className="h-9 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 flex items-center gap-1.5 ml-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          Subir comprobante
          {selectedCount > 0 && <span className="font-semibold">({selectedCount})</span>}
        </button>
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
            {search ? "Sin resultados para esa búsqueda." : "No hay solicitudes en estado DISPERSION."}
          </div>
        ) : (
          <>
            {/* ── Tabla desktop ──────────────────────────────────── */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">ID SOL.</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">PROVEEDOR</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">CÓD. CONFIRM.</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-600 whitespace-nowrap">COSTO PROV.</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-600 whitespace-nowrap">MONTO SOL.</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600">CLIENTE</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-600 whitespace-nowrap">PX VENTA</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">CHECK IN</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">CHECK OUT</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-600">MARKUP</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">DATOS BANCARIOS</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600">CARÁTULA</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600">ESTATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => {
                    const selected = !!selectedMap[row.id_solicitud_proveedor];
                    return (
                      <tr
                        key={row.id_solicitud_proveedor}
                        className={`transition-colors ${selected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleRow(row)}
                            className="h-4 w-4 accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                          {row.id_solicitud_proveedor}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800 max-w-[160px] truncate" title={row.proveedor}>
                          {row.proveedor || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                          {row.codigo_confirmacion}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">
                          {fmt(row.costo_proveedor)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {fmt(row.monto_solicitado)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-[160px] truncate" title={row.cliente}>
                          {row.cliente || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">
                          {fmt(row.precio_de_venta)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                          {fmtDate(row.check_in)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">
                          {fmtDate(row.check_out)}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${row.markup <= 0 ? "text-green-700" : "text-amber-700"}`}>
                          {row.markup.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[180px]">
                          <span className="block truncate font-mono text-[11px]" title={row.datos_bancarios}>
                            {row.datos_bancarios}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {row.caratula ? (
                            <a
                              href={row.caratula}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge estatus={row.estatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Cards mobile / tablet ───────────────────────────── */}
            <div className="lg:hidden space-y-3">
              {/* Select all mobile */}
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs text-slate-500">Seleccionar todo</span>
              </div>

              {filteredRows.map((row) => {
                const selected = !!selectedMap[row.id_solicitud_proveedor];
                return (
                  <div
                    key={row.id_solicitud_proveedor}
                    className={`rounded-xl border shadow-sm p-4 transition-colors ${
                      selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(row)}
                        className="h-4 w-4 accent-blue-600 cursor-pointer mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {row.proveedor || "—"}
                          </p>
                          <StatusBadge estatus={row.estatus} />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          #{row.id_solicitud_proveedor}
                          {row.codigo_confirmacion !== "—" && (
                            <span className="ml-2 text-slate-400">· {row.codigo_confirmacion}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <CardField label="Cliente" value={row.cliente || "—"} />
                      <CardField label="Costo prov." value={fmt(row.costo_proveedor)} />
                      <CardField label="Monto sol." value={fmt(row.monto_solicitado)} bold />
                      <CardField label="Px venta" value={fmt(row.precio_de_venta)} />
                      <CardField
                        label="Check in"
                        value={fmtDate(row.check_in)}
                      />
                      <CardField
                        label="Check out"
                        value={fmtDate(row.check_out)}
                      />
                      <CardField
                        label="Markup"
                        value={`${row.markup.toFixed(1)}%`}
                        className={row.markup <= 0 ? "text-green-700 font-semibold" : "text-amber-700 font-semibold"}
                      />
                      <CardField label="Noches" value={String(row.noches || "—")} />
                    </div>

                    {/* Datos bancarios */}
                    {row.datos_bancarios !== "—" && (
                      <div className="mt-2 px-2 py-1.5 bg-slate-100 rounded-md">
                        <p className="text-[10px] text-slate-500 mb-0.5">Datos bancarios</p>
                        <p className="text-xs font-mono text-slate-700 break-all">{row.datos_bancarios}</p>
                      </div>
                    )}

                    {/* Carátula */}
                    {row.caratula && (
                      <div className="mt-2">
                        <a
                          href={row.caratula}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver carátula
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer count */}
            <p className="mt-3 text-xs text-slate-400 text-right">
              {filteredRows.length} registro{filteredRows.length !== 1 ? "s" : ""}
              {search ? ` (filtrados de ${rows.length})` : ""}
            </p>
          </>
        )}
      </div>

      {/* Modal subir comprobante no dispersado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <OtrosMetodosPagoModal
            selectedSolicitudes={selectedSolicitudes}
            onClose={() => setShowModal(false)}
            onSubmit={async () => {
              setShowModal(false);
              setSelectedMap({});
              await fetchData(limite);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Card field helper ────────────────────────────────────────────────────────

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
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xs text-slate-800 truncate ${bold ? "font-semibold" : ""} ${className ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
