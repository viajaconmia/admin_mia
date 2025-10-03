import { ApiResponse, ApiService } from "./ApiService";

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

  public createCarRentalOperaciones = () =>
    this.post({
      path: this.formatPath(this.ENDPOINTS.POST.CAR_RENTAL_OPERACIONES),
    });
}
