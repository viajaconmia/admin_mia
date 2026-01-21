"use client";

import { createContext, useState, useContext, ReactNode } from "react";
import { useNotification } from "./useNotificacion";
import {
  mapProveedor,
  Proveedor,
  ProveedoresService,
} from "@/services/ProveedoresService";

type ProveedorContextType = {
  getProveedores: () => Promise<Proveedor[]>;
  proveedores: Proveedor[];
};

const ProveedorContext = createContext<ProveedorContextType>({
  getProveedores: async () => [],
  proveedores: [],
});

export function ProveedorProvider({ children }: { children: ReactNode }) {
  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null);
  const { showNotification } = useNotification();

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
          "No se pudo descargar los proveedores, actualiza la pagina por favor"
      );
    }
  };

  const value: ProveedorContextType = {
    proveedores,
    getProveedores,
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
