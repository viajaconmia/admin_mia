"use client";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";

const App = ({ children }) => {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.PROVEEDORES);
  return <>{children}</>;
};
export default App;
