import React, { useEffect, useReducer, useRef, useState } from "react";
import Modal from "../organism/Modal";
import { MostrarSaldos } from "../template/MostrarSaldos";
import {
  ComboBox2,
  ComboBoxOption,
  ComboBoxOption2,
  DateTimeInput,
  Dropdown,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "../atom/Input";
import { ViajeroService, ViajerosService } from "@/services/ViajerosService";
import Button from "../atom/Button";
import { CarFront, CheckCircle, Goal, Plus, Target, User2 } from "lucide-react";
import { useNotification } from "@/context/useNotificacion";
import { isSomeNull } from "@/helpers/validator";
import { Saldo } from "@/services/SaldoAFavor";
import { getDatePlusFiveYears, getTodayDateTime } from "@/lib/utils";
import { SectionForm } from "../atom/SectionForm";
import { ForSave, GuardadoRapido } from "../template/GuardadoRapido";
import { ExtraService, Proveedor, Sucursal } from "@/services/ExtraServices";
import { CarRentalServices } from "@/services/RentaCarros";

// Ajusta / elimina si ya tienes el type Agente global
type Agente = { id_agente: string };

/* =========================
   Tipos
========================= */

export type CarRental = {
  costo: number | null;
  precio: number | null;
  conductores: (ViajeroService | null)[];
  codigo: string | null;
  status: string | null;
  edad: "21" | "22" | "23" | "24" | "+25" | null;
  check_in: string | null;
  check_out: string | null;
  proveedor: Proveedor | null;
  intermediario: Proveedor | null;
  auto_descripcion: string | null;
  max_pasajeros: number | null;
  tipo_vehiculo: string | null;
  seguro: string | null;
  comentarios: string | null;
  recogida_lugar: Sucursal | null;
  devuelta_lugar: Sucursal | null;
};

const emptyState: CarRental = {
  costo: null,
  precio: null,
  conductores: [null],
  codigo: null,
  status: null,
  edad: null,
  check_in: null,
  check_out: null,
  proveedor: null,
  intermediario: null,
  auto_descripcion: null,
  max_pasajeros: null,
  tipo_vehiculo: null,
  seguro: null,
  comentarios: null,
  recogida_lugar: null,
  devuelta_lugar: null,
};

type Action =
  | { type: "RESET" }
  | { type: "DUPLICAR_LUGAR" }
  | { type: "INIT"; payload: CarRental }
  | {
      type: "UPDATE_CAR_RENTAL";
      payload: { field: keyof CarRental; value: CarRental[keyof CarRental] };
    };

const carRentalReducer = (state: CarRental, action: Action): CarRental => {
  switch (action.type) {
    case "UPDATE_CAR_RENTAL":
      return { ...state, [action.payload.field]: action.payload.value };
    case "RESET":
      return emptyState;
    case "DUPLICAR_LUGAR":
      return { ...state, devuelta_lugar: state.recogida_lugar };
    case "INIT":
      return action.payload;
    default:
      return state;
  }
};


  const safe = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));
const moneyMXN = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return safe(v);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
};
const pickSummaryFromDataInicio = (raw: any) => {
  const gem = raw?.objeto_gemini ?? {};
  const item = gem?.item?.item ?? {};
  const car = item?.carDetails ?? {};
  const pick = item?.rentalPeriod?.pickupLocation ?? {};
  const ret = item?.rentalPeriod?.returnLocation ?? {};
  const prov = item?.provider ?? {};

  return {
    id_solicitud: raw?.id_solicitud ?? null,
    estado: gem?.status ?? raw?.estado_solicitud ?? null,
    cliente: raw?.nombre_cliente ?? raw?.razon_social ?? null,
    viajero: gem?.viajero_principal ?? raw?.nombre_viajero ?? null,
    id_viajero: gem?.id_viajero ?? raw?.id_viajero ?? null,

    proveedor: gem?.proveedor ?? prov?.name ?? null,
    rating: prov?.rating ?? null,

    total: gem?.total ?? item?.price?.total ?? raw?.total_solicitud ?? null,
    currency: item?.price?.currency ?? "MXN",

    pickup_city: pick?.city ?? null,
    pickup_address: pick?.address ?? null,
    pickup_dt: pick?.dateTime ?? gem?.check_in ?? raw?.check_in ?? null,

    return_city: ret?.city ?? null,
    return_address: ret?.address ?? null,
    return_dt: ret?.dateTime ?? gem?.check_out ?? raw?.check_out ?? null,

    car_make: car?.make ?? null,
    car_model: car?.model ?? null,
    car_category: car?.category ?? null,
    passengers: car?.passengers ?? null,
    transmission: car?.transmission ?? null,

    included: item?.price?.includedFeatures ?? null,
    confirmation_code: raw?.confirmation_code ?? null,
  };
};

