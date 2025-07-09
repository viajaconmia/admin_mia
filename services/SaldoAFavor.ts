import { URL, API_KEY } from "@/lib/constants/index";

interface NuevoSaldoAFavor {
  id_cliente: string;
  monto_pagado: number;
  forma_pago:
    | "transferencia"
    | "tarjeta de credito"
    | "tarjeta de debito"
    | "wallet";
  is_facturable: boolean;
  referencia?: string;
  fecha_pago: string;
  tipo_tarjeta: "credito" | "debito";
  link_stripe?: string;
  descuento_aplicable?: boolean;
  comentario?: string;
}

export class SaldoFavor {
  private static baseURL: string = URL; //importala de lib/constant/index.ts
  private static ROUTER: string = "/mia/saldo"; //este no se cual sea, cuando ian lo cree se debera cambiar
  private static ENDPOINTS: Record<string, string> = {
    crearPago: "/new",
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
    return this.request(this.ENDPOINTS.crearPago, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
