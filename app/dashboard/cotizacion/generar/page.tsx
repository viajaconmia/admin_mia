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
  Eye,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { ExtraService } from "@/services/ExtraServices";
import Modal from "@/components/organism/Modal";
import { FormSeleccionarHoteles } from "@/components/organism/FormSeleccionarHoteles";
import { Hotel } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/useAlert";
import { useHoteles } from "@/context/Hoteles";
import { CorreoHotel } from "@/types/database_tables";

type FormData = {
  hotel: string;
  ciudad: string;
  check_in: string;
  check_out: string;
  codigo_postal: string;
  correo_cliente: string;
};

const OPCIONES_HABITACION = ["SENCILLA", "DOBLE"];

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

const RowPrev = ({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) => (
  <div className="flex border-b border-gray-200 last:border-0">
    <div className="w-[42%] bg-[#f1f5ff] px-2 py-1 text-[10px] font-bold text-gray-700 flex items-center">
      {label}
    </div>
    <div className="flex-1 px-2 py-1 text-[10px] text-gray-800 flex flex-col items-center justify-center text-center">
      <span>{value || "-"}</span>
      {note && <span className="text-[9px] text-gray-400">{note}</span>}
    </div>
  </div>
);

const RowEditable = ({
  label,
  value,
  note,
  onChange,
}: {
  label: string;
  value: string;
  note?: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex border-b border-gray-200 last:border-0">
    <div className="w-[42%] bg-[#f1f5ff] px-2 py-1 text-[10px] font-bold text-gray-700 flex items-center">
      {label}
    </div>
    <div className="flex-1 px-2 py-1 flex flex-col items-center justify-center gap-0.5">
      <div className="flex items-center gap-1 w-full">
        <span className="text-[10px] text-gray-400">$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-center text-[10px] border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-[#0b5fa5]"
        />
      </div>
      {note && <span className="text-[9px] text-gray-400">{note}</span>}
    </div>
  </div>
);

const RowDesayunoToggle = ({
  value,
  onChange,
}: {
  value: 0 | 1;
  onChange: (v: 0 | 1) => void;
}) => (
  <div className="flex border-b border-gray-200 last:border-0">
    <div className="w-[42%] bg-[#f1f5ff] px-2 py-1 text-[10px] font-bold text-gray-700 flex items-center">
      DESAYUNO:
    </div>
    <div className="flex-1 px-2 py-1 flex items-center">
      <CheckboxInput
        label={value === 1 ? "Sí" : "No"}
        checked={value === 1}
        onChange={(v) => onChange(v ? 1 : 0)}
      />
    </div>
  </div>
);

const RowSelectHabitacion = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex border-b border-gray-200 last:border-0">
    <div className="w-[42%] bg-[#f1f5ff] px-2 py-1 text-[10px] font-bold text-gray-700 flex items-center">
      HABITACIÓN:
    </div>
    <div className="flex-1 px-1.5 py-0.5">
      <Dropdown
        label=""
        value={value}
        onChange={onChange}
        options={OPCIONES_HABITACION}
      />
    </div>
  </div>
);

const RowNotas = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex border-b border-gray-200 last:border-0">
    <div className="w-[42%] bg-[#f1f5ff] px-2 py-1 text-[10px] font-bold text-gray-700 flex items-start pt-2">
      NOTAS:
    </div>
    <div className="flex-1 px-1.5 py-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        placeholder="Notas adicionales..."
        className="w-full text-[10px] border border-gray-200 rounded px-1.5 py-0.5 resize-none focus:outline-none focus:border-[#0b5fa5] placeholder:text-gray-300"
      />
    </div>
  </div>
);

const HotelCard = ({
  hotel,
  priority,
  isFirst,
  isLast,
  onUp,
  onDown,
  onEdit,
  onDelete,
  onTotalChange,
  onDesayunoChange,
  onHabitacionChange,
  onNotasChange,
}: {
  hotel: HotelCotizacion;
  priority: number;
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTotalChange: (v: string) => void;
  onDesayunoChange: (v: 0 | 1) => void;
  onHabitacionChange: (v: string) => void;
  onNotasChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between px-1">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[#0b5fa5] px-2 py-0.5 rounded-full">
        Prioridad {priority}
      </span>
      <div className="flex gap-1 items-center">
        <p className="text-[10px] text-gray-500">orden</p>
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

    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-[#0b5fa5] text-white px-3 py-1.5 text-[10px] font-bold tracking-wide">
        HOSPEDAJE 2026
      </div>

      <div className="divide-y divide-gray-100">
        <RowPrev label="HOTEL:" value={hotel.hotel} />
        <RowSelectHabitacion
          value={hotel.habitacion}
          onChange={onHabitacionChange}
        />
        <RowPrev label="CHECK-IN:" value={formatDate(hotel.checkin)} />
        <RowPrev label="CHECK-OUT:" value={formatDate(hotel.checkout)} />
        <RowDesayunoToggle value={hotel.desayuno} onChange={onDesayunoChange} />
        <RowPrev label="DIRECCIÓN:" value={hotel.direccion} />
        <RowNotas value={hotel.notas} onChange={onNotasChange} />
      </div>

      {hotel.precio_referencia !== null ? (
        <div className="divide-y divide-gray-100 border-t border-gray-200">
          <RowEditable
            label="PRECIO VENTA:"
            value={hotel.total}
            onChange={onTotalChange}
          />
        </div>
      ) : (
        <div className="border-t border-yellow-200 bg-yellow-50 px-3 py-2 flex items-start gap-2">
          <span className="text-yellow-500 text-sm leading-none mt-0.5">⚠</span>
          <p className="text-[10px] text-yellow-700 leading-snug">
            Debe verificarse que tenga disponibilidad ya que no se encontró en
            el proceso.
          </p>
        </div>
      )}

      <div className="bg-[#00a3c4] text-white px-3 py-1 text-[9px] font-bold flex items-center justify-between">
        <span>Tarifa no reembolsable</span>
      </div>
    </div>
    <div className="flex gap-1">
      <Button
        icon={Pencil}
        size="sm"
        variant="secondary"
        onClick={onEdit}
        title="modificar"
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
    </div>
  </div>
);

const EmptySlotCard = ({
  priority,
  onAdd,
}: {
  priority: number;
  onAdd: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center px-1">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-300 px-2.5 py-0.5 rounded-full">
        Prioridad {priority}
      </span>
    </div>

    <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 text-gray-400 px-4 py-2.5 text-xs font-bold tracking-wide">
        HOSPEDAJE 2026
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

  const set = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canGenerate = !!form.check_in && !!form.check_out;

  useEffect(() => {
    const raw = sessionStorage.getItem("cotizacion_correo");
    if (raw) {
      try {
        setCorreoOrigen(JSON.parse(raw));
      } catch {
        // ignorar si el JSON está corrupto
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
        return {
          id: ch.hotel_id,
          hotel: ch.hotel_name,
          total: room?.precio ?? String(ch.price_per_night),
          subtotal: room?.costo ?? String(ch.price_per_night),
          desayuno: room?.incluye_desayuno === 1 ? 1 : 0,
          habitacion: "SENCILLA",
          notas: "",
          direccion: "",
          zona: hotelCompleto?.Ciudad_Zona ?? "",
          priority: i + 1,
          distancia: null,
          checkin: form.check_in,
          checkout: form.check_out,
          precio_referencia: ch.price_per_night,
          fuente_referencia: ch.source,
          precio_sistema: room?.precio ?? null,
          costo_sistema: room?.costo ?? null,
        };
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
      console.log("Respuesta del endpoint /v1/hoteles/cotizacion:", response);
      const data = (response.data ?? []) as HotelCotizacion[];
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
    const subtotal = room?.costo ?? room?.precio ?? "0";
    const total = room?.precio ?? "0";

    const nueva: HotelCotizacion = {
      id: hotel.id_hotel,
      hotel: hotel.nombre_hotel,
      total,
      subtotal,
      desayuno: room?.incluye_desayuno === 1 ? 1 : 0,
      habitacion: "SENCILLA",
      notas: "",
      direccion: "",
      zona: hotel.Ciudad_Zona,
      priority: activeSlot + 1,
      distancia: null,
      checkin: form.check_in,
      checkout: form.check_out,
      precio_referencia: null,
      fuente_referencia: null,
      precio_sistema: room?.precio ?? null,
      costo_sistema: room?.costo ?? null,
    };

    const updated = [...slots];
    updated[activeSlot] = nueva;
    setSlots(updated);
    setActiveSlot(null);
  };
  const updateSlotPrice = (
    index: number,
    field: "total" | "subtotal",
    value: string,
  ) => {
    setSlots((prev) => {
      const updated = [...prev];
      const slot = updated[index];
      if (slot) updated[index] = { ...slot, [field]: value };
      return updated;
    });
  };

  const updateSlotDesayuno = (index: number, value: 0 | 1) => {
    setSlots((prev) => {
      const updated = [...prev];
      const slot = updated[index];
      if (slot) updated[index] = { ...slot, desayuno: value };
      return updated;
    });
  };

  const updateSlotHabitacion = (index: number, value: string) => {
    setSlots((prev) => {
      const updated = [...prev];
      const slot = updated[index];
      if (slot) updated[index] = { ...slot, habitacion: value };
      return updated;
    });
  };

  const updateSlotNotas = (index: number, value: string) => {
    setSlots((prev) => {
      const updated = [...prev];
      const slot = updated[index];
      if (slot) updated[index] = { ...slot, notas: value };
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
          costo: s.subtotal,
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

      console.log("Payload enviado a n8n:", payload);

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
                <span className="text-xs text-gray-700 font-semiboldaho truncate">
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

          <section className="flex-1 flex flex-col gap-3 bg-gray-50 border rounded-xl p-3 shadow-sm h-fit">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {slots.map((hotel, index) =>
                hotel ? (
                  <HotelCard
                    key={index}
                    hotel={hotel}
                    priority={index + 1}
                    isFirst={index === 0}
                    isLast={index === slots.length - 1}
                    onUp={() => move(index, "up")}
                    onDown={() => move(index, "down")}
                    onEdit={() => handleSlotAction(index)}
                    onDelete={() => deleteSlot(index)}
                    onTotalChange={(v) => updateSlotPrice(index, "total", v)}
                    onDesayunoChange={(v) => updateSlotDesayuno(index, v)}
                    onHabitacionChange={(v) => updateSlotHabitacion(index, v)}
                    onNotasChange={(v) => updateSlotNotas(index, v)}
                  />
                ) : (
                  <EmptySlotCard
                    key={index}
                    priority={index + 1}
                    onAdd={() => handleSlotAction(index)}
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
