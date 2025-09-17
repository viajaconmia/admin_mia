"use client";

import {
  FileText,
  BookOpen,
  Users,
  Building2,
  CreditCard,
  Receipt,
  Clock,
  Shield,
  BadgeDollarSign,
} from "lucide-react";
import NavContainer from "@/components/organism/NavContainer";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <NavContainer title="Admin" links={links}>
        <div className="h-screen bg-transparent overflow-y-auto">
          <main className="p-8 pt-0 bg-transparent">{children}</main>
        </div>
      </NavContainer>
    </ProtectedRoute>
  );
}

const links = [
  {
    title: "Inicio",
    href: "/",
    icon: FileText,
  },
  // {
  //   title: "Dashboard",
  //   href: "/dashboard",
  //   icon: LayoutDashboard,
  // },
  // {
  //   title: "Credito",
  //   href: "/dashboard/credito",
  //   icon: CreditCard,
  // },
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
    title: "Facturas Pendientes prep",
    href: "/dashboard/facturas-pendientes",
    icon: Receipt,
  },
  {
    title: "Cuentas por cobrar",
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
