// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { Eye } from "lucide-react";
// import { Table5 } from "@/components/Table5";
// import type { VueloComprado, FlightStatusResponse } from "@/services/flights";
// import type { VueloDbRow } from "@/lib/flights";
// import { mapVueloRowToComprado } from "@/lib/flights";
// import { BoletoPdfDownload } from "./components/BoletoPdf";
// import { URL, API_KEY } from "@/lib/constants/index";

// // type RowState = { loading: boolean; error: string | null; status: FlightStatusResponse | null };

// // export default function VuelosPage() {
// //   const [vuelos, setVuelos] = useState<VueloComprado[]>([]);
// //   const [byId, setById] = useState<Record<string, RowState>>({});

// //   // ✅ Datos reales del PDF (2 segmentos: ida + regreso)
// //   useEffect(() => {
// //     // Ida: GDL -> SJD, Y4 1144, 26/01/2026 10:58, asiento 6C, confirmación MCIEQC
// //     const rowIda: VueloDbRow = {
// //       id_vuelo: "pdf-ida-y4-1144",
// //       airline: "VOLARIS",
// //       airline_code: "Y4",
// //       flight_number: "1144",

// //       departure_airport: "GDL Don Miguel Hidalgo Y Costilla International Airport Guadalajara Jalisco MX",
// //       arrival_airport: "SJD Los Cabos International Airport San Jose del Cabo Baja California Sur MX",
// //       departure_date: "2026-01-26",
// //       departure_time: "10:58:00",
// //       arrival_date: "2026-01-26",
// //       arrival_time: "11:30:00",

// //       departure_city: "Guadalajara, Jalisco",
// //       arrival_city: "San Jose del Cabo, BCS",

// //       codigo_confirmacion: "MCIEQC",
// //       nombre_completo: "HECTOR RENE CONTRERAS HERNANDEZ",
// //       correo: null,
// //       apellido_paterno: "CONTRERAS",

// //       seat_number: "6C",
// //       seat_location: null,
// //     };

// //     // Regreso: SJD -> GDL, Y4 1143, 30/01/2026 15:36, asiento 6D, confirmación MCIEQC
// //     const rowRegreso: VueloDbRow = {
// //       id_vuelo: "pdf-regreso-y4-1143",
// //       airline: "VOLARIS",
// //       airline_code: "Y4",
// //       flight_number: "1143",

// //       departure_airport: "SJD Los Cabos International Airport San Jose del Cabo Baja California Sur MX",
// //       arrival_airport: "GDL Don Miguel Hidalgo Y Costilla International Airport Guadalajara Jalisco MX",
// //       departure_date: "2026-01-30",
// //       departure_time: "15:36:00",
// //       arrival_date: "2026-01-30",
// //       arrival_time: "18:07:00",

// //       departure_city: "San Jose del Cabo, BCS",
// //       arrival_city: "Guadalajara, Jalisco",

// //       codigo_confirmacion: "MCIEQC",
// //       nombre_completo: "HECTOR RENE CONTRERAS HERNANDEZ",
// //       correo: null,
// //       apellido_paterno: "CONTRERAS",

// //       seat_number: "6D",
// //       seat_location: null,
// //     };

// //     const mapped = [mapVueloRowToComprado(rowIda), mapVueloRowToComprado(rowRegreso)];
// //     setVuelos(mapped);

// //     const init: Record<string, RowState> = {};
// //     mapped.forEach((v) => (init[v.id] = { loading: false, error: null, status: null }));
// //     setById(init);
// //   }, []);

// //   const setRow = (id: string, patch: Partial<RowState>) => {
// //     setById((prev) => ({
// //       ...prev,
// //       [id]: { ...(prev[id] ?? { loading: false, error: null, status: null }), ...patch },
// //     }));
// //   };

// //   const consultarStatus = async (v: VueloComprado) => {
// //     setRow(v.id, { loading: true, error: null });

// //     try {
// //       const resp = await fetch("/dashboard/vuelos/status", {
// //   method: "POST",
// //   headers: { "Content-Type": "application/json" },
// //   body: JSON.stringify({
// //     airlineCode: v.airlineCode,
// //     flightNumber: v.flightNumberRaw,
// //     departureDateISO: v.departureDateISO,
// //     originIata: v.originIata,
// //     destinationIata: v.destinationIata,
// //     confirmationCode: v.confirmationCode,
// //     passengerLastName: v.passengerLastName,
// //   }),
// // });

