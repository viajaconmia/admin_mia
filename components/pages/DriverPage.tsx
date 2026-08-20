"use client";

import React, { useEffect, useId, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import { Marker, Polyline, useMap } from "react-leaflet";
import Button from "@/components/atom/Button";
import {
  ComboBox2,
  DateTimeInput,
  InputGoogle,
  NumberInput,
  PlaceMaps,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";
import { SectionForm } from "@/components/atom/SectionForm";
import {
  CarFront,
  CheckCircle,
  MapPin,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAlert } from "@/context/useAlert";
import { ViajeroService, ViajerosService } from "@/services/ViajerosService";
import { Proveedor } from "@/services/ProveedoresService";
import { useProveedor } from "@/context/Proveedores";
import { useGeo } from "@/context/geo";
import { MostrarSaldos } from "../template/MostrarSaldos";
import { Saldo } from "@/services/SaldoAFavor";
import { CarRentalServices } from "@/services/RentaCarros";
import Modal from "@/components/organism/Modal";

// ======================================================
// MAPA
// ======================================================

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  {
    ssr: false,
  },
);

const MapContainer = dynamic<any>(
  () =>
    import("react-leaflet").then((m) => ({
      default: m.MapContainer,
    })),
  {
    ssr: false,
  },
);

// ======================================================
// TIPOS
// ======================================================

type Agente = {
  id_agente: string;
};

type PuntoRuta = {
  ubicacion: string;
  latitud: number | null;
  longitud: number | null;
};

type ViajeChofer = {
  id_temporal: string;

  origen: PuntoRuta;
  destino: PuntoRuta;

  fecha_origen: string;
  fecha_destino: string;

  comentario_viaje: string;
};

type RentaConChofer = {
  codigo: string | null;

  proveedor: Proveedor | null;
  intermediario: Proveedor | null;

  viajeros: (ViajeroService | null)[];

  tipo_vehiculo: string | null;
  auto_descripcion: string | null;

  max_pasajeros: number | null;

  costo: number | null;
  precio: number | null;

  comentarios: string | null;

  // SIEMPRE
  status: "Confirmada";

  // SIEMPRE
  es_con_chofer: 1;
};

// ======================================================
// VIAJE VACÍO
// ======================================================

const crearViajeVacio = (): ViajeChofer => ({
  id_temporal: `viaje-${Date.now()}-${Math.random()}`,

  origen: {
    ubicacion: "",
    latitud: null,
    longitud: null,
  },

  destino: {
    ubicacion: "",
    latitud: null,
    longitud: null,
  },

  fecha_origen: "",
  fecha_destino: "",

  comentario_viaje: "",
});

// ======================================================
// ESTADO INICIAL
// ======================================================

const emptyState: RentaConChofer = {
  codigo: null,

  proveedor: null,
  intermediario: null,

  viajeros: [null],

  tipo_vehiculo: null,
  auto_descripcion: null,

  max_pasajeros: null,

  costo: null,
  precio: null,

  comentarios: null,

  status: "Confirmada",

  es_con_chofer: 1,
};

// ======================================================
// REDUCER
// ======================================================

type Action =
  | {
      type: "UPDATE";

      payload: {
        field: keyof RentaConChofer;

        value: RentaConChofer[keyof RentaConChofer];
      };
    }
  | {
      type: "RESET";
    };

const reducer = (state: RentaConChofer, action: Action): RentaConChofer => {
  switch (action.type) {
    case "UPDATE":
      return {
        ...state,

        [action.payload.field]: action.payload.value,
      };

    case "RESET":
      return {
        ...emptyState,
        viajeros: [null],
      };

    default:
      return state;
  }
};

// ======================================================
// LINEA DEL MAPA
// ======================================================

type LineaProps = {
  positions: [number, number][];
};

const MapLine = ({ positions }: LineaProps) => {
  if (positions.length < 2) {
    return null;
  }

  return <Polyline positions={positions} />;
};

// ======================================================
// AJUSTAR MAPA
// ======================================================

const MapFitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 14);

      return;
    }

    map.fitBounds(positions, {
      padding: [30, 30],
    });
  }, [positions, map]);

  return null;
};

