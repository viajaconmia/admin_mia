"use client";

import React, { useState } from "react";
import { MapPin, X, ChevronLeft, Building2 } from "lucide-react";
import {
  AgentesService,
  EstadoResumen,
  HotelFicha,
  ReservaCiudadZona,
} from "@/services/AgentesService";
import { Loader } from "@/components/atom/Loader";

interface Props {
  id_agente: string;
  estados: EstadoResumen[];
}

export function DestinosSection({ id_agente, estados }: Props) {
  const [loadingEstado, setLoadingEstado] = useState<string | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);
  const [ciudades, setCiudades] = useState<ReservaCiudadZona[]>([]);

  const [loadingCiudad, setLoadingCiudad] = useState<string | null>(null);
  const [selectedCiudad, setSelectedCiudad] = useState<string | null>(null);
  const [hoteles, setHoteles] = useState<HotelFicha[]>([]);

  const handleEstadoClick = (estado: string) => {
    setLoadingEstado(estado);
    AgentesService.getInstance()
      .getReservasCiudadZona(id_agente, estado)
      .then((res) => {
        if (res.data) {
          setCiudades(res.data);
          setSelectedEstado(estado);
          setSelectedCiudad(null);
          setHoteles([]);
        }
      })
      .finally(() => setLoadingEstado(null));
  };

  const handleCiudadClick = (ciudad_zona: string) => {
    if (!selectedEstado) return;
    setLoadingCiudad(ciudad_zona);
    AgentesService.getInstance()
      .getHotelesCiudadZona(id_agente, selectedEstado, ciudad_zona)
      .then((res) => {
        if (res.data) {
          setHoteles(res.data);
          setSelectedCiudad(ciudad_zona);
        }
      })
      .finally(() => setLoadingCiudad(null));
  };

  const handleClose = () => {
    setSelectedEstado(null);
    setSelectedCiudad(null);
    setHoteles([]);
    setCiudades([]);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {estados.map((e) => {
          const isLoading = loadingEstado === e.estado;
          return (
            <button
              key={e.estado}
              onClick={() => handleEstadoClick(e.estado)}
              disabled={loadingEstado !== null}
              className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 flex items-center gap-3 text-left hover:bg-sky-100 hover:border-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader />
              ) : (
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sky-900 truncate">
                  {e.estado.charAt(0) + e.estado.slice(1).toLowerCase()}
                </p>
              </div>
              <div className="flex flex-col items-end text-xs text-sky-700 shrink-0">
                <span>
                  <span className="font-bold text-sky-900">
                    {e.total_reservas}
                  </span>{" "}
                  Reservas.
                </span>
                <span>
                  <span className="font-bold text-sky-900">
                    {e.total_noches}
                  </span>{" "}
                  Nts.
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedEstado && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={handleClose}
          />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[560px] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                {selectedCiudad && (
                  <button
                    onClick={() => {
                      setSelectedCiudad(null);
                      setHoteles([]);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-sky-900 flex items-center gap-2 truncate">
                    {selectedCiudad ? (
                      <>
                        <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                        {selectedCiudad.charAt(0) +
                          selectedCiudad.slice(1).toLowerCase()}
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                        {selectedEstado.charAt(0) +
                          selectedEstado.slice(1).toLowerCase()}
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedCiudad
                      ? "Hoteles"
                      : "Ciudades y zonas — da click para ver hoteles"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
              {selectedCiudad
                ? // Lista de hoteles
                  hoteles.map((h) => (
                    <div
                      key={h.id_hotel}
                      className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center gap-3"
                    >
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="flex-1 text-sm font-medium text-slate-800 truncate">
                        {h.hotel.charAt(0) + h.hotel.slice(1).toLowerCase()}
                      </p>
                      <div className="flex gap-4 text-xs text-slate-500 shrink-0">
                        <span>
                          <span className="font-bold text-slate-700">
                            {h.total_reservas}
                          </span>{" "}
                          Reservas.
                        </span>
                        <span>
                          <span className="font-bold text-slate-700">
                            {h.total_noches}
                          </span>{" "}
                          Nts.
                        </span>
                        <span className="font-bold text-emerald-700">
                          $
                          {Number(h.gasto_total).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                : // Lista de ciudades
                  ciudades.map((c) => {
                    const isLoadingCiudad = loadingCiudad === c.ciudad_zona;
                    return (
                      <button
                        key={c.ciudad_zona}
                        onClick={() => handleCiudadClick(c.ciudad_zona)}
                        disabled={loadingCiudad !== null}
                        className="w-full rounded-lg bg-sky-50 border border-sky-100 px-4 py-3 flex items-center gap-3 text-left hover:bg-sky-100 hover:border-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingCiudad ? (
                          <Loader />
                        ) : (
                          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                        )}
                        <p className="flex-1 text-sm font-medium text-sky-900 truncate">
                          {c.ciudad_zona.charAt(0) +
                            c.ciudad_zona.slice(1).toLowerCase()}
                        </p>
                        <div className="flex gap-4 text-xs text-sky-700 shrink-0">
                          <span>
                            <span className="font-bold text-sky-900">
                              {c.total_reservas}
                            </span>{" "}
                            Reservas.
                          </span>
                          <span>
                            <span className="font-bold text-sky-900">
                              {c.total_noches}
                            </span>{" "}
                            Nts.
                          </span>
                        </div>
                      </button>
                    );
                  })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
