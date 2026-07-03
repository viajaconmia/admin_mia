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
  estado_facturacion: string;
  created_start: string;
  created_end: string;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  canal_de_reservacion: string;
  reservante: string;
  comentario_AP: string;
  reserva_diferencia: string;
  nombre_intermediario: string;
  forma_pago_solicitada: string;
  id_cliente: string;
  etapa_reservacion: string;
  fecha_reserva_start: string;
  fecha_reserva_end: string;
  filtrar_fecha_por_reserva: string;
  estado_solicitud: string;

  comentarios: string;
  comentario_CXP: string;

  tipo_reserva_pago: string;
  pagos_parciales: string;
  metodo_pago_reserva: string;
};

type Props = {
  open: boolean;
  filters: ConciliacionFilters;
  onChange: (field: keyof ConciliacionFilters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
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
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
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

        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* ── General ─────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              General
            </h3>
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
            </div>
          </div>

          {/* ── Solicitud de pago ────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Solicitud de pago
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

              <Field label="Tipo de solicitud (pago)">
                <SelectWithClear
                  value={filters.tipo_reserva_pago}
                  onChange={(v) => onChange("tipo_reserva_pago", v)}
                  onClear={() => onChange("tipo_reserva_pago", "")}
                  options={["CREDITO", "PREPAGO"]}
                  placeholder="Todos"
                />
              </Field>

              <Field label="Pagos parciales">
                <SelectWithClear
                  value={filters.pagos_parciales}
                  onChange={(v) => onChange("pagos_parciales", v)}
                  onClear={() => onChange("pagos_parciales", "")}
                  options={["SI", "NO"]}
                  placeholder="Todos"
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

              <Field label="Comentarios Ajustes Costos Finanzas">
                <InputWithClear
                  value={filters.comentario_AP}
                  onChange={(v) => onChange("comentario_AP", v)}
                  onClear={() => onChange("comentario_AP", "")}
                  placeholder="Buscar en comentario ajustes costos finanzas"
                />
              </Field>
            </div>
          </div>

          {/* ── Reserva ──────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Reserva
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

              <Field label="Etapa de reservación">
                <SelectWithClear
                  value={filters.etapa_reservacion}
                  onChange={(v) => onChange("etapa_reservacion", v)}
                  onClear={() => onChange("etapa_reservacion", "")}
                  options={["check_in", "in home", "check_out"]}
                  placeholder="Todas"
                />
              </Field>

              <Field label="Canal de reservación">
                <SelectWithClear
                  value={filters.canal_de_reservacion}
                  onChange={(v) => onChange("canal_de_reservacion", v)}
                  onClear={() => onChange("canal_de_reservacion", "")}
                  options={["DIRECTO", "INTERMEDIARIO"]}
                  placeholder="Selecciona una opcion"
                />
              </Field>

              <Field label="reservante">
                <SelectWithClear
                  value={filters.reservante}
                  onChange={(v) => onChange("reservante", v)}
                  onClear={() => onChange("reservante", "")}
                  options={["operaciones", "cliente"]}
                  placeholder="selecciona una opcion"
                />
              </Field>

              <Field label="Nombre intermediario">
                <InputWithClear
                  value={filters.nombre_intermediario}
                  onChange={(v) => onChange("nombre_intermediario", v)}
                  onClear={() => onChange("nombre_intermediario", "")}
                />
              </Field>
              <Field label="Estatus de pago">
                <SelectWithClear
                  value={filters.forma_pago_solicitada}
                  onChange={(v) => onChange("forma_pago_solicitada", v)}
                  onClear={() => onChange("forma_pago_solicitada", "")}
                  options={[
                    "Pagado link",
                    "Cancelada",
                    "carta enviada",
                    "transferencia solicitada",
                    "Cupon enviado",
                    "Solicitada",
                    "Pagado tarjeta",
                    "Pagado transferencia",
                    "Dispersion",
                  ]}
                  placeholder="todos"
                />
              </Field>

              <Field label="Método pago reserva">
                <SelectWithClear
                  value={filters.metodo_pago_reserva}
                  onChange={(v) => onChange("metodo_pago_reserva", v)}
                  onClear={() => onChange("metodo_pago_reserva", "")}
                  options={["PREPAGO", "CREDITO"]}
                  placeholder="Selecciona una opcion"
                />
              </Field>

              <Field label="hay diferencia">
                <SelectWithClear
                  value={filters.reserva_diferencia}
                  onChange={(v) => onChange("reserva_diferencia", v)}
                  onClear={() => onChange("reserva_diferencia", "")}
                  options={["Si", "no"]}
                  placeholder="Selecciona una opcion"
                />
              </Field>

              <Field label="ID del cliente">
                <InputWithClear
                  value={filters.id_cliente}
                  onChange={(v) => onChange("id_cliente", v)}
                  onClear={() => onChange("id_cliente", "")}
                />
              </Field>

              <Field label="Estatus de solicitud">
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
                    "CUPON ENVIADO",
                    "CANCELADA",
                    "DISPERSION",
                    "SOLICITADA",
                  ]}
                  placeholder="selecciona una opcion"
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
