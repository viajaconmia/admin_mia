"use client";

import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import Button from "../atom/Button";
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
import { useNotification } from "@/context/useNotificacion";
import { CheckCircle, Plus, Trash2 } from "lucide-react";
import { MostrarSaldos } from "./MostrarSaldos";
import Modal from "../organism/Modal";
import { Aeropuerto, ExtraService, Proveedor } from "@/services/ExtraServices";
import { isSomeNull } from "@/helpers/validator";
import { Saldo } from "@/services/SaldoAFavor";
import { VuelosServices } from "@/services/VuelosServices";
import { ForSave, GuardadoRapido } from "./GuardadoRapido";

/* =========================
   Tipos
========================= */

export type Vuelo = {
  tipo: "ida" | "vuelta" | "ida escala" | "vuelta escala" | null;
  folio: string | null;
  origen: Aeropuerto | null;
  destino: Aeropuerto | null;
  check_in: string | null;
  check_out: string | null;
  aerolinea: Proveedor | null;
  intermediario: Proveedor | null;
  asiento: string | null;
  comentarios: string | null;
  ubicacion_asiento: string | null;
  tipo_tarifa: string | null;
  id?: number;
};

type Details = {
  codigo: string | null;
  viajero: ViajeroService | null;
  costo: number | null;
  precio: number | null;
  status: string | null;
};

const emptyVuelo: Vuelo = {
  tipo: null,
  folio: null,
  origen: null,
  destino: null,
  check_in: null,
  check_out: null,
  aerolinea: null,
  intermediario: null,
  asiento: null,
  comentarios: "",
  ubicacion_asiento: null,
  tipo_tarifa: null,
};

const initialDetails: Details = {
  codigo: null,
  viajero: null,
  costo: null,
  precio: null,
  status: "confirmada",
};

const initialState: Vuelo[] = [emptyVuelo];

/* =========================
   Reducer
========================= */

type Action<K extends keyof Vuelo> =
  | { type: "RESET" }
  | { type: "SET_ALL"; payload: Vuelo[] }
  | { type: "ADD_VUELO" }
  | { type: "DELETE_VUELO"; payload: number }
  | { type: "UPDATE_VUELO"; payload: { index: number; field: K; value: Vuelo[K] } };

const vuelosReducer = (state: Vuelo[], action: Action<keyof Vuelo>) => {
  switch (action.type) {
    case "ADD_VUELO":
      return [...state, { ...emptyVuelo }];
    case "DELETE_VUELO":
      return state.filter((_, index) => index !== action.payload);
    case "UPDATE_VUELO": {
      const next = [...state];
      next[action.payload.index] = {
        ...next[action.payload.index],
        [action.payload.field]: action.payload.value,
      };
      return next;
    }
    case "SET_ALL":
      return action.payload?.length ? action.payload : [emptyVuelo];
    case "RESET":
      return [emptyVuelo];
    default:
      return state;
  }
};

/* =========================
   Helpers (prefill)
========================= */

const safe = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));

const toDT = (iso?: string | null) => {
  if (!iso) return null;
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
};

const toNumber = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeStatus = (s?: any): string | null => {
  if (!s) return null;
  const x = String(s).toLowerCase();
  if (x.includes("cancel")) return "cancelada";
  if (x.includes("confirm")) return "confirmada";
  if (x.includes("pend")) return "pendiente";
  return String(s);
};

// Matchers
const findProveedorByName = (proveedores: Proveedor[], name?: string | null) => {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  return proveedores.find((p) => (p.nombre ?? "").toLowerCase().trim() === n) ?? null;
};

const findAeropuertoByNameOrCode = (aeropuertos: Aeropuerto[], q?: string | null) => {
  if (!q) return null;
  const needle = q.toLowerCase().trim();
  // Ajusta si tu Aeropuerto tiene "iata", "codigo", etc.
  return (
    aeropuertos.find((a: any) => (a?.nombre ?? "").toLowerCase().includes(needle)) ??
    aeropuertos.find((a: any) => (a?.codigo ?? "").toLowerCase() === needle) ??
    aeropuertos.find((a: any) => (a?.iata ?? "").toLowerCase() === needle) ??
    null
  );
};

