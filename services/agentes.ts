import { TypeFilters, UpdateRequestBody } from "@/types";
import { API_KEY, URL } from "@/lib/constants";


// ... otros imports y funciones existentes ...

export const fetchPagosByAgente = async (agenteId: string): Promise<Pago[]> => {
  const response = await fetch(`${URL}/mia/pagos/agente?id=${agenteId}`, {
    headers: {
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    cache: "no-store",
  });
  
  if (!response.ok) {
    throw new Error("Error al cargar los pagos del agente");
  }
  
  const data = await response.json();
  return data;
};

// Tipo para los pagos
interface Pago {
  id: string;
  id_cliente: string;
  cliente: string;
  fecha_creacion: string;
  monto: number;
  forma_pago: string;
  referencia: string;
  fecha_pago: string;
  descuento: number;
  motivo: string;
  comentarios: string;
  aplicable: boolean;
  comprobante_url: string | null;
}

export const fetchInitSuperAgent = async (
  email: string,
  callback: (data: { link: string }) => void
) => {
  const response = await fetch(`${URL}/mia/impersonate/impersonate-user`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.log(response);
    throw new Error("Error al cargar los datos");
  }
  const data = await response.json();
  callback(data);
  return data;
};

export const fetchUpdateEmpresasAgentes = async (
  updateBody: UpdateRequestBody,
  callback: (data) => void
) => {
  const response = await fetch(`${URL}/mia/agentes/`, {
    method: "PUT",
    headers: {
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateBody),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Error al cargar los datos");
  }
  const data = await response.json();
  console.log(data);
  callback(data);
  return data;
};

export const fetchEmpresasAgentes = async (
  id_agente: string,
  callback: (data: EmpresaFromAgent[]) => void
) => {
  const response = await fetch(`${URL}/mia/agentes/empresas?id=${id_agente}`, {
    headers: {
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Error al cargar los datos");
  }
  const data: EmpresaFromAgent[] = await response.json();
  callback(data);
  return data;
};
export const fetchAgentes = async (
  filters: TypeFilters,
  defaultFilters: TypeFilters,
  callback: (data: Agente[]) => void
) => {
  const queryParams = new URLSearchParams();

  Object.entries({ ...filters, ...defaultFilters }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const response = await fetch(
    `${URL}/mia/agentes/all?${queryParams.toString()}`,
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
    throw new Error("Error al cargar los datos");
  }
  const data = await response.json();
  callback(data);
  return data;
};
export const fetchAgenteById = async (id) => {
  const cleanId = id.split("?")[0];
  const response = await fetch(`${URL}/mia/agentes/id?id=${cleanId}`, {
    headers: {
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Error al cargar los datos");
  }
  const data = await response.json();
  console.log(data);
  return data[0];
};
export const fetchEmpresasByAgente = async (id) => {
  try {
    const response = await fetch(`${URL}/mia/empresas/agente?id=${id}`, {
      headers: {
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Error al cargar los datos");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// API functions
export const fetchViajerosByAgente = async (id: string) => {
  try {
    const response = await fetch(`${URL}/mia/viajeros/agente?id=${id}`, {
      headers: {
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Error al cargar los datos");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
