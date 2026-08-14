"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";
import {
  notificacionesService,
  type ConteoNotificaciones,
} from "@/angel/services/notificaciones";
import type { ApiResponse } from "@/angel/services/apiClient";

// Patrón para agregar más badges de notificación: solo agrega una entrada
// aquí (permiso que la protege, campo con el que se guarda el conteo, y el
// método del servicio que lo trae). No hace falta tocar el resto del context.
const NOTIFICACIONES_CONFIG: {
  permiso: string;
  campo: string;
  fetchConteo: () => Promise<ApiResponse<ConteoNotificaciones>>;
}[] = [
  {
    permiso: PERMISOS.VISTAS.COMISIONABLES,
    campo: "comisionables",
    fetchConteo: notificacionesService.getConteoComisionables,
  },
];

type Conteos = Record<string, number>;

type NotificacionesContextValue = {
  conteos: Conteos;
  loading: boolean;
};

const NotificacionesContext = createContext<NotificacionesContextValue>({
  conteos: {},
  loading: false,
});

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { hasPermission } = usePermiso();
  const [conteos, setConteos] = useState<Conteos>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const campos = NOTIFICACIONES_CONFIG.filter((c) => hasPermission(c.permiso));
    if (campos.length === 0) return;

    setLoading(true);
    Promise.all(
      campos.map((c) =>
        c
          .fetchConteo()
          .then(({ data }) => [c.campo, data?.conteo ?? 0] as const)
          // Un badge que falla no debe romper el dashboard: se queda en 0.
          .catch(() => [c.campo, 0] as const),
      ),
    )
      .then((resultados) => setConteos(Object.fromEntries(resultados)))
      .finally(() => setLoading(false));
    // Solo al montar el dashboard (sin polling), como se pidió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NotificacionesContext.Provider value={{ conteos, loading }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => useContext(NotificacionesContext);
