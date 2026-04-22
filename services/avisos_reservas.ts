import { API_KEY, URL } from "@/lib/constants";

export const fetchGetAvisosReservas = async (cb: (data: any) => void) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/reservas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};

export const fetchGetAvisosReservasEnviadas = async (
  cb: (data: any) => void,
) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/enviadas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};

export const postAvisosReservasAction = async (
  endpoint: "prefacturar" | "desligar" | "aprobar",
  ids: string[],
  cb: (data: any) => void,
) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    body: JSON.stringify({ ids }),
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};