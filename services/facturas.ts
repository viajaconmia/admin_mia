import { API_KEY, URL } from "@/lib/constants";
import { SuccessResponse, ErrorResponse, TypeFilters } from "@/types";

export interface FacturaLinkPagoItem {
  id_factura: string;
  uuid_factura: string;
  total: number;
  folio: string;
  saldo: number;
  monto_a_pagar: number;
}

export interface LinkPagoResponse {
  ok: boolean;
  url: string;
  session_id: string;
}

export const crearLinkPago = async (
  facturas: FacturaLinkPagoItem[],
): Promise<LinkPagoResponse> => {
  const response = await fetch(`${URL}/mia/factura/link-pago`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(facturas),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Error HTTP ${response.status}`);
  }

  const data: LinkPagoResponse = await response.json();
  if (!data.ok) throw new Error("El servidor respondió con ok: false");
  return data;
};

export const fetchIsFacturada = async (
  id_hospedaje: string,
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
      },
    );

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch((err) => {
        console.error(
          `Error al verificar factura para ${id_hospedaje}:`,
          errorData.error || `HTTP error! status: ${response.status}`,
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
        "La estructura de la respuesta de la API no es la esperada.",
      );
    }
  } catch (error: any) {
    console.error(
      `Ocurrió un error en fetchIsFacturada para ${id_hospedaje}:`,
      error.message,
    );
    throw error;
  }
};

export const fetchFacturas = async (
  filters: TypeFilters,
  callback: (data: any[]) => void,
) => {
  try {
    console.log("Preparando filtros:", filters);
    const payload = Object.entries(filters).reduce((acc, [key, value]) => {
      if (typeof value === "boolean") {
        return { ...acc, [key]: value ? 1 : 0 };
      }
      if (value !== null && value !== undefined && value !== "") {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {});

    console.log("Payload enviado:", payload);

    const response = await fetch(`${URL}/mia/factura/filtrarFacturas`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      console.error("Error al cargar las facturas:", errorData.error);
      throw new Error(`Error al cargar las facturas: ${errorData.error}`);
    }
    const { data } = await response.json();
    callback(data);
  } catch (error) {
    console.error("Error en fetchFacturas:", error);
    callback([]);
    throw error;
  }
};
