"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ReservaSeleccion } from "@/angel/services/facturas";

type ReservasPendientesCtx = {
  seleccion: ReservaSeleccion[];
  setSeleccion: (s: ReservaSeleccion[]) => void;
  limpiar: () => void;
};

const ReservasPendientesContext = createContext<ReservasPendientesCtx>({
  seleccion: [],
  setSeleccion: () => {},
  limpiar: () => {},
});

export function ReservasPendientesProvider({ children }: { children: ReactNode }) {
  const [seleccion, setSeleccion] = useState<ReservaSeleccion[]>([]);
  return (
    <ReservasPendientesContext.Provider
      value={{ seleccion, setSeleccion, limpiar: () => setSeleccion([]) }}
    >
      {children}
    </ReservasPendientesContext.Provider>
  );
}

export function useReservasPendientes() {
  return useContext(ReservasPendientesContext);
}
