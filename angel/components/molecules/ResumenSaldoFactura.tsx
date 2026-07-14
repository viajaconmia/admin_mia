"use client";

import { fmtMoney } from "@/angel/lib/format/number";

type Props = {
  seleccionado: number | string;
  saldo?: number | string;
  labelSaldo?: string;
};

export function ResumenSaldoFactura({
  seleccionado,
  saldo,
  labelSaldo = "Saldo",
}: Props) {
  const restante = saldo != null ? Number(saldo) - Number(seleccionado) : null;
  return (
    <div className="flex items-center gap-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
      {saldo != null && (
        <div>
          <span className="text-gray-500">{labelSaldo}: </span>
          <span className="font-semibold text-gray-800">{fmtMoney(saldo)}</span>
        </div>
      )}
      <div>
        <span className="text-gray-500">Seleccionado: </span>
        <span className="font-semibold text-blue-700">
          {fmtMoney(seleccionado)}
        </span>
      </div>
      {restante != null && (
        <div>
          <span className="text-gray-500">Restante: </span>
          <span
            className={`font-semibold ${restante < 0 ? "text-red-600" : "text-green-700"}`}
          >
            {fmtMoney(restante)}
          </span>
        </div>
      )}
    </div>
  );
}
