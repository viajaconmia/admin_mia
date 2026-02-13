// src/components/PaymentModal/ReservationDetails.tsx
"use client";

import { BookingAll } from "@/services/BookingService";

interface Props {
  reservation: BookingAll;
}

const moneyMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const n0 = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function ReservationDetails({ reservation }: Props) {
  // ✅ costo proveedor
  const costoProveedor = n0((reservation as any).costo_total);

  // ✅ total vendido (usa total_booking; si no existe, cae a total)
  const totalVendido = n0((reservation as any).total_booking ?? (reservation as any).total);

  const markupMonto = totalVendido - costoProveedor;

  // ✅ % sobre vendido (si vendido=0, evita división)
  const markupPct = totalVendido > 0 ? (markupMonto / totalVendido) * 100 : 0;

  return (
    <div className="py-2 text-sm text-slate-700 space-y-2">
      <h2 className="text-base font-semibold text-slate-800">
        Detalles de la reservación
      </h2>

      <div className="border border-blue-200 bg-blue-50 rounded-md p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Reserva */}
          <div>
            <p className="text-xs text-slate-500">Reserva</p>
            <p className="font-medium text-slate-800 break-all">
              #{reservation.codigo_confirmacion || ""}
            </p>
          </div>

          {/* Hotel */}
          <div>
            <p className="text-xs text-slate-500">Hotel</p>
            <p className="font-medium text-slate-800">
              {(reservation as any).proveedor || ""}
            </p>
          </div>

          {/* Viajero */}
          <div>
            <p className="text-xs text-slate-500">Viajero</p>
            <p className="font-medium text-slate-800">
              {(reservation as any).viajero || ""}
            </p>
          </div>

          {/* ✅ Costo proveedor */}
          <div>
            <p className="text-xs text-slate-500">Costo proveedor</p>
            <p className="font-bold text-slate-800">
              {moneyMXN(costoProveedor)}
            </p>
          </div>

          {/* ✅ Total vendido */}
          <div>
            <p className="text-xs text-slate-500">Total vendido</p>
            <p className="font-bold text-blue-700">
              {moneyMXN(totalVendido)}
            </p>
          </div>

          {/* ✅ Markup */}
          <div>
            <p className="text-xs text-slate-500">Markup</p>
            <p
              className={`font-semibold ${
                markupMonto >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
              title={`${moneyMXN(markupMonto)} (${markupPct.toFixed(2)}%)`}
            >
              {moneyMXN(markupMonto)}{" "}
              <span className="text-xs">
                ({markupPct.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
