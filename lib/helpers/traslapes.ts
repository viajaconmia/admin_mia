import { formatDate } from "@/helpers/formater";
import { BookingsService } from "@/services/BookingService";

// Agregar en traslapes.ts, ANTES de guardarReserva
export async function verificarYConfirmarTraslape(validacion: {
  id_viajero: string;
  check_in: string;
  check_out: string;
}): Promise<boolean> {
  const booking = new BookingsService();
  const { data } = await booking.verificarTraslape(
    validacion.id_viajero,
    validacion.check_in,
    validacion.check_out,
  );

  if (!data.traslape) return true;

  const lista = data.reservas
    .map(
      (r) =>
        `* ${r.type} - ${r.codigo_confirmacion} ${formatDate(r.check_in)} -> ${formatDate(r.check_out)}`,
    )
    .join("\n");
  return window.confirm(
    `Esta reserva se traslapa con:\n${lista}\n\n¿Deseas continuar de todos modos?`,
  );
}

export async function guardarReserva(
  fetchFn: any,
  payload: any,
  validacion: {
    id_viajero: string;
    check_in: string;
    check_out: string;
  },
  callback: any = null,
  autorizasTraslape: boolean = false,
) {
  if (!autorizasTraslape) {
    const puede = await verificarYConfirmarTraslape(validacion);
    if (!puede) {
      throw new Error("Se cancelo correctamente la reserva");
    }
    return guardarReserva(fetchFn, payload, validacion, callback, true);
  }
  if (callback) {
    return fetchFn(payload, callback);
  } else {
    return fetchFn(payload);
  }
}
