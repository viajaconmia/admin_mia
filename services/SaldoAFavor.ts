  import { URL, API_KEY } from "@/lib/constants/index";

  export interface NuevoSaldoAFavor {
    id_cliente: string;
    monto_pagado: number;
    forma_pago:
      | "transferencia"
      | "tarjeta"
      | "wallet";
    is_facturable: boolean;
    referencia?: string;
    fecha_pago: string;
    tipo_tarjeta: string;
    link_stripe?: string;
    descuento_aplicable?: boolean;
    comentario?: string;
    ult_digits: string,
    banco_tarjeta: string,
    numero_autorizacion: string
  }

  export interface Saldo {
    id_saldos: number | null;
    id_agente: string;
    fecha_creacion: string | null;
    saldo: string | null;
    monto: string;
    metodo_pago: string;
    fecha_pago: string;
    concepto: string | null;
    referencia: string | null;
    currency: string | null;
    tipo_tarjeta: string | null;
    comentario: string | null;
    link_stripe: string | null;
    is_facturable: number | null;
    is_descuento: number | null;
    comprobante: string | null;
    created_at: string | null;
    updated_at: string | null;
    tiene_credito_consolidado: number | null;
    monto_credito: string | null;
    nombre: string | null;
    notas: string | null;
    vendedor: string | null;
    por_confirmar: string | null;
    activo?: boolean | null;
      ult_digits: string| null,
    banco_tarjeta: string| null,
    numero_autorizacion: string | null
    
  } 

  export class SaldoFavor {
    private static baseURL: string = URL;
    private static ROUTER: string = "/mia/saldo";
    private static ENDPOINTS: Record<string, string> = {
      crearPago: "/new",
      actualizarPago: "/actualizar-saldo-a-favor",
      obtenerPagos: "/", // Para GET /mia/saldo/:id
    };

    private static async request<T>(
      endpoint: string,
      options: RequestInit
    ): Promise<T> {
      //Aqui igual el T se cmabia por el objeto que Ian enviara de respuesta
      const response = await fetch(`${this.baseURL}${this.ROUTER}${endpoint}`, {
        headers: {
          "x-api-key": API_KEY || "", //Esta igual la extraes de lib/constant/index
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return response.json();
    }

    // Crear nuevo saldo a favor
    static async crearPago(data: NuevoSaldoAFavor) {
      if ((data.forma_pago.includes("tarjeta")) && !data.tipo_tarjeta) {
        throw new Error("Tipo de tarjeta es requerido para pagos con tarjeta");
      }

      const payload = data.forma_pago === "wallet"
        ? { ...data, tipo_tarjeta: null }
        : data;

      return this.request<{ success: boolean, data: Saldo }>(
        this.ENDPOINTS.crearPago,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    }

    // Actualizar pago existente
    static async actualizarPago(data: Partial<Saldo> & { id_saldos: number }) {
      if (!data.id_saldos) {
        throw new Error("ID de saldo es requerido para actualizar");
      }

      return this.request<{ success: boolean, data: Saldo }>(
        this.ENDPOINTS.actualizarPago,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );
    }

    // Obtener pagos por agente
    static async getPagos(idAgente: string) {
      return this.request<{ message: string, data: Saldo[] }>(
        `/${idAgente}`,
        {
          method: "GET"
        }
      );
    }
  }