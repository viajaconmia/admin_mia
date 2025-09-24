import React from "react";
import Button from "../atom/Button";
import { formatNumberWithCommas, redondear } from "@/helpers/formater";

interface BalanceCardProps {
  saldoAFavor: number;
  precioAPagar: number;
  totalSeleccionado: number;
  onConfirm?: () => void;
  onSecondary?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  saldoAFavor,
  precioAPagar,
  totalSeleccionado,
  onConfirm,
  onSecondary,
}) => {
  const saldoRestante = redondear(saldoAFavor - totalSeleccionado);
  const montoFinal = redondear(precioAPagar - totalSeleccionado);
  const cubreTodo = totalSeleccionado >= precioAPagar;

  return (
    <div
      className={`rounded-xl p-6 transition-all duration-300 hover:shadow-xl bg-white border border-gray-200 shadow-lg`}
    >
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Saldo disponible</p>
          <p className="text-xl font-bold text-green-600">
            ${formatNumberWithCommas(saldoAFavor)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Precio a pagar</p>
          <p className="text-xl font-bold text-gray-900">
            ${formatNumberWithCommas(precioAPagar)}
          </p>
        </div>
      </div>

      {/* Cálculo */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Saldo seleccionado</span>
          <span className="font-semibold text-blue-600">
            ${formatNumberWithCommas(totalSeleccionado)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Saldo restante</span>
          <span
            className={`font-semibold ${
              saldoRestante >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${formatNumberWithCommas(saldoRestante)}
          </span>
        </div>
        <div className="border-t pt-3 flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            Total a pagar
          </span>
          <span className={`text-xl font-bold ext-gray-900`}>
            {`$${formatNumberWithCommas(montoFinal)}`}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {onSecondary && (
          <Button
            className="w-full"
            onClick={onSecondary}
            disabled={cubreTodo}
            variant="secondary"
          >
            Completar pago con credito
          </Button>
        )}
        {onConfirm && (
          <Button className="w-full" onClick={onConfirm} disabled={!cubreTodo}>
            Confirmar pago
          </Button>
        )}
      </div>
    </div>
  );
};
