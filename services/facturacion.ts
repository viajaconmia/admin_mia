// services/fetchFacturas.ts
import { API_KEY, URL } from "@/lib/constants";

export type FacturaResponse = {
  id_factura?: string;
  codigo?: string;
  total?: number;
  fecha_emision?: string;
  error?: string;
  [key: string]: any;
};

type FetchFacturasParams = {
  id_agente: string;
  id_buscar: string;
};

export async function fetchFacturas({
  id_agente,
  id_buscar,
}: FetchFacturasParams): Promise<FacturaResponse[]> {
  console.log(id_agente,id_buscar)
  if (!id_agente || !id_buscar) {
    throw new Error("Faltan parámetros: id_agente e id_buscar son requeridos");
  }

  const endpoint = `${URL}/mia/factura/getfulldetalles?id_agente=${encodeURIComponent(
    id_agente
  )}&id_buscar=${encodeURIComponent(id_buscar)}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Error al cargar los datos de facturas");
    }

    if (Array.isArray(data) && (data[0]?.error || data[1]?.error)) {
      throw new Error("Error en los datos recibidos");
    }

    return data as FacturaResponse[];
  } catch (error) {
    console.error("Error al cargar los datos en facturas:", error);
    throw error;
  }
}
