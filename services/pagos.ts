import { TypeFilters, UpdateRequestBody,AgenteConSaldos } from "@/types";
import { API_KEY, URL } from "@/lib/constants";

type Primitive = string | number | boolean | null | undefined;

export interface PagoPrepago {
  [key: string]: any;
}

export interface Balance {
  [key: string]: any;
}

export const fetchPagosPrepago = async (
  filters: Record<string, Primitive> = {},
  defaultFilters: Record<string, Primitive> = {}
): Promise<PagoPrepago[]> => {
  const queryParams = new URLSearchParams();

  // combinamos filtros: los de `filters` tienen prioridad sobre `defaultFilters`
  Object.entries({ ...defaultFilters, ...filters }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  
  const response = await fetch(
    `${URL}/mia/pagos/getAllPagosPrepago?${queryParams.toString()}`,
    {
      headers: {
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Error al cargar los pagos de prepago (HTTP ${response.status})`);
  }

  const json = await response.json();
  
  // Esperamos { message: string, data: any }
  if (!json || !("data" in json)) {
    throw new Error("La respuesta no contiene la propiedad 'data'");
  }
  if (!Array.isArray(json.data)) {
    throw new Error("La propiedad 'data' no es un arreglo");
  }

  return json.data as PagoPrepago[];
};

// 1. Primero ajusta la función fetch
export const fetchPagosPrepagobalance = async (
  filters: Record<string, Primitive> = {},
  defaultFilters: Record<string, Primitive> = {}
): Promise<Balance> => {  // Cambiamos el tipo de retorno
  const queryParams = new URLSearchParams();

  Object.entries({ ...defaultFilters, ...filters }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  
  const response = await fetch(
    `${URL}/mia/pagos/getAllPagosPrepago?${queryParams.toString()}`,
    {
      headers: {
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Error al cargar los pagos de prepago (HTTP ${response.status})`);
  }

  const json = await response.json();

  // Verificamos la estructura de la respuesta
  if (!json || !("balance" in json) || !Array.isArray(json.balance) ){
    throw new Error("La respuesta no contiene un balance válido");
  }

  // Extraemos el primer elemento del array
  const balanceData = json.balance[0];
  // Retornamos el objeto balance directamente
  return {
    montototal: balanceData.total_pagos || "0",
    montofacturado: balanceData.total_facturado || "0",
    restante: balanceData.restante || "0",
    total_reservas_confirmadas:balanceData.total_reservas_confirmadas||"0"
  };
};