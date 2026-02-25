"use client";
import { usePermiso } from "@/hooks/usePermission";

export default function App({ children }) {
  const { hasAccess } = usePermiso();
  hasAccess("view.clientes_especiales");
  return <div className="bg-white rounded-lg">{children}</div>;
}
