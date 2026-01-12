"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useState } from "react";
import { NotificationProvider } from "./useNotificacion";
import { Notification } from "@/components/molecule/Notification";
import { HotelProvider } from "./Hoteles";
import { ProveedorProvider } from "./Proveedores";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <HotelProvider>
          <ProveedorProvider>
            <Notification></Notification>
            <AuthProvider>{children}</AuthProvider>
          </ProveedorProvider>
        </HotelProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}
