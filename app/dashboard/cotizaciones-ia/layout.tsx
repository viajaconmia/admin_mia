"use client";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";

const CotizacionesIaLayout = ({ children }: { children: React.ReactNode }) => {
  const { hasAccess } = usePermiso();

  // hasAccess redirige a /unauthorized; con su retorno evitamos además montar la vista
  // (y sus peticiones) mientras se redirige. bacl revalida el permiso en cada endpoint.
  if (!hasAccess(PERMISOS.VISTAS.COTIZACIONES_IA)) return null;

  return <>{children}</>;
};

export default CotizacionesIaLayout;
