"use client";

import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

export default function app({ children }) {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.MIA_TARJETAS)
  return <>{children}</>;
}
