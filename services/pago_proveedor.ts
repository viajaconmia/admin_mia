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
        credentials:"include"
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
        "Hubo un error: " + (response as ErrorResponse).details.message ||
          "no se"
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
    const res = await fetch(`${URL}/mia/pago_proveedor/solicitud`, {
      headers: {
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // 1) valida HTTP
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} – ${errorBody}`);
    }

    // 2) parsea
    const json: GeneralResponse<SolicitudProveedor[]> = await res.json();

    // 3) valida contrato de app
    if (!json.ok) {
      throw new Error();
    }

    // 4) log idéntico al body que viste en Network → Response
    console.log("Respuesta solicitudes (body):", json);

    callback(json as SuccessResponse<SolicitudProveedor[]>);
  } catch (error: any) {
    alert(error.message ?? "Error desconocido");
    console.error(error);
    throw error;
  }
};

export const fetchGetSolicitudesProveedores1 = async (cb: (data: any) => void) => {
  const res = await fetch(`${URL}/mia/pago_proveedor/solicitud?bandera=1`, {
    method: "GET",
    headers: { "Content-Type": "application/json" ,
      "x-api-key": API_KEY,
    },
    cache: "no-store",
  });

  const data = await res.json();
  cb(data);
};