const findViajeroById = (viajeros: ViajeroService[], id_viajero?: string | null) => {
  if (!id_viajero) return null;
  return viajeros.find((v: any) => String(v?.id_viajero) === String(id_viajero)) ?? null;
};

// Extrae un "array de segmentos" desde data_inicio en rutas comunes
const getSegmentsFromRaw = (raw: any): any[] => {
  const gem = raw?.objeto_gemini ?? {};
  const item = gem?.item ?? {};

  // Rutas posibles (ajusta si tu gemini difiere)
  const segs =
    item?.segments ??
    item?.itineraries?.[0]?.segments ??
    item?.flights ??
    item?.items ??
    gem?.segments ??
    [];

  if (Array.isArray(segs)) return segs;

  // Si viene un objeto único
  if (segs && typeof segs === "object") return [segs];

  return [];
};

const buildDetailsPatchFromDataInicio = (raw: any): Partial<Details> => {
  const gem = raw?.objeto_gemini ?? {};
  const item = gem?.item ?? {};

  const total =
    gem?.total ??
    item?.price?.total ??
    item?.total ??
    raw?.total_solicitud ??
    raw?.total ??
    null;

  const codigo =
    raw?.confirmation_code ??
    raw?.codigo_confirmacion ??
    gem?.codigo ??
    item?.bookingCode ??
    item?.pnr ??
    null;

  const status = normalizeStatus(gem?.status ?? raw?.estado_solicitud ?? raw?.status);

  const idViajero = gem?.id_viajero ?? raw?.id_viajero ?? item?.travelerId ?? null;

  return {
    codigo: codigo ? String(codigo) : null,
    precio: toNumber(total),
    status: status,
    // viajero se completa con match al catálogo en otro useEffect
    viajero: null,
  } as Partial<Details> & { __idViajero?: string };
};

// Construye drafts de Vuelo[] (SIN resolver Aeropuerto/Proveedor aún)
const buildVueloDraftsFromDataInicio = (raw: any): Array<Partial<Vuelo> & { __meta?: any }> => {
  const gem = raw?.objeto_gemini ?? {};
  const item = gem?.item ?? {};

  const segments = getSegmentsFromRaw(raw);

  // Si no hay segments, intenta fallback con check_in/out + origen/destino básicos
  if (!segments.length) {
    return [
      {
        tipo: "ida",
        folio: item?.flightNumber ?? item?.folio ?? null,
        check_in: toDT(gem?.check_in ?? raw?.check_in ?? null),
        check_out: toDT(gem?.check_out ?? raw?.check_out ?? null),
        tipo_tarifa: item?.fareType ?? item?.tipo_tarifa ?? null,
        __meta: {
          airlineName: item?.airline?.name ?? item?.carrier?.name ?? item?.airline ?? gem?.proveedor ?? null,
          originQ: item?.origin?.code ?? item?.origin ?? null,
          destQ: item?.destination?.code ?? item?.destination ?? null,
        },
      },
    ];
  }

  // Map segmentos a drafts
  return segments.map((seg: any, idx: number) => {
    const dep = seg?.departure ?? seg?.from ?? {};
    const arr = seg?.arrival ?? seg?.to ?? {};
    const airline = seg?.carrier ?? seg?.airline ?? {};
    const flightNo = seg?.flightNumber ?? seg?.number ?? seg?.folio ?? null;

    // Determina tipo: el primero "ida", el resto "ida escala" por defecto
    const tipo: Vuelo["tipo"] = idx === 0 ? "ida" : "ida escala";

    return {
      tipo,
      folio: flightNo ? String(flightNo) : null,
      check_in: toDT(dep?.dateTime ?? dep?.time ?? seg?.departureTime ?? null),
      check_out: toDT(arr?.dateTime ?? arr?.time ?? seg?.arrivalTime ?? null),
      tipo_tarifa: seg?.fareType ?? item?.fareType ?? null,
      __meta: {
        airlineName: airline?.name ?? airline?.carrierName ?? airline ?? null,
        originQ: dep?.airportCode ?? dep?.iata ?? dep?.code ?? dep?.airport ?? null,
        destQ: arr?.airportCode ?? arr?.iata ?? arr?.code ?? arr?.airport ?? null,
      },
    };
  });
};

