import { TypeFilters, UpdateRequestBody,AgenteConSaldos } from "@/types";
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

// @/services/agentes.ts
// export const fetchAgentesWithFacturableSaldos1 = async (
//   filters: TypeFilters,
//   defaultFilters: TypeFilters
// ): Promise<AgenteConSaldos[]> => {  // Cambiado a AgenteConSaldos[]
//   const queryParams = new URLSearchParams();

//   Object.entries({ ...filters, ...defaultFilters }).forEach(([key, value]) => {
//     if (value !== undefined && value !== null && value !== "") {
//       queryParams.append(key, value.toString());
//     }
//   });

//   const response = await fetch(
//     `${URL}/mia/agentes/all-with-active-facturable-saldos?${queryParams.toString()}`,
//     {
//       headers: {
//         "x-api-key": API_KEY,
//         "Cache-Control": "no-cache, no-store, must-revalidate",
//         Pragma: "no-cache",
//         Expires: "0",
//       },
//       cache: "no-store",
//     }
//   );
  
//   if (!response.ok) {
//     throw new Error("Error al cargar los datos");
//   }
  
//   const data: AgenteConSaldos[] = await response.json();
//   return data;
// };
export const fetchAgentesWithFacturableSaldos = async (
  filters: TypeFilters,
  defaultFilters: TypeFilters
): Promise<AgenteConSaldos[]> => {
  const queryParams = new URLSearchParams();

  Object.entries({ ...filters, ...defaultFilters }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const response = await fetch(
    `${URL}/mia/agentes/all-with-active-facturable-saldos?${queryParams.toString()}`,
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
  
  // Verificación de tipo segura
  if (!Array.isArray(data)) {
    throw new Error("La respuesta no es un array");
  }

  return data.map(item => ({
    ...item,
    saldos_facturables: item.saldos_facturables || [] // Asegura que siempre haya un array
  }));
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
//para empresas con datos fiscales
// export const fetchEmpresasAgentesDataFiscal = async (
//   id_agente: string,
//   callback?: (data: EmpresaFromAgent[]) => void
// ): Promise<EmpresaFromAgent[]> => {
//   try {
//     const response = await fetch(
//       `${URL}/mia/agentes/empresas-con-datos-fiscales?id_agente=${id_agente}`,
//       {
//         headers: {
//           "x-api-key": API_KEY,
//           "Cache-Control": "no-cache, no-store, must-revalidate",
//           Pragma: "no-cache",
//           Expires: "0",
//         },
//         cache: "no-store",
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Error ${response.status}: ${response.statusText}`);
//     }

//     const data = await response.json();

//     if (!data) {
//       return [];
//     }

//     // Validación básica de la estructura de datos
//     if (data && !Array.isArray(data) && data.id) {
//       const arrayData = [data];
//       if (callback) callback(arrayData);
//       return arrayData;
//     }

//     // Si es un array pero vacío
//     if (Array.isArray(data)) {
//       if (callback) callback(data);
//       return data;
//     }

//     throw new Error("Formato de respuesta no reconocido");

//   } catch (error) {
//     console.error("Error en fetchEmpresasAgentesDataFiscal:", error);
//     throw error;
//   }
// };

export const fetchEmpresasAgentesDataFiscal = async (
  id_agente: string,
  callback?: (data: EmpresaFromAgent[]) => void
): Promise<EmpresaFromAgent[]> => {
  try {
    console.log(`Solicitando empresas para agente: ${id_agente}`);
    const response = await fetch(
      `${URL}/mia/agentes/empresas-con-datos-fiscales?id_agente=${id_agente}`,
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
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Respuesta cruda de la API:", data);

    // Caso 1: Respuesta vacía o nula
    if (!data) {
      console.warn("La API devolvió una respuesta vacía");
      if (callback) callback([]);
      return [];
    }

    // Caso 2: Es un array (ya sea vacío o con datos)
    if (Array.isArray(data)) {
      // Validar estructura de cada elemento si es necesario
      const isValid = data.every(item => item.id && item.razon_social && item.rfc);
      if (!isValid) {
        console.warn("Algunos elementos del array no tienen la estructura esperada");
      }
      if (callback) callback(data);
      return data;
    }

    // Caso 3: Es un objeto individual con estructura de empresa
    if (data.id && data.razon_social && data.rfc) {
      const arrayData = [data];
      if (callback) callback(arrayData);
      return arrayData;
    }

    // Caso 4: Es un objeto con propiedad 'data' que contiene el array
    if (data.data && Array.isArray(data.data)) {
      if (callback) callback(data.data);
      return data.data;
    }

    // Caso 5: Es un objeto con propiedad 'empresas' que contiene el array
    if (data.empresas && Array.isArray(data.empresas)) {
      if (callback) callback(data.empresas);
      return data.empresas;
    }

    // Si no coincide con ningún formato conocido
    console.error("Formato de respuesta no reconocido:", data);
    throw new Error(`Formato de respuesta no reconocido. Tipo recibido: ${typeof data}`);
    
  } catch (error) {
    console.error("Error en fetchEmpresasAgentesDataFiscal:", error);
    // Retornar array vacío en caso de error para que la UI no se rompa
    return [];
  }
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

export const fetchAgenteById = async (id: string) => {
  // Limpiar el ID de posibles parámetros de consulta
  const cleanId = id.split("?")[0];
  console.log("ID limpio:", cleanId);

  try {
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
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Datos recibidos:", data);

    // Verificación básica de consistencia
    if (data.id && data.id !== cleanId) {
      console.warn(`ADVERTENCIA: El ID solicitado (${cleanId}) no coincide con el ID recibido (${data.id})`);
    }

    return data;
  } catch (error) {
    console.error("Error en fetchAgenteById:", error);
    throw error;
  }
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
