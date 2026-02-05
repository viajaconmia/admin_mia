"use client";

import { FileText, DoorOpen, Settings2 } from "lucide-react";
import NavContainer from "@/components/organism/NavContainer";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/atom/Button";
import { UserProfileImage } from "@/components/atom/UserProfileImage";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  if (!user) return;

  return (
    <div className="backdrop-blur-3xl h-screen">
      <NavContainer title="Admin" links={links}>
        <div className="h-full bg-transparent overflow-y-auto">
          {/* ESTO DEBERIA IR EN UN COMPONENTE APARTE, LUEGO LO MANEJO */}
          <nav className="backdrop-blur-3xl w-full p-4 px-6 flex justify-end items-center gap-2">
            <UserProfileImage name={user.name}></UserProfileImage>
            {/* <p className="text-sm font-semibold">
              {capitalizarTexto(user.name)}
            </p> */}
            <Button
              size="sm"
              icon={DoorOpen}
              variant="secondary"
              onClick={logout}
            >
              Cerrar sesión
            </Button>
          </nav>
          <main className="px-4 bg-transparent w-full h-[calc(100vh-6rem)]">
            {children}
          </main>
        </div>
      </NavContainer>
    </div>
  );
}
const links = [
  {
    title: "Inicio",
    href: "/ventas",
    icon: FileText,
  },
  {
    title: "Hoteles",
    href: "/ventas/hotel",
    icon: Settings2,
  },
  {
    title: "CTS",
    href: "/ventas/nueva",
    icon: Settings2,
  },
  {
    title: "Aviones",
    href: "/ventas/aviones",
    icon: Settings2,
  },
];
