// app/dashboard/saldo-a-favor/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import { Search, Filter, X, RefreshCw, Ban , CheckCircle} from "lucide-react";
import Button from "@/components/atom/Button";

type AnyRow = Record<string, any>;
type EstadoSaldo = "pending" | "applied" | "cancelled" | "";
type FormaPago = "SPEI" | "LINK" | "TRANSFERENCIA" | "";

function formatDateSimple(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTimeSimple(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(n: any) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `$${num.toFixed(2)}`;
}

function truncateText(v: any, max = 28) {
  const s = String(v ?? "").trim();
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function getRowKey(raw: any, index: number) {
  const id = raw?.id_saldo ?? raw?.row_id ?? null;
  return id != null ? String(id) : String(index);
}

/**
 * Transformación: raw (SP) -> row para Table5
 */
function toSaldoFavorRow(raw: any, index: number): AnyRow {
  const row_id = getRowKey(raw, index);

  const estado: EstadoSaldo = String(raw?.estado ?? "").toLowerCase() as any;
  const forma_pago: FormaPago = String(raw?.forma_pago ?? "").toUpperCase() as any;

  return {
    row_id,

    // saldos.*
    id_saldo: raw?.id_saldo ?? null,
    id_proveedor: raw?.id_proveedor ?? null,
    monto: Number(raw?.monto ?? 0) || 0,
    restante: Number(raw?.restante ?? 0) || 0,
    forma_pago,
    fecha_procesamiento: raw?.fecha_procesamiento ?? null,
    referencia: raw?.referencia ?? "",
    id_hospedaje: raw?.id_hospedaje ?? null,
    transaction_id: raw?.transaction_id ?? null,
    fecha_generado: raw?.fecha_generado ?? null,
    motivo: raw?.motivo ?? "",
    comentarios: raw?.comentarios ?? "",
    estado,
    id_solicitud: raw?.id_solicitud ?? null,
    update_at: raw?.update_at ?? null,

    // solicitudes_pago_proveedor (join)
    fecha_solicitud: raw?.fecha_solicitud ?? null,
    monto_solicitado: Number(raw?.monto_solicitado_solicitud ?? 0) || 0,
    estatus_pagos: raw?.estatus_pagos ?? "",
    comentario_CXP: raw?.comentario_CXP ?? "",

    // proveedores (join)
    proveedor_id: raw?.proveedor_id ?? null,
    proveedor: raw?.proveedor ?? "",
    type: raw?.type ?? "",
    convenio: Number(raw?.convenio ?? 0) || 0,
    negociacion: raw?.negociacion ?? "",
    estatus_proveedor: Number(raw?.estatus_proveedor ?? 0) || 0,
    internacional: Number(raw?.internacional ?? 0) || 0,
    estado_proveedor: raw?.estado_proveedor ?? "",
    ciudad: raw?.ciudad ?? "",
    pais: raw?.pais ?? "",
    codigo_postal: raw?.codigo_postal ?? "",

    acciones: "",
    __raw: raw,

    item:raw,
  };
}

export default function SaldoAFavorProveedoresPage() {
  const endpoint = `${URL}/mia/pago_proveedor/saldo_a_favor`;
  const changeStatusEndpoint = `${URL}/mia/pago_proveedor/cambio_de_estatus`;
 
  const [isLoading, setIsLoading] = useState(false);
  const [todos, setTodos] = useState<any[]>([]);

  // UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // filtros
  const [idProveedorFiltro, setIdProveedorFiltro] = useState<string>(""); // se manda al back (opcional)
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSaldo>("");
  const [formaPagoFiltro, setFormaPagoFiltro] = useState<FormaPago>("");
  

  const load = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);

    try {
      const url = idProveedorFiltro?.trim()
        ? `${endpoint}?id_proveedor=${encodeURIComponent(idProveedorFiltro.trim())}`
        : endpoint;

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const json = await response.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      setTodos(list);
    } catch (err) {
      console.error("Error cargando saldo a favor:", err);
      setTodos([]);
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [endpoint, idProveedorFiltro]);

  useEffect(() => {
    load();
  }, [load]);

  // ✅ Solo cancelar 1x1 + VALIDACIÓN: solo si estado=pending
  const cancelarSaldo = useCallback(
    async (id_saldo: string) => {
      const resp = await fetch(changeStatusEndpoint, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({ id_saldo, estado: "cancelled" }),
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.message || `Error HTTP: ${resp.status}`);
      return true;
    },
    [changeStatusEndpoint]
  );

    const aprobar_saldo = useCallback(
    async (id_saldo: string) => {
      const resp = await fetch(changeStatusEndpoint, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify({ id_saldo, estado: "approved" }),
      });

      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.message || `Error HTTP: ${resp.status}`);
      return true;
    },
    [changeStatusEndpoint]
  );


  const filteredData = useMemo(() => {
    const q = (searchTerm || "").toUpperCase().trim();

    const base = todos
      .filter((raw) => {
        if (estadoFiltro) {
          const e = String(raw?.estado ?? "").toLowerCase();
          if (e !== estadoFiltro) return false;
        }
        if (formaPagoFiltro) {
          const fp = String(raw?.forma_pago ?? "").toUpperCase();
          if (fp !== formaPagoFiltro) return false;
        }
        return true;
      })
      .filter((raw) => {
        if (!q) return true;
        const prov = String(raw?.proveedor ?? "").toUpperCase();
        const ref = String(raw?.referencia ?? "").toUpperCase();
        const id = String(raw?.id_saldo ?? "").toUpperCase();
        const sol = String(raw?.id_solicitud ?? "").toUpperCase();
        return prov.includes(q) || ref.includes(q) || id.includes(q) || sol.includes(q);
      });

    return base.map((raw, i) => toSaldoFavorRow(raw, i));
  }, [todos, searchTerm, estadoFiltro, formaPagoFiltro]);

  const totals = useMemo(() => {
    let restante = 0;
    let pending = 0;
    for (const r of filteredData) {
      restante += Number(r?.restante ?? 0) || 0;
      if (String(r?.estado ?? "").toLowerCase() === "pending") pending += 1;
    }
    return { restante, pending, count: filteredData.length };
  }, [filteredData]);

  const customColumns = useMemo(
    () => [
      "id_saldo",
      "proveedor",
      "type",
      "restante",
      "monto",
      "forma_pago",
      "fecha_procesamiento",
      "referencia",
      "estado",
      "fecha_solicitud",
      "id_solicitud",
      "estatus_pagos",
      "comentario_CXP",
      "acciones", // ✅ solo Cancelar (pending)
    ],
    []
  );

  const tableRenderers = useMemo<
    Record<string, React.FC<{ value: any; item: AnyRow; index: number }>>
  >(
    () => ({
      proveedor: ({ value, item }) => {
        const v = String(value ?? "").trim();
        const t = String(item?.type ?? "").trim();
        return (
          <div className="min-w-[220px]">
            <div className="font-semibold text-xs">{v ? v.toUpperCase() : "—"}</div>
            <div className="text-[11px] text-gray-500">
              {t ? t.toUpperCase() : "—"} · CP {String(item?.codigo_postal ?? "—")}
            </div>
          </div>
        );
      },

      referencia: ({ value }) => (
        <span className="text-xs" title={String(value ?? "")}>
          {truncateText(value, 34)}
        </span>
      ),

      fecha_procesamiento: ({ value }) => <span title={value}>{formatDateTimeSimple(value)}</span>,
      fecha_solicitud: ({ value }) => <span title={value}>{formatDateSimple(value)}</span>,

      restante: ({ value }) => <span title={String(value)}>{formatMoney(value)}</span>,
      monto: ({ value }) => <span title={String(value)}>{formatMoney(value)}</span>,

      estado: ({ value }) => {
        const v = String(value ?? "").toLowerCase();
        const cls =
          v === "applied"
            ? "bg-green-50 text-green-700 border-green-200"
            : v === "cancelled"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-amber-50 text-amber-700 border-amber-200";

        return (
          <span className={`text-xs font-semibold border px-2 py-1 rounded-full ${cls}`}>
            {String(value ?? "—").toUpperCase()}
          </span>
        );
      },

      comentario_CXP: ({ value }) => (
        <span className="text-xs" title={String(value ?? "")}>
          {truncateText(value, 30)}
        </span>
      ),

      // ✅ SOLO cancelar 1x1, y SOLO cuando estado=pending
      acciones: ({ value,item }) => {
          const id = String(item?.id_saldo ?? "").trim();
          const estadoSaldo = item?.estado;
          
          const canCancel = !!id && estadoSaldo === "pending"; // ✅ pending = sí cancela
          console.log("Render acciones para item:",item,"vkrnmvirnv",estadoSaldo, "canCancel?", canCancel,id);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!canCancel}
        aria-disabled={!canCancel}
        className={[
          "px-2 py-1 text-xs border rounded-md inline-flex items-center gap-1",
          canCancel
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-gray-200 bg-gray-100 text-gray-400",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        ].join(" ")}
        onClick={async () => {
          if (!canCancel) return; // ✅ guard por si tu UI no respeta disabled
          const ok = confirm(`¿Aprobar saldo ${id}? (estado=approved)`);
          if (!ok) return;

          try {
            await cancelarSaldo(id);
            await load();
          } catch (e: any) {
            alert(e?.message || "Error cancelando saldo");
          }
        }}
        title={canCancel ? "Cancelar saldo (solo pending)" : "No se puede cancelar: solo estado pending"}
      >
        <Ban className="w-4 h-4" />
        Cancelar
      </button>


      <button
        type="button"
        disabled={!canCancel}
        aria-disabled={!canCancel}
        className={[
          "px-2 py-1 text-xs border rounded-md inline-flex items-center gap-1",
          canCancel
            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            : "border-gray-200 bg-gray-100 text-gray-400",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        ].join(" ")}
        onClick={async () => {
          if (!canCancel) return; // ✅ guard por si tu UI no respeta disabled
          const ok = confirm(`aprobar saldo ${id}? (estado=aprobado)`);
          if (!ok) return;

          try {
            await aprobar_saldo(id);
            await load();
          } catch (e: any) {
            alert(e?.message || "Error aprobando saldo");
          }
        }}
        title={canCancel ? "aprobar saldo (solo pending)" : "No se puede aprobar: solo estado pending"}
      >
        <Ban className="w-4 h-4" />
        aprobar
      </button>
    </div>
  );
},
    }),
    [cancelarSaldo, load, aprobar_saldo]
  );

  const defaultSort = useMemo(() => ({ key: "fecha_procesamiento", sort: false }), []);

  

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">Saldo a favor · Proveedores</div>
              <div className="text-xs text-gray-500">
                Registros: <span className="font-semibold">{totals.count}</span> · Pending:{" "}
                <span className="font-semibold">{totals.pending}</span> · Restante:{" "}
                <span className="font-semibold">{formatMoney(totals.restante)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={() => void load()}
              >
                <RefreshCw className="w-4 h-4" />
                Recargar
              </Button>

              <Button
                variant="secondary"
                size="md"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                onClick={() => setFiltersOpen((s) => !s)}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por proveedor, referencia, id_saldo, id_solicitud..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <Button
              variant="secondary"
              size="md"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              onClick={() => setSearchTerm("")}
            >
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          </div>

          {/* Filters */}
          {filtersOpen && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    id_proveedor (se envía al backend)
                  </label>
                  <input
                    value={idProveedorFiltro}
                    onChange={(e) => setIdProveedorFiltro(e.target.value)}
                    placeholder="Ej. 4138 (opcional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado (cliente)</label>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Todos</option>
                    <option value="pending">PENDING</option>
                    <option value="applied">APPLIED</option>
                    <option value="cancelled">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Forma de pago (cliente)</label>
                  <select
                    value={formaPagoFiltro}
                    onChange={(e) => setFormaPagoFiltro(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Todas</option>
                    <option value="SPEI">SPEI</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    <option value="LINK">LINK</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                    onClick={() => {
                      setIdProveedorFiltro("");
                      setEstadoFiltro("");
                      setFormaPagoFiltro("");
                      setSearchTerm("");
                      void load();
                    }}
                  >
                    <X className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
          <Table5<any>
            registros={filteredData as any}
            renderers={tableRenderers}
            defaultSort={defaultSort as any}
            leyenda={`Mostrando ${filteredData.length} registros`}
            customColumns={customColumns}
            fillHeight
            maxHeight="calc(100vh - 260px)"
          />
        </div>

        {isLoading && <div className="text-sm text-gray-500 px-2">Cargando información...</div>}
      </div>
    </div>
  );
}