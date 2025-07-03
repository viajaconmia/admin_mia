import { API_KEY, URL } from "@/lib/constants";
import { SuccessResponse, ErrorResponse } from "@/types";

export const fetchIsFacturada = async (
  id_hospedaje: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${URL}/mia/factura/isFacturada/${id_hospedaje}`,
      {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch((err) => {
        console.error(
          `Error al verificar factura para ${id_hospedaje}:`,
          errorData.error || `HTTP error! status: ${response.status}`
        );
        throw errorData;
      });
    }

    const data: SuccessResponse<{ facturada: boolean }> = await response.json();

    if (data.ok && "facturada" in data.data) {
      return data.data.facturada;
    } else {
      console.error("Respuesta inesperada de la API:", data);
      throw new Error(
        "La estructura de la respuesta de la API no es la esperada."
      );
    }
  } catch (error: any) {
    console.error(
      `Ocurrió un error en fetchIsFacturada para ${id_hospedaje}:`,
      error.message
    );
    throw error;
  }
};
