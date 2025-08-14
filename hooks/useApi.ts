import { CfdiInvoice } from "../types/billing";
// import { supabase } from "../services/supabaseClient";
import { ENDPOINTS, ROUTES, URL, HEADERS_API } from "../lib/constants/index";

// export const probando = async () => {
//   const { data } = await supabase.auth.getUser();
//   const { data: bookings } = await supabase
//     .from("bookings")
//     .select("*")
//     .eq("user_id", data.user?.id);
//   console.log(bookings);
// };

async function safeFetchJSON(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const raw = await res.text(); // nunca truena aunque el body esté vacío
  let data: any = null;

  if (raw) {
    try { data = JSON.parse(raw); }
    catch { data = { raw }; } // por si el backend manda HTML o texto
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.Message)) ||
      res.statusText ||
      "Error HTTP";
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const useApi = () => {
  const obtenerSessionCheckout = async (ID_CHECKOUT_SESSION: string) => {
    const response = await fetch(
      `${URL}${ROUTES.stripe}${ENDPOINTS.retrieve}?id_checkout=${ID_CHECKOUT_SESSION}`,
      {
        method: "GET",
        headers: HEADERS_API,
      }
    );
    const json = await response.json();
    console.log(json);
  };

  
  const crearSessionCheckout = async (payment_data) => {
    const response = await fetch(`${URL}${ROUTES.stripe}${ENDPOINTS.create}`, {
      method: "POST",
      headers: HEADERS_API,
      body: JSON.stringify({ payment_data }),
    });
    const json = await response.json();
    /* Aqui puedes agregar a la base de datos o asi */
    window.location.replace(json.url);
  };

  const getFactura = async (endpoint: string, params: string) => {
    const response = await fetch(
      `${URL}${ROUTES.factura}${endpoint}${params ? params : ""}`,
      {
        method: "GET",
        headers: HEADERS_API,
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  };

    const postFactura = async (endpoint: string, body: PostBodyParams) => {
    return safeFetchJSON(`${URL}${ROUTES.factura}${endpoint}`, {
      method: "POST",
      headers: HEADERS_API,
      body: JSON.stringify(body),
    });
  };

  const crearCfdi = async (
    cfdi: CfdiInvoice,
    info_user: {
      id_user: string;
      id_solicitud: string[];
      id_items: string[];
    }
  ) => {
    try {
      const response = await fetch(`${URL}/mia/factura/combinada`, {
        method: "POST",
        headers: HEADERS_API,
        body: JSON.stringify({ cfdi, info_user }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      return json;
    } catch (error) {
      console.error("Error en crearCfdi:", error);
      throw {
        error: "Error al crear CFDI",
        details: error.message,
        originalError: error,
      };
    }
  };
  
  
//   const crearCfdiEmi = async (
//     cfdi: CfdiInvoice,
//     info_user: {
//       id_user: string;
//       id_solicitud: string[];
//       id_items: string[];
//     }
//   ) => {
//     try {
//       const response = await fetch(`${URL}/mia/factura/combinadaEmi`, {
//         method: "POST",
//         headers: HEADERS_API,
//         body: JSON.stringify({ cfdi, info_user }),
//       });

//       // if (!response.ok) {
//       //   console.log("Error de http")
//       //   throw new Error(`HTTP error! status: ${response.status}`);
//       // }

//       const json = await response.json();
// console.log(json)
//       // if (json.error) {
//       //   throw new Error(json.error);
//       // }

//       return json;
//     } catch (error) {
//       console.error("Error en crearCfdi:", error);
//       throw {
//         error: "Error al crear CFDI",
//         details: error.message,
//         originalError: error,
//       };
//     }
//   };

  const crearCfdiEmi = async (payload: {
    cfdi: CfdiInvoice;
    info_user: { id_user: string;};
    datos_empresa: { rfc: string; id_empresa: string };
  }) => {
    try {
      const json = await safeFetchJSON(`${URL}/mia/factura/combinadaEmi`, {
        method: "POST",
        headers: HEADERS_API,
        body: JSON.stringify(payload),
      });
      console.log("crearCfdiEmi OK:", json);
      return json;
    } catch (error: any) {
      console.error("Error en crearCfdiEmi:", error?.status, error?.data || error);
      // Re-lanza con formato consistente para el componente
      throw {
        error: "Error al crear CFDI",
        status: error?.status || 500,
        details: error?.data || error?.message || "Error no identificado",
      };
    }
  };

  const obtenerClientes = async () =>
    await getFactura(ENDPOINTS.facturas.getClientes.endpoint, "");

  const obtenerClientesPorRfc = async (clientRfc: string) =>
    await getFactura(
      ENDPOINTS.facturas.getClientesPorRfc.endpoint,
      `?clientRfc=${clientRfc}`
    );

  const obtenerClientesPorId = async (clientId: string) =>
    await getFactura(
      ENDPOINTS.facturas.getClientesPorId.endpoint,
      `?clientId=${clientId}`
    );

  const obtenerlistaCfdisPorCliente = async (rfc: string) =>
    await getFactura(ENDPOINTS.facturas.getCfdi.endpoint, `?rfc=${rfc}`);

  const descargarFactura = async (cfdi_id: string) =>
    postFactura(ENDPOINTS.facturas.downloadCfdi.endpoint, { cfdi_id });

  const descargarFacturaXML = async (cfdi_id: string) =>
    postFactura(ENDPOINTS.facturas.downloadCfdiXML.endpoint, { cfdi_id });

  const mandarCorreo = async (id_cfdi: string, email: string) =>
    postFactura(ENDPOINTS.facturas.sendEmail.endpoint, { id_cfdi, email });

  // const crearClient = async (client: any) =>
  //   postFactura(ENDPOINTS.facturas.createClient.endpoint, { client });

  return {
    crearSessionCheckout,
    obtenerSessionCheckout,
    obtenerClientes,
    obtenerClientesPorRfc,
    obtenerClientesPorId,
    obtenerlistaCfdisPorCliente,
    descargarFactura,
    mandarCorreo,
    crearCfdi,
    crearCfdiEmi,
    descargarFacturaXML,
    // crearClient,
  };
};

interface DataToDownload {
  cfdi_id: string;
}

interface DataToSendEmail {
  id_cfdi: string;
  email: string;
}

interface DataToCreateCfdi {
  cfdi: CfdiInvoice;
}

type PostBodyParams = DataToDownload | DataToSendEmail | DataToCreateCfdi;

export default useApi;
