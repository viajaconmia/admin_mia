import { FullHotelData } from "@/app/dashboard/hoteles/_components/hotel-table";
import { API_KEY } from "@/lib/constants";
import { TypeFilters } from "@/types";

export const fetchHoteles = async (callback: (data) => void = (data) => {}) => {
  try {
    const response = await fetch("https://miaback.vercel.app/v1/mia/hoteles", {
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    }).then((res) => res.json());
    if (response.error) {
      console.log("Error en la respuesta de hoteles: ", response.error);
      throw new Error("Error al cargar los datos de los hoteles");
    }
    callback(response);
    return response;
  } catch (error) {
    console.log(error);
    throw new Error("Error al cargar los datos de los hoteles");
  }
};

export const fetchHotelesFiltro_Avanzado = async (
  filters: TypeFilters,
  callback: (data: FullHotelData[]) => void
) => {
  try {
    console.log("Preparando filtros:", filters);

    // Preparar el payload eliminando valores nulos/vacíos
    const payload = Object.entries(filters).reduce((acc, [key, value]) => {
      // Convertir booleanos a 1/0 para el backend
      if (typeof value === "boolean") {
        return { ...acc, [key]: value ? 1 : 0 };
      }

      // Ignorar valores nulos, undefined o strings vacíos
      if (value !== null && value !== undefined && value !== "") {
        return { ...acc, [key]: value };
      }

      return acc;
    }, {});

    console.log("Payload enviado:", payload);

    const response = await fetch(
      "https://miaback.vercel.app/v1/mia/hoteles/Filtro-avanzado",
      //"http://localhost:3001/v1/mia/hoteles/Filtro-avanzado"
      {
        method: "POST", // Usar POST para enviar el body
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Procesar la respuesta según la estructura esperada
    const rawData = result.hoteles || result.data || result;
    const hoteles = Array.isArray(rawData) ? rawData : [rawData];

    console.log("Hoteles recibidos:", hoteles);
    callback(hoteles);

    return hoteles;
  } catch (error) {
    console.error("Error en fetchHotelesFiltro_Avanzado:", error);
    callback([]); // Retornar array vacío en caso de error
    throw error; // Opcional: relanzar el error para manejo externo
  }
};
