"use client";

import {
  FileText,
  BookOpen,
  Users,
  Building2,
  CreditCard,
  Receipt,
  Shield,
  BadgeDollarSign,
  DoorOpen,
  Settings2,
} from "lucide-react";
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
    href: "/dashboard",
    icon: FileText,
  },
  {
    title: "Administración", //
    href: "/dashboard/admin",
    icon: Settings2,
  },
  {
    title: "Solicitudes", //
    href: "/dashboard/solicitudes",
    icon: FileText,
  },
  {
    title: "Reservas", //
    href: "/dashboard/reservas",
    icon: BookOpen,
  },
  {
    title: "Clientes", //
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Hoteles", //
    href: "/dashboard/hoteles",
    icon: Building2,
  },
  {
    title: "Pagos proveedor", //
    href: "/dashboard/pagos_proveedor",
    icon: CreditCard,
  },
  {
    title: "Pagos proveedor pagados", //
    href: "/dashboard/pagos_proveedor/pagados",
    icon: CreditCard,
  },
  {
    title: "Cuentas por cobrar", //
    href: "/dashboard/cuentas-cobrar",
    icon: FileText,
  },
  {
    title: "Pagos", //
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    title: "Facturas", //
    href: "/dashboard/invoices",
    icon: Receipt,
  },
  {
    title: "Facturas Pendientes", //
    href: "/dashboard/facturas-pendientes",
    icon: Receipt,
  },
  {

    title: "Facturas pendientes credito",
    href: "/dashboard/facturacion",
    icon: BookOpen,
  },
  {
    title: "Codigo confirmación", //
    href: "/dashboard/codigo-confirmacion",
    icon: Shield,
  },
];
