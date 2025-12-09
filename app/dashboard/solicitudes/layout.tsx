"use client";

import { WraperContainer } from "@/components/atom/WraperContainer";
import { Tab, TabsList } from "@/components/molecule/TabsList";
import { PERMISOS } from "@/constant/permisos";
import { usePermiso } from "@/hooks/usePermission";
import { Building2, CheckCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function App({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAccess } = usePermiso();
  let selected = pathname.split("/").filter((item) => Boolean(item))[2] || "";

  hasAccess(PERMISOS.VISTAS.SOLICITUDES);

  return (
    <WraperContainer>
      <div className="w-full h-full">
        <div className="bg-gray-50 rounded-t-md">
          <TabsList
            tabs={tabRouterAdministracion}
            activeTab={selected}
            onChange={(value) => {
              router.push(`/dashboard/solicitudes/${value}`);
            }}
          />
        </div>
        {children}
      </div>
    </WraperContainer>
  );
}

const tabRouterAdministracion: Tab[] = [
  { label: "hoteles", icon: Building2, tab: "hoteles" },
  { label: "cotizaciones", icon: CheckCircle, tab: "cotizaciones" },
];
