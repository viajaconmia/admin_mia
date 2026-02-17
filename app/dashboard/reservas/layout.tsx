"use client";

import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";

const App = ({ children }) => {
  const { hasAccess } = usePermiso();
  hasAccess(PERMISOS.VISTAS.RESERVAS);
  return (
    <div className="h-fit">
      <div className="w-full mx-auto bg-white p-4 rounded-lg shadow">
        {children}
      </div>
    </div>
  );
};

export default App;
