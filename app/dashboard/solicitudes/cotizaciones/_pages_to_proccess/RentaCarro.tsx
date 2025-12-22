import React from "react";
import {
  Car,
  Calendar,
  User,
  MapPin,
  Gauge,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export const RentalCartCard = ({ cart }) => {
  // Extraemos la información del objeto anidado para facilitar el acceso
  const rental = cart.objeto_gemini?.item?.item || {};
  const extra = cart.objeto_gemini?.item?.extra?.principal || {};
  const status = cart.estado_solicitud || "pending";

  // Formateador de moneda
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden my-4 font-sans">
      {/* Header: Estatus y ID */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
            ID Solicitud
          </span>
          <span className="text-sm font-mono text-gray-600">
            {cart.id_solicitud}
          </span>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            status === "pending"
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status === "pending" ? "Pendiente" : status}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna 1: Info del Vehículo */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Car size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {rental.carDetails?.make} {rental.carDetails?.model}
                </h2>
                <p className="text-gray-500 uppercase text-xs font-semibold tracking-wide">
                  {rental.carDetails?.category} •{" "}
                  {rental.carDetails?.transmission === "automatic"
                    ? "Automático"
                    : "Manual"}
                </p>
              </div>
            </div>

            {/* Detalles de Recogida y Entrega */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <MapPin size={14} />
                  <span className="text-[10px] font-bold uppercase">
                    Recogida
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-700">
                  {rental.rentalPeriod?.pickupLocation?.city}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {rental.rentalPeriod?.pickupLocation?.address}
                </p>
                <p className="text-xs font-mono mt-1 text-blue-700">
                  {new Date(
                    rental.rentalPeriod?.pickupLocation?.dateTime
                  ).toLocaleString()}
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-4 sm:pt-0 sm:pl-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <MapPin size={14} />
                  <span className="text-[10px] font-bold uppercase">
                    Devolución
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-700">
                  {rental.rentalPeriod?.returnLocation?.city}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {rental.rentalPeriod?.returnLocation?.address}
                </p>
                <p className="text-xs font-mono mt-1 text-indigo-700">
                  {new Date(
                    rental.rentalPeriod?.returnLocation?.dateTime
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Características Incluidas */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
                <Gauge size={14} /> Kilometraje Ilimitado
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
                <ShieldCheck size={14} /> Seguro TPL Incluido
              </div>
            </div>
          </div>

          {/* Columna 2: Resumen de Pago y Viajero */}
          <div className="space-y-6">
            {/* Tarjeta de Precio */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md">
              <div className="flex justify-between items-center mb-2">
                <CreditCard size={20} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Total Renta
                </span>
              </div>
              <p className="text-3xl font-black">
                {formatter.format(cart.total_solicitud || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Vía {rental.provider?.name}
              </p>
            </div>

            {/* Info del Conductor */}
            <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                  Conductor
                </span>
              </div>
              <p className="text-sm font-bold text-gray-800 break-words">
                {extra.nombre_completo}
              </p>
              <p className="text-xs text-gray-500 mt-1">{extra.correo}</p>
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] text-gray-400">
                  Tel: {extra.telefono}
                </span>
                <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  MX
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
