// src/components/PaymentModal/ReservationDetails.tsx
import type { Solicitud, Solicitud2 } from "@/types";

interface Props {
  reservation: Solicitud2;
  // Puedes pasarle otros datos calculados si es necesario
}

// Usamos `export default` para el componente principal del archivo
export default function ReservationDetails({ reservation }: Props) {
  return (
    <div className=" py-2 text-sm text-slate-700 space-y-2">
      <h2 className="text-base font-semibold text-slate-800">
        Detalles de la reservación
      </h2>

      <div className="border border-blue-200 bg-blue-50 rounded-md p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Reserva */}
          <div>
            <p className="text-xs text-slate-500">Reserva</p>
            <p className="font-medium text-slate-800 break-all">
              #{reservation.codigo_reservacion_hotel || ""}
            </p>
          </div>

          {/* Hotel */}
          <div>
            <p className="text-xs text-slate-500">Hotel</p>
            <p className="font-medium text-slate-800">
              {reservation.hotel_reserva || ""}
            </p>
          </div>

          {/* Viajero */}
          <div>
            <p className="text-xs text-slate-500">Viajero</p>
            <p className="font-medium text-slate-800">
              {reservation.nombre_viajero_reservacion || ""}
            </p>
          </div>

          {/* Total */}
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="font-bold text-blue-700">
              ${reservation.costo_total || ""}
            </p>
          </div>

          {/* Markup */}
          <div>
            <p className="text-xs text-slate-500">Markup</p>
            <p className="font-semibold text-emerald-600">
              %
              {(
                ((Number(reservation.total || 0) -
                  Number(reservation.costo_total || 0)) /
                  Number(reservation.total || 1)) *
                100
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
