// import { API_KEY, URL } from "@/lib/constants/index";
// // class SaldoFavor1 {
// //   private endpoint: string = "https://api.example.com/saldoafavor";

// //   private constructor() {}

// //   public async getSaldoAFavor(): Promise<number> {
// //     // Simulate an API call to fetch the balance
// //     return new Promise((resolve) => {
// //       setTimeout(() => resolve(1000), 1000);
// //     });
// //   }
// // }

// //saldo a favor
// //==================================
// export interface FormSaldoFavor {
//   id_cliente: string; // Se obtiene al entrar a la wallet del cliente
//   monto_pagado: number;
//   forma_pago:
//   | "transferencia"
//   | "tarjeta de credito"
//   | "tarjeta de debito"
//   | "wallet"; //De aqui obtienes el tipo de tarjeta
//   is_facturable: boolean;
//   referencia?: string;
//   fecha_pago: string;
//   tipo_tarjeta: "credito" | "debito"; // Este extraelo a la hora de colocar lo de la forma de pago, puedes seleccionar hasta si quieres un value de debit y credit en lugar de tarjeta de credito y asi en el select y replicas el valor aqui y si es wallet lo eliminas, que inicial este null
//   link_stripe?: string;
//   descuento_aplicable?: boolean;
//   comentario?: string;
// }

// export interface NuevoSaldoAFavor {
//   id_cliente: string;
//   monto_pagado: number;
//   forma_pago: "transferencia" | "tarjeta de credito" | "tarjeta de debito" | "wallet";
//   is_facturable: boolean;
//   referencia?: string;
//   fecha_pago: string;
//   tipo_tarjeta?: "credito" | "debito"; // Hacer opcional ya que no aplica para wallet
//   link_stripe?: string;
//   descuento_aplicable?: boolean;
//   comentario?: string;
// }

// export class SaldoFavor {
//   private static baseURL: string = URL; // importada de lib/constant/index.ts
//   private static ROUTER: string = "/mia/saldo"; // cambiar cuando se defina la ruta correcta
//   private static ENDPOINTS: Record<string, string> = {
//     crearPago: "/new",
//   };

//   private static async request<T>(
//     endpoint: string,
//     options: RequestInit
//   ): Promise<T> {
//     const response = await fetch(`${this.baseURL}${this.ROUTER}${endpoint}`, {
//       headers: {
//         "x-api-key": API_KEY || "", // importada de lib/constant/index
//         "Cache-Control": "no-cache",
//         "Content-Type": "application/json",
//       },
//       ...options,
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Error ${response.status}: ${errorText}`);
//     }

//     return response.json();
//   }

//   // Crear nuevo saldo a favor
//   static async crearPago(data: NuevoSaldoAFavor) {
//     // Validar que si la forma de pago es tarjeta, debe incluir tipo_tarjeta
//     if ((data.forma_pago === "tarjeta de credito" || data.forma_pago === "tarjeta de debito") && !data.tipo_tarjeta) {
//       throw new Error("Tipo de tarjeta es requerido para pagos con tarjeta");
//     }

//     // Si es wallet, eliminar tipo_tarjeta
//     const payload = data.forma_pago === "wallet"
//       ? { ...data, tipo_tarjeta: null }
//       : data;

//     return this.request<{ success: boolean, data: NuevoSaldoAFavor }>(
//       this.ENDPOINTS.crearPago,
//       {
//         method: "POST",
//         body: JSON.stringify(payload),
//       }
//     );
//   }

//   static async getPagos(id: string) {
//     return this.request<{ message: string, data: Saldo[] }>(
//       `/${id}`,
//       {
//         method: "GET"
//       }
//     );
//   }
// }



// //====================================
// export interface Saldo {
//   id_saldos: number | null;
//   id_agente: string;
//   fecha_creacion: string | null;
//   saldo: string | null;
//   monto: string;
//   metodo_pago: string;
//   fecha_pago: string;
//   concepto: string | null;
//   referencia: string | null;
//   currency: string | null;
//   tipo_tarjeta: string | null;
//   comentario: string | null;
//   link_stripe: string | null;
//   is_facturable: number | null;
//   is_descuento: number | null;
//   comprobante: string | null;
//   created_at: string | null;
//   updated_at: string | null;
//   tiene_credito_consolidado: number | null;
//   monto_credito: string | null;
//   nombre: string | null;
//   notas: string | null;
//   vendedor: string | null;
//   por_confirmar: string | null;
// }

import { API_KEY, URL } from "@/lib/constants/index";

export interface NuevoSaldoAFavor {
  id_cliente: string;
  monto_pagado: number;
  forma_pago: "transferencia" | "tarjeta de credito" | "tarjeta de debito" | "wallet";
  is_facturable: boolean;
  referencia?: string;
  fecha_pago: string;
  tipo_tarjeta?: "credito" | "debito";
  link_stripe?: string;
  descuento_aplicable?: boolean;
  comentario?: string;
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
    const response = await fetch(`${this.baseURL}${this.ROUTER}${endpoint}`, {
      headers: {
        "x-api-key": API_KEY || "",
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