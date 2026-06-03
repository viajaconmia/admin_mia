"use client";

import DOMPurify from "dompurify";
import { useState, useEffect, useRef, useReducer } from "react";
import { useSearchParams } from "next/navigation";
import {
  DateInput,
  Dropdown,
  CheckboxInput,
  NumberInput,
  TextAreaInput,
  TextInput,
  InputGoogle,
  PlaceMaps,
} from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import {
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { ExtraService } from "@/services/ExtraServices";
import { Loader } from "@/components/atom/Loader";
import Modal from "@/components/organism/Modal";
import { FormSeleccionarHoteles } from "@/components/organism/FormSeleccionarHoteles";
import { Hotel, Agente } from "@/types";
import { useAlert } from "@/context/useAlert";
import { useHoteles } from "@/context/Hoteles";
import { fetchAgentes } from "@/services/agentes";
import { CorreoHotel } from "@/types/database_tables";
import React from "react";
import { calcularNoches } from "@/helpers/utils";
import { formatNumber } from "@/helpers/formater";
import { API_KEY, URL as BASE_URL } from "@/lib/constants";

// ─── Constants ──────────────────────────────────────────────────────────────
const NOKTO_CON_IVA = 168.2;
const OPCIONES_HABITACION = ["SENCILLA", "DOBLE"];

// ─── Types ──────────────────────────────────────────────────────────────────
type FormData = {
  check_in: string;
  check_out: string;
  lat: number | null;
  lng: number | null;
  correo_cliente: string;
  id_cliente: string;
  nombre_cliente: string;
};

type HotelCotizacion = {
  id: string;
  hotel: string;
  total: string;
  subtotal: string;
  desayuno: 0 | 1;
  habitacion: string;
  direccion: string;
  zona: string;
  priority: number;
  distancia: number | null;
  checkin: string;
  checkout: string;
  precio_referencia: number | null;
  fuente_referencia: string | null;
  precio_sistema: string | null;
  costo_sistema: string | null;
  notas: string;
  noktos_noche: string;
  noktos_estancia: string;
  mostrar_total_estancia: boolean;
  convenio: 0 | 1 | null;
  sin_disponibilidad: boolean;
};

// ─── Reducer ────────────────────────────────────────────────────────────────
type SlotAction =
  | { type: "set_slots"; payload: (HotelCotizacion | null)[] }
  | { type: "set_hotel"; index: number; hotel: HotelCotizacion }
  | { type: "update_total"; index: number; value: string }
  | { type: "update_field"; index: number; patch: Partial<HotelCotizacion> }
  | { type: "update_nokto_noche"; index: number; value: string }
  | { type: "update_nokto_estancia"; index: number; value: string }
  | { type: "delete"; index: number }
  | { type: "promote"; index: number }
  | { type: "sync_dates"; check_in: string; check_out: string };

function slotsReducer(
  state: (HotelCotizacion | null)[],
  action: SlotAction,
): (HotelCotizacion | null)[] {
  switch (action.type) {
    case "set_slots":
      return action.payload;

    case "set_hotel": {
      const next = [...state];
      next[action.index] = action.hotel;
      return next;
    }

    case "update_total": {
      const slot = state[action.index];
      if (!slot) return state;
      const total = parseFloat(action.value) || 0;
      const next = [...state];
      next[action.index] = {
        ...slot,
        total: action.value,
        subtotal: total > 0 ? (total / 1.16).toFixed(2) : "0",
      };
      return next;
    }

    case "update_field": {
      const slot = state[action.index];
      if (!slot) return state;
      const next = [...state];
      next[action.index] = { ...slot, ...action.patch };
      return next;
    }

    case "update_nokto_noche": {
      const slot = state[action.index];
      if (!slot) return state;
      const noches =
        slot.checkin && slot.checkout
          ? calcularNoches(slot.checkin, slot.checkout)
          : 0;
      const n = parseFloat(action.value) || 0;
      const precioNoche = (n * NOKTO_CON_IVA).toFixed(2);
      const next = [...state];
      next[action.index] = {
        ...slot,
        noktos_noche: action.value,
        noktos_estancia: noches > 0 ? (n * noches).toFixed(4) : "0",
        total: precioNoche,
        subtotal: (parseFloat(precioNoche) / 1.16).toFixed(2),
      };
      return next;
    }

    case "update_nokto_estancia": {
      const slot = state[action.index];
      if (!slot) return state;
      const noches =
        slot.checkin && slot.checkout
          ? calcularNoches(slot.checkin, slot.checkout)
          : 0;
      const n = parseFloat(action.value) || 0;
      const noktosPorNoche = noches > 0 ? n / noches : 0;
      const precioNoche = (noktosPorNoche * NOKTO_CON_IVA).toFixed(2);
      const next = [...state];
      next[action.index] = {
        ...slot,
        noktos_estancia: action.value,
        noktos_noche: noches > 0 ? noktosPorNoche.toFixed(4) : "0",
        total: precioNoche,
        subtotal: (parseFloat(precioNoche) / 1.16).toFixed(2),
      };
      return next;
    }

    case "delete": {
      const next = [...state];
      next[action.index] = null;
      return next;
    }

    case "promote": {
      if (action.index === 0) return state;
      const next = [...state];
      [next[0], next[action.index]] = [next[action.index], next[0]];
      return next;
    }

    case "sync_dates":
      return state.map((slot) =>
        slot
          ? { ...slot, checkin: action.check_in, checkout: action.check_out }
          : null,
      );

    default:
      return state;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatCuponDate = (d: string) => {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  const meses = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];
  return `${day} ${meses[+m - 1]} ${y}`;
};

const withNoktoDefaults = (h: Partial<HotelCotizacion>): HotelCotizacion =>
  ({
    noktos_noche: "0",
    noktos_estancia: "0",
    mostrar_total_estancia: false,
    sin_disponibilidad: false,
    ...h,
  }) as HotelCotizacion;

const blankHotel = (
  index: number,
  checkin: string,
  checkout: string,
): HotelCotizacion =>
  withNoktoDefaults({
    id: `blank-${index}-${Date.now()}`,
    hotel: "",
    total: "0",
    subtotal: "0",
    desayuno: 0,
    habitacion: "SENCILLA",
    direccion: "",
    zona: "",
    priority: index + 1,
    distancia: null,
    checkin,
    checkout,
    precio_referencia: null,
    fuente_referencia: null,
    precio_sistema: null,
    costo_sistema: null,
    notas: "",
    convenio: null,
  });

const slotNoches = (h: HotelCotizacion) =>
  h.checkin && h.checkout ? calcularNoches(h.checkin, h.checkout) : 0;

// ─── CuponRow ───────────────────────────────────────────────────────────────
const CuponRow = ({
  label,
  value,
  note,
  alert,
}: {
  label: string;
  value: string;
  note?: string;
  alert?: boolean;
}) => (
  <div className="flex border-b border-gray-200 last:border-0">
    <div className="w-[30%] bg-[#f1f5ff] px-2 py-1 text-[10px] font-bold text-gray-700 flex items-center">
      {label}
    </div>
    <div
      className={`flex-1 bg-white px-2 py-1 text-[10px] flex flex-col items-center justify-center text-center ${
        alert ? "text-red-500 font-bold" : "text-gray-800"
      }`}
    >
      <span>{value || "-"}</span>
      {note && <span className="text-[9px] text-gray-400">{note}</span>}
    </div>
  </div>
);

// ─── CuponCard ──────────────────────────────────────────────────────────────
const CuponCard = React.forwardRef<
  HTMLDivElement,
  { hotel: HotelCotizacion; priority: number }
>(({ hotel, priority }, ref) => {
  const noches = slotNoches(hotel);
  const total = parseFloat(hotel.total) || 0;
  const subtotalNoche = total > 0 ? total / 1.16 : 0;
  const totalEstancia = total * noches;

  return (
    <div
      ref={ref}
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white"
    >
      <div className="bg-[#0b5fa5] text-white px-3 py-1.5 text-[10px] font-bold tracking-wide">
        OPCIÓN {priority} — HOSPEDAJE
      </div>

      <div className="divide-y divide-gray-100">
        <CuponRow label="HOTEL:" value={hotel.hotel} />
        <CuponRow label="HABITACIÓN:" value={hotel.habitacion} />
        <CuponRow label="CHECK-IN:" value={formatCuponDate(hotel.checkin)} />
        <CuponRow label="CHECK-OUT:" value={formatCuponDate(hotel.checkout)} />
        <CuponRow label="NOCHES:" value={noches > 0 ? String(noches) : "-"} />
        <CuponRow
          label="DESAYUNO:"
          value={hotel.desayuno === 1 ? "SÍ" : "NO"}
        />
        <CuponRow label="DIRECCIÓN:" value={hotel.direccion} />

        {hotel.sin_disponibilidad ? (
          <div className="flex flex-col items-center justify-center gap-1 bg-red-600 px-3 py-4">
            <span className="text-white text-[18px] font-black tracking-widest leading-none">
              ✕
            </span>
            <span className="text-white text-[11px] font-black tracking-[0.15em] uppercase">
              Sin disponibilidad
            </span>
            <span className="text-red-200 text-[9px] font-medium">
              No hay habitaciones disponibles para las fechas seleccionadas
            </span>
          </div>
        ) : total > 0 ? (
          <>
            <CuponRow
              label="PRECIO / NOCHE:"
              value={`$ ${formatNumber(total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              note="Con IVA"
            />
            <CuponRow
              label="SUBTOTAL / NOCHE:"
              value={`$ ${formatNumber(subtotalNoche, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              note="Sin IVA"
            />
            {hotel.mostrar_total_estancia && noches > 0 && (
              <CuponRow
                label="TOTAL ESTANCIA:"
                value={`$ ${formatNumber(totalEstancia, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                note={`${noches} ${noches === 1 ? "noche" : "noches"}`}
              />
            )}
          </>
        ) : (
          <CuponRow label="PRECIO / NOCHE:" value="SIN PRECIO" alert />
        )}
      </div>

      {hotel.notas ? (
        <div className="bg-white px-3 py-2 border-t border-gray-100 flex gap-2">
          <span className="text-[9px] font-bold text-[#0b5fa5] shrink-0">
            NOTAS:
          </span>
          <span className="text-[9px] text-gray-600 break-words">
            {hotel.notas}
          </span>
        </div>
      ) : null}

      <div className="bg-[#00a3c4] text-white px-3 py-1 text-[9px] font-bold">
        Tarifa no reembolsable
      </div>
    </div>
  );
});
CuponCard.displayName = "CuponCard";

// ─── PrecioIA ────────────────────────────────────────────────────────────────
type PrecioIA = {
  precio_por_noche: string;
  moneda: string;
  fuente: string;
};

// ─── ControlsPanel ──────────────────────────────────────────────────────────
type ControlsPanelProps = {
  hotel: HotelCotizacion;
  index: number;
  downloading: boolean;
  downloadingImage: boolean;
  dispatch: React.Dispatch<SlotAction>;
  onEdit: () => void;
  onDownload: () => void;
  onDownloadImagen: () => void;
  precioIA?: PrecioIA | null;
};

const ControlsPanel = ({
  hotel,
  index,
  downloading,
  downloadingImage,
  dispatch,
  onEdit,
  onDownload,
  onDownloadImagen,
  precioIA,
}: ControlsPanelProps) => {
  const total = parseFloat(hotel.total) || 0;
  const canDownload = !!hotel.checkin && !!hotel.checkout;

  return (
    <div className="grid lg:grid-cols-2 items-end gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Hotel / Dirección */}
      <TextInput
        label="Hotel"
        value={hotel.hotel}
        onChange={(v) =>
          dispatch({ type: "update_field", index, patch: { hotel: v } })
        }
      />
      <Dropdown
        label="Habitación"
        value={hotel.habitacion}
        onChange={(v) =>
          dispatch({ type: "update_field", index, patch: { habitacion: v } })
        }
        options={OPCIONES_HABITACION}
      />
      <TextInput
        label="Dirección"
        value={hotel.direccion}
        onChange={(v) =>
          dispatch({ type: "update_field", index, patch: { direccion: v } })
        }
      />
      <CheckboxInput
        label={`Desayuno: ${hotel.desayuno === 1 ? "Sí" : "No"}`}
        checked={hotel.desayuno === 1}
        onChange={(v) =>
          dispatch({
            type: "update_field",
            index,
            patch: { desayuno: v ? 1 : 0 },
          })
        }
      />

      <TextInput
        label="Notas"
        value={hotel.notas}
        className="col-span-2"
        placeholder="Notas adicionales..."
        onChange={(v) =>
          dispatch({ type: "update_field", index, patch: { notas: v } })
        }
      />

      {/* Noktos */}
      <div className="grid grid-cols-2 gap-2 lg:col-span-2">
        <NumberInput
          label="Noktos / noche"
          value={parseFloat(hotel.noktos_noche) || null}
          onChange={(v) =>
            dispatch({ type: "update_nokto_noche", index, value: v })
          }
        />
        <NumberInput
          label="Noktos estancia"
          value={parseFloat(hotel.noktos_estancia) || null}
          onChange={(v) =>
            dispatch({ type: "update_nokto_estancia", index, value: v })
          }
        />
      </div>

      {/* Toggles */}
      <div className="grid lg:grid-cols-2 gap-1.5 lg:col-span-2">
        <CheckboxInput
          label="Mostrar total"
          checked={hotel.mostrar_total_estancia}
          onChange={(v) =>
            dispatch({
              type: "update_field",
              index,
              patch: { mostrar_total_estancia: v },
            })
          }
        />
        <CheckboxInput
          label="No disponible"
          checked={hotel.sin_disponibilidad}
          onChange={(v) =>
            dispatch({
              type: "update_field",
              index,
              patch: { sin_disponibilidad: v },
            })
          }
        />
      </div>
      <div className="lg:col-span-2 space-y-1.5">
        {/* Alerta sin precio */}
        {total === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5 flex gap-1.5">
            <span className="text-yellow-500 text-xs leading-none mt-0.5">
              ⚠
            </span>
            <p className="text-[10px] text-yellow-700 leading-snug">
              Sin precio registrado
            </p>
          </div>
        )}

        {/* Nota de precio IA */}
        {precioIA !== undefined &&
          (precioIA === null ||
          precioIA.precio_por_noche === "no disponible" ? (
            <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1.5 flex gap-1.5">
              <span className="text-orange-400 text-xs leading-none mt-0.5">
                ○
              </span>
              <p className="text-[10px] text-orange-700 leading-snug">
                No encontramos precio de ejemplo para estas fechas.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 flex gap-1.5">
              <span className="text-blue-400 text-xs leading-none mt-0.5">
                ℹ
              </span>
              <p className="text-[10px] text-blue-700 leading-snug">
                La IA encontró un precio asociado a estas fechas pero no
                confirma disponibilidad real — favor de verificar.
                <br />- {precioIA.fuente}
              </p>
            </div>
          ))}

        {/* Botones */}
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2">
          <Button
            icon={downloading ? Loader2 : Download}
            size="sm"
            variant="secondary"
            onClick={onDownload}
            disabled={downloading || !canDownload}
            title={
              !canDownload
                ? "Agrega check-in y check-out primero"
                : "Descargar cupón PDF"
            }
          >
            cupón
          </Button>
          <Button
            icon={downloadingImage ? Loader2 : ImageIcon}
            size="sm"
            variant="secondary"
            onClick={onDownloadImagen}
            disabled={downloadingImage || !canDownload}
            title={
              !canDownload
                ? "Agrega check-in y check-out primero"
                : "Descargar imagen"
            }
          >
            imagen
          </Button>
          <Button icon={Pencil} size="sm" variant="secondary" onClick={onEdit}>
            cambiar hotel
          </Button>
          {/* Prioridad */}
          {index > 0 && (
            <Button
              type="button"
              onClick={() => dispatch({ type: "promote", index })}
              size="sm"
              icon={Star}
              variant="primary"
            >
              Priorizar opción
            </Button>
          )}
          <Button
            icon={Trash2}
            size="sm"
            className="col-span-2"
            variant="warning"
            onClick={() => dispatch({ type: "delete", index })}
          >
            eliminar
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── HotelCard ──────────────────────────────────────────────────────────────
type HotelCardProps = {
  hotel: HotelCotizacion;
  index: number;
  downloading: boolean;
  downloadingImage: boolean;
  dispatch: React.Dispatch<SlotAction>;
  onEdit: () => void;
  onDownload: () => void;
  onDownloadImagen: () => void;
  cuponRef: React.Ref<HTMLDivElement>;
  precioIA?: PrecioIA | null;
};

const HotelCard = ({
  hotel,
  index,
  downloading,
  downloadingImage,
  dispatch,
  onEdit,
  onDownload,
  onDownloadImagen,
  cuponRef,
  precioIA,
}: HotelCardProps) => (
  <div className="flex flex-col gap-1 bg-white">
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[#0b5fa5] px-2 py-0.5 rounded-full w-fit">
      Prioridad {index + 1}
    </span>
    {hotel.convenio === 0 && (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-medium px-3 py-1.5 rounded-lg">
        <span>⚠️</span>
        <span>
          Este hotel no tiene convenio — verifica el precio antes de cotizar.
        </span>
      </div>
    )}
    <div className="grid grid-cols-[320px_1fr] gap-3 items-start">
      <ControlsPanel
        hotel={hotel}
        index={index}
        downloading={downloading}
        downloadingImage={downloadingImage}
        dispatch={dispatch}
        onEdit={onEdit}
        onDownload={onDownload}
        onDownloadImagen={onDownloadImagen}
        precioIA={precioIA}
      />
      <CuponCard ref={cuponRef} hotel={hotel} priority={index + 1} />
    </div>
  </div>
);

// ─── EmptySlotCard ──────────────────────────────────────────────────────────
const EmptySlotCard = ({
  priority,
  onAdd,
}: {
  priority: number;
  onAdd: () => void;
}) => (
  <div className="flex flex-col gap-1">
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white bg-gray-300 px-2 py-0.5 rounded-full w-fit">
      Prioridad {priority}
    </span>
    <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 text-gray-400 px-4 py-2.5 text-xs font-bold tracking-wide">
        HOSPEDAJE
      </div>
      <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
        <p className="text-xs text-gray-400 text-center">
          Sin hotel asignado para esta prioridad
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0b5fa5] border border-[#0b5fa5] rounded-lg hover:bg-[#f0f6ff] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar hotel
        </button>
      </div>
      <div className="bg-gray-100 px-4 py-2 text-[10px] font-bold text-gray-300">
        Tarifa no reembolsable
      </div>
    </div>
  </div>
);

// ─── CotizacionModal ────────────────────────────────────────────────────────
type CotizacionRow = {
  hotel: string;
  habitacion: string;
  desayuno: 0 | 1;
  cantidad: string;
  checkin: string;
  checkout: string;
  noches: number;
  noktos_unitarios: string;
  precio_noche: string;
  costos: string[];
  convenios: (0 | 1)[];
};

const PROVIDER_COLORS = [
  { header: "#1e3a5f", border: "#162d4d", cell: "bg-blue-50/40" },
  { header: "#2c4a7a", border: "#1e3a5f", cell: "bg-indigo-50/40" },
  { header: "#3d3072", border: "#2c2260", cell: "bg-violet-50/40" },
  { header: "#5a2070", border: "#481858", cell: "bg-fuchsia-50/40" },
];

const calcMarkup = (precio: number, costo: number) => {
  if (costo <= 0 || precio <= 0) return "-";
  return `${Math.round(((precio - costo) / costo) * 100)}%`;
};

const EditableCell = ({
  value,
  onChange,
  numeric = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  className?: string;
}) => (
  <input
    type={numeric ? "number" : "text"}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full min-w-[60px] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0b5fa5] focus:outline-none text-center text-[11px] py-0.5 transition-colors ${className}`}
  />
);

function CotizacionModal({
  slots,
  hotelesContext,
  onClose,
}: {
  slots: (HotelCotizacion | null)[];
  hotelesContext: Hotel[] | null;
  onClose: () => void;
}) {
  const [providers, setProviders] = React.useState<string[]>(["MIA"]);

  const [rows, setRows] = React.useState<CotizacionRow[]>(() =>
    slots
      .filter((s): s is HotelCotizacion => s !== null)
      .map((s) => {
        const hotelMia = hotelesContext?.find((h) => h.id_hotel === s.id);
        const costoMia =
          hotelMia?.tipos_cuartos[0]?.costo ??
          s.costo_sistema ??
          "0";
        const convenioMia: 0 | 1 =
          hotelMia?.convenio ?? (s.convenio === 1 ? 1 : 0);
        const precioNum = parseFloat(s.total) || 0;
        const noktosSrc = parseFloat(s.noktos_noche) || 0;
        const noktos =
          noktosSrc > 0
            ? Math.round(noktosSrc)
            : Math.round(precioNum / NOKTO_CON_IVA);
        return {
          hotel: s.hotel,
          habitacion: s.habitacion,
          desayuno: s.desayuno,
          cantidad: "1",
          checkin: s.checkin,
          checkout: s.checkout,
          noches: slotNoches(s),
          noktos_unitarios: String(noktos),
          precio_noche: s.total,
          costos: [costoMia],
          convenios: [convenioMia],
        };
      }),
  );

  const update = (i: number, patch: Partial<CotizacionRow>) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

  const updateCosto = (rowIdx: number, pi: number, value: string) =>
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        const costos = [...r.costos];
        costos[pi] = value;
        return { ...r, costos };
      }),
    );

  const updateConvenio = (rowIdx: number, pi: number, value: 0 | 1) =>
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        const convenios = [...r.convenios] as (0 | 1)[];
        convenios[pi] = value;
        return { ...r, convenios };
      }),
    );

  const addProvider = () => {
    const nextLabel = String.fromCharCode(65 + providers.length);
    setProviders((p) => [...p, nextLabel]);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        costos: [...r.costos, "0"],
        convenios: [...r.convenios, 0],
      })),
    );
  };

  const updateProviderName = (pi: number, name: string) =>
    setProviders((prev) => prev.map((p, i) => (i === pi ? name : p)));

  const color = (pi: number) => PROVIDER_COLORS[pi % PROVIDER_COLORS.length];

  const colHeader = (key: string, text: string, bg: string, borderColor: string) => (
    <th
      key={key}
      className="px-2 py-1 font-semibold whitespace-nowrap text-[10px] text-white border"
      style={{ backgroundColor: bg, borderColor }}
    >
      {text}
    </th>
  );

  return (
    <Modal onClose={onClose} title="Cotización" subtitle="Detalle de servicios">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse min-w-max">
          <thead>
            <tr>
              <th
                colSpan={11}
                className="bg-[#42a5d4] text-white text-center py-1.5 px-3 font-bold text-[11px] tracking-wide border border-[#42a5d4]"
              >
                DETALLE SERVICIOS
              </th>
              {providers.map((name, pi) => (
                <th
                  key={pi}
                  colSpan={5}
                  className="text-white text-center py-1.5 px-3 font-bold text-[11px] tracking-wide border"
                  style={{
                    backgroundColor: color(pi).header,
                    borderColor: color(pi).border,
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    COSTO PROVEEDOR
                    <input
                      value={name}
                      onChange={(e) => updateProviderName(pi, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 bg-transparent border-b border-white/50 focus:border-white focus:outline-none text-white text-center font-bold text-[11px] placeholder-white/60"
                      placeholder="Nombre"
                    />
                  </span>
                </th>
              ))}
              <th className="px-2 bg-gray-50 border border-gray-200 align-middle">
                <button
                  type="button"
                  onClick={addProvider}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[#0b5fa5] hover:text-blue-800 whitespace-nowrap px-1.5 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Proveedor
                </button>
              </th>
            </tr>
            <tr>
              {[
                "#",
                "HOTEL",
                "DETALLE",
                "DESAYUNO INCLUIDO",
                "CANTIDAD",
                "CHECK IN",
                "CHECK OUT",
                "NOCHES",
                "NOKTOS UNITARIOS",
                "IMPORTE / NOCHE",
                "IMPORTE TOTAL",
              ].map((h) =>
                colHeader(h, h, "#42a5d4", "#2e8bbb"),
              )}
              {Array.from({ length: providers.length }).map((_, pi) =>
                ["CONVENIO", "COSTO / NOCHE", "COSTO TOTAL", "MARK UP", "GANANCIA"].map(
                  (h) => colHeader(`${pi}-${h}`, h, color(pi).header, color(pi).border),
                ),
              )}
              <th className="bg-gray-50 border border-gray-200" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const precio = parseFloat(row.precio_noche) || 0;
              const cant = parseInt(row.cantidad) || 1;
              const importeTotal = precio * row.noches * cant;
              const bg = i % 2 === 0 ? "bg-white" : "bg-gray-50";

              return (
                <tr key={i} className={bg}>
                  <td className="px-2 py-1.5 text-center border border-gray-200 font-medium text-gray-700">
                    {i + 1}
                  </td>
                  <td className="px-1 py-1 border border-gray-200 min-w-[120px]">
                    <EditableCell
                      value={row.hotel}
                      onChange={(v) => update(i, { hotel: v })}
                    />
                  </td>
                  <td className="px-1 py-1 border border-gray-200">
                    <EditableCell
                      value={row.habitacion}
                      onChange={(v) => update(i, { habitacion: v })}
                    />
                  </td>
                  <td className="px-1 py-1 border border-gray-200 text-center">
                    <EditableCell
                      value={row.desayuno === 1 ? "SÍ" : "NO"}
                      onChange={(v) =>
                        update(i, {
                          desayuno:
                            v.toUpperCase() === "SÍ" ||
                            v.toUpperCase() === "SI"
                              ? 1
                              : 0,
                        })
                      }
                    />
                  </td>
                  <td className="px-1 py-1 border border-gray-200">
                    <EditableCell
                      value={row.cantidad}
                      numeric
                      onChange={(v) => update(i, { cantidad: v })}
                    />
                  </td>
                  <td className="px-1 py-1 border border-gray-200">
                    <input
                      type="date"
                      value={row.checkin}
                      onChange={(e) => {
                        const newCheckin = e.target.value;
                        const newNoches =
                          newCheckin && row.checkout
                            ? calcularNoches(newCheckin, row.checkout)
                            : row.noches;
                        update(i, { checkin: newCheckin, noches: newNoches });
                      }}
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0b5fa5] focus:outline-none text-[11px] py-0.5 transition-colors"
                    />
                  </td>
                  <td className="px-1 py-1 border border-gray-200">
                    <input
                      type="date"
                      value={row.checkout}
                      min={row.checkin || undefined}
                      onChange={(e) => {
                        const newCheckout = e.target.value;
                        const newNoches =
                          row.checkin && newCheckout
                            ? calcularNoches(row.checkin, newCheckout)
                            : row.noches;
                        update(i, { checkout: newCheckout, noches: newNoches });
                      }}
                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0b5fa5] focus:outline-none text-[11px] py-0.5 transition-colors"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center border border-gray-200 font-medium">
                    {row.noches || "-"}
                  </td>
                  <td className="px-1 py-1 border border-gray-200">
                    <EditableCell
                      value={row.noktos_unitarios}
                      numeric
                      onChange={(v) =>
                        update(i, {
                          noktos_unitarios: String(
                            Math.round(parseFloat(v) || 0),
                          ),
                        })
                      }
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center border border-gray-200 text-gray-700 whitespace-nowrap">
                    $
                    {formatNumber(precio, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-2 py-1.5 text-center border border-gray-200 font-bold text-sky-900 whitespace-nowrap">
                    $
                    {formatNumber(importeTotal, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  {Array.from({ length: providers.length }).map((_, pi) => {
                    const costo = parseFloat(row.costos[pi] ?? "0") || 0;
                    const costoTotal = costo * row.noches * cant;
                    const ganancia = precio - costo;
                    const c = color(pi);
                    const convenio = row.convenios[pi] ?? 0;
                    return (
                      <React.Fragment key={pi}>
                        <td className={`px-2 py-1.5 text-center border border-gray-200 ${c.cell}`}>
                          <button
                            type="button"
                            onClick={() => updateConvenio(i, pi, convenio === 1 ? 0 : 1)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                              convenio === 1
                                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                : "bg-red-50 text-red-500 border-red-200"
                            }`}
                          >
                            {convenio === 1 ? "SÍ" : "NO"}
                          </button>
                        </td>
                        <td className={`px-1 py-1 border border-gray-200 ${c.cell}`}>
                          <EditableCell
                            value={row.costos[pi] ?? "0"}
                            numeric
                            onChange={(v) => updateCosto(i, pi, v)}
                          />
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center border border-gray-200 ${c.cell} whitespace-nowrap`}
                        >
                          {formatNumber(costoTotal, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center border border-gray-200 ${c.cell}`}
                        >
                          {calcMarkup(precio, costo)}
                        </td>
                        <td
                          className={`px-2 py-1.5 text-center border border-gray-200 ${c.cell} font-bold whitespace-nowrap ${ganancia >= 0 ? "text-emerald-700" : "text-red-600"}`}
                        >
                          $
                          {formatNumber(ganancia, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className={`border border-gray-200 ${bg}`} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── GenerarCotizacion ──────────────────────────────────────────────────────
export default function GenerarCotizacion() {
  const searchParams = useSearchParams();
  const slotsInitialized = useRef(false);
  const { hoteles: hotelesContext } = useHoteles();
  const { error } = useAlert();

  const [correoOrigen, setCorreoOrigen] = useState<{
    id_correo: string | null;
    subject: string | null;
    body_email: string | null;
    hoteles: CorreoHotel[] | null;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    check_in: searchParams.get("check_in") ?? "",
    check_out: searchParams.get("check_out") ?? "",
    lat: null,
    lng: null,
    correo_cliente: "",
    id_cliente: "",
    nombre_cliente: "",
  });

  const [slots, dispatch] = useReducer(slotsReducer, [null, null, null]);
  const [allHotels, setAllHotels] = useState<HotelCotizacion[]>([]);
  const [swapTarget, setSwapTarget] = useState<HotelCotizacion | null>(null);
  const [clientes, setClientes] = useState<Agente[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [preciosIA, setPreciosIA] = useState<Map<string, PrecioIA>>(new Map());
  const [loadingVis, setLoadingVis] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [downloadingSlot, setDownloadingSlot] = useState<number | null>(null);
  const [downloadingImageSlot, setDownloadingImageSlot] = useState<
    number | null
  >(null);
  const [showCotizacionModal, setShowCotizacionModal] = useState(false);
  const cuponRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  const handleCheckInChange = (value: string) =>
    setForm((prev) => ({
      ...prev,
      check_in: value,
      check_out: prev.check_out && prev.check_out < value ? "" : prev.check_out,
    }));

  const handleCheckOutChange = (value: string) => {
    if (form.check_in && value < form.check_in) return;
    setForm((prev) => ({ ...prev, check_out: value }));
  };

  const canGenerate =
    !!form.check_in &&
    !!form.check_out &&
    form.lat !== null &&
    form.lng !== null;

  useEffect(() => {
    const raw = sessionStorage.getItem("cotizacion_correo");
    if (raw) {
      try {
        setCorreoOrigen(JSON.parse(raw));
      } catch {
        // ignorar JSON corrupto
      }
    }
  }, []);

  useEffect(() => {
    if (slotsInitialized.current) return;
    if (!correoOrigen?.hoteles || !hotelesContext) return;
    slotsInitialized.current = true;

    const nuevosSlots: (HotelCotizacion | null)[] = correoOrigen.hoteles
      .filter((ch) => !ch.enviado)
      .map((ch, i) => {
        const hotelCompleto = hotelesContext.find(
          (h) => h.id_hotel === ch.hotel_id,
        );
        const room = hotelCompleto?.tipos_cuartos[0];
        const total = room?.precio ?? String(ch.price_per_night);
        return withNoktoDefaults({
          id: ch.hotel_id,
          hotel: ch.hotel_name,
          total,
          subtotal: room?.costo ?? String(ch.price_per_night),
          desayuno: room?.incluye_desayuno === 1 ? 1 : 0,
          habitacion: "SENCILLA",
          notas: "",
          direccion: hotelCompleto?.direccion ?? "",
          zona: hotelCompleto?.Ciudad_Zona ?? "",
          priority: i + 1,
          distancia: null,
          checkin: form.check_in,
          checkout: form.check_out,
          precio_referencia: ch.price_per_night,
          fuente_referencia: ch.source,
          precio_sistema: room?.precio ?? null,
          costo_sistema: room?.costo ?? null,
        });
      });

    const MIN_SLOTS = 3;
    while (nuevosSlots.length < MIN_SLOTS) nuevosSlots.push(null);
    dispatch({ type: "set_slots", payload: nuevosSlots });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correoOrigen, hotelesContext]);

  const datesInitialized = useRef(false);
  useEffect(() => {
    if (!datesInitialized.current) {
      datesInitialized.current = true;
      return;
    }
    dispatch({
      type: "sync_dates",
      check_in: form.check_in,
      check_out: form.check_out,
    });
  }, [form.check_in, form.check_out]);

  useEffect(() => {
    fetchAgentes({}, {}, setClientes).catch(() => {});
  }, []);

  const filteredClientes = clientSearch.trim()
    ? clientes.filter((c) =>
        c.nombre_agente_completo
          .toLowerCase()
          .includes(clientSearch.toLowerCase()),
      )
    : clientes;

  const handleSelectCliente = (c: Agente) => {
    setForm((prev) => ({
      ...prev,
      id_cliente: c.id_agente,
      nombre_cliente: c.nombre_agente_completo,
    }));
    setClientSearch(c.nombre_agente_completo);
    setClientOpen(false);
  };

  const buscarPreciosIA = async (hoteles: HotelCotizacion[]) => {
    setLoadingSearch(true);
    try {
      const nombres = hoteles.map((h) => h.hotel).filter(Boolean);
      const origin = new URL(BASE_URL).origin;
      const res = await fetch(`${origin}/search-hotel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify({
          hoteles: nombres,
          checkin: form.check_in,
          checkout: form.check_out,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log("[Precios IA]", json.data);
      const mapa = new Map<string, PrecioIA>();
      (json.data?.hoteles ?? []).forEach((h: PrecioIA & { nombre: string }) => {
        mapa.set(h.nombre.toLowerCase().trim(), h);
      });
      setPreciosIA(mapa);
    } catch (err: any) {
      console.warn("[Precios IA] Error:", err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleGenerarVisualizaciones = async () => {
    setLoadingVis(true);
    try {
      const response = await ExtraService.getInstance().getHotelesCotizacion({
        checkin: form.check_in,
        checkout: form.check_out,
        lat: form.lat!,
        lng: form.lng!,
        ...(form.id_cliente ? { id_cliente: form.id_cliente } : {}),
      });
      const data = ((response.data ?? []) as HotelCotizacion[]).map((h) =>
        withNoktoDefaults(h),
      );
      const sorted = [...data].sort(
        (a, b) => parseFloat(a.total || "0") - parseFloat(b.total || "0"),
      );
      setAllHotels(sorted);
      dispatch({
        type: "set_slots",
        payload: [sorted[0] ?? null, sorted[1] ?? null, sorted[2] ?? null],
      });
      buscarPreciosIA(sorted);
    } catch (err: any) {
      error(err?.message || "Error al obtener cotizaciones");
    } finally {
      setLoadingVis(false);
    }
  };

  const hasAny = slots.some((s) => s !== null);

  const handleHotelSelected = (hoteles: Hotel[]) => {
    const hotel = hoteles[0];
    if (!hotel || activeSlot === null) return;

    const room = hotel.tipos_cuartos[0];
    const total = hotel.convenio === 0 ? "" : (room?.precio ?? "0");

    dispatch({
      type: "set_hotel",
      index: activeSlot,
      hotel: withNoktoDefaults({
        id: hotel.id_hotel,
        hotel: hotel.nombre_hotel,
        total,
        subtotal: room?.costo ?? room?.precio ?? "0",
        desayuno: room?.incluye_desayuno === 1 ? 1 : 0,
        habitacion: "SENCILLA",
        notas: hotel.convenio === 0 ? "TARIFA DINÁMICA" : "",
        direccion: hotel.direccion,
        zona: hotel.Ciudad_Zona,
        priority: activeSlot + 1,
        distancia: null,
        checkin: form.check_in,
        checkout: form.check_out,
        precio_referencia: null,
        fuente_referencia: null,
        precio_sistema: room?.precio ?? null,
        costo_sistema: room?.costo ?? null,
        convenio: hotel.convenio,
      }),
    });
    setActiveSlot(null);
  };

  const handleDownloadCupon = async (hotel: HotelCotizacion, index: number) => {
    setDownloadingSlot(index);
    try {
      const backUrl = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/v1$/, "");
      const params = new URLSearchParams({
        hotel: JSON.stringify({
          id: hotel.id,
          nombre: hotel.hotel,
          precio_venta: hotel.total,
          checkin: hotel.checkin,
          checkout: hotel.checkout,
          iteracion: index,
          notas: hotel.notas,
          tiene_desayuno: hotel.desayuno === 1,
          cuarto: hotel.habitacion,
        }),
      });
      const res = await fetch(`${backUrl}/probando?${params}`);
      if (!res.ok) throw new Error("Error al generar el cupón");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion_opcion${index + 1}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      error(err?.message || "Error al descargar cupón");
    } finally {
      setDownloadingSlot(null);
    }
  };

  const handleDownloadImagen = async (index: number) => {
    const node = cuponRefs.current[index];
    if (!node) return;
    setDownloadingImageSlot(index);
    try {
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `cupon_opcion${index + 1}.png`;
      a.click();
    } catch (err: any) {
      error(err?.message ?? "Error al generar imagen del cupón");
    } finally {
      setDownloadingImageSlot(null);
    }
  };

  const slotIds = new Set(slots.filter(Boolean).map((s) => s!.id));
  const benchHotels = allHotels.filter((h) => !slotIds.has(h.id));

  const handleSwap = (slotIndex: number) => {
    if (!swapTarget) return;
    dispatch({
      type: "set_hotel",
      index: slotIndex,
      hotel: {
        ...swapTarget,
        checkin: form.check_in,
        checkout: form.check_out,
      },
    });
    setSwapTarget(null);
  };

  const modalSubtitle = [
    form.lat !== null && `Lat: ${form.lat}`,
    form.lng !== null && `Lng: ${form.lng}`,
    form.check_in && `Check-in: ${form.check_in}`,
    form.check_out && `Check-out: ${form.check_out}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {showCotizacionModal && (
        <CotizacionModal
          slots={slots}
          hotelesContext={hotelesContext}
          onClose={() => setShowCotizacionModal(false)}
        />
      )}

      {activeSlot !== null && (
        <Modal
          onClose={() => setActiveSlot(null)}
          title={
            slots[activeSlot]
              ? `Modificar — ${slots[activeSlot]!.hotel}`
              : `Agregar hotel — Prioridad ${activeSlot + 1}`
          }
          subtitle={modalSubtitle}
        >
          <FormSeleccionarHoteles
            mode="single"
            onSubmit={handleHotelSelected}
          />
        </Modal>
      )}

      <div className="flex flex-col gap-4 p-4">
        {loadingSearch && (
          <div className="flex items-center gap-4 rounded-xl px-5 py-4 shadow-sm bg-white">
            <Loader />
            <div>
              <p className="text-sm font-semibold">
                Buscando precios actuales con IA
              </p>
              <p className="text-xs text-gray-500">
                Consultando Booking.com, Expedia y sitios oficiales...
              </p>
            </div>
          </div>
        )}

        <section className="w-full flex flex-col gap-2 bg-white border rounded-xl p-3 shadow-sm h-fit">
          <h2 className="font-semibold text-gray-800 text-xs">
            Datos de búsqueda
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerarVisualizaciones();
            }}
            className="flex gap-3 items-end justify-between"
          >
            <InputGoogle
              size="lg"
              googleStyle
              label="Zona/Lugar/Dirección *"
              onChange={(place: PlaceMaps) => {
                setForm((prev) => ({
                  ...prev,
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                }));
              }}
            />
            <DateInput
              label="Check-in *"
              value={form.check_in}
              onChange={handleCheckInChange}
              className="text-xs w-full"
            />
            <DateInput
              label="Check-out *"
              value={form.check_out}
              onChange={handleCheckOutChange}
              min={form.check_in || undefined}
              className="text-xs w-full"
            />

            {/* Cliente */}
            <div className="relative w-full">
              <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                Cliente
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0b5fa5]"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setClientOpen(true);
                  if (!e.target.value) {
                    setForm((prev) => ({
                      ...prev,
                      id_cliente: "",
                      nombre_cliente: "",
                    }));
                  }
                }}
                onFocus={() => setClientOpen(true)}
                onBlur={() => setTimeout(() => setClientOpen(false), 150)}
              />
              {clientOpen && filteredClientes.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {filteredClientes.map((c) => (
                    <li
                      key={c.id_agente}
                      onMouseDown={() => handleSelectCliente(c)}
                      className="px-3 py-2 text-xs cursor-pointer hover:bg-[#f0f6ff] truncate"
                    >
                      <span className="font-medium text-gray-800">
                        {c.nombre_agente_completo}
                      </span>
                      {c.correo && (
                        <span className="ml-1.5 text-gray-400">{c.correo}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              type="submit"
              size="md"
              variant="primary"
              icon={loadingVis ? Loader2 : Eye}
              disabled={loadingVis}
            >
              {loadingVis ? "Buscando..." : "Generar"}
            </Button>
          </form>
        </section>
        <div className="flex gap-4">
          {/* Bench — otras opciones */}
          {benchHotels.length > 0 && (
            <aside className="w-52 flex-shrink-0 flex flex-col gap-2 bg-white border rounded-xl p-3 shadow-sm h-fit sticky top-4">
              <h2 className="font-semibold text-gray-800 text-xs">
                Otras opciones ({benchHotels.length})
              </h2>

              {/* Picker de slot cuando hay swapTarget */}
              {swapTarget && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold text-blue-700 leading-snug">
                    ¿En qué prioridad poner{" "}
                    <span className="font-bold">{swapTarget.hotel}</span>?
                  </p>
                  <div className="flex flex-col gap-1">
                    {slots.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSwap(i)}
                        className="text-left text-[10px] px-2 py-1 rounded bg-white border border-blue-300 hover:bg-blue-100 transition-colors"
                      >
                        <span className="font-bold text-blue-700">
                          Prioridad {i + 1}
                        </span>
                        {s && (
                          <span className="text-gray-500 ml-1 truncate block">
                            {s.hotel}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSwapTarget(null)}
                    className="text-[10px] text-gray-400 hover:text-gray-600 text-center mt-0.5"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                {benchHotels.map((h) => (
                  <li
                    key={h.id}
                    className={`rounded-lg border p-2 flex flex-col gap-1 transition-colors ${
                      swapTarget?.id === h.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-gray-800 leading-snug line-clamp-2">
                      {h.hotel}
                    </span>
                    {parseFloat(h.total) > 0 && (
                      <span className="text-[10px] text-blue-600 font-bold">
                        $
                        {formatNumber(parseFloat(h.total), {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        <span className="text-gray-400 font-normal">
                          {" "}
                          / noche
                        </span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setSwapTarget(swapTarget?.id === h.id ? null : h)
                      }
                      className={`mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded border transition-colors ${
                        swapTarget?.id === h.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "text-[#0b5fa5] border-[#0b5fa5] hover:bg-[#f0f6ff]"
                      }`}
                    >
                      {swapTarget?.id === h.id
                        ? "Seleccionado"
                        : "Cambiar opción"}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Slots */}
          <section className="flex-1 flex flex-col gap-3 bg-gray-50 border rounded-xl p-3 shadow-sm">
            {hasAny && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowCotizacionModal(true)}
                >
                  Generar Cotización
                </Button>
              </div>
            )}
            {loadingVis ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16 gap-2">
                <Loader />
                <p className="text-sm font-medium text-gray-600">
                  Buscando hoteles...
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {slots.map((hotel, index) =>
                    hotel ? (
                      <HotelCard
                        key={index}
                        hotel={hotel}
                        index={index}
                        downloading={downloadingSlot === index}
                        downloadingImage={downloadingImageSlot === index}
                        dispatch={dispatch}
                        onEdit={() => setActiveSlot(index)}
                        onDownload={() => handleDownloadCupon(hotel, index)}
                        onDownloadImagen={() => handleDownloadImagen(index)}
                        cuponRef={(el) => {
                          cuponRefs.current[index] = el;
                        }}
                        precioIA={
                          loadingSearch
                            ? undefined
                            : (preciosIA.get(
                                hotel.hotel.toLowerCase().trim(),
                              ) ?? null)
                        }
                      />
                    ) : (
                      <EmptySlotCard
                        key={index}
                        priority={index + 1}
                        onAdd={() =>
                          dispatch({
                            type: "set_hotel",
                            index,
                            hotel: blankHotel(
                              index,
                              form.check_in,
                              form.check_out,
                            ),
                          })
                        }
                      />
                    ),
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
