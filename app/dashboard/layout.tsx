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
} from "lucide-react";
import NavContainer from "@/components/organism/NavContainer";
import { useAuth } from "@/context/AuthContext";
import { capitalizarTexto, obtenerIniciales } from "@/helpers/formater";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  console.log(user);
  if (!user) return;
  const links = [
    {
      title: "Inicio",
      href: "/",
      icon: FileText,
    },
    {
      title: "Pagos proveedor",
      href: "/dashboard/pagos_proveedor",
      icon: CreditCard,
    },
    {
      title: "Solicitudes",
      href: "/dashboard/solicitudes",
      icon: FileText,
    },
    {
      title: "Reservas",
      href: "/dashboard/reservas",
      icon: BookOpen,
    },
    {
      title: "Clientes",
      href: "/dashboard/clients",
      icon: Users,
    },
    {
      title: "Hoteles",
      href: "/dashboard/hoteles",
      icon: Building2,
    },
    {
      title: "Pagos",
      href: "/dashboard/payments",
      icon: CreditCard,
    },
    {
      title: "Facturas",
      href: "/dashboard/invoices",
      icon: Receipt,
    },
    {
      title: "Facturas Pendientes",
      href: "/dashboard/facturas-pendientes",
      icon: Receipt,
    },
    {
      title: "Items sin facturar",
      href: "/dashboard/facturacion",
      icon: BookOpen,
    },
    {
      title: "Codigo confirmación",
      href: "/dashboard/codigo",
      icon: Shield,
    },
    {
      title: "Viajeros",
      href: "/dashboard/viajeros",
      icon: Users,
    },
    {
      title: "Aplicación de saldo",
      href: "/dashboard/aplicacion-saldo",
      icon: BadgeDollarSign,
    },
    {
      title: "Cuentas por cobrar",
      href: "/dashboard/cuentas-cobrar",
      icon: FileText,
    },
  ];

  return (
    <NavContainer title="Admin" links={links}>
      <div className="h-screen bg-transparent overflow-y-auto">
        <div className="backdrop-blur-3xl w-full p-2 px-6 flex justify-end items-center gap-2">
          <div className="rounded-full w-8 h-8 bg-blue-200 flex justify-center items-center">
            <p className="text-sm">{obtenerIniciales(user.name)}</p>
          </div>
          <p className="text-xs font-semibold">{capitalizarTexto(user.name)}</p>
        </div>
        <main className="px-4 bg-transparent w-full h-full">{children}</main>
      </div>
    </NavContainer>
  );
}
