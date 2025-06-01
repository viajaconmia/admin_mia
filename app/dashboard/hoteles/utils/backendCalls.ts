import { API_KEY } from "@/app/constants/constantes";

// utils/backend.ts
export const createHotel = async (payload: any) => {
  try {
    const response = await fetch(
      "https://mianoktos.vercel.app/v1/mia/hoteles/Agregar-hotel/",
      {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData = await response.json();
    return { ok: response.ok, data: responseData, status: response.status };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};
