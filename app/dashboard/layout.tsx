"use client";

import React, { useMemo, useState } from "react";
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
  Star,
  Users2,
  User,
  Wallet,
  FileCheck,
  Percent,
  Calculator,
} from "lucide-react";

import NavContainer from "@/components/organism/NavContainer"; // <- aquí importas el nuevo
import CotizadorExterno from "@/components/organism/cotizador/cotizadorExterno";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/atom/Button";
import { UserProfileImage } from "@/components/atom/UserProfileImage";
import { Card } from "@/components/ui/card";
import { ClientQuickSearch } from "@/components/organism/ClientQuickSearch";
import {
  NotificacionesProvider,
  useNotificaciones,
} from "@/angel/context/NotificacionesContext";

/**
 * Si en tu NavContainer tipaste NavGroup internamente,
 * NO necesitas exportar tipos.
 * Si sí los exportaste, puedes tipar links.
 */
type NavItem = {
  title: string;
  href: string;
  icon?: any;
  badge?: number;
};

type NavSubGroup = {
  title: string;
  icon?: any;
  items: NavItem[];
};

type NavGroup = {
  title: string;
  icon?: any;
  items: (NavItem | NavSubGroup)[];
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <NotificacionesProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </NotificacionesProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const { conteos } = useNotificaciones();
  const [isOpen, setIsOpen] = useState(false);

  // Inyecta el conteo de notificaciones en los items de `links` que lo tengan
  // configurado en NotificacionesContext (por ahora solo patch a un nivel:
  // items directos de cada grupo, no dentro de subgrupos).
  const linksConBadge = useMemo(
    () =>
      links.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          "href" in item && item.href === "/dashboard/comisionables"
            ? { ...item, badge: conteos["comisionables"] }
            : item,
        ),
      })),
    [conteos],
  );

  return (
    <div className="backdrop-blur-3xl h-screen">
      <NavContainer title="Admin" links={linksConBadge}>
        <div className="h-full bg-transparent overflow-y-auto">
          <nav className="backdrop-blur-3xl w-full p-4 px-6 flex justify-between items-center gap-2">
            <ClientQuickSearch />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="md"
                icon={Calculator}
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                Cotizador
              </Button>
              <Button
                size="sm"
                icon={DoorOpen}
                variant="secondary"
                onClick={logout}
              >
                Log out
              </Button>
            </div>
          </nav>

          <main className="px-4 bg-transparent w-full h-[calc(100vh-6rem)]">
            {children}
          </main>
        </div>
      </NavContainer>

      {isOpen && (
        <CotizadorExterno onClose={() => setIsOpen(false)}></CotizadorExterno>
      )}
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
      { title: "Tarjetas", href: "/dashboard/tarjetas", icon: CreditCard },
      {
        title: "Conciliación",
        href: "/dashboard/conciliacion",
        icon: CreditCard,
      },
      {
        title: "Generación cotización",
        href: "/dashboard/cotizacion/generar",
        icon: FileText,
      },
      {
        title: "Reporte reservas general",
        href: "/dashboard/reporte_general",
        icon: FileText,
      },
    ],
  },
  {
    title: "Finanzas",
    icon: CreditCard,
    items: [
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
            title: "Nueva Pagos proveedor",
            href: "/dashboard/reservas_proveedor",
            icon: CreditCard,
          },
          {
            title: "cartera de CXP",
            href: "/dashboard/concentrado_cxp",
            icon: FileText,
          },
          {
            title: "Comprobante pago",
            href: "/dashboard/pagos_proveedor_l",
            icon: CreditCard,
          },
          {
            title: "Nueva Comprobante pago",
            href: "/dashboard/dispersiones",
            icon: CreditCard,
          },
          {
            title: "Comprobante pago",
            href: "/dashboard/pagos_proveedor_l",
            icon: CreditCard,
          },
          {
            title: "Saldos Proveedor",
            href: "/dashboard/saldo_a_favor_proveedor",
            icon: Wallet,
          },
          {
            title: "Proveedores",
            href: "/dashboard/proveedores_finanzas",
            icon: Truck,
          },
          {
            title: "Tarjetas",
            href: "/dashboard/tarjetas_finanzas",
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
            title: "Cartera de CXC",
            href: "/dashboard/concentrado_cxc",
            icon: FileText,
          },
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
          {
            title: "Reporte",
            href: "/dashboard/detalles_facturas",
            icon: Receipt,
          },
          { title: "Clientes", href: "/dashboard/clients", icon: Users },
          { title: "Pagos", href: "/dashboard/payments", icon: CreditCard },
        ],
      },
      {
        title: "Reservas",
        href: "/dashboard/finanza_reserva",
        icon: Building2,
      },
      {
        title: "Cambios en reservas",
        href: "/dashboard/avisos_reservas",
        icon: Building2,
      },
      {
        title: "Reporte mensual",
        href: "/dashboard/reporte_mensual",
        icon: FileCheck,
      },
      {
        title: "Comisionables",
        href: "/dashboard/comisionables",
        icon: Percent,
      },
    ],
  },
  {
    title: "Comercial",
    icon: Star,
    items: [
      { title: "General", href: "/dashboard/client/", icon: Users2 },
      {
        title: "KONE",
        href: "/dashboard/client/765f610d-b793-407d-8341-7d1fc8a86c37",
        icon: User,
      },
    ],
  },
];
