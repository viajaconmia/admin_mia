// app/dashboard/conciliacion/compponents/FiltrosConciliacionModal.tsx
"use client";

import React from "react";
import { X } from "lucide-react";
import Button from "@/components/atom/Button";

export type ConciliacionFilters = {
  folio: string;
  cliente: string;
  viajero: string;
  hotel: string;
  estado_solicitud: string;
  estado_facturacion: string;
  forma_pago: string;
  created_start: string;
  created_end: string;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;

  id_cliente: string;
  estado_reserva: string;
  etapa_reservacion: string;
  reservante: string;
  metodo_pago_reserva: string;
  fecha_reserva_start: string;
  fecha_reserva_end: string;
  filtrar_fecha_por_reserva: string;

  comentarios: string;
  comentario_CXP: string;
};

type Props = {
  open: boolean;
  filters: ConciliacionFilters;
  onChange: (field: keyof ConciliacionFilters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  options?: {
    estadoReserva?: string[];
    etapaReservacion?: string[];
    reservante?: string[];
    metodoPagoReserva?: string[];
  };
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function InputWithClear({
  value,
  onChange,
  onClear,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm outline-none"
      />
      <button
        type="button"
        onClick={onClear}
        className="w-11 border-l border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SelectWithClear({
  value,
  onChange,
  onClear,
  options,
  placeholder = "Selecciona una opción",
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm outline-none bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onClear}
        className="w-11 border-l border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FiltrosConciliacionModal({
  open,
  filters,
  onChange,
  onApply,
  onClear,
  onClose,
  options,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-6xl bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Filtros actuales</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Field label="Código de reservación">
                <InputWithClear
                  value={filters.folio}
                  onChange={(v) => onChange("folio", v)}
                  onClear={() => onChange("folio", "")}
                />
              </Field>

              <Field label="Cliente">
                <InputWithClear
                  value={filters.cliente}
                  onChange={(v) => onChange("cliente", v)}
                  onClear={() => onChange("cliente", "")}
                />
              </Field>

              <Field label="Viajero">
                <InputWithClear
                  value={filters.viajero}
                  onChange={(v) => onChange("viajero", v)}
                  onClear={() => onChange("viajero", "")}
                />
              </Field>

              <Field label="Proveedor">
                <InputWithClear
                  value={filters.hotel}
                  onChange={(v) => onChange("hotel", v)}
                  onClear={() => onChange("hotel", "")}
                />
              </Field>

              <Field label="Creado desde">
                <InputWithClear
                  type="date"
                  value={filters.created_start}
                  onChange={(v) => onChange("created_start", v)}
                  onClear={() => onChange("created_start", "")}
                />
              </Field>

              <Field label="Creado hasta">
                <InputWithClear
                  type="date"
                  value={filters.created_end}
                  onChange={(v) => onChange("created_end", v)}
                  onClear={() => onChange("created_end", "")}
                />
              </Field>

              <Field label="Check-in desde">
                <InputWithClear
                  type="date"
                  value={filters.check_in_start}
                  onChange={(v) => onChange("check_in_start", v)}
                  onClear={() => onChange("check_in_start", "")}
                />
              </Field>

              <Field label="Check-in hasta">
                <InputWithClear
                  type="date"
                  value={filters.check_in_end}
                  onChange={(v) => onChange("check_in_end", v)}
                  onClear={() => onChange("check_in_end", "")}
                />
              </Field>

              <Field label="Check-out desde">
                <InputWithClear
                  type="date"
                  value={filters.check_out_start}
                  onChange={(v) => onChange("check_out_start", v)}
                  onClear={() => onChange("check_out_start", "")}
                />
              </Field>

              <Field label="Check-out hasta">
                <InputWithClear
                  type="date"
                  value={filters.check_out_end}
                  onChange={(v) => onChange("check_out_end", v)}
                  onClear={() => onChange("check_out_end", "")}
                />
              </Field>

              <Field label="Estatus facturación">
                <SelectWithClear
                  value={filters.estado_facturacion}
                  onChange={(v) => onChange("estado_facturacion", v)}
                  onClear={() => onChange("estado_facturacion", "")}
                  options={["pendiente", "parcial", "completo"]}
                />
              </Field>

              <Field label="Estatus solicitud">
                <SelectWithClear
                  value={filters.estado_solicitud}
                  onChange={(v) => onChange("estado_solicitud", v)}
                  onClear={() => onChange("estado_solicitud", "")}
                  options={[
                    "CARTA_ENVIADA",
                    "PAGADO TARJETA",
                    "TRANSFERENCIA_SOLICITADA",
                    "PAGADO TRANSFERENCIA",
                    "PAGADO LINK",
                    "SOLICITADA",
                    "CUPON ENVIADO",
                    "CANCELADA",
                    "DISPERSION",
                  ]}
                />
              </Field>

              <Field label="Forma de pago solicitud">
                <SelectWithClear
                  value={filters.forma_pago}
                  onChange={(v) => onChange("forma_pago", v)}
                  onClear={() => onChange("forma_pago", "")}
                  options={["card", "transfer", "link", "credit"]}
                />
              </Field>
              <Field label="Comentarios Ops">
                <InputWithClear
                  value={filters.comentarios}
                  onChange={(v) => onChange("comentarios", v)}
                  onClear={() => onChange("comentarios", "")}
                  placeholder="Buscar en comentarios"
                />
              </Field>

              <Field label="Comentario CXP">
                <InputWithClear
                  value={filters.comentario_CXP}
                  onChange={(v) => onChange("comentario_CXP", v)}
                  onClear={() => onChange("comentario_CXP", "")}
                  placeholder="Buscar en comentario CXP"
                />
              </Field>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Filtros de reserva</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Field label="ID del cliente">
                <InputWithClear
                  value={filters.id_cliente}
                  onChange={(v) => onChange("id_cliente", v)}
                  onClear={() => onChange("id_cliente", "")}
                />
              </Field>

              <Field label="Estado">
                <SelectWithClear
                  value={filters.estado_reserva}
                  onChange={(v) => onChange("estado_reserva", v)}
                  onClear={() => onChange("estado_reserva", "")}
                  options={options?.estadoReserva ?? []}
                />
              </Field>

              <Field label="Etapa de reservación">
                <SelectWithClear
                  value={filters.etapa_reservacion}
                  onChange={(v) => onChange("etapa_reservacion", v)}
                  onClear={() => onChange("etapa_reservacion", "")}
                  options={options?.etapaReservacion ?? []}
                />
              </Field>

              <Field label="Reservante">
                <SelectWithClear
                  value={filters.reservante}
                  onChange={(v) => onChange("reservante", v)}
                  onClear={() => onChange("reservante", "")}
                  options={options?.reservante ?? []}
                />
              </Field>

              <Field label="Método de pago">
                <SelectWithClear
                  value={filters.metodo_pago_reserva}
                  onChange={(v) => onChange("metodo_pago_reserva", v)}
                  onClear={() => onChange("metodo_pago_reserva", "")}
                  options={options?.metodoPagoReserva ?? []}
                />
              </Field>

              <Field label="Filtrar fecha por">
                <SelectWithClear
                  value={filters.filtrar_fecha_por_reserva}
                  onChange={(v) => onChange("filtrar_fecha_por_reserva", v)}
                  onClear={() => onChange("filtrar_fecha_por_reserva", "")}
                  options={["created_at", "check_in", "check_out"]}
                />
              </Field>

              <Field label="Desde">
                <InputWithClear
                  type="date"
                  value={filters.fecha_reserva_start}
                  onChange={(v) => onChange("fecha_reserva_start", v)}
                  onClear={() => onChange("fecha_reserva_start", "")}
                />
              </Field>

              <Field label="Hasta">
                <InputWithClear
                  type="date"
                  value={filters.fecha_reserva_end}
                  onChange={(v) => onChange("fecha_reserva_end", v)}
                  onClear={() => onChange("fecha_reserva_end", "")}
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              onClick={onClear}
            >
              Limpiar
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
              onClick={onApply}
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}