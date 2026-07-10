import { TypeFilters, Solicitud, Solicitud2 } from "@/types";
import { API_KEY, URL } from "@/lib/constants";

export const fetchSolicitudes = async (
  filters: TypeFilters,
  defaultFilters: TypeFilters,
  callback: (data: Solicitud[]) => void
) => {
  try {
    const url = `${URL}/mia/reservasClient/filtro_solicitudes_y_reservas?p_criterio=0`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ ...filters }),
    });

    const data = await res.json();
    // console.log(data);
    callback(data);
    return data;
  } catch (err) {
    console.error("Error al actualizar solicitudes:", err);
  }
};

export const fetchSolicitudes2 = async (
  filters: TypeFilters,
  defaultFilters: TypeFilters,
  callback: (data: Solicitud2[]) => void
) => {
  try {
    // Construir el body con todos los filtros
    const body = { ...filters, ...defaultFilters };

    // URL con query param fijo
    const url = `${URL}/mia/reservasClient/filtro_solicitudes_y_reservas?p_criterio=1`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY || "",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    callback(data.data || []);
    return data;
  } catch (err) {
    console.log(err.response || err.message || "ERROR DESCONOCIDO");
    console.error("Error al actualizar solicitudes:", err);
  }
};

export const fetchOtp = async (callback: (data: any) => void) => {
  try {
    const url = `${URL}/otp/all`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache",
      },
    });

    const data = await res.json();
    console.log(data);
    callback(data);
    return data;
  } catch (err) {
    console.error("Error al obtener otps:", err);
  }
};
export const fetchHotelEdicion = async (id_booking: string) => {
  try {
    const url = `${URL}/mia/reservasClient/hotel_edicion?id_booking=${id_booking}`;

    console.log("LLAMANDO HOTEL_EDICION:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error al obtener detalle de hotel");
    }

    return data.data;
  } catch (err) {
    console.error("Error al obtener detalle de hotel:", err);
    throw err;
  }
};