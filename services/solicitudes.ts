import { TypeFilters, Solicitud } from "@/types";
import { API_KEY, URL } from "@/lib/constants";

export const fetchSolicitudes = async (
  filters: TypeFilters,
  defaultFilters: TypeFilters,
  callback: (data: Solicitud[]) => void
) => {
  try {
    const queryParams = new URLSearchParams();

    Object.entries({ ...filters, ...defaultFilters }).forEach(
      ([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      }
    );

    const url = `${URL}/mia/solicitud?${queryParams.toString()}`;

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
