"use client";

import { Dropdown, NumberInput } from "@/components/atom/Input";
import {
  cfdiUseOptions,
  paymentFormOptions,
  paymentMethodOptions,
  periodicidades,
  meses,
} from "@/angel/lib/cfdi/constants";

type Props = {
  selectedCfdiUse: string;
  onCfdiUseChange: (value: string) => void;
  selectedPaymentForm: string;
  onPaymentFormChange: (value: string) => void;
  selectedPaymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  isPublicoGeneral: boolean;
  periodicity: string;
  onPeriodicityChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
};

export function ControlesCfdi({
  selectedCfdiUse,
  onCfdiUseChange,
  selectedPaymentForm,
  onPaymentFormChange,
  selectedPaymentMethod,
  onPaymentMethodChange,
  isPublicoGeneral,
  periodicity,
  onPeriodicityChange,
  month,
  onMonthChange,
  year,
  onYearChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Dropdown label="Uso de CFDI" value={selectedCfdiUse} onChange={onCfdiUseChange} options={cfdiUseOptions} />
      <Dropdown
        label="Forma de Pago"
        value={selectedPaymentForm}
        onChange={onPaymentFormChange}
        options={paymentFormOptions}
      />
      <Dropdown
        label="Método de Pago"
        value={selectedPaymentMethod}
        onChange={onPaymentMethodChange}
        options={paymentMethodOptions}
      />

      {isPublicoGeneral && (
        <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
          <Dropdown label="Periodicidad" value={periodicity} onChange={onPeriodicityChange} options={periodicidades} />
          <Dropdown label="Mes" value={month} onChange={onMonthChange} options={meses} />
          <NumberInput label="Año" value={Number(year)} onChange={onYearChange} />
        </div>
      )}
    </div>
  );
}
