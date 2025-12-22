"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useNotification } from "./useNotificacion";
import { fetchHoteles, newFetchHoteles } from "@/services/hoteles";

type HotelContextType = {
  actualizarHoteles: () => void;
  hoteles: any[] | null;
};

const HotelContext = createContext<HotelContextType>({
  actualizarHoteles: () => {},
  hoteles: null,
});

type HotelProviderProps = {
  children: ReactNode;
};

export function HotelProvider({ children }: HotelProviderProps) {
  const [hoteles, setHoteles] = useState<any[] | null>(null);
  const { showNotification } = useNotification();

  const actualizarHoteles = async () => {
    try {
      if (hoteles) return;
      const response = await newFetchHoteles();
      setHoteles(response);
    } catch (error) {
      setHoteles(null);
      showNotification(
        "error",
        error.message ||
          "No se pudo descargar los hoteles, actualiza la pagina por favor"
      );
    }
  };

  useEffect(() => {
    actualizarHoteles();
  }, []);

  const value: HotelContextType = {
    hoteles,
    actualizarHoteles,
  };

  return (
    <HotelContext.Provider value={value}>{children}</HotelContext.Provider>
  );
}

export function useHoteles(): HotelContextType {
  const context = useContext(HotelContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un HotelProvider");
  }
  return context;
}