const moneyMXN = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return safe(v);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
};

const VuelosDataInicioSummary = ({ data_inicio }: { data_inicio: any }) => {
  const gem = data_inicio?.objeto_gemini ?? {};
  const item = gem?.item ?? {};
  const total = gem?.total ?? item?.price?.total ?? data_inicio?.total_solicitud ?? null;

  const segs = getSegmentsFromRaw(data_inicio);

  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Información de la solicitud</h3>
          <p className="text-xs text-slate-600">Se detectó data inicial; se usará para autorrellenar.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-600">Total</div>
          <div className="text-sm font-semibold text-slate-900">{moneyMXN(total)}</div>
          <div className="text-xs text-slate-600">{safe(gem?.status ?? data_inicio?.estado_solicitud)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className="rounded-md bg-white p-2 border border-slate-200">
          <div className="font-semibold text-slate-700">Cliente / Viajero</div>
          <div className="text-slate-700">Cliente: {safe(data_inicio?.nombre_cliente ?? data_inicio?.razon_social)}</div>
          <div className="text-slate-700">Viajero: {safe(gem?.viajero_principal ?? data_inicio?.nombre_viajero)}</div>
          <div className="text-slate-500">ID viajero: {safe(gem?.id_viajero ?? data_inicio?.id_viajero)}</div>
        </div>

        <div className="rounded-md bg-white p-2 border border-slate-200">
          <div className="font-semibold text-slate-700">Reserva</div>
          <div className="text-slate-700">ID solicitud: {safe(data_inicio?.id_solicitud)}</div>
          <div className="text-slate-700">Código: {safe(data_inicio?.confirmation_code ?? item?.pnr ?? item?.bookingCode)}</div>
          <div className="text-slate-500">Tramos: {safe(segs?.length || 1)}</div>
        </div>

        <div className="rounded-md bg-white p-2 border border-slate-200">
          <div className="font-semibold text-slate-700">Fechas</div>
          <div className="text-slate-700">Check-in: {safe(gem?.check_in ?? data_inicio?.check_in)}</div>
          <div className="text-slate-700">Check-out: {safe(gem?.check_out ?? data_inicio?.check_out)}</div>
        </div>
      </div>
    </div>
  );
};

/* =========================
   FORM reutilizable (Page/Modal)
========================= */

type VuelosFormProps = {
  agente: Agente;
  data_inicio?: any;          // cart/solicitud
  onClose?: () => void;
  onSuccess?: () => void;
  showSummary?: boolean;      // para decidir si el cuadro se pinta aquí o en el modal wrapper
};

