import { URL, API_KEY } from "@/constant/index";
import { Viajero } from "@/types";

export const fetchViajeros = async (id, callback) => {
  if (!id) {
    console.log("No hay id de viajero");
    return;
  }
  try {
    const response = await fetch(
      `https://miaback.vercel.app/v1/mia/viajeros/id?id=${id}`,
      {
        headers: {
          "x-api-key": API_KEY || "",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        cache: "no-store",
      }
    ).then((res) => res.json());
    callback(response);
  } catch (error) {
    console.log(error);
    throw new Error("Error al cargar los datos de los viajeros");
  }
};
export const fetchViajerosFromAgent = async (
  id: string,
  callback: (data: Viajero[]) => void
) => {
  try {
    const response = await fetch(`${URL}/mia/viajeros/id?id=${id}`, {
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    }).then((res) => res.json());
    if (response.error) {
      console.error(response);
      throw new Error("Error al buscar los viajeros");
    }
    callback(response as Viajero[]);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