const DataInicioSummary = ({ data_inicio }: { data_inicio: any }) => {
  const s = pickSummaryFromDataInicio(data_inicio);

  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Información de la solicitud</h3>
          <p className="text-xs text-slate-600">
            Se detectó data inicial; se usará para autorrellenar el formulario.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-600">Total</div>
          <div className="text-sm font-semibold text-slate-900">
            {moneyMXN(s.total)}
          </div>
          <div className="text-xs text-slate-600">{safe(s.estado)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-white p-2 border border-slate-200">
          <div className="font-semibold text-slate-700">Cliente / Viajero</div>
          <div className="text-slate-700">Cliente: {safe(s.cliente)}</div>
          <div className="text-slate-700">Viajero: {safe(s.viajero)}</div>
          <div className="text-slate-500">ID viajero: {safe(s.id_viajero)}</div>
        </div>

        <div className="rounded-md bg-white p-2 border border-slate-200">
          <div className="font-semibold text-slate-700">Proveedor / Auto</div>
          <div className="text-slate-700">Proveedor: {safe(s.proveedor)}</div>
          <div className="text-slate-500">Rating: {safe(s.rating)}</div>
          <div className="text-slate-700">
            Auto: {safe(s.car_make)} {safe(s.car_model)} ({safe(s.car_category)})
          </div>
          <div className="text-slate-500">
            Pasajeros: {safe(s.passengers)} · Transmisión: {safe(s.transmission)}
          </div>
        </div>

        <div className="rounded-md bg-white p-2 border border-slate-200">
          <div className="font-semibold text-slate-700">Fechas / Lugares</div>
          <div className="text-slate-700">
            Recogida: {safe(s.pickup_city)} · {safe(s.pickup_dt)}
          </div>
          <div className="text-slate-500">{safe(s.pickup_address)}</div>
          <div className="mt-1 text-slate-700">
            Devolución: {safe(s.return_city)} · {safe(s.return_dt)}
          </div>
          <div className="text-slate-500">{safe(s.return_address)}</div>
        </div>
      </div>

      {s.included && (
        <div className="mt-2 rounded-md bg-white p-2 border border-slate-200 text-xs">
          <div className="font-semibold text-slate-700">Incluye</div>
          <div className="text-slate-700">{safe(s.included)}</div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
        <span className="rounded-full bg-white border border-slate-200 px-2 py-1">
          ID solicitud: {safe(s.id_solicitud)}
        </span>
        <span className="rounded-full bg-white border border-slate-200 px-2 py-1">
          Confirmation: {safe(s.confirmation_code)}
        </span>
      </div>
    </div>
  );
};

/* =========================
   Helpers para prefill (cart -> CarRental)
========================= */

const toDT = (iso?: string | null) => {
  if (!iso) return null;
  return iso.length >= 16 ? iso.slice(0, 16) : iso; // "YYYY-MM-DDTHH:mm"
};

const toNumber = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const mapTransmissionToTipoVehiculo = (
  t?: string | null
): CarRental["tipo_vehiculo"] => {
  if (!t) return null;
  const x = String(t).toLowerCase();
  return x.includes("auto") ? "AUTOMATICO" : "ESTANDAR";
};

const mapStatus = (s?: string | null): CarRental["status"] => {
  if (!s) return null;
  const x = String(s).toLowerCase();
  if (x.includes("cancel")) return "Cancelada";
  if (x.includes("confirm")) return "Confirmada";
  if (x.includes("pend")) return "Pendiente";
  return null;
};

const normalizeInitial = (data_inicio?: Partial<CarRental> | null): CarRental => {
  const merged: CarRental = {
    ...emptyState,
    ...(data_inicio ?? {}),
  } as CarRental;

  merged.conductores =
    (data_inicio as any)?.conductores?.length > 0
      ? (data_inicio as any).conductores
      : [null];

  return merged;
};

const buildPatchFromDataInicio = (raw: any): Partial<CarRental> => {
  const gem = raw?.objeto_gemini ?? {};
  const item = gem?.item?.item ?? {};

  const priceTotal =
    gem?.total ?? item?.price?.total ?? raw?.total_solicitud ?? null;

  const pickupDT =
    item?.rentalPeriod?.pickupLocation?.dateTime ??
    gem?.check_in ??
    raw?.check_in ??
    null;

  const returnDT =
    item?.rentalPeriod?.returnLocation?.dateTime ??
    gem?.check_out ??
    raw?.check_out ??
    null;

  const make = item?.carDetails?.make ?? "";
  const model = item?.carDetails?.model ?? "";
  const category = item?.carDetails?.category ?? "";
  const autoDesc = [make, model, category].filter(Boolean).join(" ") || null;

  return {
    codigo: null,
    precio: toNumber(priceTotal),
    edad: gem?.item?.extra?.edad
      ? (String(gem.item.extra.edad) as CarRental["edad"])
      : null,
    check_in: toDT(pickupDT),
    check_out: toDT(returnDT),
    max_pasajeros: toNumber(item?.carDetails?.passengers),
    tipo_vehiculo: mapTransmissionToTipoVehiculo(item?.carDetails?.transmission),
    auto_descripcion: autoDesc,
    seguro: item?.price?.includedFeatures ?? null,
    status: mapStatus(gem?.status ?? raw?.estado_solicitud),
  };
};

const initFromAny = (data_inicio: any): CarRental => {
  if (!data_inicio) return emptyState;

  // si viene cart (tiene objeto_gemini) -> patch
  if (data_inicio?.objeto_gemini) {
    return normalizeInitial(buildPatchFromDataInicio(data_inicio));
  }

  // si viene ya como CarRental parcial
  return normalizeInitial(data_inicio as Partial<CarRental>);
};

const findProveedorByName = (proveedores: Proveedor[], name?: string | null) => {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  return (
    proveedores.find((p) => (p.nombre ?? "").toLowerCase().trim() === n) ?? null
  );
};

const findSucursalByAddress = (sucursales: Sucursal[], address?: string | null) => {
  if (!address) return null;
  const a = address.toLowerCase().trim();
  return (
    sucursales.find((s) => (s.direccion ?? "").toLowerCase().includes(a)) ??
    sucursales.find((s) => a.includes((s.direccion ?? "").toLowerCase())) ??
    null
  );
};

const findViajeroById = (viajeros: ViajeroService[], id_viajero?: string | null) => {
  if (!id_viajero) return null;
  return (
    viajeros.find((v: any) => String(v?.id_viajero) === String(id_viajero)) ?? null
  );
};

/* =========================
   FORM
========================= */

type CarRentalFormProps = {
  agente: Agente | null;          // <-- importante: permite null para no romper
  data_inicio?: any;
  onClose?: () => void;
  onSuccess?: () => void;
};

export const CarRentalForm: React.FC<CarRentalFormProps> = ({
  agente,
  data_inicio,
  onClose,
  onSuccess,
}) => {
  const agenteId = agente?.id_agente ?? agente; // <-- evita crashes
  console.log("envion de informacion",data_inicio)
  const [state, dispatch] = useReducer(
    carRentalReducer,
    data_inicio ?? null,
    initFromAny
  );
  

  const [viajeros, setViajeros] = useState<ViajeroService[]>([]);
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);


  const [openPago, setOpenPago] = useState(false);
  const [save, setSave] = useState<ForSave>(null);

  const { showNotification } = useNotification();

  const handleUpdateCarRental = <K extends keyof CarRental>(
    field: K,
    value: CarRental[K]
  ) => {
    dispatch({ type: "UPDATE_CAR_RENTAL", payload: { field, value } });
  };

  /** Prefill SOLO una vez por id_solicitud (para no pisar edición del usuario) */
  const prefillKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data_inicio) return;

    const key = String(data_inicio?.id_solicitud ?? "no-id");
    if (prefillKeyRef.current === key) return;
    prefillKeyRef.current = key;

    dispatch({ type: "INIT", payload: initFromAny(data_inicio) });
  }, [data_inicio]);

  /** Carga catálogos SOLO cuando ya hay agenteId */
  useEffect(() => {
    if (!agenteId) return;

    ViajerosService.getInstance()
      .obtenerViajerosPorAgente(agenteId)
      .then((res) => setViajeros(res.data || []))
      .catch((error: any) =>
        showNotification("error", error?.message || "Error al obtener viajeros")
      );

    ExtraService.getInstance()
      .getProveedoresCarros()
      .then((res) => setProveedores(res.data || []))
      .catch((error: any) =>
        showNotification("error", error?.message || "Error al obtener proveedores")
      );

    ExtraService.getInstance()
      .getSucursales()
      .then((res) => setSucursales(res.data || []))
      .catch((error: any) =>
        showNotification("error", error?.message || "Error al obtener sucursales")
      );
  }, [agenteId, showNotification]);

  /** Resolver proveedor/sucursales/conductor cuando catálogos ya llegaron */
  useEffect(() => {
    if (!data_inicio?.objeto_gemini) return;

    const gem = data_inicio?.objeto_gemini ?? {};
    const item = gem?.item?.item ?? {};

    // proveedor
    if (!state.proveedor && proveedores.length > 0) {
      const provName = gem?.proveedor ?? item?.provider?.name ?? null;
      const provObj = findProveedorByName(proveedores, provName);
      if (provObj) handleUpdateCarRental("proveedor", provObj);
    }

    // sucursales
    if (!state.recogida_lugar && sucursales.length > 0) {
      const addr = item?.rentalPeriod?.pickupLocation?.address ?? null;
      const s = findSucursalByAddress(sucursales, addr);
      if (s) handleUpdateCarRental("recogida_lugar", s);
    }

    if (!state.devuelta_lugar && sucursales.length > 0) {
      const addr = item?.rentalPeriod?.returnLocation?.address ?? null;
      const s = findSucursalByAddress(sucursales, addr);
      if (s) handleUpdateCarRental("devuelta_lugar", s);
    }

    // conductor principal
    if ((state.conductores?.[0] ?? null) === null && viajeros.length > 0) {
      const idV = gem?.id_viajero ?? data_inicio?.id_viajero ?? null;
      const v = findViajeroById(viajeros, idV);
      if (v) handleUpdateCarRental("conductores", [v]);
    }
  }, [data_inicio, proveedores, sucursales, viajeros, state.proveedor, state.recogida_lugar, state.devuelta_lugar, state.conductores]);

  const onPagar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if ((state.precio ?? 0) <= 0) throw new Error("El precio debe ser mayor a 0");
      if (isSomeNull(state, ["comentarios"])) {
        throw new Error("Parece ser que dejaste algunos campos vacíos");
      }
      setOpenPago(true);
    } catch (error: any) {
      showNotification("error", error?.message || "Error al ir a pagar");
    }
  };

  const handleGuardarProveedor = (p: Proveedor[]) => {
    setProveedores(p);
    setSave(null);
  };

  const handleSaveSucursal = (s: Sucursal[]) => {
    setSucursales(s);
    setSave(null);
  };

  const handleSubmit = async (
    saldos: (Saldo & { restante: number; usado: boolean })[],
    faltante: number,
    isPrimary: boolean
  ) => {
    try {
      setLoading(true);

      if (!agenteId) throw new Error("No hay agente seleccionado");

      if (faltante !== 0 && isPrimary) {
        throw new Error(
          "No puedes pagar con este, por favor si quieres pagar con crédito usa el otro botón"
        );
      }

      if (faltante === 0 && !isPrimary) {
        throw new Error(
          "Parece que ya pagaste todo con saldo a favor, ya no queda nada para pagar a crédito"
        );
      }

      const { message } =
        await CarRentalServices.getInstance().createCarRentalOperaciones({
          ...state,
          saldos,
          faltante: faltante.toFixed(2),
          id_agente: agenteId,
        });

      dispatch({ type: "RESET" });
      setOpenPago(false);
      showNotification("success", message);

      onSuccess?.();
      onClose?.();
    } catch (error: any) {
      showNotification("error", error?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal interno: pagar */}
      {openPago && (
        <Modal
          onClose={() => setOpenPago(false)}
          title="Selecciona con qué pagar"
          subtitle="Puedes escoger solo algunos y pagar lo restante con crédito"
        >
          <MostrarSaldos
            id_agente={agenteId}
            precio={state.precio ?? 0}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </Modal>
      )}

      {/* Modal interno: guardado rápido */}
      {save && (
        <Modal
          onClose={() => setSave(null)}
          title={`Agregar ${
            save === "renta_carro" ? "proveedor de renta de carro" : "sucursal"
          }`}
          subtitle={`Agrega los valores de ${
            save === "renta_carro" ? "el nuevo proveedor" : "la nueva sucursal"
          }`}
        >
          <GuardadoRapido
            onSaveProveedor={handleGuardarProveedor}
            type={save}
            onSaveSucursal={handleSaveSucursal}
            proveedores={proveedores}
          />
        </Modal>
      )}

      {/* CLAVE: quita h-full para que no colapse dentro del Modal */}
      <form className="w-full relative p-2 flex flex-col gap-2" onSubmit={onPagar}>
        <div className="w-full grid md:grid-cols-3 gap-2 rounded-md">
          <SectionForm legend={"Detalles de renta"} icon={CarFront} className="col-span-2">
            <div className="grid lg:grid-cols-2 gap-4">
              <TextInput
                // value={String(new Date().getTime())}
                value={state.codigo}
                label="Código de reservación"
                placeholder="HJK1243..."
                onChange={(value: string) => handleUpdateCarRental("codigo", value)}
              />

              <div className="flex gap-2">
                <ComboBox2
                  label="Proveedor"
                  className="w-full"
                  value={
                    state.proveedor
                      ? { name: state.proveedor.nombre, content: state.proveedor }
                      : null
                  }
                  onChange={(value: ComboBoxOption2<Proveedor>) => {
                    handleUpdateCarRental("proveedor", value.content);
                  }}
                  options={proveedores.map((proveedor) => ({
                    name: proveedor.nombre,
                    content: proveedor,
                  }))}
                />
                <Button
                  icon={Plus}
                  className="self-end"
                  type="button"
                  onClick={() => setSave("renta_carro")}
                >
                  Agregar
                </Button>
              </div>

              <Dropdown
                label="Estado"
                value={state.status}
                onChange={(value: string) => handleUpdateCarRental("status", value)}
                options={["Pendiente", "Confirmada", "Cancelada"]}
              />

              <TextInput
                value={state.seguro}
                label="Seguro"
                placeholder=""
                onChange={(value: string) => handleUpdateCarRental("seguro", value)}
              />

              <Dropdown
                value={state.tipo_vehiculo}
                onChange={(value: string) => handleUpdateCarRental("tipo_vehiculo", value)}
                label="Tipo de vehículo"
                options={["AUTOMATICO", "ESTANDAR"]}
              />

              <TextInput
                value={state.auto_descripcion}
                onChange={(value: string) =>
                  handleUpdateCarRental("auto_descripcion", value)
                }
                label="Descripción auto"
              />

              <Dropdown
                label="Edad"
                value={state.edad}
                onChange={(value: string) =>
                  handleUpdateCarRental("edad", value as CarRental["edad"])
                }
                options={["21", "22", "23", "24", "+25"]}
              />

              <NumberInput
                label="Número máximo de pasajeros"
                value={state.max_pasajeros}
                onChange={(value: string) =>
                  handleUpdateCarRental("max_pasajeros", Number(value))
                }
              />
            </div>
          </SectionForm>

          <SectionForm legend={"Conductores"} icon={User2} className="flex flex-col w-full">
            <div className="grid gap-2 h-full flex-1">
              {state.conductores.map((conductor, index) => (
                <ComboBox2
                  key={`Conductor-Car-Rental-${index}`}
                  value={
                    conductor
                      ? { name: conductor.nombre_completo, content: conductor }
                      : null
                  }
                  className="flex-1"
                  label={`Conductor #${index + 1}`}
                  onChange={(value: ComboBoxOption<ViajeroService>) => {
                    const newConductores = [...state.conductores].map((c, i) =>
                      i === index ? value.content : c
                    );
                    handleUpdateCarRental("conductores", newConductores);
                  }}
                  options={viajeros.map((c) => ({
                    name: c.nombre_completo,
                    content: c,
                  }))}
                />
              ))}

              <div className="grid md:grid-cols-2 items-end w-full">
                <Button
                  className="w-full"
                  type="button"
                  disabled={state.conductores.length <= 1}
                  variant="warning"
                  onClick={() =>
                    handleUpdateCarRental(
                      "conductores",
                      [...state.conductores].slice(0, -1)
                    )
                  }
                >
                  Borrar conductor
                </Button>
                <Button
                  className="w-full"
                  type="button"
                  onClick={() =>
                    handleUpdateCarRental("conductores", [...state.conductores, null])
                  }
                >
                  Agregar conductor
                </Button>
              </div>
            </div>
          </SectionForm>
        </div>

        <div className="w-full grid md:grid-cols-2 gap-2 rounded-md">
          <SectionForm legend={"Recogida"} icon={Target}>
            <div className="grid gap-2 mx-2">
              <div className="flex gap-2">
                <ComboBox2
                  className="w-full"
                  label="Lugar de recogida"
                  value={
                    state.recogida_lugar
                      ? {
                          name: `${state.recogida_lugar.nombre} - ${state.recogida_lugar.direccion}`,
                          content: state.recogida_lugar,
                        }
                      : null
                  }
                  onChange={(value: ComboBoxOption2<Sucursal>) =>
                    handleUpdateCarRental("recogida_lugar", value.content)
                  }
                  options={sucursales.map((s) => ({
                    name: `${s.nombre} - ${s.direccion}`,
                    content: s,
                  }))}
                />
                <Button
                  icon={Plus}
                  className="self-end"
                  type="button"
                  onClick={() => setSave("sucursal")}
                >
                  Agregar
                </Button>
              </div>

              <DateTimeInput
                label="Fecha de recogida"
                min={getTodayDateTime()}
                max={getDatePlusFiveYears()}
                value={state.check_in}
                onChange={(value: string) => {
                  handleUpdateCarRental("check_in", value);
                  if (state.check_out == null) handleUpdateCarRental("check_out", value);
                }}
              />
            </div>
          </SectionForm>

          <SectionForm legend={"Devolución"} icon={Goal}>
            <div className="grid gap-2 mx-2">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <ComboBox2
                    className="w-full"
                    label="Lugar de devolución"
                    value={
                      state.devuelta_lugar
                        ? {
                            name: `${state.devuelta_lugar.nombre} - ${state.devuelta_lugar.direccion}`,
                            content: state.devuelta_lugar,
                          }
                        : null
                    }
                    onChange={(value: ComboBoxOption2<Sucursal>) =>
                      handleUpdateCarRental("devuelta_lugar", value.content)
                    }
                    options={sucursales.map((s) => ({
                      name: `${s.nombre} - ${s.direccion}`,
                      content: s,
                    }))}
                  />
                  <Button
                    icon={Plus}
                    type="button"
                    className="self-end"
                    onClick={() => setSave("sucursal")}
                  >
                    Agregar
                  </Button>
                </div>

                {!state.devuelta_lugar && !!state.recogida_lugar && (
                  <p
                    onClick={() => dispatch({ type: "DUPLICAR_LUGAR" })}
                    className="text-blue-700 underline text-xs cursor-pointer hover:text-blue-900"
                  >
                    ¿Quieres poner el mismo lugar de recogida?
                  </p>
                )}
              </div>

              <DateTimeInput
                min={getTodayDateTime()}
                max={getDatePlusFiveYears()}
                label="Fecha de devolución"
                value={state.check_out}
                onChange={(value: string) => handleUpdateCarRental("check_out", value)}
              />
            </div>
          </SectionForm>
        </div>

        <div className="py-6 px-4 rounded-t-lg bg-sky-50 flex flex-col space-y-4">
          <div className="grid grid-cols-7 gap-2 w-full">
            <TextAreaInput
              rows={1}
              label="Comentarios"
              value={state.comentarios || ""}
              className="col-span-3"
              onChange={(value: string) => handleUpdateCarRental("comentarios", value)}
            />

            <ComboBox2
              label="Intermediario"
              className="col-span-3"
              value={
                state.intermediario
                  ? { name: state.intermediario.nombre, content: state.intermediario }
                  : null
              }
              onChange={(value: ComboBoxOption2<Proveedor>) =>
                handleUpdateCarRental("intermediario", value.content)
              }
              options={proveedores.map((i) => ({ name: i.nombre, content: i }))}
            />

            <Button
              icon={Plus}
              className="self-end"
              type="button"
              onClick={() => setSave("renta_carro")}
            >
              Agregar
            </Button>

            <NumberInput
              label="Costo proveedor"
              value={state.costo}
              className="col-span-3"
              onChange={(value: string) => handleUpdateCarRental("costo", Number(value))}
            />

            <NumberInput
              label="Precio a cliente"
              className="col-span-3"
              value={state.precio}
              onChange={(value: string) => handleUpdateCarRental("precio", Number(value))}
            />

            <div className="pt-6">
              <Button icon={CheckCircle} className="w-full">
                Ir a pagar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

/* =========================
   MODAL wrapper
========================= */

type CarRentalModalProps = {
  agente: Agente | null;     // <-- permite null para no romper
  open: boolean;
  onClose: () => void;
  data_inicio?: any;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
};

export const CarRentalModal: React.FC<CarRentalModalProps> = ({
  agente,
  open,
  onClose,
  data_inicio,
  onSuccess,
  title,
  subtitle,
}) => {
  if (!open) return null;
  console.log("envio de informacion", agente)

  return (
    <Modal
      onClose={onClose}
      title={title ?? (data_inicio ? "Editar renta de carro" : "Nueva renta de carro")}
      subtitle={subtitle ?? "Completa la información y continúa a pagar"}
    >
      {/* CLAVE: wrapper con scroll para que se vea completo */}
      <div className="w-[90vw] max-w-6xl max-h-[85vh]">
        {/* ✅ CUADRO SOLO SI VIENE DATA INICIAL */}
        {data_inicio ? <DataInicioSummary data_inicio={data_inicio} /> : null}
        
        <CarRentalForm
          agente={agente}
          data_inicio={data_inicio}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </Modal>
  );
};

/* =========================
   FULLSCREEN (compatibilidad)
========================= */
export const CarRentalPage = ({ agente }: { agente: Agente }) => {
  return <CarRentalForm agente={agente} />;
};
