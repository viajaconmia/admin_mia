import React from "react";
import { Plane, ArrowRight, Briefcase, Ticket } from "lucide-react";
import Button from "@/components/atom/Button";

/* ─────────────────────────────
   Helpers / Types
────────────────────────────── */

const asArray = <T,>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

type VueloSegmento = {
  index: number;
  airline?: string;
  flightNumber?: string;
  originAirportCode?: string;
  originCity?: string;
  departureTime?: string;
  destinationAirportCode?: string;
  destinationCity?: string;
  arrivalTime?: string;
};

export type CrearReservaVueloPayload = {
  // Datos raíz (si existen en tu objeto)
  id_solicitud?: string;
  estado_solicitud?: string;
  total_solicitud?: number;
  quien_reservo?: string;

  // Datos generales del item
  itineraryType?: string;
  baggagePieces?: number | null;
  url?: string | null;

  // Pasajero principal
  pasajero?: {
    nombre_completo?: string;
    correo?: string;
  };

  // TODOS los segmentos del itinerario
  vuelos: VueloSegmento[];

  // Opcional: el objeto crudo completo para debug/compatibilidad
  raw?: any;
};

type VueloCardProps = {
  vuelo: any;
  onCrearReserva?: (payload: CrearReservaVueloPayload) => void;
};

/* ─────────────────────────────
   Component
────────────────────────────── */

export const VueloCard: React.FC<VueloCardProps> = ({ vuelo, onCrearReserva }) => {
  const rawSegments = vuelo?.objeto_gemini?.item?.item?.segments?.segment;
  const segments = asArray<any>(rawSegments);

  const extra = vuelo?.objeto_gemini?.item?.extra?.viajero || {};
  const itemGeneral = vuelo?.objeto_gemini?.item?.item || {};

  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Normaliza todos los segmentos a un arreglo “limpio” para backend/servicio
  const vuelosNormalizados: VueloSegmento[] = segments.map((seg: any, index: number) => ({
    index,
    airline: seg?.airline,
    flightNumber: seg?.flightNumber,
    originAirportCode: seg?.origin?.airportCode,
    originCity: seg?.origin?.city,
    departureTime: seg?.departureTime,
    destinationAirportCode: seg?.destination?.airportCode,
    destinationCity: seg?.destination?.city,
    arrivalTime: seg?.arrivalTime,
  }));

  const handleCrearReserva = () => {
    const payload: CrearReservaVueloPayload = {
      // Si tu objeto tiene estos campos, perfecto; si no, se van como undefined.
      id_solicitud: vuelo?.id_solicitud,
      estado_solicitud: vuelo?.estado_solicitud,
      total_solicitud: Number(vuelo?.total_solicitud ?? 0),
      quien_reservo: vuelo?.quien_reservó,

      itineraryType: itemGeneral?.itineraryType,
      baggagePieces: itemGeneral?.baggage?.pieces ?? null,
      url: itemGeneral?.url ?? null,

      pasajero: {
        nombre_completo: extra?.nombre_completo,
        correo: extra?.correo,
      },

      vuelos: vuelosNormalizados,
      raw: vuelo, // quítalo si no lo necesitas
    };

    console.log("[VUELO] payload =>", payload);
    onCrearReserva?.(payload);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden my-6 font-sans">
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Plane size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Tipo de Viaje
            </p>
            <p className="text-sm font-semibold">
              {itemGeneral?.itineraryType === "round_trip" ? "Viaje Redondo" : "Vuelo Sencillo"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
            {vuelo?.estado_solicitud ?? "—"}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-8 relative">
          {segments.map((seg: any, index: number) => (
            <div key={index} className="relative">
              {index < segments.length - 1 && (
                <div className="absolute left-4 top-14 bottom-[-32px] w-0.5 border-l-2 border-dashed border-gray-200" />
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-2xl font-black text-slate-800">
                    {seg?.origin?.airportCode ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 font-medium truncate w-40">
                    {seg?.origin?.city ?? "—"}
                  </p>
                  <p className="text-[10px] text-blue-600 font-bold mt-1">
                    {formatDate(seg?.departureTime)}
                  </p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <p className="text-[10px] font-bold text-gray-400 mb-1">
                    {seg?.flightNumber ?? "—"}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-[2px] w-8 bg-gray-200" />
                    <Plane size={16} className="text-gray-300 rotate-90" />
                    <div className="h-[2px] w-8 bg-gray-200" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 mt-1">
                    {seg?.airline ?? "—"}
                  </p>
                </div>

                <div className="flex-1 md:text-right">
                  <p className="text-2xl font-black text-slate-800">
                    {seg?.destination?.airportCode ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 font-medium truncate w-40 md:ml-auto">
                    {seg?.destination?.city ?? "—"}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-bold mt-1">
                    {formatDate(seg?.arrivalTime)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                Pasajero Principal
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {extra?.nombre_completo ?? "—"}
              </p>
              <p className="text-[10px] text-gray-500">{extra?.correo ?? "—"}</p>
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase size={14} />
                <span className="text-xs">
                  Equipaje: {itemGeneral?.baggage?.pieces ?? "—"} pza(s)
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Ticket size={14} />
                <span className="text-xs text-indigo-600 font-medium">Clase: No especificada</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
              <p className="text-2xl font-black text-slate-900">
                {formatter.format(Number(vuelo?.total_solicitud ?? 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center gap-3">
        <p className="text-[10px] text-gray-400 font-medium">
          Creado por: {vuelo?.quien_reservó ?? "—"}
        </p>

        <div className="flex items-center gap-2">
          <Button size="sm" icon={Plane} onClick={handleCrearReserva}>
            Crear reserva
          </Button>

          <a
            href={itemGeneral?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            Ver en buscador <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};