// //       if (!resp.ok) {
// //         const err = await resp.json().catch(() => ({}));
// //         throw new Error(err?.error || `HTTP ${resp.status}`);
// //       }

// //       const data: FlightStatusResponse = await resp.json();
// //       setRow(v.id, { loading: false, status: data, error: null });
// //     } catch (e: any) {
// //       setRow(v.id, { loading: false, error: e?.message ?? "Error al consultar" });
// //     }
// //   };

// //   const registros = useMemo(() => {
// //     return vuelos.map((v) => {
// //       const st = byId[v.id]?.status ?? null;
// //       const loading = byId[v.id]?.loading ?? false;
// //       const error = byId[v.id]?.error ?? null;

// //       const flightPretty =
// //         v.flightNumberRaw
// //           ? (String(v.flightNumberRaw).toUpperCase().includes(v.airlineCode) ? v.flightNumberRaw : `${v.airlineCode} ${v.flightNumberRaw}`)
// //           : "—";

// //       return {
// //         acciones: { vuelo: v, loading, error, status: st, onClick: () => consultarStatus(v) },
// //         airline: `${v.airlineName} (${v.airlineCode})`,
// //         flight: flightPretty,
// //         fecha: `${v.departureDateISO} ${v.departureTime ?? ""}`.trim(),
// //         ruta: `${v.originIata ?? "—"} → ${v.destinationIata ?? "—"}`,
// //         pasajero: v.passengerFullName,
// //         confirmacion: v.confirmationCode ?? "—",
// //         status: st?.status ?? "—",
// //         item: v,
// //       };
// //     });
// //   }, [vuelos, byId]);

// //   const renderers = {
// //     acciones: ({ value }: any) => {
// //       const v: VueloComprado = value.vuelo;
// //       const st: FlightStatusResponse | null = value.status;
// //       const loading: boolean = value.loading;
// //       const error: string | null = value.error;

// //       return (
// //         <div className="flex items-center gap-2 justify-center">
// //           <button
// //             type="button"
// //             onClick={value.onClick}
// //             disabled={loading}
// //             className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-60"
// //             title="Consulta estatus y habilita el PDF"
// //           >
// //             <Eye size={12} />
// //             {loading ? "Consultando…" : "Generar cupón PDF"}
// //           </button>

// //           <BoletoPdfDownload vuelo={v} status={st} disabled={loading} />

// //           {error ? <span className="text-[11px] text-red-600" title={error}>Error</span> : null}
// //         </div>
// //       );
// //     },

// //     flight: ({ value }: any) => (
// //       <div className="flex justify-center">
// //         <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded">{value}</span>
// //       </div>
// //     ),

// //     status: ({ value }: any) => (
// //       <div className="flex justify-center">
// //         <span className="text-[11px] font-semibold">{value}</span>
// //       </div>
// //     ),
// //   };

// //   const customColumns = ["acciones", "airline", "flight", "fecha", "ruta", "pasajero", "confirmacion", "status"];

// //   return (
// //     <div className="p-6 bg-slate-50 rounded-md">
// //       <header className="mb-6 border-b pb-4">
// //         <h1 className="text-2xl font-bold text-gray-800">Vuelos comprados</h1>
// //         <p className="text-sm text-gray-600">Genera cupón PDF consultando estatus en aerolínea.</p>
// //       </header>

// //       <div className="bg-white border rounded-lg overflow-hidden">
// //         <Table5
// //           registros={registros}
// //           renderers={renderers}
// //           customColumns={customColumns}
// //           exportButton={true}
// //           maxHeight="calc(100vh - 260px)"
// //         />
// //       </div>
// //     </div>
// //   );
// // }

// import { formatDate } from "@/helpers/utils";
// import { useNotification } from "@/context/useNotificacion";
// import Button from "@/components/atom/Button";
// import { Printer, RefreshCwIcon } from "lucide-react";
// import { Table } from "@/component/molecule/Table";
// import { Loader } from "@/components/atom/Loader";
// import { FilterInput } from "@/component/atom/FilterInput";
// import { ViajeAereoConVuelos, VuelosServices } from "@/services/VuelosServices";

// interface TrackingPage {
//   total: number;
//   page: number;
//   total_pages: number;
// }

// const PAGE_SIZE = 50;

