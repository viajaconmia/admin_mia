"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Table5 } from "@/components/Table5";
import type { VueloComprado, FlightStatusResponse } from "@/services/flights";
import type { VueloDbRow } from "@/lib/flights";
import { mapVueloRowToComprado } from "@/lib/flights";
import { BoletoPdfDownload } from "./components/BoletoPdf";
import { URL, API_KEY } from "@/lib/constants/index";

type RowState = { loading: boolean; error: string | null; status: FlightStatusResponse | null };

export default function VuelosPage() {
  const [vuelos, setVuelos] = useState<VueloComprado[]>([]);
  const [byId, setById] = useState<Record<string, RowState>>({});

  // ✅ Datos reales del PDF (2 segmentos: ida + regreso)
  useEffect(() => {
    // Ida: GDL -> SJD, Y4 1144, 26/01/2026 10:58, asiento 6C, confirmación MCIEQC
    const rowIda: VueloDbRow = {
      id_vuelo: "pdf-ida-y4-1144",
      airline: "VOLARIS",
      airline_code: "Y4",
      flight_number: "1144",

      departure_airport: "GDL Don Miguel Hidalgo Y Costilla International Airport Guadalajara Jalisco MX",
      arrival_airport: "SJD Los Cabos International Airport San Jose del Cabo Baja California Sur MX",
      departure_date: "2026-01-26",
      departure_time: "10:58:00",
      arrival_date: "2026-01-26",
      arrival_time: "11:30:00",

      departure_city: "Guadalajara, Jalisco",
      arrival_city: "San Jose del Cabo, BCS",

      codigo_confirmacion: "MCIEQC",
      nombre_completo: "HECTOR RENE CONTRERAS HERNANDEZ",
      correo: null,
      apellido_paterno: "CONTRERAS",
      apellido_materno:"HERNANDEZ",

      seat_number: "6C",
      seat_location: null,
    };

    // Regreso: SJD -> GDL, Y4 1143, 30/01/2026 15:36, asiento 6D, confirmación MCIEQC
    const rowRegreso: VueloDbRow = {
      id_vuelo: "pdf-regreso-y4-1143",
      airline: "VOLARIS",
      airline_code: "Y4",
      flight_number: "1143",

      departure_airport: "SJD Los Cabos International Airport San Jose del Cabo Baja California Sur MX",
      arrival_airport: "GDL Don Miguel Hidalgo Y Costilla International Airport Guadalajara Jalisco MX",
      departure_date: "2026-01-30",
      departure_time: "15:36:00",
      arrival_date: "2026-01-30",
      arrival_time: "18:07:00",

      departure_city: "San Jose del Cabo, BCS",
      arrival_city: "Guadalajara, Jalisco",

      codigo_confirmacion: "MCIEQC",
      nombre_completo: "HECTOR RENE CONTRERAS HERNANDEZ",
      correo: null,
      apellido_paterno: "CONTRERAS",
      apellido_materno:"HERNANDEZ",

      seat_number: "6D",
      seat_location: null,
    };

    const mapped = [mapVueloRowToComprado(rowIda), mapVueloRowToComprado(rowRegreso)];
    setVuelos(mapped);

    const init: Record<string, RowState> = {};
    mapped.forEach((v) => (init[v.id] = { loading: false, error: null, status: null }));
    setById(init);
  }, []);

  const setRow = (id: string, patch: Partial<RowState>) => {
    setById((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { loading: false, error: null, status: null }), ...patch },
    }));
  };

  const consultarStatus = async (v: VueloComprado) => {
    setRow(v.id, { loading: true, error: null });

    try {
const resp = await fetch("./vuelos/status", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    airlineCode: v.airlineCode,
    confirmationCode: v.confirmationCode,
    passengerLastName: (v.passengerLastName || "").trim(),
    flightNumber: v.flightNumberRaw ?? null,
    departureDateISO: v.departureDateISO ?? null,
    debug: true,
  }),
});


      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${resp.status}`);
      }

      const data: FlightStatusResponse = await resp.json();
      setRow(v.id, { loading: false, status: data, error: null });
    } catch (e: any) {
      setRow(v.id, { loading: false, error: e?.message ?? "Error al consultar" });
    }
  };

  const registros = useMemo(() => {
    return vuelos.map((v) => {
      const st = byId[v.id]?.status ?? null;
      const loading = byId[v.id]?.loading ?? false;
      const error = byId[v.id]?.error ?? null;

      const flightPretty =
        v.flightNumberRaw
          ? (String(v.flightNumberRaw).toUpperCase().includes(v.airlineCode) ? v.flightNumberRaw : `${v.airlineCode} ${v.flightNumberRaw}`)
          : "—";

      return {
        acciones: { vuelo: v, loading, error, status: st, onClick: () => consultarStatus(v) },
        airline: `${v.airlineName} (${v.airlineCode})`,
        flight: flightPretty,
        fecha: `${v.departureDateISO} ${v.departureTime ?? ""}`.trim(),
        ruta: `${v.originIata ?? "—"} → ${v.destinationIata ?? "—"}`,
        pasajero: v.passengerFullName,
        confirmacion: v.confirmationCode ?? "—",
        status: st?.status ?? "—",
        item: v,
      };
    });
  }, [vuelos, byId]);

  const renderers = {
    acciones: ({ value }: any) => {
      const v: VueloComprado = value.vuelo;
      const st: FlightStatusResponse | null = value.status;
      const loading: boolean = value.loading;
      const error: string | null = value.error;

      return (
        <div className="flex items-center gap-2 justify-center">
          <button
            type="button"
            onClick={value.onClick}
            disabled={loading}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-60"
            title="Consulta estatus y habilita el PDF"
          >
            <Eye size={12} />
            {loading ? "Consultando…" : "Generar cupón PDF"}
          </button>

          <BoletoPdfDownload vuelo={v} status={st} disabled={loading} />

          {error ? <span className="text-[11px] text-red-600" title={error}>Error</span> : null}
        </div>
      );
    },

    flight: ({ value }: any) => (
      <div className="flex justify-center">
        <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded">{value}</span>
      </div>
    ),

    status: ({ value }: any) => (
      <div className="flex justify-center">
        <span className="text-[11px] font-semibold">{value}</span>
      </div>
    ),
  };

  const customColumns = ["acciones", "airline", "flight", "fecha", "ruta", "pasajero", "confirmacion", "status"];

  return (
    <div className="p-6 bg-slate-50 rounded-md">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Vuelos comprados</h1>
        <p className="text-sm text-gray-600">Genera cupón PDF consultando estatus en aerolínea.</p>
      </header>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table5
          registros={registros}
          renderers={renderers}
          customColumns={customColumns}
          exportButton={true}
          maxHeight="calc(100vh - 260px)"
        />
      </div>
    </div>
  );
}
