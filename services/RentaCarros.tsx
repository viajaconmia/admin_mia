import { CarRental } from "@/components/pages/CarRental";
import { ApiResponse, ApiService } from "./ApiService";
import { Saldo } from "./SaldoAFavor";

export class CarRentalServices extends ApiService {
  private static instance: CarRentalServices = null;
  private ENDPOINTS = {
    POST: {
      CAR_RENTAL_OPERACIONES: "/",
    },
  };

  constructor() {
    super("/mia/renta_carros");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new CarRentalServices();
    }
    return this.instance;
  }

  public createCarRentalOperaciones = (
    body: CarRental & {
      saldos: (Saldo & { restante: number; usado: boolean })[];
      faltante: string;
      id_agente: string;
    }
  ) =>
    this.post({
      path: this.formatPath(this.ENDPOINTS.POST.CAR_RENTAL_OPERACIONES),
      body: {
        ...body,
        saldos: body.saldos.map((saldo) => ({
          ...saldo,
          restante: saldo.restante.toFixed(2),
        })),
        costo: body.costo.toFixed(2),
        precio: body.precio.toFixed(2),
      },
    });
}
