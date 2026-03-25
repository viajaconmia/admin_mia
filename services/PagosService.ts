import { Item, Saldo } from "@/types/database_tables";
import { ApiResponse, ApiService } from "./ApiService";

export class PagosService extends ApiService {
  private static instance: PagosService = null;
  private ENDPOINTS = {
    PUT: {
      actualizarYRegresarSaldo: "/precio-contado-regresar-saldo",
    },
    POST: {
      pagoConSaldoAjusteCuenta: "/crearItemdeAjuste",
    },
    GET: { complemento: "/complemento" },
  };

  constructor() {
    super("/mia/pagos");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new PagosService();
    }
    return this.instance;
  }

  public obtenerPagoParaComplemento = async (
    id,
  ): Promise<ApiResponse<SaldoFacturado>> =>
    this.get({
      path: this.formatPath(this.ENDPOINTS.GET.complemento),
      params: { id },
    });

  public actualizarContadoRegresarSaldo = async (body: {
    id_agente: string;
    id_servicio: string;
    diferencia: number;
    id_booking: string;
    id_hospedaje: string;
    precio_actualizado: number;
    id_pago: string;
  }): Promise<ApiResponse<{ message: string }>> =>
    this.put<{ message: string }>({
      path: this.formatPath(this.ENDPOINTS.PUT.actualizarYRegresarSaldo),
      body,
    });

  public ajustePrecioConSaldo = async (body: {
    updatedItem: Item;
    updatedSaldos: (Saldo & { monto_cargado_al_item: string })[];
    diferencia: number;
    precioActualizado: number;
    id_booking: string;
    id_servicio: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    return this.post<{ message: string }>({
      path: this.formatPath(this.ENDPOINTS.POST.pagoConSaldoAjusteCuenta),
      body,
    });
  };
}

export type SaldoFacturado = {
  id_saldos: number;
  monto: string;
  metodo_pago: MetodoPago;
  referencia: string;
  tipo_tarjeta: TipoTarjeta | null;
  fecha_pago: string; // ISO date
  facturas: FacturaSaldo[];
};

export type FacturaSaldo = {
  monto_asignado: string;
  folio: string;
  total: string;
  uuid_factura: string;
  saldo_insoluto: string;
  parcialidad: number;
  pagos_complemento: any[];
};

export type MetodoPago = "transferencia" | "efectivo" | "tarjeta";
export type TipoTarjeta = "credito" | "debito";
