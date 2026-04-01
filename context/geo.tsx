"use client";

import { filterWithinRadius } from "@/lib/geo";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useHoteles } from "./Hoteles";
import { Hotel } from "@/types";

type GeoContextType = {
  filtrados: Hotel[];
  center: [number, number];
  range: number;
  setCenter: (center: [number, number]) => void;
  setRange: (range: number) => void;
  order: (callback: (a: Hotel, b: Hotel) => boolean) => void;
};

const GeoContext = createContext<GeoContextType>({
  filtrados: [],
  center: [0, 0],
  range: 0,
  setCenter: () => {},
  setRange: () => {},
  order: () => {},
});

type GeoProviderProps = {
  children: ReactNode;
};

export function GeoProvider({ children }: GeoProviderProps) {
  const [filtrados, setFiltrados] = useState<Hotel[]>([]);
  const [center, setCenter] = useState<[number, number]>([
    19.435404276995, -99.131177233551,
  ]);
  const [range, setRange] = useState<number>(200);
  const { hoteles } = useHoteles();

  useEffect(() => {
    // const visibleHotels = filterWithinRadius(hoteles, center, range);
    setFiltrados(hoteles);
  }, [center, range, hoteles]);

  const order = (callback: (a: Hotel, b: Hotel) => boolean) => {
    const sorted = [...filtrados].sort((a, b) => (callback(a, b) ? -1 : 1));
    setFiltrados(sorted);
  };

  const value: GeoContextType = {
    filtrados,
    center,
    range,
    setCenter,
    order,
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