// export default function VuelosCuponPage() {
//   const [vuelos, setVuelos] = useState<ViajeAereoConVuelos[]>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [filtros, setFiltros] = useState<{
//     created_inicio?: string;
//     created_fin?: string;
//     viajero?: string;
//     codigo_confirmacion?: string;
//   }>({});
//   const [pageTracking, setPageTraking] = useState<TrackingPage>({
//     total: 0,
//     page: 1,
//     total_pages: 1,
//   });
//   const { showNotification } = useNotification();

//   useEffect(() => {
//     setPageTraking((prev) => ({ ...prev, page: 1 }));
//   }, [filtros]);

//   useEffect(() => {
//     showNotification(
//       "info",
//       "Debes seleccionar primero un filtro y despues presionar el boton de buscar resultados",
//     );
//   }, []);

//   const fetchVuelos = async (page = pageTracking.page) => {
//     setIsLoading(true);
//     try {
//       const resp = await fetch("./vuelos/status", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           airlineCode: v.airlineCode,
//           confirmationCode: v.confirmationCode,
//           passengerLastName: (v.passengerLastName || "").trim(),
//           flightNumber: v.flightNumberRaw ?? null,
//           departureDateISO: v.departureDateISO ?? null,
//           debug: true,
//         }),
//       });

//       if (!resp.ok) {
//         const err = await resp.json().catch(() => ({}));
//         throw new Error(err?.error || `HTTP ${resp.status}`);
//       }

//       const data: FlightStatusResponse = await resp.json();
//       setRow(v.id, { loading: false, status: data, error: null });
//     } catch (e: any) {
//       setRow(v.id, {
//         loading: false,
//         error: e?.message ?? "Error al consultar",
//       });
//     }
//   };

//   const registros = useMemo(() => {
//     return vuelos.map((v) => {
//       const st = byId[v.id]?.status ?? null;
//       const loading = byId[v.id]?.loading ?? false;
//       const error = byId[v.id]?.error ?? null;

//       const flightPretty = v.flightNumberRaw
//         ? String(v.flightNumberRaw).toUpperCase().includes(v.airlineCode)
//           ? v.flightNumberRaw
//           : `${v.airlineCode} ${v.flightNumberRaw}`
//         : "—";

//       return {
//         acciones: {
//           vuelo: v,
//           loading,
//           error,
//           status: st,
//           onClick: () => consultarStatus(v),
//         },
//         airline: `${v.airlineName} (${v.airlineCode})`,
//         flight: flightPretty,
//         fecha: `${v.departureDateISO} ${v.departureTime ?? ""}`.trim(),
//         ruta: `${v.originIata ?? "—"} → ${v.destinationIata ?? "—"}`,
//         pasajero: v.passengerFullName,
//         confirmacion: v.confirmationCode ?? "—",
//         status: st?.status ?? "—",
//         item: v,
//       };
//     });
//   }, [vuelos, byId]);

//   const renderers: {
//     [key: string]: React.FC<{ value: any; item: any; index: number }>;
//   } = {
//     detalles: ({ value }) => (
//       <>
//         <Button size="sm" icon={Printer} onClick={() => console.log(value)}>
//           Generar
//         </Button>
//       </>
//     ),
//   };

//   const handleFilterChange = (value, propiedad) => {
//     if (value == null) {
//       const newObj = Object.fromEntries(
//         Object.entries({ ...filtros }).filter(([key]) => key != propiedad),
//       );
//       setFiltros(newObj);
//       return;
//     }
//     setFiltros((prev) => ({ ...prev, [propiedad]: value }));
//   };

//   return (
//     <>
//       <div className="bg-white rounded-md shadow-md border p-4 space-y-4">
//         <div className="w-full grid md:grid-cols-4 bg-gray-50 border rounded-md p-4 gap-4">
//           <FilterInput
//             type="text"
//             onChange={handleFilterChange}
//             propiedad="codigo_confirmacion"
//             value={filtros.codigo_confirmacion || null}
//             label="Código de confirmación"
//           />
//           <FilterInput
//             type="text"
//             onChange={handleFilterChange}
//             propiedad="viajero"
//             value={filtros.viajero || null}
//             label="Viajero"
//           />
//           <FilterInput
//             type="date"
//             onChange={handleFilterChange}
//             propiedad="created_inicio"
//             value={filtros.created_inicio || null}
//             label="Fecha de inicio"
//           />
//           <FilterInput
//             type="date"
//             onChange={handleFilterChange}
//             propiedad="created_fin"
//             value={filtros.created_fin || null}
//             label="Fecha de fin"
//           />
//         </div>

