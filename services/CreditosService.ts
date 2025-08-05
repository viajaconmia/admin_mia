import { ApiResponse, ApiService } from "./ApiService";

export class CreditoService extends ApiService {
  private ENDPOINTS = {
    PUT: {
      actualizarPrecioVentaYCobrar: "/precio-venta-credito",
      actualizarCreditoRegresarCredito: "/precio-credito-regresar-saldo", //EN ESTE DEBO HACER LA VALIDACION QUE EL PRECIO MANDADO NO DEBE SER MENOR AL QUE SE PAGO POR LA RESERVA
    },
  };
  static instancia: CreditoService = null;

  constructor() {
    super("/mia/credito");
  }

  public static getInstance() {
    if (!this.instancia) {
      this.instancia = new CreditoService();
    }
    return this.instancia;
  }

  public updateAndPayPrecioVenta(body: {
    id_agente: string;
    diferencia: number;
    id_servicio: string;
    hotel: string;
    id_hospedaje: string;
    id_booking: string;
    precio_actualizado: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.put({
      path: this.formatPath(this.ENDPOINTS.PUT.actualizarPrecioVentaYCobrar),
      body,
    });
  }

  public actualizarYRegresarCredito = async (body: {
    id_agente: string;
    id_servicio: string;
    diferencia: number;
    id_booking: string;
    id_hospedaje: string;
    precio_actualizado: number;
  }) =>
    this.put({
      path: this.formatPath(
        this.ENDPOINTS.PUT.actualizarCreditoRegresarCredito
      ),
      body,
    });
}
