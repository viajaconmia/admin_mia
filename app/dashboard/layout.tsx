"use client";

import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Building2,
  CreditCard,
  Receipt,
  Clock,
  Shield,
  Banknote,
} from "lucide-react";
import NavContainer from "@/components/structure/NavContainer";
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
    title: "Cuentas por cobrar",
    href: "/dashboard/cuentas-cobrar",
    icon: Clock,
  },
  {
    title: "Facturas",
    href: "/dashboard/invoices",
    icon: Receipt,
  },
  {
    title: "Facturación",
    href: "/dashboard/facturacion",
    icon: Receipt,
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
  // {
  //   title: "Saldo a Favor",
  //   href: "/dashboard/saldo-a-favor",
  //   icon: Banknote,
  // },
];
