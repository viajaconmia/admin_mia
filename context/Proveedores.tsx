"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useAlert } from "./useAlert";
import {
  mapProveedor,
  Proveedor,
  ProveedoresService,
} from "@/services/ProveedoresService";
import { useAuth } from "./AuthContext";

type ProveedorContextType = {
  getProveedores: () => Promise<Proveedor[]>;
  proveedores: Proveedor[];
  updateProveedores: () => Promise<void>;
};

const ProveedorContext = createContext<ProveedorContextType>({
  getProveedores: async () => [],
  proveedores: [],
  updateProveedores: async () => {},
});

export function ProveedorProvider({ children }: { children: ReactNode }) {
  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null);
  const { showNotification } = useAlert();
  const { isAuthenticated, loading } = useAuth();

  const getProveedores = async () => {
    try {
      if (proveedores) return proveedores;
      const response = await ProveedoresService.getInstance().getProveedores();
      const mapProv = response.data.map((prov) => mapProveedor(prov));
      setProveedores(mapProv);
      return mapProv;
    } catch (error) {
      setProveedores(null);
      showNotification(
        "error",
        error.message ||
          "No se pudo descargar los proveedores, actualiza la pagina por favor",
      );
    }
  };

  const updateProveedores = async () => {
    try {
      const response = await ProveedoresService.getInstance().getProveedores();
      const mapProv = response.data.map((prov) => mapProveedor(prov));
      setProveedores(mapProv);
    } catch (error) {
      showNotification(
        "error",
        error.message ||
          "No se pudo descargar los proveedores, actualiza la pagina por favor",
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated && !loading) {
      getProveedores();
    }
  }, [isAuthenticated]);

  const value: ProveedorContextType = {
    proveedores,
    getProveedores,
    updateProveedores,
  };

  return (
    <ProveedorContext.Provider value={value}>
      {children}
    </ProveedorContext.Provider>
  );
}

export function useProveedor(): ProveedorContextType {
  const context = useContext(ProveedorContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un ProveedorProvider");
  }
  return context;
}
