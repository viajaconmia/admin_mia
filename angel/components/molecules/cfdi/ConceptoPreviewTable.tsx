"use client";

import { TextAreaInput } from "@/components/atom/Input";
import { fmtMoney } from "@/angel/lib/format/number";
import { CfdiPreviewLinea } from "@/angel/lib/cfdi/payload";

type Props = {
  lineas: CfdiPreviewLinea[];
  descOverrides: Record<string, string>;
  onOverrideChange: (key: string, value: string) => void;
  totals: { base: number; tax: number; total: number };
  ivaRateStr: string;
};

export function ConceptoPreviewTable({
  lineas,
  descOverrides,
  onOverrideChange,
  totals,
  ivaRateStr,
}: Props) {
  return (
    <div>
      <div className="overflow-x-auto bg-white border rounded-md">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase border-b">
                ClaveProdServ
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase border-b">
                Cant.
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase border-b">
                Unidad
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase border-b">
                Descripción
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500 uppercase border-b">
                Base
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500 uppercase border-b">
                IVA
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500 uppercase border-b">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {lineas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                  No hay conceptos para previsualizar.
                </td>
              </tr>
            ) : (
              lineas.map((linea) => (
                <tr key={linea.key} className="border-b last:border-b-0">
                  <td className="px-3 py-2 text-sm text-gray-800">{linea.ProductCode}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">{linea.Quantity}</td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    {linea.UnitCode}
                    <div className="text-[11px] text-gray-500">{linea.Unit}</div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    <TextAreaInput
                      value={descOverrides[linea.key] ?? linea.Description}
                      onChange={(v) => onOverrideChange(linea.key, v)}
                      rows={3}
                    />
                    <div className="text-[11px] text-gray-500 mt-1">
                      Traslado IVA 002 · Tasa {linea.TaxRate} · Base {fmtMoney(linea.Base)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-right text-gray-800">{fmtMoney(linea.Base)}</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-800">{fmtMoney(linea.Tax)}</td>
                  <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                    {fmtMoney(linea.Total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col md:flex-row md:justify-end gap-3">
        <div className="bg-white border rounded-md p-3 w-full md:w-[360px]">
          <div className="flex justify-between text-sm text-gray-700">
            <span>Subtotal (Base)</span>
            <span className="font-medium">{fmtMoney(totals.base)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700 mt-1">
            <span>IVA ({ivaRateStr})</span>
            <span className="font-medium">{fmtMoney(totals.tax)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-900 mt-2 pt-2 border-t">
            <span className="font-semibold">Total</span>
            <span className="font-bold">{fmtMoney(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
