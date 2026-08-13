import { AvionStrategy } from "./avionStrategy";
import { HotelStrategy } from "./hotelStrategy";
import { RentaAutoStrategy } from "./rentaAutoStrategy";
import { UnknownStrategy } from "./unknownStrategy";
import type { TipoServicio } from "../types";
import type { InvoiceStrategy } from "./types";

const strategies: Record<TipoServicio, InvoiceStrategy> = {
  HOTEL: new HotelStrategy(),
  AVION: new AvionStrategy(),
  RENTA_AUTO: new RentaAutoStrategy(),
  DESCONOCIDO: new UnknownStrategy(),
};

export const invoiceStrategyFactory = {
  crear(tipo: TipoServicio): InvoiceStrategy {
    return strategies[tipo] ?? strategies.DESCONOCIDO;
  },
};
