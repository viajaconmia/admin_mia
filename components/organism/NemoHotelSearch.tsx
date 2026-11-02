"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Building2,
  Calendar,
  Users,
  MapPin,
  Star,
  Info,
  Loader2,
  DollarSign,
  BedDouble,
  ShieldAlert,
  User,
  Briefcase,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  NemoHotel,
  NemoRate,
  searchNemoHotels,
  SearchNemoHotelsDto,
} from "@/services/nemo";
import { fetchAgentes } from "@/services/agentes";
import { fetchViajerosFromAgent } from "@/services/viajeros";
import { Agente, Viajero } from "@/types";

const POPULAR_DESTINATIONS = [
  { label: "Mar del Plata (Argentina - Test Sandbox)", code: "5718" },
  { label: "Cancún (México)", code: "3690" },
  { label: "Ciudad de México (México)", code: "2757" },
  { label: "Madrid (España)", code: "2262" },
  { label: "Buenos Aires (Argentina)", code: "747" },
  { label: "Miami (EE.UU.)", code: "1340" },
];

export interface SelectedReservationContext {
  cliente: Agente;
  viajero: Viajero | null;
  hotel: NemoHotel;
  rate: NemoRate;
  checkIn: string;
  checkOut: string;
}

export interface NemoHotelSearchProps {
  onSelectReservation?: (context: SelectedReservationContext) => void;
  showSelectButton?: boolean;
}

