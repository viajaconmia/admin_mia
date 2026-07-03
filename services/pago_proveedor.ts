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

// Mapea las claves del estado de filtros del front a los query params que espera el backend.
const FILTER_KEY_MAP: Record<string, string> = {
  codigo_reservacion: "folio",
  statusPagoProveedor: "estatus_pagos",
};

export const fetchGetSolicitudesFiltradas = async (
  cb: (data: any) => void,
  filters: Record<string, any> = {},
  limit: number | null = null,
  pag: number = 1,
) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    const apiKey = FILTER_KEY_MAP[key] ?? key;
    params.append(apiKey, v);
  });

  params.set("pag", String(pag > 0 ? pag : 1));
  params.set("limite", String(limit && limit > 0 ? limit : 50));

  const res = await fetch(
    `${URL}/mia/pago_proveedor/solicitud?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      cache: "no-store",
    },
  );

  const data = await res.json();
  cb(data);
};

export const fetchSolicitudesLu = async (
  estado: "Dispersion" | "PAGADO TRANSFERENCIA" | null = null,
): Promise<any[]> => {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);

  const res = await fetch(
    `${URL}/mia/pago_proveedor/solicitudes_lu?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      credentials: "include",
      cache: "no-store",
    },
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `Error HTTP: ${res.status}`);
  return Array.isArray(json?.data) ? json.data : [];
};

export const fetchConteosRapidos = async (
  filters: Record<string, any> = {},
): Promise<Record<string, number>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    params.append(FILTER_KEY_MAP[key] ?? key, v);
  });
  params.set("tipo", "conteos");
  const res = await fetch(`${URL}/mia/pago_proveedor/solicitud?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    cache: "no-store",
  });
  const json = await res.json();
  return json?.data?.[0] ?? json?.data ?? {};
};

export const fetchBucketSolicitudes = async (
  bucket: string,
  filters: Record<string, any> = {},
  limit: number | null = null,
  pag: number = 1,
): Promise<any> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    params.append(FILTER_KEY_MAP[key] ?? key, v);
  });
  params.set("bucket", bucket);
  params.set("pag", String(pag > 0 ? pag : 1));
  params.set("limite", String(limit && limit > 0 ? limit : 50));
  const res = await fetch(`${URL}/mia/pago_proveedor/solicitud?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    cache: "no-store",
  });
  return res.json();
};
export const fetchResumenCxp = async (
  filters: Record<string, any> = {},
): Promise<any> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    params.append(key, v);
  });

  const res = await fetch(
    `${URL}/mia/pago_proveedor/resumen_cxp?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      credentials: "include",
      cache: "no-store",
    },
  );

  const json = await res.json();

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || "Error al obtener resumen CXP");
  }

  return json;
};
export const fetchDetalleCxp = async (
  filters: Record<string, any> = {},
): Promise<any> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const v = String(value ?? "").trim();
    if (!v) return;
    params.append(key, v);
  });

  const res = await fetch(
    `${URL}/mia/pago_proveedor/detalle_cxp?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      credentials: "include",
      cache: "no-store",
    },
  );

  const json = await res.json();

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || "Error al obtener detalle CXP");
  }

  return json;
};
export const fetchHistorialCuentaProveedor = async (
  idProveedorCuenta: number | string,
): Promise<any[]> => {
  const res = await fetch(
    `${URL}/mia/pago_proveedor/cuentas/${idProveedorCuenta}/historial`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      credentials: "include",
      cache: "no-store",
    },
  );

  const json = await res.json();

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || "Error al obtener historial de cuenta");
  }

  return Array.isArray(json?.data) ? json.data : [];
};
export const aprobarRevisionCuentaProveedor = async (
  idProveedorCuenta: number | string,
): Promise<any> => {
  const res = await fetch(
    `${URL}/mia/pago_proveedor/cuentas/${idProveedorCuenta}/aprobar_revision`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      credentials: "include",
      cache: "no-store",
    },
  );

  const json = await res.json();

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || "Error al aprobar cuenta");
  }

  return json;
};