export const VuelosForm: React.FC<VuelosFormProps> = ({
  agente,
  data_inicio,
  onClose,
  onSuccess,
  showSummary = true,
}) => {
  const { showNotification } = useNotification();

  const [state, dispatch] = useReducer(vuelosReducer, initialState);
  const [details, setDetails] = useState<Details>(initialDetails);

  const [viajeros, setViajeros] = useState<ViajeroService[]>([]);
  const [aerolineas, setAerolineas] = useState<Proveedor[]>([]);
  const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal interno: pagar
  const [openPago, setOpenPago] = useState<boolean>(false);

  // Modal interno: guardado rápido
  const [save, setSave] = useState<ForSave>(null);

  // Para no re-aplicar el prefill varias veces al mismo cart
  const prefillKeyRef = useRef<string | null>(null);

  const handleDelete = (index: number) => dispatch({ type: "DELETE_VUELO", payload: index });
  const handleAddVuelo = () => dispatch({ type: "ADD_VUELO" });

  const handleUpdateVuelo = <K extends keyof Vuelo>(index: number, field: K, value: Vuelo[K]) =>
    dispatch({ type: "UPDATE_VUELO", payload: { index, field, value } });

  /* ---------------------------------
     1) Carga catálogos
  ---------------------------------- */
  useEffect(() => {
    ViajerosService.getInstance()
      .obtenerViajerosPorAgente(agente.id_agente)
      .then((res) => setViajeros(res.data || []))
      .catch((error: any) => showNotification("error", error?.message || "Error al obtener viajeros"));

    ExtraService.getInstance()
      .getAerolineas()
      .then((res) => setAerolineas(res.data || []))
      .catch((error: any) => showNotification("error", error?.message || "Error al obtener aerolíneas"));

    ExtraService.getInstance()
      .getAeropuerto()
      .then((res) => setAeropuertos(res.data || []))
      .catch((error: any) => showNotification("error", error?.message || "Error al obtener aeropuertos"));
  }, [agente.id_agente, showNotification]);

  /* ---------------------------------
     2) Prefill base (details + vuelos drafts)
     - Se aplica una sola vez por id_solicitud
  ---------------------------------- */
  useEffect(() => {
    if (!data_inicio) return;

    const key = String(data_inicio?.id_solicitud ?? "no-id");
    if (prefillKeyRef.current === key) return;
    prefillKeyRef.current = key;

    // DETAILS
    const patchDetails = buildDetailsPatchFromDataInicio(data_inicio);
    setDetails((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(patchDetails).filter(([_, v]) => v !== null && v !== undefined && v !== "")
      ),
    }));

    // VUELOS (drafts)
    const drafts = buildVueloDraftsFromDataInicio(data_inicio);
    const normalizedDrafts: Vuelo[] = drafts.map((d: any) => ({
      ...emptyVuelo,
      ...d,
      // no guardamos __meta en state final, lo resolveremos con matcher luego
    }));

    dispatch({ type: "SET_ALL", payload: normalizedDrafts });
  }, [data_inicio]);

  /* ---------------------------------
     3) Resolver matches a catálogos (aerolínea/aeropuerto/viajero)
     - Se ejecuta cuando ya hay catálogos
  ---------------------------------- */
  const draftsMeta = useMemo(() => {
    // reconstruimos los drafts para obtener __meta sin guardar en state
    if (!data_inicio) return [];
    return buildVueloDraftsFromDataInicio(data_inicio);
  }, [data_inicio]);

  useEffect(() => {
    if (!data_inicio) return;
    if (!aerolineas.length && !aeropuertos.length && !viajeros.length) return;

    // 3.1 viajero en details
    if (!details.viajero && viajeros.length) {
      const gem = data_inicio?.objeto_gemini ?? {};
      const idV = gem?.id_viajero ?? data_inicio?.id_viajero ?? null;
      const v = findViajeroById(viajeros, idV);
      if (v) setDetails((prev) => ({ ...prev, viajero: v }));
    }

    // 3.2 resolver aerolínea/aeropuertos por cada vuelo
    // solo intentamos completar si aún está null
    state.forEach((vuelo, idx) => {
      const meta = draftsMeta[idx]?.__meta ?? {};

      // aerolínea
      if (!vuelo.aerolinea && aerolineas.length) {
        const p = findProveedorByName(aerolineas, meta?.airlineName ?? null);
        if (p) handleUpdateVuelo(idx, "aerolinea", p);
      }

      // origen/destino
      if (!vuelo.origen && aeropuertos.length) {
        const a = findAeropuertoByNameOrCode(aeropuertos, meta?.originQ ?? null);
        if (a) handleUpdateVuelo(idx, "origen", a);
      }

      if (!vuelo.destino && aeropuertos.length) {
        const a = findAeropuertoByNameOrCode(aeropuertos, meta?.destQ ?? null);
        if (a) handleUpdateVuelo(idx, "destino", a);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data_inicio, aerolineas, aeropuertos, viajeros]);

  /* ---------------------------------
     Acciones: pagar / guardar
  ---------------------------------- */
  const onPagar = () => {
    try {
      if ((details.precio ?? 0) <= 0) throw new Error("El precio debe ser mayor a 0");

      const res = state.map((vuelo) => isSomeNull(vuelo, ["comentarios"])).some(Boolean);

      // OJO: aquí isSomeNull(details) te exige viajero/codigo/costo etc.
      // si "costo" no es obligatorio, pásalo en ignore list o valida tú.
      if (res || isSomeNull(details as any)) {
        throw new Error("Parece ser que dejaste algunos campos vacíos");
      }

      setOpenPago(true);
    } catch (error: any) {
      showNotification("error", error?.message || "Error al ir a pagar");
    }
  };

  const handleGuardarAerolinea = (list: Proveedor[]) => {
    setAerolineas(list);
    setSave(null);
  };

  const handleGuardarAeropuerto = (list: Aeropuerto[]) => {
    setAeropuertos(list);
    setSave(null);
  };

  const handleSubmit = async (
    saldos: (Saldo & { restante: number; usado: boolean })[],
    faltante: number,
    isPrimary: boolean
  ) => {
    try {
      setLoading(true);

      if (faltante !== 0 && isPrimary)
        throw new Error("No puedes pagar con este, por favor si quieres pagar con crédito usa el otro botón");

      if (faltante === 0 && !isPrimary)
        throw new Error("Parece que ya pagaste todo con saldo a favor, ya no queda nada para pagar a crédito");

      const { message } = await VuelosServices.getInstance().createVuelo(
        faltante,
        saldos,
        state.flat().filter((item): item is Vuelo => !Array.isArray(item)),
        details,
        agente
      );

      dispatch({ type: "RESET" });
      setDetails(initialDetails);
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
            id_agente={agente.id_agente}
            precio={details.precio ?? 0}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </Modal>
      )}

      {/* Modal interno: guardado rápido */}
      {save && (
        <Modal
          onClose={() => setSave(null)}
          title={`Agregar ${save === "vuelo" ? "aerolínea" : "aeropuerto"}`}
          subtitle={`Agrega los valores del nuevo ${save === "vuelo" ? "proveedor" : "aeropuerto"}`}
        >
          <GuardadoRapido
            onSaveProveedor={handleGuardarAerolinea}
            type={save}
            onSaveAeropuerto={handleGuardarAeropuerto}
          />
        </Modal>
      )}

      <div className="w-full h-full p-2 space-y-4 relative">
        {/* ✅ Cuadro de data inicial */}
        {showSummary && data_inicio ? <VuelosDataInicioSummary data_inicio={data_inicio} /> : null}

        {/* Detalles */}
        <div className="w-full grid md:grid-cols-3 gap-4 p-2">
          <ComboBox2
            value={
              details.viajero
                ? { name: details.viajero.nombre_completo, content: details.viajero }
                : null
            }
            label="Viajero"
            onChange={(value: ComboBoxOption<ViajeroService>) => {
              setDetails((prev) => ({ ...prev, viajero: value.content }));
            }}
            options={viajeros.map((viajero) => ({
              name: viajero.nombre_completo,
              content: viajero,
            }))}
          />

          <TextInput
            value={details.codigo}
            label="Código de reservación"
            placeholder="PNR / Código..."
            onChange={(value: string) => setDetails((prev) => ({ ...prev, codigo: value }))}
          />

          <Dropdown
            label="Estado"
            value={details.status}
            onChange={(value: string) => setDetails((prev) => ({ ...prev, status: value }))}
            options={["confirmada", "cancelada", "pendiente"]}
          />
        </div>

        {/* Vuelos */}
        <div className="space-y-4 mx-4">
          {state.map((item, index) => {
            const vuelo = item;

            return (
              <div
                key={`${index}-vuelos`}
                className="w-full h-fit bg-blue-50 p-2 rounded-md shadow-md flex flex-col gap-2"
              >
                <h1 className="w-full border-b text-gray-800 p-2 text-base font-semibold">
                  Vuelo {index + 1}
                </h1>

                <div className="grid md:grid-cols-2 gap-4">
                  <Dropdown
                    label="Tipo"
                    value={vuelo.tipo}
                    onChange={(value: string) => handleUpdateVuelo(index, "tipo", value as Vuelo["tipo"])}
                    options={["ida", "vuelta", "ida escala", "vuelta escala"]}
                  />

                  <TextInput
                    value={vuelo.folio}
                    onChange={(value: string) => handleUpdateVuelo(index, "folio", value)}
                    label="Número de vuelo"
                  />

                  <TextInput
                    label="Tipo de tarifa"
                    value={vuelo.tipo_tarifa}
                    onChange={(value: string) => handleUpdateVuelo(index, "tipo_tarifa", value)}
                  />

                  {/* Aerolínea */}
                  <div className="grid grid-cols-3 gap-4 w-full">
                    <ComboBox2
                      className="col-span-2"
                      value={
                        vuelo.aerolinea
                          ? { name: vuelo.aerolinea.nombre, content: vuelo.aerolinea }
                          : null
                      }
                      label="Aerolínea"
                      onChange={(value: ComboBoxOption2<Proveedor>) =>
                        handleUpdateVuelo(index, "aerolinea", value.content)
                      }
                      options={aerolineas.map((a) => ({ name: a.nombre, content: a }))}
                    />
                    <Button
                      icon={Plus}
                      size="md"
                      className="mt-6 h-fit"
                      onClick={() => setSave("vuelo")}
                      type="button"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Origen / Destino */}
                <div className="grid md:grid-cols-7 gap-4">
                  <ComboBox2<Aeropuerto>
                    value={vuelo.origen ? { name: vuelo.origen.nombre, content: vuelo.origen } : null}
                    className="col-span-3"
                    label="Origen"
                    onChange={(value: ComboBoxOption2<Aeropuerto>) =>
                      handleUpdateVuelo(index, "origen", value.content)
                    }
                    options={aeropuertos.map((a) => ({ name: a.nombre, content: a }))}
                  />

                  <ComboBox2<Aeropuerto>
                    value={vuelo.destino ? { name: vuelo.destino.nombre, content: vuelo.destino } : null}
                    className="col-span-3"
                    label="Destino"
                    onChange={(value: ComboBoxOption2<Aeropuerto>) =>
                      handleUpdateVuelo(index, "destino", value.content)
                    }
                    options={aeropuertos.map((a) => ({ name: a.nombre, content: a }))}
                  />

                  <Button
                    icon={Plus}
                    size="md"
                    className="mt-6 h-fit"
                    onClick={() => setSave("aeropuerto")}
                    type="button"
                  >
                    Agregar
                  </Button>
                </div>

                {/* Fechas */}
                <div className="grid md:grid-cols-2 gap-4">
                  <DateTimeInput
                    label="Fecha de salida"
                    value={vuelo.check_in}
                    onChange={(value: string) => handleUpdateVuelo(index, "check_in", value)}
                  />
                  <DateTimeInput
                    label="Fecha de llegada"
                    value={vuelo.check_out}
                    onChange={(value: string) => handleUpdateVuelo(index, "check_out", value)}
                  />
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                  <TextInput
                    label="Asientos"
                    value={vuelo.asiento}
                    onChange={(value: string) => handleUpdateVuelo(index, "asiento", value)}
                  />

                  <Dropdown
                    label="Ubicación del asiento"
                    value={vuelo.ubicacion_asiento}
                    onChange={(value: string) =>
                      handleUpdateVuelo(index, "ubicacion_asiento", value as Vuelo["ubicacion_asiento"])
                    }
                    options={["Ventana", "En medio", "Pasillo"]}
                  />

                  <TextAreaInput
                    label="Comentarios"
                    value={vuelo.comentarios}
                    onChange={(value: string) => handleUpdateVuelo(index, "comentarios", value)}
                  />

                  {/* Intermediario */}
                  <div className="grid grid-cols-3 gap-4 w-full col-span-2">
                    <ComboBox2
                      className="col-span-2"
                      value={
                        vuelo.intermediario
                          ? { name: vuelo.intermediario.nombre, content: vuelo.intermediario }
                          : null
                      }
                      label="Intermediario"
                      onChange={(value: ComboBoxOption2<Proveedor>) =>
                        handleUpdateVuelo(index, "intermediario", value.content)
                      }
                      options={aerolineas.map((p) => ({ name: p.nombre, content: p }))}
                    />
                    <Button
                      icon={Plus}
                      size="md"
                      className="mt-6 h-fit"
                      onClick={() => setSave("vuelo")}
                      type="button"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>

                {index !== 0 && (
                  <Button
                    icon={Trash2}
                    variant="warning"
                    onClick={() => handleDelete(index)}
                    type="button"
                  >
                    Eliminar vuelo
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer sticky */}
        <div className="sticky bottom-0 py-6 px-4 rounded-t-lg bg-gray-100 flex flex-col space-y-4">
          <div className="grid md:grid-cols-3 gap-2 w-full">
            <NumberInput
              label="Costo proveedor"
              value={details.costo}
              onChange={(value: string) => setDetails((prev) => ({ ...prev, costo: Number(value) }))}
            />
            <NumberInput
              label="Precio a cliente"
              value={details.precio}
              onChange={(value: string) => setDetails((prev) => ({ ...prev, precio: Number(value) }))}
            />
            <div className="grid grid-cols-2 gap-2 pt-6">
              <Button variant="secondary" icon={Plus} onClick={handleAddVuelo} type="button">
                Agregar vuelo
              </Button>
              <Button icon={CheckCircle} onClick={onPagar} type="button">
                Ir a pagar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================
   MODAL wrapper
========================= */

type VuelosModalProps = {
  agente: Agente;
  open: boolean;
  onClose: () => void;
  data_inicio?: any;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
};

export const VuelosModal: React.FC<VuelosModalProps> = ({
  agente,
  open,
  onClose,
  data_inicio,
  onSuccess,
  title,
  subtitle,
}) => {
  if (!open) return null;

  return (
    <Modal
      onClose={onClose}
      title={title ?? (data_inicio ? "Editar vuelo" : "Nuevo vuelo")}
      subtitle={subtitle ?? "Completa la información y continúa a pagar"}
    >
      <div className="w-[90vw] max-w-6xl max-h-[85vh] overflow-y-auto">
        {/* Aquí puedes mostrar el summary en el wrapper o dentro del form */}
        {data_inicio ? <VuelosDataInicioSummary data_inicio={data_inicio} /> : null}

        <VuelosForm
          agente={agente}
          data_inicio={data_inicio}
          onClose={onClose}
          onSuccess={onSuccess}
          showSummary={false} // ya lo mostramos arriba
        />
      </div>
    </Modal>
  );
};

/* =========================
   PAGE (compatibilidad)
========================= */

export const PageVuelosForm = ({ agente, data_inicio }: { agente: Agente; data_inicio?: any }) => {
  return <VuelosForm agente={agente} data_inicio={data_inicio} />;
};

// Si quieres mantener tu export PageVuelos igual:
export const PageVuelos = ({ agente }: { agente: Agente }) => {
  return <VuelosForm agente={agente} />;
};
