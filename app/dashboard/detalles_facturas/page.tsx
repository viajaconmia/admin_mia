"use client";

import React, { useMemo, useState } from "react";
import { API_KEY, URL } from "@/lib/constants";
import { Table5 } from "@/components/Table5";
import { Loader } from "@/components/atom/Loader";

type AnyRow = Record<string, any>;

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s || "").trim()
  );

const fmtDateCell = (value: any) => {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  if (!s) return "";

  // Si viene tipo "2026-02-21..." o "2026-02-21 00:00:00", corta YYYY-MM-DD
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];

  // Fallback: intenta parsear y formatear a YYYY-MM-DD
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return s;
};

const isYYYYMMDD = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const money2 = (n: any) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
};

const fmtMoney = (n: any) =>
  money2(n).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtISODate = (s: any) => {
  const str = String(s || "").trim();
  if (!str) return "";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toISOString().slice(0, 10);
};

const TZ = "America/Mexico_City";
const DAY_MS = 24 * 60 * 60 * 1000;

const fmtYYYYMMDD_TZ = (d: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const da = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${da}`;
};

const defaultFechaHasta = () => fmtYYYYMMDD_TZ(new Date());
const defaultFechaDesde = () => fmtYYYYMMDD_TZ(new Date(Date.now() - 7 * DAY_MS));

export default function AgentesReportFacPage() {
  const [idAgente, setIdAgente] = useState<string>(
    "765f610d-b793-407d-8341-7d1fc8a86c37"
  );

  // ✅ NUEVO: rango de fechas (opcionales)
// ✅ NUEVO: rango de fechas (por default últimos 7 días)
const [fechaDesde, setFechaDesde] = useState<string>(() => defaultFechaDesde()); // YYYY-MM-DD
const [fechaHasta, setFechaHasta] = useState<string>(() => defaultFechaHasta()); // YYYY-MM-DD


  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [error, setError] = useState<string>("");

const limpiarFechas = () => {
  setFechaDesde("");
  setFechaHasta("");
};

  const consultar = async () => {
    setError("");

    const id = String(idAgente || "").trim();
    if (!id) {
      setError("Ingresa un id_agente.");
      return;
    }
    if (!isUUID(id)) {
      setError(
        "id_agente inválido. Debe ser UUID (ej. 765f610d-b793-407d-8341-7d1fc8a86c37)."
      );
      return;
    }

    // Normaliza fechas: "" => null
    const fDesde = String(fechaDesde || "").trim() || null;
    const fHasta = String(fechaHasta || "").trim() || null;

    // Validación básica (por si el navegador no respeta type="date")
    if (fDesde && !isYYYYMMDD(fDesde)) {
      setError("Fecha inicio inválida. Usa formato YYYY-MM-DD.");
      return;
    }
    if (fHasta && !isYYYYMMDD(fHasta)) {
      setError("Fecha fin inválida. Usa formato YYYY-MM-DD.");
      return;
    }
    if (fDesde && fHasta && fDesde > fHasta) {
      setError("Rango de fechas inválido: la fecha inicio es mayor que la fecha fin.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Construye query params (si no hay fechas, no las envía)
      const qs = new URLSearchParams();
      qs.set("id_agente", id);
      if (fDesde) qs.set("fecha_desde", fDesde);
      if (fHasta) qs.set("fecha_hasta", fHasta);

      const endpoint = `${URL}/mia/factura/agentes_report_fac?${qs.toString()}`;

      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      console.log(json);
      if (!res.ok) {
        const msg = json?.message || json?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const arr = Array.isArray(json?.data) ? json.data : null;
      if (!arr) {
        throw new Error("Respuesta inválida: no existe data.data (json.data).");
      }

      if (arr?.[0]?.error || arr?.[1]?.error) {
        throw new Error("Error al cargar los datos (SP retornó error).");
      }

      const mapped = arr.map((r: AnyRow) => ({ ...r, item: r }));
      setRows(mapped);
    } catch (e: any) {
      console.log("❌ Error agentes_report_fac:", e);
      setRows([]);
      setError(e?.message || "Error al consultar.");
    } finally {
      setLoading(false);
    }
  };

  const renderers = useMemo(() => {
    return {
      chin: ({ value }: any) => (
        <div className="flex justify-center">
          <span className="text-xs text-gray-600">{fmtISODate(value)}</span>
        </div>
      ),
      chout: ({ value }: any) => (
        <div className="flex justify-center">
          <span className="text-xs text-gray-600">{fmtISODate(value)}</span>
        </div>
      ),
      viajero: ({ value }: any) => (
        <div className="flex justify-center">
          <span className="font-semibold text-xs text-gray-800">{value}</span>
        </div>
      ),
      host: ({ value }: any) => (
        <div className="flex justify-center">
          <span className="font-semibold text-xs text-gray-800">{value}</span>
        </div>
      ),
      tipo_habitacion: ({ value }: any) => (
        <div className="flex justify-center">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
            {value}
          </span>
        </div>
      ),
      noches: ({ value }: any) => (
        <div className="text-right">
          <span className="text-xs font-mono tabular-nums">{value}</span>
        </div>
      ),
      tarifa_por_noche: ({ value }: any) => (
        <div className="text-right">
          <span className="text-xs font-mono tabular-nums font-semibold">
            {fmtMoney(value)}
          </span>
        </div>
      ),
      monto_total_por_estancia: ({ value }: any) => (
        <div className="text-right">
          <span className="text-xs font-mono tabular-nums font-semibold text-indigo-600">
            {fmtMoney(value)}
          </span>
        </div>
      ),
      booking_subtotal: ({ value }: any) => (
        <div className="text-right">
          <span className="text-xs font-mono tabular-nums">{fmtMoney(value)}</span>
        </div>
      ),
      booking_iva: ({ value }: any) => (
        <div className="text-right">
          <span className="text-xs font-mono tabular-nums">{fmtMoney(value)}</span>
        </div>
      ),
      booking_total: ({ value }: any) => (
        <div className="text-right">
          <span className="text-xs font-mono tabular-nums font-bold text-gray-900">
            {fmtMoney(value)}
          </span>
        </div>
      ),
      estado_reserva: ({ value }: any) => {
        let colorClasses = "bg-gray-100 text-gray-800";
        const lower = value?.toLowerCase() || "";
        if (lower.includes("confirmada")) colorClasses = "bg-green-100 text-green-800";
        else if (lower.includes("cancelada")) colorClasses = "bg-red-100 text-red-800";
        else if (lower.includes("pendiente")) colorClasses = "bg-yellow-100 text-yellow-800";
        else if (lower.includes("completada")) colorClasses = "bg-blue-100 text-blue-800";

        return (
          <div className="flex justify-center">
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses}`}>
              {value}
            </span>
          </div>
        );
      },

      // Render reutilizable para cualquier columna de fecha
       fecha_emision: ({ value }: any) => (
        <div className="flex justify-center">
            <span className="text-xs font-mono tabular-nums text-gray-600">
            {fmtDateCell(value)}
            </span>
        </div>
        ),

      folio: ({ value }: any) => (
        <div className="flex justify-center">
          <span className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded">
            {value}
          </span>
        </div>
      ),
      uuid_factura: ({ value }: any) => (
        <div className="flex justify-center">
          <span
            className="font-mono text-[10px] text-gray-500 truncate max-w-[150px]"
            title={value}
          >
            {value}
          </span>
        </div>
      ),
      codigo_confirmacion: ({ value }: any) => (
        <div className="flex justify-center">
          <span className="font-mono text-xs">{value}</span>
        </div>
      ),
    } as any;
  }, []);

  return (
    <div className="w-full p-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs text-gray-600 mb-1">id_agente (UUID)</label>
              <input
                value={idAgente}
                onChange={(e) => setIdAgente(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") consultar();
                }}
                className="h-10 w-full sm:w-[30rem] px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="765f610d-b793-407d-8341-7d1fc8a86c37"
              />
            </div>

            {/* ✅ NUEVO: fechas */}
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs text-gray-600 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-10 w-full sm:w-[12rem] px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs text-gray-600 mb-1">Fecha fin</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-10 w-full sm:w-[12rem] px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              onClick={consultar}
              disabled={loading}
              className="h-10 px-4 rounded-md border border-gray-300 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Consultar
            </button>

            <button
              onClick={limpiarFechas}
              disabled={loading}
              className="h-10 px-4 rounded-md border border-gray-300 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              title="Quita el filtro de fechas"
            >
              Limpiar fechas
            </button>


            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </div>
        </div>

        {loading ? (
          <div className="py-6">
            <Loader />
          </div>
        ) : (
          <Table5
            registros={rows}
            renderers={renderers}
            leyenda={`Registros: ${rows.length}`}
            maxHeight="calc(100vh - 300px)"
            customColumns={[
              "viajero",
              "host",
              "tipo_habitacion",
              "chin",
              "chout",
              "noches",
              "tarifa_por_noche",
              "monto_total_por_estancia",
              "fecha_emision",
              "estado_reserva",
              "codigo_confirmacion",
              "folio",
              "uuid_factura",
              "booking_subtotal",
              "booking_iva",
              "booking_total",
            ]}
            splitStringsBySpace={true}
            splitColumns={["viajero", "host"]}
            exportButton={true}
          />
        )}
      </div>
    </div>
  );
}