"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AgenteListado, listarAgentes } from "@/angel/services/agentes";

type ClientesCtx = {
  clientes: AgenteListado[];
  loading: boolean;
  error: string | null;
};

const ClientesContext = createContext<ClientesCtx>({
  clientes: [],
  loading: false,
  error: null,
});

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<AgenteListado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listarAgentes()
      .then(setClientes)
      .catch((err) => setError(err.message || "Error al cargar clientes"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClientesContext.Provider value={{ clientes, loading, error }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  return useContext(ClientesContext);
}
