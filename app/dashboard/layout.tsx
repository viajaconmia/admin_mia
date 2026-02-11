"use client";

import React from "react";
import {
  FileText,
  BookOpen,
  Users,
  Building2,
  CreditCard,
  Receipt,
  Shield,
  DoorOpen,
  Settings2,
  Truck,
} from "lucide-react";

import NavContainer from "@/components/organism/NavContainer"; // <- aquí importas el nuevo
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/atom/Button";
import { UserProfileImage } from "@/components/atom/UserProfileImage";

/**
 * Si en tu NavContainer tipaste NavGroup internamente,
 * NO necesitas exportar tipos.
 * Si sí los exportaste, puedes tipar links.
 */
type NavItem = {
  title: string;
  href: string;
  icon?: any;
};

type NavGroup = {
  title: string;
  icon?: any;
  items: NavItem[];
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="backdrop-blur-3xl h-screen">
      <NavContainer title="Admin" links={links}>
        <div className="h-full bg-transparent overflow-y-auto">
          <nav className="backdrop-blur-3xl w-full p-4 px-6 flex justify-end items-center gap-2">
            <UserProfileImage name={user.name} />
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

/** Links organizados por categorías (submenu = tus href) */
const links: NavGroup[] = [
  {
    title: "General",
    icon: FileText,
    items: [
      { title: "Inicio", href: "/dashboard", icon: FileText },
      { title: "Administración", href: "/dashboard/admin", icon: Settings2 },
    ],
  },
  {
    title: "Operación",
    icon: BookOpen,
    items: [
      {
        title: "Solicitudes",
        href: "/dashboard/solicitudes/hoteles",
        icon: FileText,
      },
      { title: "Reservas", href: "/dashboard/reservas", icon: BookOpen },
      { title: "Proveedores", href: "/dashboard/proveedores", icon: Truck },
      { title: "Clientes", href: "/dashboard/clients", icon: Users },
      { title: "Hoteles", href: "/dashboard/hoteles", icon: Building2 },
      {
        title: "Códigos",
        href: "/dashboard/codigo-confirmacion",
        icon: Shield,
      },
    ],
  },
  {
    title: "Pagos",
    icon: CreditCard,
    items: [
      { title: "Pagos", href: "/dashboard/payments", icon: CreditCard },
      { title: "Tarjetas", href: "/dashboard/tarjetas", icon: CreditCard },
    ],
  },
  {
    title: "CXP",
    icon: CreditCard,
    items: [
      {
        title: "Pagos proveedor",
        href: "/dashboard/pagos_proveedor",
        icon: CreditCard,
      },
      {
        title: "Conciliación",
        href: "/dashboard/conciliacion",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "CXC",
    icon: FileText,
    items: [
      {
        title: "Resumen",
        href: "/dashboard/cuentas-cobrar",
        icon: FileText,
      },
      {
        title: "Detallado",
        href: "/dashboard/concentrado_cxc",
        icon: FileText,
      },
    ],
  },
  {
    title: "Facturas",
    icon: Receipt,
    items: [
      { title: "Facturas", href: "/dashboard/invoices", icon: Receipt },
      {
        title: "Pend. Prepago",
        href: "/dashboard/facturas-pendientes",
        icon: Receipt,
      },
      {
        title: "Pend. Crédito",
        href: "/dashboard/facturacion",
        icon: BookOpen,
      },
    ],
  },
];