//         <div className="overflow-hidden">
//           <div className="flex gap-2 w-full justify-end">
//             <Button
//               onClick={() => fetchVuelos()}
//               disabled={isLoading}
//               size="sm"
//               icon={RefreshCwIcon}
//             >
//               {isLoading
//                 ? "Cargando..."
//                 : !vuelos
//                   ? "Buscar resultados"
//                   : "Refrescar"}
//             </Button>
//           </div>
//           <div className="pt-4">
//             {isLoading ? (
//               <div className="flex justify-center items-center h-56">
//                 <Loader></Loader>
//               </div>
//             ) : (
//               <>
//                 <Table registros={registros || []} renderers={renderers} />
//               </>
//             )}
//           </div>
//           {vuelos && (
//             <div className="flex flex-col items-center gap-2 w-full">
//               <div className="flex gap-3 items-end relative px-3">
//                 {pageTracking.page > 1 && (
//                   <div className="absolute top-0 right-full flex items-end  gap-3">
//                     <Button
//                       size="sm"
//                       variant="secondary"
//                       onClick={() => {
//                         setPageTraking((prev) => ({
//                           ...prev,
//                           page: prev.page - 1,
//                         }));
//                         fetchVuelos(pageTracking.page - 1);
//                       }}
//                     >
//                       Anterior
//                     </Button>
//                     <span className="text-xs text-gray-400">
//                       {pageTracking.page - 1}
//                     </span>
//                   </div>
//                 )}
//                 {pageTracking.page && (
//                   <Button size="sm" variant="primary">
//                     {pageTracking.page}
//                   </Button>
//                 )}
//                 {pageTracking.page < pageTracking.total_pages && (
//                   <div className="absolute top-0 left-full flex  items-end gap-3">
//                     <span className="text-xs text-gray-400">
//                       {pageTracking.page + 1}
//                     </span>
//                     <Button
//                       size="sm"
//                       variant="secondary"
//                       onClick={() => {
//                         setPageTraking((prev) => ({
//                           ...prev,
//                           page: prev.page + 1,
//                         }));
//                         fetchVuelos(pageTracking.page + 1);
//                       }}
//                     >
//                       Siguiente
//                     </Button>
//                   </div>
//                 )}
//               </div>
//               <p className="text-xs text-gray-500 font-semibold">
//                 {pageTracking.page}/{pageTracking.total_pages}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

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

      const rowRegreso1: VueloDbRow = {
      id_vuelo: "pdf-regreso-y4-1143",
      airline: "VIVAAEROBUS",
      airline_code: "VB",
      flight_number: "1143",

      departure_airport: "SJD Los Cabos International Airport San Jose del Cabo Baja California Sur MX",
      arrival_airport: "GDL Don Miguel Hidalgo Y Costilla International Airport Guadalajara Jalisco MX",
      departure_date: "2026-01-30",
      departure_time: "15:36:00",
      arrival_date: "2026-01-30",
      arrival_time: "18:07:00",

      departure_city: "San Jose del Cabo, BCS",
      arrival_city: "Guadalajara, Jalisco",

      codigo_confirmacion: "IB226P",
      nombre_completo: "Juan Carlos Martinez Gonzalez",
      correo: null,
      apellido_paterno: "MARTINEZ",
      apellido_materno:"GONZALEZ",

      seat_number: "6D",
      seat_location: null,
    };

    const mapped = [mapVueloRowToComprado(rowIda), mapVueloRowToComprado(rowRegreso),mapVueloRowToComprado(rowRegreso1)];
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
const resp = await fetch("/dashboard/vuelos/status", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    airlineCode: v.airlineCode,
    confirmationCode: v.confirmationCode,
    passengerLastName: (v.passengerLastName || "").trim(),
    debug: true,
  }),
});



    const json = await resp.json();
    console.log("LOOKUP:", json);

    if (!resp.ok || !json?.ok) {
      throw new Error(json?.error || `HTTP ${resp.status}`);
    }

    // OJO: tu API responde { ok:true, data:{...} }
    setRow(v.id, { loading: false, status: json.data, error: null });
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
