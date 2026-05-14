"use client";

import DOMPurify from "dompurify";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  DateInput,
  TextInput,
  Dropdown,
  CheckboxInput,
} from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { ExtraService } from "@/services/ExtraServices";
import Modal from "@/components/organism/Modal";
import { FormSeleccionarHoteles } from "@/components/organism/FormSeleccionarHoteles";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/useAlert";
import { useHoteles } from "@/context/Hoteles";
import { CorreoHotel } from "@/types/database_tables";
import React from "react";

// ─── Constants ──────────────────────────────────────────────────────────────
const NOKTO_CON_IVA = 168.2;
const OPCIONES_HABITACION = ["SENCILLA", "DOBLE"];

// ─── Types ──────────────────────────────────────────────────────────────────
type FormData = {
  hotel: string;
  ciudad: string;
  check_in: string;
  check_out: string;
  codigo_postal: string;
  correo_cliente: string;
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
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const calcNoches = (checkin: string, checkout: string): number => {
  if (!checkin || !checkout) return 0;
  const diff = new Date(checkout).getTime() - new Date(checkin).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
};

const formatDate = (d: string) => {
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

const formatNum = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const withNoktoDefaults = (h: Partial<HotelCotizacion>): HotelCotizacion =>
  ({
    noktos_noche: "0",
    noktos_estancia: "0",
    mostrar_total_estancia: false,
    ...h,
  }) as HotelCotizacion;

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
    <div className="w-[42%] bg-[#f1f5ff] px-2 py-1 text-[10px] font-bold text-gray-700 flex items-center">
      {label}
    </div>
    <div
      className={`flex-1 px-2 py-1 text-[10px] flex flex-col items-center justify-center text-center ${
        alert ? "text-red-500 font-bold" : "text-gray-800"
      }`}
    >
      <span>{value || "-"}</span>
      {note && <span className="text-[9px] text-gray-400">{note}</span>}
    </div>
  </div>
);

// ─── CuponCard (solo display, pensado para captura de pantalla) ─────────────
const CuponCard = React.forwardRef<
  HTMLDivElement,
  { hotel: HotelCotizacion; priority: number }
>(({ hotel, priority }, ref) => {
  const noches = calcNoches(hotel.checkin, hotel.checkout);
  const total = parseFloat(hotel.total) || 0;
  const subtotalNoche = total > 0 ? total / 1.16 : 0;
  const totalEstancia = total * noches;
  return (
    <div
      ref={ref}
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
    >
      <div className="bg-[#0b5fa5] text-white px-3 py-1.5 text-[10px] font-bold tracking-wide">
        OPCIÓN {priority} — HOSPEDAJE
      </div>

      <div className="divide-y divide-gray-100">
        <CuponRow label="HOTEL:" value={hotel.hotel} />
        <CuponRow label="HABITACIÓN:" value={hotel.habitacion} />
        <CuponRow label="CHECK-IN:" value={formatDate(hotel.checkin)} />
        <CuponRow label="CHECK-OUT:" value={formatDate(hotel.checkout)} />
        <CuponRow label="NOCHES:" value={noches > 0 ? String(noches) : "-"} />
        <CuponRow
          label="DESAYUNO:"
          value={hotel.desayuno === 1 ? "SÍ" : "NO"}
        />
        <CuponRow label="DIRECCIÓN:" value={hotel.direccion} />

        {total > 0 ? (
          <>
            <CuponRow
              label="PRECIO / NOCHE:"
              value={`$ ${formatNum(total)}`}
              note="Con IVA"
            />
            <CuponRow
              label="SUBTOTAL / NOCHE:"
              value={`$ ${formatNum(subtotalNoche)}`}
              note="Sin IVA"
            />
            {hotel.mostrar_total_estancia && noches > 0 && (
              <CuponRow
                label="TOTAL ESTANCIA:"
                value={`$ ${formatNum(totalEstancia)}`}
                note={`${noches} ${noches === 1 ? "noche" : "noches"}`}
              />
            )}
          </>
        ) : (
          <CuponRow label="PRECIO / NOCHE:" value="SIN PRECIO" alert />
        )}

      </div>

      {hotel.notas ? (
        <div className="px-3 py-2 border-t border-gray-100 flex gap-2">
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

// ─── ControlsPanel ──────────────────────────────────────────────────────────
const ControlsPanel = ({
  hotel,
  isFirst,
  isLast,
  canEdit,
  downloading,
  downloadingImage,
  onUp,
  onDown,
  onEdit,
  onDelete,
  onDownload,
  onDownloadImagen,
  onTotalChange,
  onDesayunoChange,
  onHabitacionChange,
  onNotasChange,
  onNoktoNocheChange,
  onNoktoEstanciaChange,
  onMostrarTotalEstanciaChange,
}: {
  hotel: HotelCotizacion;
  isFirst: boolean;
  isLast: boolean;
  canEdit: boolean;
  downloading: boolean;
  downloadingImage: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onDownloadImagen: () => void;
  onTotalChange: (v: string) => void;
  onDesayunoChange: (v: 0 | 1) => void;
  onHabitacionChange: (v: string) => void;
  onNotasChange: (v: string) => void;
  onNoktoNocheChange: (v: string) => void;
  onNoktoEstanciaChange: (v: string) => void;
  onMostrarTotalEstanciaChange: (v: boolean) => void;
}) => {
  const noches = calcNoches(hotel.checkin, hotel.checkout);
  const total = parseFloat(hotel.total) || 0;
  const subtotalNoche = total > 0 ? total / 1.16 : 0;
  const inputCls =
    "w-full text-[10px] border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#0b5fa5]";
  const labelCls = "text-[10px] font-bold text-gray-600 mb-0.5 block";

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Orden */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">orden</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onUp}
            disabled={isFirst}
            className="p-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-25 transition-colors"
            title="Subir prioridad"
          >
            <ChevronUp className="w-3 h-3 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={onDown}
            disabled={isLast}
            className="p-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-25 transition-colors"
            title="Bajar prioridad"
          >
            <ChevronDown className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Precio / noche */}
      <div>
        <label className={labelCls}>PRECIO / NOCHE</label>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400">$</span>
          <input
            type="number"
            value={hotel.total}
            onChange={(e) => onTotalChange(e.target.value)}
            className={inputCls}
          />
        </div>
        {subtotalNoche > 0 && (
          <span className="text-[9px] text-gray-400 mt-0.5 block">
            Subtotal s/IVA: ${formatNum(subtotalNoche)}
          </span>
        )}
        {total > 0 && noches > 0 && (
          <span className="text-[9px] text-blue-500 mt-0.5 block font-medium">
            Total estancia: ${formatNum(total * noches)} ({noches}n)
          </span>
        )}
      </div>

      {/* Noktos */}
      <div className="border-t border-gray-100 pt-2">
        <label className={labelCls}>NOKTOS</label>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-400 w-[56px] shrink-0">
              / noche
            </span>
            <input
              type="number"
              value={hotel.noktos_noche}
              onChange={(e) => onNoktoNocheChange(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-400 w-[56px] shrink-0">
              estancia{noches > 0 ? ` (${noches}n)` : ""}
            </span>
            <input
              type="number"
              value={hotel.noktos_estancia}
              onChange={(e) => onNoktoEstanciaChange(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Mostrar total de estancia en el cupón */}
      <CheckboxInput
        label="Mostrar total de estancia"
        checked={hotel.mostrar_total_estancia}
        onChange={onMostrarTotalEstanciaChange}
      />

      {/* Habitación */}
      <div>
        <label className={labelCls}>HABITACIÓN</label>
        <Dropdown
          label=""
          value={hotel.habitacion}
          onChange={onHabitacionChange}
          options={OPCIONES_HABITACION}
        />
      </div>

      {/* Desayuno */}
      <CheckboxInput
        label={`Desayuno: ${hotel.desayuno === 1 ? "Sí" : "No"}`}
        checked={hotel.desayuno === 1}
        onChange={(v) => onDesayunoChange(v ? 1 : 0)}
      />

      {/* Notas */}
      <div>
        <label className={labelCls}>NOTAS</label>
        <textarea
          value={hotel.notas}
          onChange={(e) => onNotasChange(e.target.value)}
          rows={2}
          placeholder="Notas adicionales..."
          className="w-full text-[10px] border border-gray-200 rounded px-1.5 py-1 resize-none focus:outline-none focus:border-[#0b5fa5] placeholder:text-gray-300"
        />
      </div>

      {/* Alerta sin precio */}
      {total === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5 flex gap-1.5">
          <span className="text-yellow-500 text-xs leading-none mt-0.5">⚠</span>
          <p className="text-[10px] text-yellow-700 leading-snug">
            Sin precio registrado
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-1 flex-wrap border-t border-gray-100 pt-2">
        <Button
          icon={Pencil}
          size="sm"
          variant="secondary"
          onClick={onEdit}
          disabled={!canEdit}
          title={canEdit ? "modificar" : "Ingresa check-in y check-out primero"}
        >
          modificar
        </Button>
        <Button
          icon={Trash2}
          size="sm"
          variant="warning ghost"
          onClick={onDelete}
          title="eliminar"
        >
          eliminar
        </Button>
        <Button
          icon={downloading ? Loader2 : Download}
          size="sm"
          variant="secondary"
          onClick={onDownload}
          disabled={downloading}
          title="descargar cupón PDF"
        >
          cupón
        </Button>
        <Button
          icon={downloadingImage ? Loader2 : ImageIcon}
          size="sm"
          variant="secondary"
          onClick={onDownloadImagen}
          disabled={downloadingImage}
          title="descargar imagen del cupón"
        >
          imagen
        </Button>
      </div>
    </div>
  );
};

// ─── HotelCard ──────────────────────────────────────────────────────────────
const HotelCard = ({
  hotel,
  priority,
  isFirst,
  isLast,
  canEdit,
  downloading,
  downloadingImage,
  onUp,
  onDown,
  onEdit,
  onDelete,
  onDownload,
  onDownloadImagen,
  onTotalChange,
  onDesayunoChange,
  onHabitacionChange,
  onNotasChange,
  onNoktoNocheChange,
  onNoktoEstanciaChange,
  onMostrarTotalEstanciaChange,
  cuponRef,
}: {
  hotel: HotelCotizacion;
  priority: number;
  isFirst: boolean;
  isLast: boolean;
  canEdit: boolean;
  downloading: boolean;
  downloadingImage: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onDownloadImagen: () => void;
  onTotalChange: (v: string) => void;
  onDesayunoChange: (v: 0 | 1) => void;
  onHabitacionChange: (v: string) => void;
  onNotasChange: (v: string) => void;
  onNoktoNocheChange: (v: string) => void;
  onNoktoEstanciaChange: (v: string) => void;
  onMostrarTotalEstanciaChange: (v: boolean) => void;
  cuponRef: React.Ref<HTMLDivElement>;
}) => (
  <div className="flex flex-col gap-1">
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[#0b5fa5] px-2 py-0.5 rounded-full w-fit">
      Prioridad {priority}
    </span>
    <div className="grid grid-cols-[260px_1fr] gap-3 items-start">
      <ControlsPanel
        hotel={hotel}
        isFirst={isFirst}
        isLast={isLast}
        canEdit={canEdit}
        downloading={downloading}
        downloadingImage={downloadingImage}
        onUp={onUp}
        onDown={onDown}
        onEdit={onEdit}
        onDelete={onDelete}
        onDownload={onDownload}
        onDownloadImagen={onDownloadImagen}
        onTotalChange={onTotalChange}
        onDesayunoChange={onDesayunoChange}
        onHabitacionChange={onHabitacionChange}
        onNotasChange={onNotasChange}
        onNoktoNocheChange={onNoktoNocheChange}
        onNoktoEstanciaChange={onNoktoEstanciaChange}
        onMostrarTotalEstanciaChange={onMostrarTotalEstanciaChange}
      />
      <CuponCard ref={cuponRef} hotel={hotel} priority={priority} />
    </div>
  </div>
);

// ─── EmptySlotCard ──────────────────────────────────────────────────────────
const EmptySlotCard = ({
  priority,
  onAdd,
  canAdd,
}: {
  priority: number;
  onAdd: () => void;
  canAdd: boolean;
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
          {canAdd
            ? "Sin hotel asignado para esta prioridad"
            : "Ingresa check-in y check-out para agregar un hotel"}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0b5fa5] border border-[#0b5fa5] rounded-lg hover:bg-[#f0f6ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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

// ─── GenerarCotizacion ──────────────────────────────────────────────────────
export default function GenerarCotizacion() {
  const searchParams = useSearchParams();
  const slotsInitialized = useRef(false);
  const { user } = useAuth();
  const { hoteles: hotelesContext } = useHoteles();

  const [correoOrigen, setCorreoOrigen] = useState<{
    id_correo: string | null;
    subject: string | null;
    body_email: string | null;
    hoteles: CorreoHotel[] | null;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    hotel: searchParams.get("hotel") ?? "",
    ciudad: searchParams.get("ciudad") ?? "",
    check_in: searchParams.get("check_in") ?? "",
    check_out: searchParams.get("check_out") ?? "",
    codigo_postal: searchParams.get("codigo_postal") ?? "",
    correo_cliente: "",
  });
  const [slots, setSlots] = useState<(HotelCotizacion | null)[]>([
    null,
    null,
    null,
  ]);
  const [loadingVis, setLoadingVis] = useState(false);
  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [downloadingSlot, setDownloadingSlot] = useState<number | null>(null);
  const [downloadingImageSlot, setDownloadingImageSlot] = useState<
    number | null
  >(null);
  const cuponRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  const set = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canGenerate = !!form.check_in && !!form.check_out;

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
    setSlots(nuevosSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correoOrigen, hotelesContext]);

  const handleGenerarVisualizaciones = async () => {
    setLoadingVis(true);
    try {
      const response = await ExtraService.getInstance().getHotelesCotizacion({
        checkin: form.check_in,
        checkout: form.check_out,
        ...(form.hotel && { hotel: form.hotel }),
        ...(form.ciudad && { ciudad: form.ciudad }),
        ...(form.codigo_postal && { cp: form.codigo_postal }),
      });
      const data = ((response.data ?? []) as HotelCotizacion[]).map((h) =>
        withNoktoDefaults(h),
      );
      const sorted = [...data].sort(
        (a, b) => parseFloat(a.total || "0") - parseFloat(b.total || "0"),
      );
      if (form.hotel) {
        const needle = form.hotel.toLowerCase();
        const idx = sorted.findIndex((h) =>
          h.hotel.toLowerCase().includes(needle),
        );
        if (idx > 0) sorted.unshift(sorted.splice(idx, 1)[0]);
      }
      setSlots([sorted[0] ?? null, sorted[1] ?? null, sorted[2] ?? null]);
    } catch (error) {
      console.error("Error al obtener cotizaciones:", error);
    } finally {
      setLoadingVis(false);
    }
  };

  const hasAny = slots.some((s) => s !== null);

  const handleSlotAction = (index: number) => setActiveSlot(index);

  const handleHotelSelected = (hoteles: Hotel[]) => {
    const hotel = hoteles[0];
    if (!hotel || activeSlot === null) return;

    const room = hotel.tipos_cuartos[0];
    const total = room?.precio ?? "0";

    const nueva = withNoktoDefaults({
      id: hotel.id_hotel,
      hotel: hotel.nombre_hotel,
      total,
      subtotal: room?.costo ?? room?.precio ?? "0",
      desayuno: room?.incluye_desayuno === 1 ? 1 : 0,
      habitacion: "SENCILLA",
      notas: "",
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
    });

    const updated = [...slots];
    updated[activeSlot] = nueva;
    setSlots(updated);
    setActiveSlot(null);
  };

  const updateSlot = (index: number, patch: Partial<HotelCotizacion>) => {
    setSlots((prev) => {
      const updated = [...prev];
      const slot = updated[index];
      if (slot) updated[index] = { ...slot, ...patch };
      return updated;
    });
  };

  const updateSlotTotal = (index: number, value: string) => {
    const total = parseFloat(value) || 0;
    updateSlot(index, {
      total: value,
      subtotal: total > 0 ? (total / 1.16).toFixed(2) : "0",
    });
  };

  const updateSlotNoktoNoche = (index: number, value: string) => {
    setSlots((prev) => {
      const updated = [...prev];
      const slot = updated[index];
      if (!slot) return prev;
      const noches = calcNoches(slot.checkin, slot.checkout);
      const n = parseFloat(value) || 0;
      const precioNoche = (n * NOKTO_CON_IVA).toFixed(2);
      updated[index] = {
        ...slot,
        noktos_noche: value,
        noktos_estancia: noches > 0 ? (n * noches).toFixed(4) : "0",
        total: precioNoche,
        subtotal: (parseFloat(precioNoche) / 1.16).toFixed(2),
      };
      return updated;
    });
  };

  const updateSlotNoktoEstancia = (index: number, value: string) => {
    setSlots((prev) => {
      const updated = [...prev];
      const slot = updated[index];
      if (!slot) return prev;
      const noches = calcNoches(slot.checkin, slot.checkout);
      const n = parseFloat(value) || 0;
      const noktosPorNoche = noches > 0 ? n / noches : 0;
      const precioNoche = (noktosPorNoche * NOKTO_CON_IVA).toFixed(2);
      updated[index] = {
        ...slot,
        noktos_estancia: value,
        noktos_noche: noches > 0 ? noktosPorNoche.toFixed(4) : "0",
        total: precioNoche,
        subtotal: (parseFloat(precioNoche) / 1.16).toFixed(2),
      };
      return updated;
    });
  };

  const { error } = useAlert();

  const handleGenerarYEnviar = async () => {
    setLoadingEnvio(true);
    try {
      const hoteles = slots
        .filter((s): s is HotelCotizacion => s !== null)
        .slice(0, 3)
        .map((s) => ({
          id: s.id,
          nombre: s.hotel,
          precio_venta: s.total,
          costo: (parseFloat(s.total) / 1.16).toFixed(2),
          checkin: s.checkin,
          checkout: s.checkout,
          notas: s.notas,
          enviado: true,
        }));

      const payload = {
        correo: {
          id_correo: correoOrigen?.id_correo ?? null,
          subject: correoOrigen?.subject ?? null,
          agent_process: {
            check_in: form.check_in,
            check_out: form.check_out,
          },
        },
        hoteles,
        user: {
          id: user?.id ?? null,
          name: user?.name ?? null,
        },
      };

      await fetch(
        "https://n8n-iirj.srv1623687.hstgr.cloud/webhook/e6f345aa-2be8-4c69-80fb-b7e46d5edfd8",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test_token_123456",
          },
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      error(err.message || "Error al enviar cotización");
      console.error("Error al enviar cotización a n8n:", err);
    } finally {
      setLoadingEnvio(false);
    }
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
    } catch (err) {
      error(err.message || "Error al descargar cupón");
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

  const deleteSlot = (index: number) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const move = (index: number, dir: "up" | "down") => {
    const next = dir === "up" ? index - 1 : index + 1;
    if (next < 0 || next >= slots.length) return;
    const updated = [...slots];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    setSlots(updated);
  };

  const modalSubtitle = [
    form.hotel && `Hotel: ${form.hotel}`,
    form.ciudad && `Ciudad: ${form.ciudad}`,
    form.check_in && `Check-in: ${form.check_in}`,
    form.check_out && `Check-out: ${form.check_out}`,
    form.codigo_postal && `CP: ${form.codigo_postal}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
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
        {correoOrigen && (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#f1f5ff] px-5 py-3 border-b flex items-center gap-2">
              <span className="text-xs font-semibold text-[#0b5fa5] uppercase tracking-wide">
                Correo de origen
              </span>
              {correoOrigen.subject && (
                <span className="text-xs text-gray-700 font-semibold truncate">
                  — {correoOrigen.subject}
                </span>
              )}
            </div>
            {correoOrigen.body_email ? (
              <div
                className="px-5 py-4 text-xs text-gray-700 leading-relaxed max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(correoOrigen.body_email),
                }}
              />
            ) : (
              <p className="px-5 py-4 text-xs text-gray-400">
                Sin cuerpo de correo.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          {/* Sidebar de búsqueda */}
          <aside className="w-56 flex-shrink-0 flex flex-col gap-2 bg-white border rounded-xl p-3 shadow-sm h-fit sticky top-4">
            <h2 className="font-semibold text-gray-800 text-xs">
              Datos de búsqueda
            </h2>
            <TextInput
              label="Hotel de referencia"
              value={form.hotel}
              onChange={set("hotel")}
              placeholder="Nombre del hotel"
              className="text-xs"
            />
            <TextInput
              label="Ciudad"
              value={form.ciudad}
              onChange={set("ciudad")}
              placeholder="Ej. ORIZABA"
              className="text-xs"
            />
            <DateInput
              label="Check-in *"
              value={form.check_in}
              onChange={set("check_in")}
              className="text-xs"
            />
            <DateInput
              label="Check-out *"
              value={form.check_out}
              onChange={set("check_out")}
              min={form.check_in || undefined}
              className="text-xs"
            />
            <TextInput
              label="Código postal"
              value={form.codigo_postal}
              onChange={set("codigo_postal")}
              placeholder="Ej. 94300"
              className="text-xs"
            />
            <Button
              size="sm"
              icon={loadingVis ? Loader2 : Eye}
              disabled={!canGenerate || loadingVis}
              onClick={handleGenerarVisualizaciones}
            >
              {loadingVis ? "Buscando..." : "Generar"}
            </Button>
            {!canGenerate && (
              <p className="text-[10px] text-gray-400 text-center -mt-1">
                Check-in y check-out son obligatorios
              </p>
            )}
            {hasAny && (
              <div className="border-t pt-2">
                <Button
                  size="sm"
                  icon={loadingEnvio ? Loader2 : Send}
                  disabled={loadingEnvio}
                  onClick={handleGenerarYEnviar}
                >
                  {loadingEnvio ? "Enviando..." : "Enviar cotización"}
                </Button>
              </div>
            )}
          </aside>

          {/* Slots */}
          <section className="flex-1 flex flex-col gap-3 bg-gray-50 border rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 text-xs">
                {hasAny
                  ? "Cotizaciones — usa las flechas para cambiar prioridad"
                  : "Las cotizaciones aparecerán aquí"}
              </h2>
              {hasAny && (
                <span className="text-[10px] text-gray-400">
                  Solo las primeras 3 prioridades se enviarán
                </span>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {slots.map((hotel, index) =>
                hotel ? (
                  <HotelCard
                    key={index}
                    hotel={hotel}
                    priority={index + 1}
                    isFirst={index === 0}
                    isLast={index === slots.length - 1}
                    canEdit={canGenerate}
                    downloading={downloadingSlot === index}
                    onUp={() => move(index, "up")}
                    onDown={() => move(index, "down")}
                    onEdit={() => handleSlotAction(index)}
                    onDelete={() => deleteSlot(index)}
                    onDownload={() => handleDownloadCupon(hotel, index)}
                    downloadingImage={downloadingImageSlot === index}
                    onDownloadImagen={() => handleDownloadImagen(index)}
                    cuponRef={(el) => {
                      cuponRefs.current[index] = el;
                    }}
                    onTotalChange={(v) => updateSlotTotal(index, v)}
                    onDesayunoChange={(v) => updateSlot(index, { desayuno: v })}
                    onHabitacionChange={(v) =>
                      updateSlot(index, { habitacion: v })
                    }
                    onNotasChange={(v) => updateSlot(index, { notas: v })}
                    onNoktoNocheChange={(v) => updateSlotNoktoNoche(index, v)}
                    onNoktoEstanciaChange={(v) =>
                      updateSlotNoktoEstancia(index, v)
                    }
                    onMostrarTotalEstanciaChange={(v) =>
                      updateSlot(index, { mostrar_total_estancia: v })
                    }
                  />
                ) : (
                  <EmptySlotCard
                    key={index}
                    priority={index + 1}
                    onAdd={() => handleSlotAction(index)}
                    canAdd={canGenerate}
                  />
                ),
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
