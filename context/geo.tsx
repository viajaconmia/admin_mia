"use client";

import { filterWithinRadius } from "@/lib/geo";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  SetStateAction,
  Dispatch,
} from "react";
import { useHoteles } from "./Hoteles";
import { Hotel } from "@/types";

type GeoContextType = {
  filtrados: Hotel[];
  center: [number, number];
  range: number;
  search: string;
  setCenter: (center: [number, number]) => void;
  setRange: (range: number) => void;
  setSearch: (search: string) => void;
  setOrder: Dispatch<SetStateAction<"distancia" | "precio">>;
};

const GeoContext = createContext<GeoContextType>({
  filtrados: [],
  center: [0, 0],
  range: 0,
  search: "",
  setCenter: () => {},
  setRange: () => {},
  setSearch: () => {},
  setOrder: () => {},
});

type GeoProviderProps = {
  children: ReactNode;
};

type HotelWithDistance = Hotel & { distance: number };

export function GeoProvider({ children }: GeoProviderProps) {
  const [filtrados, setFiltrados] = useState<(Hotel & { distance: number })[]>(
    [],
  );
  const [center, setCenter] = useState<[number, number]>([
    19.435404276995, -99.131177233551,
  ]);
  const [range, setRange] = useState<number>(200);
  const [search, setSearch] = useState<string>("");
  const [orderBy, setOrderBy] = useState<"distancia" | "precio">("distancia");
  const { hoteles } = useHoteles();

  useEffect(() => {
    if (!hoteles) return;
    const visibleHotelsDistance: (Hotel & { distance: number })[] =
      filterWithinRadius(hoteles, center, range);
    const visibleHotels = visibleHotelsDistance.filter((hotel) =>
      hotel.nombre_hotel.toLowerCase().includes(search.toLowerCase()),
    );
    const ordered = order(visibleHotels);
    setFiltrados(ordered);
  }, [center, range, hoteles, search, orderBy]);

  const order = (data: (Hotel & { distance: number })[]) => {
    if (orderBy === "distancia") {
      return data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    if (orderBy === "precio") {
      return data.sort(
        (a, b) =>
          Number(a.tipos_cuartos[0]?.precio || 0) -
          Number(b.tipos_cuartos[0]?.precio || 0),
      );
    }
  };

  const value: GeoContextType = {
    filtrados,
    center,
    range,
    setCenter,
    setOrder: setOrderBy,
    search,
    setSearch,
    setRange,
  };

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo(): GeoContextType {
  const context = useContext(GeoContext);
  if (context === undefined) {
    throw new Error("useGeo debe ser usado dentro de un GeoProvider");
  }
  return context;
}
