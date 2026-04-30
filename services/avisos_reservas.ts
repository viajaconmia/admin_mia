import { API_KEY, URL } from "@/lib/constants";
import type { AvisosFilters } from "@/app/dashboard/avisos_reservas/FiltrosAvisosModal";

const LIMIT = 50;

function buildBody(filters: AvisosFilters, page: number) {
  return JSON.stringify({ ...filters, pag: page, cant: LIMIT });
}

const POST_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "Cache-Control": "no-cache, no-store, must-revalidate",
};

export const fetchGetAvisosReservas = async (
  cb: (data: any) => void,
  filters: AvisosFilters = { id_agente: "", nombre_agente: "", hotel: "", codigo_reservacion: "", traveler: "", tipo_hospedaje: "" },
  page = 1,
) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/reservas`, {
    method: "POST",
    headers: POST_HEADERS,
    body: buildBody(filters, page),
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};

export const fetchGetAvisosReservasEnviadas = async (
  cb: (data: any) => void,
  filters: AvisosFilters = { id_agente: "", nombre_agente: "", hotel: "", codigo_reservacion: "", traveler: "", tipo_hospedaje: "" },
  page = 1,
) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/enviadas`, {
    method: "POST",
    headers: POST_HEADERS,
    body: buildBody(filters, page),
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};

export const fetchGetAvisosReservasnotificadas = async (
  cb: (data: any) => void,
  filters: AvisosFilters = { id_agente: "", nombre_agente: "", hotel: "", codigo_reservacion: "", traveler: "", tipo_hospedaje: "" },
  page = 1,
) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/notificadas`, {
    method: "POST",
    headers: POST_HEADERS,
    body: buildBody(filters, page),
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};

export const fetchFacturacionAviso = async (
  cb: (data: any) => void,
  params: { id_factura: string | number; id_relacion: string | number },
) => {
  console.log("informacion", params);

  const res = await fetch(`${URL}/mia/avisos_reservas/facturacion`, {
    method: "POST",
    headers: POST_HEADERS,
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};

export const fetchGenerarLayaut = async (
  cb: (data: any) => void,
  params: { id_relaciones: (string | number)[]; id_agente: string | number },
) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/generar_layaut`, {
    method: "POST",
    headers: POST_HEADERS,
    body: JSON.stringify(params),
    cache: "no-store",
  });
  const data = await res.json();
  cb(data);
};

export const postAvisosReservasAction = async (
  endpoint: "prefacturar" | "desligar" | "aprobar",
  ids: { id_relacion: string | number; id_booking: string | number }[],
  cb: (data: any) => void,
) => {
  const res = await fetch(`${URL}/mia/avisos_reservas/${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ ids }),
    cache: "no-store",
    credentials :"include"
  });

  const data = await res.json();
  cb(data);
};