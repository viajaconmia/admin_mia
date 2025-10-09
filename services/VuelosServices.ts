import { Vuelo } from "@/components/template/PageVuelos";
import { ApiResponse, ApiService } from "./ApiService";
import { Saldo } from "./SaldoAFavor";
import { ViajeroService } from "./ViajerosService";
import { ViajeAereoDetails } from "@/components/template/EditarVuelos";

export class VuelosServices extends ApiService {
  private ENDPOINTS = {
    POST: {
      CREATE: "/",
    },
    GET: {
      VUELOS: "/",
      ID: "/id",
    },
    PUT: {
      VIAJE_AEREO: "/",
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

  public getVuelos = (): Promise<ApiResponse<ViajeAereo[]>> =>
    this.get<ViajeAereo[]>({
      path: this.formatPath(this.ENDPOINTS.GET.VUELOS),
    });

  public getVueloById = (id: string): Promise<ApiResponse<ViajeAereoDetails>> =>
    this.get<ViajeAereoDetails>({
      path: this.formatPath(this.ENDPOINTS.GET.ID),
      params: { id },
    });

  public editarViajeAereo = (body: {
    saldos: (Saldo & {
      restante: number;
      usado: boolean;
    })[];
    faltante: number;
    cambios: {
      logs: {};
      keys: string[];
    };
    before: ViajeAereoDetails;
    current: ViajeAereoDetails;
    viaje_aereo: ViajeAereo & {
      id_agente: string;
      nombre: string;
    };
  }) =>
    this.put({ path: this.formatPath(this.ENDPOINTS.PUT.VIAJE_AEREO), body });

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

export type ViajeAereo = {
  id_viaje_aereo: string;
  id_booking: string;
  id_servicio: string;
  trip_type: "SENCILLO" | "REDONDO" | string; // puedes ajustar según tus valores reales
  status: "confirmada" | "pendiente" | "cancelada" | string;
  payment_status: "pagado" | "pendiente" | "fallido" | string;
  total_passengers: number;
  aeropuerto_origen: string;
  ciudad_origen: string;
  aeropuerto_destino: string;
  ciudad_destino: string;
  regreso_aeropuerto_origen: string | null;
  regreso_ciudad_origen: string | null;
  regreso_aeropuerto_destino: string | null;
  regreso_ciudad_destino: string | null;
  adults: number | null;
  children: number;
  infants: number;
  subtotal: string;
  taxes: string;
  fees: string;
  total: string;
  currency: "MXN" | "USD" | string;
  cancellation_policies: string | null;
  created_at: string; // formato ISO
  updated_at: string; // formato ISO
  codigo_confirmacion: string;
};
