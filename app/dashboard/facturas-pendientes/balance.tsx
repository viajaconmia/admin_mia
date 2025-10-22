import { Banknote, FileCheck, ShoppingCart } from "lucide-react";
// @/app/dashboard/facturas-pendientes/balance.tsx

import React from 'react';

// Componente BalanceSummary
interface BalanceProps {
  balance: {
    montototal: string;
    restante: string;
    montofacturado: string;
    total_reservas_confirmadas: string;
  };
  formatCurrency: (value: number) => string;
}

const BalanceSummary: React.FC<BalanceProps> = ({ balance, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
      {/* Monto Pagado */}
      <div className="flex items-center gap-4 bg-white border border-blue-200 rounded-xl p-4 shadow-sm ring-1 ring-blue-100 hover:shadow-md transition">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg">
          <Banknote className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-700">Monto Pagado</h3>
          <p className="text-2xl font-bold text-blue-800">
            {balance ? formatCurrency(Number(balance.montototal)) : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* Monto Facturado */}
      <div className="flex items-center gap-4 bg-white border border-green-200 rounded-xl p-4 shadow-sm ring-1 ring-green-100 hover:shadow-md transition">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-green-700">Monto Facturado</h3>
          <p className="text-2xl font-bold text-green-800">
            {balance ? formatCurrency(Number(balance.montofacturado)) : formatCurrency(0)}
          </p>
          <p className="text-sm mt-1">
            <span className="text-gray-600">Restante: </span>
            <span className={`font-semibold ${balance && Number(balance.restante) >= 0 ? "text-red-600" : "text-green-600"}`}>
              {balance ? formatCurrency(Number(balance.restante)) : formatCurrency(0)}
            </span>
          </p>
        </div>
      </div>

      {/* Total Reservas Confirmadas */}
      <div className="flex items-center gap-4 bg-white border border-yellow-200 rounded-xl p-4 shadow-sm ring-1 ring-yellow-100 hover:shadow-md transition">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-yellow-700">Total Reservas Confirmadas</h3>
          <p className="text-2xl font-bold text-yellow-800">
            {balance ? formatCurrency(Number(balance.total_reservas_confirmadas)) : formatCurrency(0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceSummary; // Asegúrate de exportarlo correctamente

export interface Balance {
  montototal: string;
  restante: string;
  montofacturado: string;
  total_reservas_confirmadas: string;
}