export function NemoHotelSearch({
  onSelectReservation,
  showSelectButton = true,
}: NemoHotelSearchProps) {
  // CLIENTE STATE
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientResults, setClientResults] = useState<Agente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Agente | null>(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientContainerRef = useRef<HTMLDivElement>(null);

  // VIAJERO STATE
  const [viajeros, setViajeros] = useState<Viajero[]>([]);
  const [selectedViajero, setSelectedViajero] = useState<Viajero | null>(null);
  const [loadingViajeros, setLoadingViajeros] = useState(false);

  // SEARCH PARAMS STATE
  const [destinationId, setDestinationId] = useState("5718");
  const [customDestination, setCustomDestination] = useState("");
  const [useCustomDestination, setUseCustomDestination] = useState(false);
  const [checkIn, setCheckIn] = useState("2026-11-11");
  const [checkOut, setCheckOut] = useState("2026-11-13");
  const [adults, setAdults] = useState(2);

  // RESULTS STATE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<NemoHotel[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<NemoHotel | null>(null);

  // Click outside listener for Client Autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        clientContainerRef.current &&
        !clientContainerRef.current.contains(e.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejador del cambio en búsqueda de cliente
  const handleClientSearchChange = (value: string) => {
    setClientSearchTerm(value);
    if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);

    if (value.trim().length < 2) {
      setClientResults([]);
      setShowClientDropdown(false);
      return;
    }

    clientDebounceRef.current = setTimeout(() => {
      setLoadingClients(true);
      fetchAgentes({ client: value } as any, {} as any, (data) => {
        const term = value.toUpperCase();
        const filtered = (data || [])
          .filter(
            (c) =>
              c.nombre_agente_completo.toUpperCase().includes(term) ||
              c.correo?.toUpperCase().includes(term) ||
              c.id_agente.toUpperCase().replaceAll("-", "").includes(term.replaceAll("-", ""))
          )
          .slice(0, 8);
        setClientResults(filtered);
        setShowClientDropdown(true);
        setLoadingClients(false);
      });
    }, 300);
  };

  // Seleccionar un cliente
  const handleSelectClient = (client: Agente) => {
    setSelectedClient(client);
    setClientSearchTerm(client.nombre_agente_completo);
    setShowClientDropdown(false);
    setSelectedViajero(null);

    // Cargar viajeros asociados a este cliente / agente
    setLoadingViajeros(true);
    fetchViajerosFromAgent(client.id_agente, (data: any) => {
      const list = Array.isArray(data) ? data : data?.data || [];
      setViajeros(list);
      if (list.length > 0) {
        setSelectedViajero(list[0]);
      }
      setLoadingViajeros(false);
    });
  };

  // Limpiar selección de cliente
  const handleClearClient = () => {
    setSelectedClient(null);
    setClientSearchTerm("");
    setViajeros([]);
    setSelectedViajero(null);
  };

  // Buscar en Nemo
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    setHasSearched(true);
    setSelectedHotel(null);

    const activeDestination = useCustomDestination
      ? customDestination.trim()
      : destinationId;

    if (!activeDestination) {
      setError("Por favor ingresa o selecciona un código de destino.");
      setLoading(false);
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Indica fechas de check-in y check-out.");
      setLoading(false);
      return;
    }

    if (checkOut <= checkIn) {
      setError("La fecha de check-out debe ser posterior a la de check-in.");
      setLoading(false);
      return;
    }

    try {
      const searchParams: SearchNemoHotelsDto = {
        destinationId: activeDestination,
        checkIn,
        checkOut,
        rooms: [{ roomSequence: 1, roomType: "NMO.HTL.RMT.DBL" }],
        passengers: Array.from({ length: adults }, () => ({
          ageType: "ADT" as const,
          roomSequence: 1,
        })),
      };

      const result = await searchNemoHotels(searchParams);
      setHotels(result.hotels || []);
      if (result.hotels && result.hotels.length > 0) {
        setSelectedHotel(result.hotels[0]);
      }
    } catch (err: any) {
      console.error("Error al buscar hoteles en Nemo:", err);
      setError(
        err?.message || "Ocurrió un error al consultar el catálogo de Nemo."
      );
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRateSelect = (hotel: NemoHotel, rate: NemoRate) => {
    if (!selectedClient) {
      alert("Por favor selecciona un Cliente antes de elegir la tarifa.");
      return;
    }

    if (onSelectReservation) {
      onSelectReservation({
        cliente: selectedClient,
        viajero: selectedViajero,
        hotel,
        rate,
        checkIn,
        checkOut,
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ============================================================ */}
      {/* SECCIÓN 1: ASIGNACIÓN DE CLIENTE Y VIAJERO */}
      {/* ============================================================ */}
      <Card className="shadow-sm border border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base font-bold text-slate-800">
                1. Asignar Cliente y Viajero
              </CardTitle>
            </div>
            {selectedClient ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Cliente Asignado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500 border-slate-300">
                Requerido para cotizar / reservar
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buscador de Cliente */}
            <div className="space-y-1 relative" ref={clientContainerRef}>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-indigo-600" /> Cliente / Empresa
              </label>

              <div className="relative">
                <Input
                  placeholder="Buscar por nombre, correo o ID..."
                  value={clientSearchTerm}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  onFocus={() => {
                    if (clientResults.length > 0) setShowClientDropdown(true);
                  }}
                  className="h-9 text-sm pr-8"
                />
                {loadingClients ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400 absolute right-2.5 top-2.5" />
                ) : selectedClient ? (
                  <button
                    type="button"
                    onClick={handleClearClient}
                    className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-red-500 font-bold"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {/* Dropdown de Clientes */}
              {showClientDropdown && clientResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                  {clientResults.map((client) => (
                    <div
                      key={client.id_agente}
                      onClick={() => handleSelectClient(client)}
                      className="p-2.5 hover:bg-indigo-50/50 cursor-pointer border-b border-slate-100 last:border-b-0 text-left transition-colors"
                    >
                      <div className="font-semibold text-sm text-slate-800">
                        {client.nombre_agente_completo}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{client.correo || "Sin correo"}</span>
                        <span>·</span>
                        <span>Crédito: {client.tiene_credito_consolidado ? "Sí" : "No"}</span>
                        {client.saldo !== undefined && (
                          <span className="font-medium text-slate-700">
                            (Saldo: ${Number(client.saldo).toLocaleString("es-MX")})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedClient && (
                <div className="mt-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      {selectedClient.nombre_agente_completo}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      ID: {selectedClient.id_agente.slice(0, 10)}...
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {selectedClient.tiene_credito_consolidado ? "Crédito activo" : "Prepago"}
                    </span>
                    {selectedClient.correo && <span>· {selectedClient.correo}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Selector de Viajero */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-indigo-600" /> Viajero Principal
              </label>

              {loadingViajeros ? (
                <div className="h-9 flex items-center gap-2 px-3 text-xs text-slate-500 bg-slate-50 rounded-md border border-slate-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  Cargando viajeros del cliente...
                </div>
              ) : !selectedClient ? (
                <div className="h-9 flex items-center px-3 text-xs text-slate-400 bg-slate-50 rounded-md border border-slate-200">
                  Primero selecciona un cliente arriba
                </div>
              ) : viajeros.length === 0 ? (
                <div className="h-9 flex items-center px-3 text-xs text-amber-700 bg-amber-50 rounded-md border border-amber-200">
                  El cliente no tiene viajeros registrados
                </div>
              ) : (
                <select
                  value={selectedViajero?.id_viajero || ""}
                  onChange={(e) => {
                    const found = viajeros.find((v) => v.id_viajero === e.target.value);
                    setSelectedViajero(found || null);
                  }}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {viajeros.map((v) => (
                    <option key={v.id_viajero} value={v.id_viajero}>
                      {v.nombre_completo || "Viajero sin nombre"}{" "}
                      {v.correo ? `(${v.correo})` : ""}
                    </option>
                  ))}
                </select>
              )}

              {selectedViajero && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Viajero seleccionado: <strong>{selectedViajero.nombre_completo}</strong>
                  {selectedViajero.numero_empleado ? ` · No. Emp: ${selectedViajero.numero_empleado}` : ""}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* SECCIÓN 2: PARÁMETROS DE BÚSQUEDA HOTELERA */}
      {/* ============================================================ */}
      <Card className="shadow-sm border border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base font-bold text-slate-800">
                2. Parámetros de Hospedaje en Nemo
              </CardTitle>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Certificación
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Selector de Destino */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Destino (Nemo ID)
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseCustomDestination(!useCustomDestination)}
                    className="text-[10px] text-indigo-600 hover:underline font-normal"
                  >
                    {useCustomDestination ? "Elegir lista" : "ID manual"}
                  </button>
                </label>

                {useCustomDestination ? (
                  <Input
                    placeholder="Ej. 5718 o 3690"
                    value={customDestination}
                    onChange={(e) => setCustomDestination(e.target.value)}
                    className="h-9 text-sm"
                  />
                ) : (
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {POPULAR_DESTINATIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Check-In */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Entrada (Check-In)
                </label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Check-Out */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Salida (Check-Out)
                </label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Pasajeros / Ocupación */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Pasajeros Adultos
                </label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={1}>1 Adulto</option>
                  <option value={2}>2 Adultos</option>
                  <option value={3}>3 Adultos</option>
                  <option value={4}>4 Adultos</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando en Nemo...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Buscar Hoteles en Nemo
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* MENSAJES DE ERROR */}
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-semibold">Error al consultar Nemo:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* RESULTADO VACÍO */}
      {hasSearched && !loading && !error && hotels.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            No se encontraron hoteles disponibles
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Nemo no reporta disponibilidad para las fechas o destino seleccionados en el ambiente de prueba. Prueba con el destino de prueba <strong>Mar del Plata (5718)</strong>.
          </p>
        </div>
      )}

      {/* RESULTADOS */}
      {hotels.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LISTA DE HOTELES (IZQUIERDA) */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {hotels.length} {hotels.length === 1 ? "Hotel encontrado" : "Hoteles encontrados"}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {hotels.map((hotel) => {
                const isSelected = selectedHotel?.hotelCode === hotel.hotelCode;
                const minPrice = hotel.rates?.[0]?.amount ?? 0;
                const currency = hotel.rates?.[0]?.currency ?? "USD";

                return (
                  <div
                    key={hotel.hotelCode}
                    onClick={() => setSelectedHotel(hotel)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {hotel.hotelName}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: Math.min(hotel.rating || 1, 5) }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-amber-400 text-amber-400"
                              />
                            )
                          )}
                          <span className="text-[11px] text-slate-500 ml-1">
                            {hotel.rating} estrellas
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-slate-100">
                        {hotel.hotelCode}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                      {hotel.address?.street}
                      {hotel.address?.city ? `, ${hotel.address.city}` : ""}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {hotel.rates.length}{" "}
                        {hotel.rates.length === 1 ? "tarifa" : "tarifas"}
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Desde</span>{" "}
                        <strong className="text-sm font-bold text-indigo-700">
                          {currency} ${minPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETALLES Y TARIFAS DEL HOTEL SELECCIONADO (DERECHA) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedHotel ? (
              <Card className="shadow-md border border-slate-200 bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-slate-900">
                          {selectedHotel.hotelName}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          Código: {selectedHotel.hotelCode}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {selectedHotel.address?.street}{" "}
                        {selectedHotel.address?.city ? `· ${selectedHotel.address.city}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-800">
                        {selectedHotel.rating}.0
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Tarifas Disponibles en Nemo
                    </h5>

                    <div className="space-y-3">
                      {selectedHotel.rates.map((rate, idx) => (
                        <div
                          key={rate.tripProductId || idx}
                          className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                                <BedDouble className="h-4 w-4 text-indigo-600" />
                                {rate.roomRates?.[0]?.roomType || "Habitación Estándar"}
                              </span>
                              <Badge className="text-[10px] bg-slate-200 text-slate-700 hover:bg-slate-200 font-normal">
                                {rate.roomRates?.[0]?.boardDescription || "Sólo alojamiento"}
                              </Badge>
                            </div>

                            <p className="text-xs text-slate-500">
                              {rate.cancellationPolicy.refundable ? (
                                <span className="text-emerald-600 font-medium">
                                  ✓ Reembolsable
                                  {rate.cancellationPolicy.deadline
                                    ? ` hasta ${rate.cancellationPolicy.deadline.slice(0, 10)}`
                                    : ""}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium">
                                  Tarifa no reembolsable
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0">
                            <div className="text-left md:text-right">
                              <div className="text-xs text-slate-400">Total estancia</div>
                              <div className="text-lg font-bold text-slate-900">
                                {rate.currency} ${rate.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                              </div>
                            </div>

                            {showSelectButton && (
                              <Button
                                size="sm"
                                onClick={() => handleRateSelect(selectedHotel, rate)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                Seleccionar para Reserva
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>Información para Operaciones:</strong> Al seleccionar una tarifa se vinculará con el cliente y viajero elegidos arriba para generar la cotización o reserva correspondiente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                Selecciona un hotel de la lista para ver sus tarifas y detalles
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
