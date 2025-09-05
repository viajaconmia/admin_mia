import { API_KEY, URL } from "@/lib/constants";

// Definimos la interfaz para la respuesta estándar, incluyendo el error opcional
export interface ApiResponse<T> {
  message: string;
  data: T | null;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
}

// Clase para errores específicos de la API, encapsulando la respuesta de error
export class ApiError extends Error {
  public status: number;
  public response: ApiResponse<any> | null; // La respuesta completa del servidor si estaba en formato ApiResponse

  constructor(
    message: string,
    status: number,
    response: ApiResponse<any> | null = null
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class ApiService {
  private url_base = URL;
  private headers: { "Content-Type": string; "x-api-key": string } = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  protected formatPath(endpoint: string): string {
    return `${this.path}${endpoint}`;
  }

  protected async request<T>(
    method: string,
    path: string,
    body?: any,
    customHeaders: { [key: string]: any } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = { ...this.headers, ...customHeaders };
      const config: RequestInit = {
        method,
        headers,
      };

      if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
        config.body = JSON.stringify(body);
      } else if (body && ["GET", "HEAD"].includes(method.toUpperCase())) {
        console.warn(
          `Advertencia: El método ${method} no debería tener un cuerpo. Los datos del 'body' serán ignorados.`
        );
      }

      const response = await fetch(`${this.url_base}${path}`, config);

      if (!response.ok) {
        let errorResponse: ApiResponse<any> | null = null;
        let errorMessage = `HTTP error: status: ${response.status}`;

        try {
          // Intentamos parsear la respuesta como ApiResponse<any> incluso en error
          errorResponse = (await response.json()) as ApiResponse<any>;
          // Si tiene la estructura esperada de ApiResponse, usamos su mensaje y error
          if (errorResponse && typeof errorResponse.message === "string") {
            errorMessage = errorResponse.message;
          }
        } catch (e) {
          // Si no es JSON o no tiene el formato esperado, tomamos el statusText
          errorMessage += `\n${
            response.statusText || "Error desconocido del servidor."
          }`;
        }
        // Lanzamos nuestra ApiError personalizada con la información detallada
        throw new ApiError(errorMessage, response.status, errorResponse);
      }

      // Manejar respuestas 204 No Content
      if (response.status === 204) {
        return {
          message: "Operación exitosa.",
          data: null as T,
        };
      }

      // Para respuestas exitosas, esperamos el formato { message, data }
      const result = await response.json();
      if (
        result &&
        typeof result.message === "string" &&
        result.hasOwnProperty("data")
      ) {
        return result as ApiResponse<T>;
      } else {
        console.error("Respuesta de API exitosa no conforme:", result);
        throw new Error(
          "La respuesta de la API exitosa no sigue el formato esperado { message, data }."
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Error de red o inesperado en la solicitud:", error);
      throw new Error(
        `Fallo de red o error inesperado: ${(error as Error).message}`
      );
    }
  }

  // Helper para construir la cadena de consulta
  private buildQueryString(params: { [key: string]: any }): string {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]: [string, any]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  protected async get<T>({
    path,
    headers,
    params = {},
  }: {
    path: string;
    headers?: { [key: string]: any };
    params?: { [key: string]: any };
  }): Promise<ApiResponse<T>> {
    const fullPath = `${path}${this.buildQueryString(params)}`;
    return this.request<T>("GET", fullPath, undefined, headers);
  }

  protected async post<T>({
    path,
    body,
    headers,
  }: {
    path: string;
    body?: any;
    headers?: { [key: string]: any };
  }): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, headers);
  }

  protected async put<T>({
    path,
    body,
    headers,
  }: {
    path: string;
    body?: any;
    headers?: { [key: string]: any };
  }): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body, headers);
  }

  protected async patch<T>({
    path,
    body,
    headers,
  }: {
    path: string;
    body?: any;
    headers?: { [key: string]: any };
  }): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, headers);
  }

  protected async delete<T>({
    path,
    headers,
    params = {},
  }: {
    path: string;
    headers?: { [key: string]: any };
    params?: { [key: string]: any };
  }): Promise<ApiResponse<T>> {
    const fullPath = `${path}${this.buildQueryString(params)}`;
    return this.request<T>("DELETE", fullPath, undefined, headers);
  }
}
