import { API_KEY, URL } from "@/lib/constants";
import {
  ErrorResponse,
  GeneralResponse,
  Solicitud,
  SolicitudProveedor,
  SuccessResponse,
} from "@/types";
import { PaymentData } from "@/types/pago_proveedor";

export const fetchCreateSolicitud = async (
  solicitud: PaymentData,
  callback: (response: SuccessResponse<PaymentData>) => void
) => {
  try {
    const response: GeneralResponse<PaymentData> = await fetch(
      `${URL}/mia/pago_proveedor/solicitud`,
      {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ solicitud }),
        cache: "no-store",
      }
    )
      .then((res) => res.json())
      .catch((error) => {
        alert("Hubo un error");
        console.log(error);
        throw error;
      });

    if (!response.ok) {
      console.log(response);
      throw new Error(
        "Hubo un error: " + (response as ErrorResponse).details.message
      );
    }

    console.log(response);
    callback(response);
  } catch (error) {
    alert(error.message);
    console.log(error);
    throw error;
  }
};
export const fetchGetSolicitudesProveedores = async (
  callback: (response: SuccessResponse<SolicitudProveedor[]>) => void
) => {
  try {
    const response: GeneralResponse<SolicitudProveedor[]> = await fetch(
      `${URL}/mia/pago_proveedor/solicitud`,
      {
        headers: {
          "x-api-key": API_KEY,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )
      .then((res) => res.json())
      .catch((error) => {
        alert("Hubo un error");
        console.log(error);
        throw error;
      });

    if (!response.ok) {
      console.log(response);
      throw new Error(
        "Hubo un error: " + (response as ErrorResponse).details.message
      );
    }

    console.log(response);
    callback(response);
  } catch (error) {
    alert(error.message);
    console.log(error);
    throw error;
  }
};
