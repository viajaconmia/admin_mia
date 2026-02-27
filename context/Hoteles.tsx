"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useAlert } from "./useAlert";
import { fetchHoteles, newFetchHoteles } from "@/services/hoteles";
import { useAuth } from "./AuthContext";

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
  const { showNotification } = useAlert();
  const { isAuthenticated, loading } = useAuth();

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
          "No se pudo descargar los hoteles, actualiza la pagina por favor",
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log("Jalando hoteles");
      actualizarHoteles();
    }
  }, [isAuthenticated]);

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
