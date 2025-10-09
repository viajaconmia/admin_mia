import { environment } from "@/lib/constants";

const MIA_DOMAIN = environment
  ? "http://localhost:5173"
  : "https://www.viajaconmia.com";

export const ROUTES = {
  BOOKING: {
    ID_SOLICITUD: (id: string) => `${MIA_DOMAIN}/bookings/${btoa(id)}`,
  },
};
