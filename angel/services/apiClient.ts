import { API_KEY, URL } from "@/lib/constants";

export interface ApiResponse<T> {
  message: string;
  data: T | null;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
  metadata?: any;
}

export class ApiError extends Error {
  public status: number;
  public response: ApiResponse<any> | null;

  constructor(
    message: string,
    status: number,
    response: ApiResponse<any> | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type Headers = Record<string, string>;
type Params = Record<string, any>;

function buildQueryString(params: Params): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => queryParams.append(key, item.toString()));
    } else {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function request<T>(
  baseUrl: string,
  defaultHeaders: Headers,
  method: string,
  path: string,
  body?: any,
  customHeaders: Headers = {},
): Promise<ApiResponse<T>> {
  try {
    const headers = { ...defaultHeaders, ...customHeaders };
    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
      config.body = JSON.stringify(body);
    } else if (body && ["GET", "HEAD"].includes(method.toUpperCase())) {
      console.warn(
        `Advertencia: El método ${method} no debería tener un cuerpo. Los datos del 'body' serán ignorados.`,
      );
    }

    const response = await fetch(`${baseUrl}${path}`, config);

    if (!response.ok) {
      let errorResponse: ApiResponse<any> | null = null;
      let errorMessage = `HTTP error: status: ${response.status}`;

      try {
        errorResponse = (await response.json()) as ApiResponse<any>;
        if (errorResponse && typeof errorResponse.message === "string") {
          errorMessage = errorResponse.message;
        }
      } catch {
        errorMessage += `\n${response.statusText || "Error desconocido del servidor."}`;
      }

      throw new ApiError(errorMessage, response.status, errorResponse);
    }

    if (response.status === 204) {
      return { message: "Operación exitosa.", data: null as T };
    }

    const result = await response.json();
    if (
      result &&
      typeof result.message === "string" &&
      result.hasOwnProperty("data")
    ) {
      return result as ApiResponse<T>;
    }

    console.error("Respuesta de API exitosa no conforme:", result);
    throw new Error(
      "La respuesta de la API exitosa no sigue el formato esperado { message, data }.",
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Error de red o inesperado en la solicitud:", error);
    throw new Error(
      `Fallo de red o error inesperado: ${(error as Error).message}`,
    );
  }
}

export interface ApiClient {
  get<T>(path: string, params?: Params, headers?: Headers): Promise<ApiResponse<T>>;
  post<T>(path: string, body?: any, headers?: Headers): Promise<ApiResponse<T>>;
  put<T>(path: string, body?: any, headers?: Headers): Promise<ApiResponse<T>>;
  patch<T>(path: string, body?: any, headers?: Headers): Promise<ApiResponse<T>>;
  delete<T>(path: string, params?: Params, headers?: Headers): Promise<ApiResponse<T>>;
}

export function createApiClient(
  basePath: string,
  options: { baseUrl?: string; headers?: Headers } = {},
): ApiClient {
  const baseUrl = `${options.baseUrl ?? URL}${basePath}`;
  const defaultHeaders: Headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...options.headers,
  };

  return {
    get: (path, params = {}, headers) =>
      request(baseUrl, defaultHeaders, "GET", `${path}${buildQueryString(params)}`, undefined, headers),
    post: (path, body, headers) =>
      request(baseUrl, defaultHeaders, "POST", path, body, headers),
    put: (path, body, headers) =>
      request(baseUrl, defaultHeaders, "PUT", path, body, headers),
    patch: (path, body, headers) =>
      request(baseUrl, defaultHeaders, "PATCH", path, body, headers),
    delete: (path, params = {}, headers) =>
      request(baseUrl, defaultHeaders, "DELETE", `${path}${buildQueryString(params)}`, undefined, headers),
  };
}
