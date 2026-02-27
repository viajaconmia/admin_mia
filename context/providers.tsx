"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useState } from "react";
import { NotificationProvider } from "./useAlert";
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
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <HotelProvider>
            <ProveedorProvider>
              <Notification></Notification>
              {children}
            </ProveedorProvider>
          </HotelProvider>
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}
