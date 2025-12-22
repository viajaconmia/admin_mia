import { environment } from "@/lib/constants";

const MIA_DOMAIN = environment
  ? "http://localhost:5173"
  : "https://www.viajaconmia.com";

export const ROUTES = {
  BOOKING: {
    ID_SOLICITUD: (id: string) => `${MIA_DOMAIN}/bookings/${btoa(id)}`,
  },
  DASHBOARD: {
    UNAUTHORIZED: "/dashboard/unauthorized",
  },
};

export const PAGES = {
  BOOKINGS: {
    CREAR_RESERVA: "/dashboard/reservas/create",
  },
};
