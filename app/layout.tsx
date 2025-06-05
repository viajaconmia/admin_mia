"use client";

import "./globals.css";
import { AuthProvider } from "./auth/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Factory,
  ChevronDown,
  Menu,
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Building2,
  CreditCard,
  Receipt,
  User,
  UserRoundCog,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  navShow: boolean;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    navShow: true,
    title: "Inicio",
    href: "/",
    icon: FileText,
  },
  {
    navShow: false,
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    navShow: false,
    title: "Solicitudes",
    href: "/dashboard/solicitudes",
    icon: FileText,
  },
  {
    navShow: false,
    title: "Reservas",
    href: "/dashboard/reservas",
    icon: BookOpen,
  },
  {
    navShow: false,
    title: "Clientes",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    navShow: false,
    title: "Credito",
    href: "/dashboard/credito",
    icon: CreditCard,
  },
  {
    navShow: false,
    title: "Hoteles",
    href: "/dashboard/hoteles",
    icon: Building2,
  },
  {
    navShow: false,
    title: "Pagos",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    navShow: false,
    title: "Cuentas por cobrar",
    href: "/dashboard/cuentas-cobrar",
    icon: Clock,
  },
  {
    navShow: false,
    title: "Facturas",
    href: "/dashboard/invoices",
    icon: Receipt,
  },
  // {
  //   navShow: false,
  //   title: "Empresas",
  //   href: "/dashboard/empresas",
  //   icon: Factory,
  // },
  {
    navShow: false,
    title: "Viajeros",
    href: "/dashboard/viajeros",
    icon: Users,
  },
  // {
  //   navShow: false,
  //   title: "Agentes",
  //   href: "/dashboard/agentes",
  //   icon: UserRoundCog,
  // },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  let path = pathname
    .split("/")
    .filter((obj) => obj != "")
    .map((cadena) => cadena.charAt(0).toUpperCase() + cadena.slice(1))
    .slice(1, 2);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-[#f0f7ff]">
        <div className="flex min-h-screen">
          {/* Mobile Sidebar */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="fixed left-4 top-4 z-40 bg-transparent"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-white p-0">
              <div className="p-6 border-b border-blue-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  viewBox="0 0 1152 539"
                  className="h-12 w-auto"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g>
                    <path
                      className="st0"
                      d="M760.47,409.43c0,1.12-.31,2.13-.93,3.03-.62.9-1.74,1.63-3.37,2.19-1.63.56-3.79,1.01-6.48,1.35s-6.12.5-10.27.5-7.41-.17-10.1-.5c-2.69-.34-4.83-.78-6.39-1.35-1.57-.56-2.69-1.29-3.37-2.19-.67-.9-1.01-1.91-1.01-3.03v-177.24h-.34l-63.12,177.07c-.45,1.46-1.18,2.67-2.19,3.62-1.01.95-2.39,1.71-4.12,2.27-1.74.56-3.96.93-6.65,1.09-2.69.17-5.95.25-9.76.25s-7.07-.14-9.76-.42c-2.69-.28-4.91-.73-6.65-1.35-1.74-.62-3.11-1.37-4.12-2.27-1.01-.9-1.68-1.96-2.02-3.2l-60.93-177.07h-.34v177.24c0,1.12-.31,2.13-.93,3.03-.62.9-1.77,1.63-3.45,2.19-1.68.56-3.85,1.01-6.48,1.35-2.64.34-6.03.5-10.18.5s-7.41-.17-10.1-.5c-2.69-.34-4.85-.78-6.48-1.35-1.63-.56-2.75-1.29-3.37-2.19-.62-.9-.93-1.91-.93-3.03v-194.07c0-5.72,1.51-10.1,4.54-13.13,3.03-3.03,7.07-4.54,12.12-4.54h28.95c5.16,0,9.59.42,13.3,1.26,3.7.84,6.9,2.25,9.59,4.21,2.69,1.97,4.94,4.55,6.73,7.74,1.79,3.2,3.37,7.15,4.71,11.87l47.13,129.77h.67l48.81-129.43c1.46-4.71,3.06-8.7,4.8-11.95,1.74-3.25,3.76-5.89,6.06-7.91,2.3-2.02,5.02-3.45,8.16-4.29,3.14-.84,6.79-1.26,10.94-1.26h29.79c3.03,0,5.64.39,7.83,1.18,2.19.79,3.98,1.94,5.39,3.45,1.4,1.51,2.47,3.37,3.2,5.56.73,2.19,1.09,4.69,1.09,7.49v194.07Z"
                    ></path>
                    <g>
                      <path
                        className="st0"
                        d="M1056.75,179.92h-235.54c-24.44,0-44.25,20.68-44.25,46.19v161.26c0,25.51,19.81,46.19,44.25,46.19h235.54c24.44,0,44.25-20.68,44.25-46.19v-161.26c0-25.51-19.81-46.19-44.25-46.19ZM853.75,409.43c0,1.12-.37,2.13-1.09,3.03-.73.9-1.94,1.63-3.62,2.19-1.68.56-3.93,1.01-6.73,1.35-2.81.34-6.4.5-10.77.5s-7.83-.17-10.69-.5c-2.86-.34-5.13-.78-6.82-1.35-1.68-.56-2.89-1.29-3.62-2.19-.73-.9-1.09-1.91-1.09-3.03v-205.68c0-1.12.36-2.13,1.09-3.03.73-.9,1.96-1.63,3.7-2.19,1.74-.56,4.01-1.01,6.82-1.35,2.8-.34,6.34-.51,10.6-.51s7.97.17,10.77.51c2.8.34,5.05.79,6.73,1.35,1.68.56,2.89,1.29,3.62,2.19.73.9,1.09,1.91,1.09,3.03v205.68ZM1082.18,413.89c-1.24,1.18-3.42,1.91-6.56,2.19-3.14.28-7.46.42-12.96.42s-10.18-.08-13.38-.25c-3.2-.17-5.64-.5-7.32-1.01-1.68-.5-2.86-1.21-3.53-2.1-.67-.9-1.24-2.07-1.68-3.53l-14.64-43.76h-81.8l-13.8,42.58c-.45,1.57-1.04,2.89-1.77,3.96-.73,1.07-1.91,1.91-3.53,2.53-1.63.61-3.93,1.04-6.9,1.26-2.97.22-6.87.34-11.7.34-5.16,0-9.2-.17-12.12-.5-2.92-.34-4.94-1.15-6.06-2.44-1.12-1.29-1.52-3.11-1.18-5.47.34-2.36,1.18-5.5,2.53-9.43l67.16-193.22c.67-1.91,1.46-3.45,2.36-4.63.9-1.18,2.33-2.08,4.29-2.69,1.96-.62,4.68-1.01,8.16-1.18,3.48-.17,8.08-.25,13.8-.25,6.62,0,11.89.08,15.82.25,3.93.17,6.98.56,9.17,1.18,2.19.62,3.76,1.54,4.71,2.78.95,1.24,1.77,2.92,2.44,5.05l67.33,193.06c1.35,4.04,2.19,7.24,2.53,9.59.34,2.36-.11,4.12-1.35,5.3Z"
                      ></path>
                      <polygon
                        className="st0"
                        points="980.86 239.26 950.06 331.83 1011.83 331.83 981.03 239.26 980.86 239.26"
                      ></polygon>
                    </g>
                  </g>
                  <path
                    className="st1"
                    d="M205.06,500.55s-.04.03-.06.02c-64.5-64.5-133.27-131.46-133.27-209.51,0-86.62,84.17-157.09,187.63-157.09s187.63,70.47,187.63,157.09c0,74.79-63.42,139.58-150.8,154.08-.02,0-.05-.01-.05-.04l-8.8-53.12c61.28-10.16,105.76-52.6,105.76-100.92,0-56.91-60-103.2-133.74-103.2s-133.74,46.3-133.74,103.2c0,49.8,48,93.56,111.66,101.79,0,0,.01,0,.01.02l-32.23,107.69Z"
                  ></path>
                  <ellipse
                    className="st0"
                    cx="211.01"
                    cy="277.85"
                    rx="28.37"
                    ry="37.7"
                  ></ellipse>
                  <ellipse
                    className="st0"
                    cx="313.34"
                    cy="277.85"
                    rx="28.37"
                    ry="37.7"
                  ></ellipse>
                  <path
                    className="st1"
                    d="M340.98,125.54c-2.9,0-5.84-.69-8.58-2.14-70.29-37.27-135.91-1.73-138.67-.2-8.84,4.91-20.01,1.76-24.95-7.07-4.94-8.82-1.84-19.96,6.96-24.93,3.45-1.95,85.44-47.12,173.85-.23,8.95,4.75,12.36,15.86,7.62,24.81-3.29,6.21-9.65,9.76-16.23,9.76Z"
                  ></path>
                </svg>
              </div>
              <ScrollArea className="h-[calc(100vh-5rem)]">
                <nav className="flex flex-col gap-2 p-4">
                  {navItems.map((item) => (
                    <Link key={item.title} href={item.href}>
                      <span
                        className={cn(
                          "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                          "text-blue-950 hover:bg-blue-50/50 hover:text-blue-900"
                        )}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </span>
                    </Link>
                  ))}
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-br to-customColor from-gray-100">
            <div className="flex gap-4 items-center h-24 pl-20">
              <span>
                <svg
                  version="1.1"
                  id="Capa_1"
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  viewBox="0 0 493 539"
                  className="w-[50px] h-[50px] -rotate-12 transform text-sky-950"
                >
                  <path
                    fill="currentColor"
                    d="M205.1,500.5C205.1,500.5,205,500.6,205.1,500.5C140.5,436.1,71.7,369.1,71.7,291.1
          c0-86.6,84.2-157.1,187.6-157.1S447,204.4,447,291.1c0,74.8-63.4,139.6-150.8,154.1c0,0,0,0,0,0l-8.8-53.1
          c61.3-10.2,105.8-52.6,105.8-100.9c0-56.9-60-103.2-133.7-103.2s-133.7,46.3-133.7,103.2c0,49.8,48,93.6,111.7,101.8c0,0,0,0,0,0
          L205.1,500.5L205.1,500.5z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="M341,125.5c-2.9,0-5.8-0.7-8.6-2.1c-70.3-37.3-135.9-1.7-138.7-0.2c-8.8,4.9-20,1.8-24.9-7.1
          c-4.9-8.8-1.8-20,7-24.9c3.4-1.9,85.4-47.1,173.8-0.2c9,4.8,12.4,15.9,7.6,24.8C353.9,122,347.6,125.5,341,125.5z"
                  ></path>
                  <g>
                    <path
                      fill="currentColor"
                      d="M248.8,263.8c-38.1-26-73.7-0.8-75.2,0.2c-6.4,4.6-8.7,14-5.3,21.8c1.9,4.5,5.5,7.7,9.8,8.9
            c4,1.1,8.2,0.3,11.6-2.1c0.9-0.6,21.4-14.9,43.5,0.2c2.2,1.5,4.6,2.3,7.1,2.4c0.2,0,0.4,0,0.6,0c0,0,0,0,0,0
            c5.9,0,11.1-3.7,13.5-9.7C257.8,277.6,255.4,268.3,248.8,263.8z"
                    ></path>
                    <path
                      fill="currentColor"
                      d="M348.8,263.8c-38.1-26-73.7-0.8-75.2,0.2c-6.4,4.6-8.7,14-5.3,21.8c1.9,4.5,5.5,7.7,9.8,8.9
            c4,1.1,8.2,0.3,11.6-2.1c0.9-0.6,21.4-14.9,43.5,0.2c2.2,1.5,4.6,2.3,7.1,2.4c0.2,0,0.4,0,0.6,0c0,0,0,0,0,0
            c5.9,0,11.1-3.7,13.5-9.7C357.8,277.6,355.4,268.3,348.8,263.8z"
                    ></path>
                  </g>
                </svg>
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-sky-950">
                {path}
              </h1>
            </div>
            <QueryClientProvider client={queryClient}>
              <Suspense fallback={<h1>Cargando...</h1>}>
                <AuthProvider>{children}</AuthProvider>
              </Suspense>
            </QueryClientProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
