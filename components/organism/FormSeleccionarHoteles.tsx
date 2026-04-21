"use client";

import { useEffect, useState } from "react";
import { useGeo } from "@/context/geo";
import {
  InputGoogle,
  PlaceMaps,
  RangeInput,
  TextInput,
} from "@/components/atom/Input";
import { formatNumberWithCommas } from "@/helpers/formater";
import { Map } from "@/components/atom/Map";
import {
  MarkerHotel,
  MarkerHotelSelect,
  MarkerUser,
} from "@/components/atom/Marker";
import Circle from "@/components/atom/Circle";
import Button from "@/components/atom/Button";
import { Hotel } from "@/types";
import { Check, CheckCircle2, Plus, SlidersHorizontal, X } from "lucide-react";
import React from "react";

type SortType = "distancia" | "precio";

type Props = {
  onSubmit?: (hoteles: Hotel[]) => void;
  mode?: "single" | "multi";
};

export const FormSeleccionarHoteles = ({ onSubmit, mode = "multi" }: Props) => {
  const {
    center,
    range,
    setRange,
    setCenter,
    filtrados,
    search,
    setSearch,
    setOrder,
  } = useGeo();
  const [seleccionados, setSeleccionados] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>("distancia");

  const agregar = (hotel: Hotel) => {
    if (mode === "single") {
      onSubmit?.([hotel]);
      return;
    }
    if (seleccionados.some((h) => h.id_hotel === hotel.id_hotel)) return;
    const nuevos = [...seleccionados, hotel];
    setSeleccionados(nuevos);
  };

  const quitar = (id_hotel: string) => {
    const nuevos = seleccionados.filter((h) => h.id_hotel !== id_hotel);
    setSeleccionados(nuevos);
  };

  const handleSort = (tipo: SortType) => {
    setOrder(tipo);
    setSortBy(tipo);
  };

  const handleClick = () => {
    onSubmit?.(seleccionados);
  };

  useEffect(() => {
    setLoading(false);
  }, [filtrados]);

  return (
    <div className="w-[90vw] grid md:grid-cols-[auto_1fr] grid-rows-[1fr] pt-4 relative">
      {/* PANEL IZQUIERDO */}
      <div className="h-[calc(100vh-200px)] p-4 border relative rounded-l-lg min-w-[400px] flex flex-col gap-4 overflow-hidden">
        {menuOpen && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur rounded-lg p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-800">
                Filtros y ordenamiento
              </p>
              <Button
                size="sm"
                variant="warning ghost"
                icon={X}
                onClick={() => setMenuOpen(false)}
              />
            </div>

            <RangeInput
              label="Radio de búsqueda"
              value={range}
              onChange={setRange}
              min={100}
              max={5000}
              step={100}
              sign="m"
              formatValue={formatNumberWithCommas}
            />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">Ordenar por</p>
              <div className="flex gap-6">
                {(["distancia", "precio"] as SortType[]).map((tipo) => (
                  <label
                    key={tipo}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="sort"
                      value={tipo}
                      checked={sortBy === tipo}
                      onChange={() => handleSort(tipo)}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm font-medium capitalize">
                      {tipo}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between shrink-0">
          <p className="text-sm font-semibold text-gray-700">
            Hoteles disponibles
          </p>
          <Button
            size="sm"
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={() => setMenuOpen(true)}
          />
        </div>
        <TextInput
          placeholder="Buscar hotel..."
          value={search}
          onChange={setSearch}
        />
        {/* Lista de hoteles */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {filtrados.map((hotel) => {
            const yaAgregado = seleccionados.some(
              (h) => h.id_hotel === hotel.id_hotel,
            );
            return (
              <div
                key={hotel.id_hotel}
                className="w-full flex border rounded-lg overflow-hidden shrink-0"
              >
                <img
                  src={hotel.imagenes[0] || ""}
                  alt=""
                  className="w-24 h-24 object-cover shrink-0"
                />
                <div className="flex flex-col justify-between p-3">
                  <div className="flex flex-col">
                    <p className="truncate w-56 font-bold">
                      {hotel.nombre_hotel}
                    </p>
                    <p className="truncate w-56 font-semibold text-xs text-gray-500">
                      {hotel.Estado}, {hotel.Ciudad_Zona}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold">
                      {hotel.tipos_cuartos[0]?.precio
                        ? "$" +
                          formatNumberWithCommas(hotel.tipos_cuartos[0].precio)
                        : "Sin precio"}
                    </p>
                    <Button
                      size="sm"
                      icon={yaAgregado ? Check : Plus}
                      variant={yaAgregado ? "secondary" : "primary"}
                      disabled={mode === "multi" && (yaAgregado || seleccionados.length >= 3)}
                      onClick={() => agregar(hotel)}
                    >
                      {mode === "single"
                        ? "Seleccionar"
                        : yaAgregado
                          ? "Agregado"
                          : "Agregar"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seleccionados — solo en modo multi */}
        {mode === "multi" && seleccionados.length > 0 && (
          <div className="border-t pt-3 flex flex-col gap-2 shrink-0">
            <div className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              <p className="flex gap-2">
                Seleccionados
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {seleccionados.length}
                </span>
              </p>
              <Button
                disabled={seleccionados.length < 3}
                size="sm"
                icon={CheckCircle2}
                onClick={handleClick}
              >
                Continuar
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-1">
              {seleccionados.map((h) => (
                <div
                  key={h.id_hotel}
                  className="flex items-center gap-2 border rounded-lg p-1"
                >
                  <p className="flex-1 text-xs font-medium truncate">
                    {h.nombre_hotel}
                  </p>
                  <Button
                    size="sm"
                    variant="warning ghost"
                    icon={X}
                    onClick={() => quitar(h.id_hotel)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAPA */}
      <div className="relative col-start-1 md:col-start-2 row-start-1 flex flex-col">
        <div className="absolute top-0 left-0 w-full p-2 flex items-center justify-center z-10">
          <InputGoogle
            onChange={(place: PlaceMaps) => {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              setCenter([lat, lng]);
            }}
          />
        </div>
        {!loading && (
          <Map>
            {filtrados.map(({ geo, nombre_hotel, id_hotel }) => (
              <React.Fragment key={id_hotel}>
                {seleccionados.some((h) => h.id_hotel === id_hotel) ? (
                  <MarkerHotelSelect
                    key={id_hotel}
                    label={nombre_hotel}
                    position={[Number(geo.latitud), Number(geo.longitud)]}
                  />
                ) : (
                  <MarkerHotel
                    key={id_hotel}
                    label={nombre_hotel}
                    position={[Number(geo.latitud), Number(geo.longitud)]}
                  />
                )}
              </React.Fragment>
            ))}
            <MarkerUser position={center} />
            <Circle center={center} range={range} />
          </Map>
        )}
      </div>
    </div>
  );
};