// ======================================================
// LOGICA MAPA
// ======================================================

const MapLogic = ({ children }: { children?: React.ReactNode }) => {
  const map = useMap();

  const { center } = useGeo();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {children}
    </>
  );
};

// ======================================================
// MAP
// ======================================================

const Map = ({ children }: { children?: React.ReactNode }) => {
  const { center } = useGeo();

  const mapKey = useId();

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={14}
      style={{
        height: "365px",
        width: "100%",
        zIndex: 0,
      }}
    >
      <MapLogic>{children}</MapLogic>
    </MapContainer>
  );
};
export const DriverPage = ({ agente }: { agente: Agente }) => {
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [openPago, setOpenPago] = useState(false);
  const [viajes, setViajes] = useState<ViajeChofer[]>([crearViajeVacio()]);
  const [viajeros, setViajeros] = useState<ViajeroService[]>([]);

  const [loading, setLoading] = useState(false);
  const { showNotification } = useAlert();

  const { proveedores, getProveedores } = useProveedor();

  const { setCenter } = useGeo();
  useEffect(() => {
    getProveedores();

    ViajerosService.getInstance()
      .obtenerViajerosPorAgente(agente.id_agente)
      .then((response) => {
        setViajeros(response.data || []);
      })
      .catch((error) => {
        showNotification(
          "error",
          error?.message || "Error al obtener viajeros",
        );
      });
  }, [agente.id_agente]);

  // ====================================================
  // UPDATE GENERAL
  // ====================================================

  const updateField = <K extends keyof RentaConChofer>(
    field: K,
    value: RentaConChofer[K],
  ) => {
    dispatch({
      type: "UPDATE",

      payload: {
        field,
        value,
      },
    });
  };

  // ====================================================
  // ACTUALIZAR VIAJE
  // ====================================================

  const actualizarViaje = (index: number, cambios: Partial<ViajeChofer>) => {
    setViajes((prev) =>
      prev.map((viaje, i) =>
        i === index
          ? {
              ...viaje,
              ...cambios,
            }
          : viaje,
      ),
    );
  };

  // ====================================================
  // ACTUALIZAR ORIGEN
  // ====================================================

  const actualizarOrigen = (index: number, cambios: Partial<PuntoRuta>) => {
    setViajes((prev) =>
      prev.map((viaje, i) =>
        i === index
          ? {
              ...viaje,

              origen: {
                ...viaje.origen,
                ...cambios,
              },
            }
          : viaje,
      ),
    );
  };

  // ====================================================
  // ACTUALIZAR DESTINO
  // ====================================================

  const actualizarDestino = (index: number, cambios: Partial<PuntoRuta>) => {
    setViajes((prev) =>
      prev.map((viaje, i) =>
        i === index
          ? {
              ...viaje,

              destino: {
                ...viaje.destino,
                ...cambios,
              },
            }
          : viaje,
      ),
    );
  };

  // ====================================================
  // GOOGLE PLACE -> PUNTO
  // ====================================================

  const obtenerPuntoGoogle = (place: PlaceMaps): PuntoRuta | null => {
    if (!place?.geometry?.location) {
      showNotification(
        "error",
        "No fue posible obtener las coordenadas de la ubicación",
      );

      return null;
    }

    const latitud = place.geometry.location.lat();

    const longitud = place.geometry.location.lng();

    return {
      ubicacion: place.formatted_address || place.name || "",

      latitud,
      longitud,
    };
  };

  // ====================================================
  // ORIGEN
  // ====================================================

  const seleccionarOrigen = (index: number, place: PlaceMaps) => {
    const punto = obtenerPuntoGoogle(place);

    if (!punto) {
      return;
    }

    actualizarOrigen(index, punto);

    if (punto.latitud !== null && punto.longitud !== null) {
      setCenter([punto.latitud, punto.longitud]);
    }
  };

  // ====================================================
  // DESTINO
  // ====================================================

  const seleccionarDestino = (index: number, place: PlaceMaps) => {
    const punto = obtenerPuntoGoogle(place);

    if (!punto) {
      return;
    }

    actualizarDestino(index, punto);

    if (punto.latitud !== null && punto.longitud !== null) {
      setCenter([punto.latitud, punto.longitud]);
    }
  };

  // ====================================================
  // AGREGAR VIAJE
  // ====================================================

  const agregarViaje = () => {
    setViajes((prev) => [...prev, crearViajeVacio()]);
  };

  // ====================================================
  // ELIMINAR VIAJE
  // ====================================================

  const eliminarViaje = (index: number) => {
    if (viajes.length === 1) {
      showNotification("error", "Debe existir al menos un viaje");

      return;
    }

    setViajes((prev) => prev.filter((_, i) => i !== index));
  };

  // ====================================================
  // POSICIONES DEL MAPA
  // ====================================================

  const posicionesMapa: [number, number][] = viajes.flatMap((viaje) => {
    const puntos: [number, number][] = [];

    if (viaje.origen.latitud !== null && viaje.origen.longitud !== null) {
      puntos.push([viaje.origen.latitud, viaje.origen.longitud]);
    }

    if (viaje.destino.latitud !== null && viaje.destino.longitud !== null) {
      puntos.push([viaje.destino.latitud, viaje.destino.longitud]);
    }

    return puntos;
  });

  // ====================================================
  // VALIDAR
  // ====================================================

  const validarFormulario = () => {
    if (!state.codigo) {
      throw new Error("Ingresa el código de reservación");
    }

    if (!state.proveedor) {
      throw new Error("Selecciona un proveedor");
    }

    if (!state.tipo_vehiculo) {
      throw new Error("Ingresa el tipo de vehículo");
    }

    if (!state.max_pasajeros) {
      throw new Error("Ingresa el máximo de pasajeros");
    }

    if (!state.costo) {
      throw new Error("Ingresa el costo proveedor");
    }

    if (!state.precio) {
      throw new Error("Ingresa el precio a cliente");
    }

    if (!state.viajeros.some(Boolean)) {
      throw new Error("Selecciona al menos un viajero");
    }

    viajes.forEach((viaje, index) => {
      const numero = index + 1;

      if (
        !viaje.origen.ubicacion ||
        viaje.origen.latitud === null ||
        viaje.origen.longitud === null
      ) {
        throw new Error(`Selecciona un origen válido para el viaje ${numero}`);
      }

      if (
        !viaje.destino.ubicacion ||
        viaje.destino.latitud === null ||
        viaje.destino.longitud === null
      ) {
        throw new Error(`Selecciona un destino válido para el viaje ${numero}`);
      }

      if (!viaje.fecha_origen) {
        throw new Error(`Selecciona la fecha de salida del viaje ${numero}`);
      }

      if (!viaje.fecha_destino) {
        throw new Error(`Selecciona la fecha de llegada del viaje ${numero}`);
      }
    });
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  // ====================================================
  // ABRIR PAGO
  // ====================================================

  const handleContinuar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      validarFormulario();

      setOpenPago(true);
    } catch (error: any) {
      showNotification("error", error?.message || "Verifica la información");
    }
  };

  // ====================================================
  // GUARDAR RENTA CON CHOFER
  // ====================================================

  const handleGuardar = async (
    saldos: (Saldo & {
      restante: number;
      usado: boolean;
    })[],
    faltante: number,
    isPrimary: boolean,
  ) => {
    try {
      setLoading(true);

      // Misma lógica que la renta normal.
      if (faltante !== 0 && isPrimary) {
        throw new Error(
          "No puedes pagar con este, si quieres pagar con crédito usa el otro botón",
        );
      }

      if (faltante === 0 && !isPrimary) {
        throw new Error("Ya se cubrió el total con saldo a favor");
      }

      validarFormulario();

      const primerViaje = viajes[0];
      const ultimoViaje = viajes[viajes.length - 1];

      // Quitamos nulls por seguridad.
      const conductores = state.viajeros.filter(
        (viajero): viajero is ViajeroService => viajero !== null,
      );

      // ==================================================
      // RENTA
      // ==================================================

      const renta = {
        codigo: state.codigo,

        proveedor: state.proveedor,

        intermediario: state.intermediario,

        conductores,

        tipo_vehiculo: state.tipo_vehiculo,

        auto_descripcion: state.auto_descripcion,

        max_pasajeros: state.max_pasajeros,

        costo: Number(state.costo),

        precio: Number(state.precio),

        comentarios: state.comentarios,

        // La reserva general toma:
        // primer origen -> último destino
        check_in: primerViaje.fecha_origen,

        check_out: ultimoViaje.fecha_destino,

        // En viaje con chofer no aplican.
        edad: null,

        seguro: null,

        recogida_lugar: null,

        devuelta_lugar: null,

        // SIEMPRE
        status: "Confirmada",

        // Necesario para el flujo de crédito/saldos.
        faltante: Number(faltante),

        id_agente: agente.id_agente,
      };

      // ==================================================
      // VIAJES
      //
      // IMPORTANTE:
      // el backend usa direccion_origen/destino
      // ==================================================

      const payloadViajes = viajes.map((viaje) => ({
        direccion_origen: viaje.origen.ubicacion,

        latitud_origen: viaje.origen.latitud,

        longitud_origen: viaje.origen.longitud,

        fecha_origen: viaje.fecha_origen,

        direccion_destino: viaje.destino.ubicacion,

        latitud_destino: viaje.destino.latitud,

        longitud_destino: viaje.destino.longitud,

        fecha_destino: viaje.fecha_destino,

        comentario_viaje: viaje.comentario_viaje || null,
      }));

      // ==================================================
      // JSON FINAL
      // ==================================================

      const payload = {
        renta,

        viajes: payloadViajes,

        saldos,

        // OJO:
        // es_con_chofer, NO is_con_chofer
        es_con_chofer: 1,
      };

      console.log("PAYLOAD RENTA CON CHOFER:", payload);

      // ==================================================
      // MISMO ENDPOINT DE RENTA DE AUTOS
      // ==================================================

      const { message } =
        await CarRentalServices.getInstance().createCarRentalOperaciones(
          payload,
        );

      showNotification(
        "success",
        message || "Viaje con chofer creado correctamente",
      );

      // ==================================================
      // LIMPIAR
      // ==================================================

      dispatch({
        type: "RESET",
      });

      setViajes([crearViajeVacio()]);

      setOpenPago(false);
    } catch (error: any) {
      showNotification(
        "error",
        error?.message || "Error al crear el viaje con chofer",
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // JSX
  // ====================================================

  return (
    <>
      {/* GOOGLE AUTOCOMPLETE ENCIMA DEL MODAL */}

      <style jsx global>{`
        .pac-container {
          z-index: 999999 !important;
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="
          w-[92vw]
          max-w-[1500px]
          min-w-0
          p-4
          flex
          flex-col
          gap-4
        "
      >
        {/* ==================================================
            BLOQUE SUPERIOR

            IZQUIERDA:
            VIAJE CON CHOFER

            DERECHA:
            VIAJEROS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-[2fr_1fr]
            gap-4
            items-stretch
          "
        >
          {/* ==================================================
              VIAJE CON CHOFER
          ================================================== */}

          <SectionForm legend="Viaje con chofer" icon={CarFront}>
            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-4
              "
            >
              {/* FILA 1 */}

              <TextInput
                label="Código de reservación"
                placeholder="Ej. VIA-12345"
                value={state.codigo ?? ""}
                onChange={(value) =>
                  updateField(
                    "codigo",

                    value.replaceAll(" ", ""),
                  )
                }
              />

              <ComboBox2<Proveedor>
                label="Proveedor"
                value={
                  state.proveedor
                    ? {
                        name: state.proveedor.proveedor,

                        content: state.proveedor,
                      }
                    : null
                }
                onChange={(value) =>
                  updateField(
                    "proveedor",

                    value?.content ?? null,
                  )
                }
                options={proveedores
                  .filter((proveedor) => proveedor.type === "renta_carro")
                  .map((proveedor) => ({
                    name: proveedor.proveedor,

                    content: proveedor,
                  }))}
              />

              <TextInput
                label="Tipo de vehículo"
                placeholder="Ej. SUV"
                value={state.tipo_vehiculo ?? ""}
                onChange={(value) => updateField("tipo_vehiculo", value)}
              />

              {/* FILA 2 */}

              <TextInput
                label="Descripción auto"
                placeholder="Ej. Toyota Avanza"
                value={state.auto_descripcion ?? ""}
                onChange={(value) => updateField("auto_descripcion", value)}
              />

              <NumberInput
                label="Máximo pasajeros"
                value={state.max_pasajeros}
                onChange={(value) =>
                  updateField(
                    "max_pasajeros",

                    value === "" ? null : Number(value),
                  )
                }
              />

              <ComboBox2<Proveedor>
                label="Intermediario"
                value={
                  state.intermediario
                    ? {
                        name: state.intermediario.proveedor,

                        content: state.intermediario,
                      }
                    : null
                }
                onChange={(value) =>
                  updateField(
                    "intermediario",

                    value?.content ?? null,
                  )
                }
                options={proveedores
                  .filter((proveedor) => proveedor.intermediario)
                  .map((proveedor) => ({
                    name: proveedor.proveedor,

                    content: proveedor,
                  }))}
              />

              {/* FILA 3 */}

              <NumberInput
                label="Costo proveedor"
                value={state.costo}
                onChange={(value) =>
                  updateField(
                    "costo",

                    value === "" ? null : Number(value),
                  )
                }
              />

              <NumberInput
                label="Precio a cliente"
                value={state.precio}
                onChange={(value) =>
                  updateField(
                    "precio",

                    value === "" ? null : Number(value),
                  )
                }
              />

              <TextAreaInput
                rows={2}
                label="Comentario general"
                placeholder="Comentarios..."
                value={state.comentarios ?? ""}
                onChange={(value) => updateField("comentarios", value)}
              />
            </div>
          </SectionForm>

          {/* ==================================================
              VIAJEROS
          ================================================== */}

          <SectionForm legend="Viajeros" icon={UserRound}>
            <div className="flex h-full flex-col gap-3">
              <div className="flex flex-1 flex-col gap-3">
                {state.viajeros.map((viajero, index) => (
                  <div
                    key={`viajero-${index}`}
                    className="flex items-end gap-2"
                  >
                    <ComboBox2<ViajeroService>
                      className="flex-1"
                      label={`Viajero #${index + 1}`}
                      value={
                        viajero
                          ? {
                              name: viajero.nombre_completo,

                              content: viajero,
                            }
                          : null
                      }
                      onChange={(value) => {
                        const nuevos = [...state.viajeros];

                        nuevos[index] = value?.content ?? null;

                        updateField(
                          "viajeros",

                          nuevos,
                        );
                      }}
                      options={viajeros.map((item) => ({
                        name: item.nombre_completo,

                        content: item,
                      }))}
                    />

                    {state.viajeros.length > 1 && (
                      <Button
                        type="button"
                        variant="warning"
                        icon={Trash2}
                        onClick={() =>
                          updateField(
                            "viajeros",

                            state.viajeros.filter((_, i) => i !== index),
                          )
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                icon={Plus}
                className="w-full"
                onClick={() =>
                  updateField(
                    "viajeros",

                    [...state.viajeros, null],
                  )
                }
              >
                Agregar viajero
              </Button>
            </div>
          </SectionForm>
        </div>

        {/* ==================================================
            BLOQUE INFERIOR

            IZQUIERDA:
            VIAJES

            DERECHA:
            MAPA
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-[2fr_1fr]
            gap-4
            items-stretch
          "
        >
          {/* ==================================================
              VIAJES
          ================================================== */}

          <SectionForm legend="Viajes" icon={MapPin}>
            <div className="flex h-full flex-col gap-3">
              <div className="flex flex-1 flex-col gap-3">
                {viajes.map((viaje, index) => (
                  <div
                    key={viaje.id_temporal}
                    className="
                        rounded-lg
                        border
                        border-slate-200
                        bg-slate-50
                        p-3
                      "
                  >
                    {/* ====================================
                          ORIGEN Y DESTINO
                      ==================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InputGoogle
                        label={`Origen - Viaje ${index + 1}`}
                        size="lg"
                        googleStyle
                        onChange={(place) => seleccionarOrigen(index, place)}
                      />

                      <InputGoogle
                        label="Destino"
                        size="lg"
                        googleStyle
                        onChange={(place) => seleccionarDestino(index, place)}
                      />
                    </div>

                    {/* ====================================
                          FECHAS
                      ==================================== */}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DateTimeInput
                        label="Fecha y hora de salida"
                        value={viaje.fecha_origen}
                        onChange={(value) =>
                          actualizarViaje(
                            index,

                            {
                              fecha_origen: value,
                            },
                          )
                        }
                      />

                      <DateTimeInput
                        label="Fecha y hora de llegada"
                        value={viaje.fecha_destino}
                        onChange={(value) =>
                          actualizarViaje(
                            index,

                            {
                              fecha_destino: value,
                            },
                          )
                        }
                      />
                    </div>

                    {/* ====================================
                          COMENTARIO
                      ==================================== */}

                    <div className="mt-3">
                      <TextAreaInput
                        rows={2}
                        label="Comentario del viaje"
                        placeholder="Comentario del traslado..."
                        value={viaje.comentario_viaje}
                        onChange={(value) =>
                          actualizarViaje(
                            index,

                            {
                              comentario_viaje: value,
                            },
                          )
                        }
                      />
                    </div>

                    {/* ====================================
                          ELIMINAR VIAJE
                      ==================================== */}

                    {viajes.length > 1 && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          variant="warning"
                          icon={Trash2}
                          onClick={() => eliminarViaje(index)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ========================================
                  AGREGAR VIAJE
              ======================================== */}

              <Button
                type="button"
                icon={Plus}
                className="w-full"
                onClick={agregarViaje}
              >
                Agregar viaje
              </Button>
            </div>
          </SectionForm>

          {/* ==================================================
              MAPA
          ================================================== */}

          <SectionForm legend="Mapa" icon={MapPin}>
            <div className="h-full">
              <div
                className="
                  overflow-hidden
                  rounded-lg
                  border
                  border-slate-200
                "
              >
                <Map>
                  <MapFitBounds positions={posicionesMapa} />

                  {/* ========================================
                      DIBUJAR VIAJES

                      CADA VIAJE TIENE SU PROPIA LINEA

                      NO CONECTAMOS UN VIAJE CON OTRO.
                  ======================================== */}

                  {viajes.map((viaje) => {
                    const linea: [number, number][] = [];

                    // ORIGEN
                    if (
                      viaje.origen.latitud !== null &&
                      viaje.origen.longitud !== null
                    ) {
                      linea.push([viaje.origen.latitud, viaje.origen.longitud]);
                    }

                    // DESTINO
                    if (
                      viaje.destino.latitud !== null &&
                      viaje.destino.longitud !== null
                    ) {
                      linea.push([
                        viaje.destino.latitud,

                        viaje.destino.longitud,
                      ]);
                    }

                    return (
                      <React.Fragment key={`map-${viaje.id_temporal}`}>
                        {/* LINEA */}

                        <MapLine positions={linea} />

                        {/* MARKER ORIGEN */}

                        {viaje.origen.latitud !== null &&
                          viaje.origen.longitud !== null && (
                            <Marker
                              position={
                                [
                                  viaje.origen.latitud,

                                  viaje.origen.longitud,
                                ] as [number, number]
                              }
                            />
                          )}

                        {/* MARKER DESTINO */}

                        {viaje.destino.latitud !== null &&
                          viaje.destino.longitud !== null && (
                            <Marker
                              position={
                                [
                                  viaje.destino.latitud,

                                  viaje.destino.longitud,
                                ] as [number, number]
                              }
                            />
                          )}
                      </React.Fragment>
                    );
                  })}
                </Map>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                El mapa se actualiza automáticamente al seleccionar el origen y
                destino.
              </p>
            </div>
          </SectionForm>
        </div>

        {/* ==================================================
            GUARDAR
        ================================================== */}

        <div className="flex justify-end">
          <Button icon={CheckCircle} disabled={loading}>
            {loading ? "Guardando..." : "Crear viaje con chofer"}
          </Button>
        </div>
      </form>
    </>
  );
};
