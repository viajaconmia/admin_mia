import { Vuelo } from "@/components/template/PageVuelos";
import { ApiResponse, ApiService } from "./ApiService";
import { Saldo } from "./SaldoAFavor";
import { ViajeroService } from "./ViajerosService";

export class VuelosServices extends ApiService {
  private ENDPOINTS = {
    POST: {
      CREATE: "/",
    },
  };
  private static instance: VuelosServices;

  private constructor() {
    super("/mia/vuelos");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new VuelosServices();
    }
    return this.instance;
  }

  public createVuelo = (
    faltante: number,
    saldos: (Saldo & { restante: number; usado: boolean })[],
    vuelos: Vuelo[],
    reserva: {
      codigo: string | null;
      viajero: ViajeroService | null;
      costo: number | null;
      precio: number | null;
      status: string | null;
    },
    agente: Agente
  ): Promise<ApiResponse<{}>> =>
    this.post<{}>({
      path: this.formatPath(this.ENDPOINTS.POST.CREATE),
      body: {
        faltante: faltante.toFixed(2),
        saldos: saldos.map((saldo) => ({
          ...saldo,
          restante: saldo.restante.toFixed(2),
        })),
        vuelos,
        reserva: {
          ...reserva,
          costo: reserva.costo.toFixed(2),
          precio: reserva.precio.toFixed(2),
        },
        id_agente: agente.id_agente,
      },
    });
}
