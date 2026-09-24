"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { AgenteListado, listarAgentesCompletos } from "@/angel/services/agentes";

type ClientesCtx = {
  /** Catálogo ligero {id_agente, nombre} para selects y filtros */
  clientes: AgenteListado[];
  /** Listado completo de agentes, tal cual lo devuelve el backend */
  agentes: Agente[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const ClientesContext = createContext<ClientesCtx>({
  clientes: [],
  agentes: [],
  loading: false,
  error: null,
  refetch: () => {},
});

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = useCallback(() => {
    setLoading(true);
    setError(null);
    listarAgentesCompletos()
      .then(setAgentes)
      .catch((err) => setError(err.message || "Error al cargar clientes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const clientes = useMemo(
    () =>
      agentes.map((agente) => ({
        id_agente: agente.id_agente,
        nombre: agente.nombre_agente_completo,
      })),
    [agentes],
  );

  return (
    <ClientesContext.Provider
      value={{ clientes, agentes, loading, error, refetch: fetchClientes }}
    >
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  return useContext(ClientesContext);
}
