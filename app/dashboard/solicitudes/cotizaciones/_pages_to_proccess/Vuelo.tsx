import React from "react";
import {
  Plane,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Briefcase,
  Ticket,
} from "lucide-react";

export const VueloCard = ({ vuelo }) => {
  // 1. Manejo de la inconsistencia de "segments"
  const rawSegments = vuelo.objeto_gemini?.item?.item?.segments?.segment;

  // Convertimos a array siempre para poder usar .map() sin errores
  const segments = Array.isArray(rawSegments)
    ? rawSegments
    : rawSegments
    ? [rawSegments]
    : [];

  const extra = vuelo.objeto_gemini?.item?.extra?.viajero || {};
  const itemGeneral = vuelo.objeto_gemini?.item?.item || {};

  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden my-6 font-sans">
      {/* Header: Aerolínea y Estatus */}
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
              {itemGeneral.itineraryType === "round_trip"
                ? "Viaje Redondo"
                : "Vuelo Sencillo"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
            {vuelo.estado_solicitud}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Renderizado de Segmentos (Vuelos) */}
        <div className="space-y-8 relative">
          {segments.map((seg, index) => (
            <div key={index} className="relative">
              {/* Línea conectora si hay más de un segmento */}
              {index < segments.length - 1 && (
                <div className="absolute left-4 top-14 bottom-[-32px] w-0.5 border-l-2 border-dashed border-gray-200"></div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Origen */}
                <div className="flex-1">
                  <p className="text-2xl font-black text-slate-800">
                    {seg.origin?.airportCode}
                  </p>
                  <p className="text-xs text-gray-500 font-medium truncate w-40">
                    {seg.origin?.city}
                  </p>
                  <p className="text-[10px] text-blue-600 font-bold mt-1">
                    {formatDate(seg.departureTime)}
                  </p>
                </div>

                {/* Icono Central y Vuelo */}
                <div className="flex flex-col items-center px-4">
                  <p className="text-[10px] font-bold text-gray-400 mb-1">
                    {seg.flightNumber}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-[2px] w-8 bg-gray-200"></div>
                    <Plane size={16} className="text-gray-300 rotate-90" />
                    <div className="h-[2px] w-8 bg-gray-200"></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 mt-1">
                    {seg.airline}
                  </p>
                </div>

                {/* Destino */}
                <div className="flex-1 md:text-right">
                  <p className="text-2xl font-black text-slate-800">
                    {seg.destination?.airportCode}
                  </p>
                  <p className="text-xs text-gray-500 font-medium truncate w-40 md:ml-auto">
                    {seg.destination?.city}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-bold mt-1">
                    {formatDate(seg.arrivalTime)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Pasajero */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <User size={18} className="text-slate-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                Pasajero Principal
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {extra.nombre_completo}
              </p>
              <p className="text-[10px] text-gray-500">{extra.correo}</p>
            </div>
          </div>

          {/* Resumen de Equipaje y Precio */}
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase size={14} />
                <span className="text-xs">
                  Equipaje: {itemGeneral.baggage?.pieces} pza(s)
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Ticket size={14} />
                <span className="text-xs text-indigo-600 font-medium">
                  Clase: No especificada
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">
                Total
              </p>
              <p className="text-2xl font-black text-slate-900">
                {formatter.format(vuelo.total_solicitud || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer del Ticket */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
        <p className="text-[10px] text-gray-400 font-medium">
          Creado por: {vuelo.quien_reservó}
        </p>
        <a
          href={itemGeneral.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver en buscador <ArrowRight size={10} />
        </a>
      </div>
    </div>
  );
};
