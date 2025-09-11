"use client";

import { WraperContainer } from "@/components/atom/WraperContainer";
import { Tab, TabsList } from "@/components/molecule/TabsList";
import { Users2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function AdministracionLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  let selected = pathname.split("/").filter((item) => Boolean(item))[2] || "";
  return (
    <WraperContainer>
      <div className="w-full h-full">
        <TabsList
          tabs={tabRouterAdministracion}
          activeTab={selected}
          onChange={(value) => {
            router.push(`/dashboard/admin/${value}`);
          }}
        />
        {children}
      </div>
    </WraperContainer>
  );
}

const tabRouterAdministracion: Tab[] = [
  {
    tab: "usuarios",
    label: "Usuarios",
    icon: Users2,
  },
];
