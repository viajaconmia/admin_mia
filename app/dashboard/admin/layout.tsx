"use client";

import { TextInput } from "@/components/atom/Input";
import { WraperContainer } from "@/components/atom/WraperContainer";
import { Tab, TabsList } from "@/components/molecule/TabsList";
import { ShieldCheck, Users2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSearchParams } from "wouter";

export default function AdministracionLayout({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  let selected = pathname.split("/").filter((item) => Boolean(item))[2] || "";
  return (
    <WraperContainer>
      <div className="w-full h-full">
        <div className="bg-gray-50 rounded-t-md">
          <TabsList
            tabs={tabRouterAdministracion}
            activeTab={selected}
            onChange={(value) => {
              router.push(`/dashboard/admin/${value}`);
            }}
          />
        </div>
        {/* <div className="px-4">
          <TextInput
            value={searchParams.get("search")}
            onChange={(value) => {
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set("search", value);
                return params;
              });
            }}
            placeholder="Buscar"
          />
        </div> */}
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
  {
    tab: "roles",
    label: "Roles",
    icon: ShieldCheck,
  },
];
