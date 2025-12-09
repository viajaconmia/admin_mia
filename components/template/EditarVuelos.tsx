import { useEffect, useReducer, useState } from "react";
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
import { ViajeAereo, VuelosServices } from "@/services/VuelosServices";
import { ForSave, GuardadoRapido } from "./GuardadoRapido";
import { Vuelo } from "./PageVuelos";
import { verificar } from "@/lib/utils";

export const EditarVuelos = ({
  vuelo,
  onSubmit,
}: {
  vuelo: ViajeAereo & { id_agente: string; nombre: string };
  onSubmit: () => void;
}) => {
  const [viajeros, setViajeros] = useState<ViajeroService[]>([]);
  const [aerolineas, setAerolineas] = useState<Proveedor[]>([]);
  const [aeropuertos, setAeropuertos] = useState<Aeropuerto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [save, setSave] = useState<ForSave>(null);

  const [state, dispatch] = useReducer(vuelosReducer, initialState);
  const [before, dispatchBefore] = useReducer(vuelosReducer, initialState);

  const { showNotification } = useNotification();

  const handleDelete = (index: number) =>
    dispatch({ type: "DELETE_VUELO", payload: index });

  const handleAddVuelo = () => dispatch({ type: "ADD_VUELO", payload: null });

  const handleUpdateViaje = <K extends keyof ViajeAereoDetails>(
    field: K,
    value: ViajeAereoDetails[K]
  ) => {
    dispatch({
      type: "UPDATE_VUELO",
      payload: { field: field, value: value },
    });
  };

  const handleUpdateVuelo = <K extends keyof Vuelo>(
    index: number,
    field: K,
    value: Vuelo[K]
  ) => {
    const newVuelos = [...state.vuelos];
    newVuelos[index] = {
      ...newVuelos[index],
      [field]: value,
    };
    dispatch({
      type: "UPDATE_VUELO",
      payload: { field: "vuelos", value: newVuelos },
    });
  };

  const onPagar = () => {
    try {
      if (state.precio <= 0) throw new Error("El precio debe ser mayor a 0");
      const res = state.vuelos
        .map((vuelo) => isSomeNull(vuelo, ["comentarios"]))
        .some((bool) => !!bool);
      if (res || isSomeNull(state)) {
        throw new Error("Parece ser que dejaste algunos campos vacios");
      }
      setOpen(true);
    } catch (error) {
      console.log(error);
      showNotification("error", error.message || "Error al ir a pagar");
    }
  };

  const handleGuardarAerolinea = (aerolineas: Proveedor[]) => {
    setAerolineas(aerolineas);
    setSave(null);
  };


  const handleGuardarAeropuerto = (aeropuertos: Aeropuerto[]) => {
    setAeropuertos(aeropuertos);
    setSave(null);
  };

  const handleSubmit = async (
    saldos: (Saldo & { restante: number; usado: boolean })[],
    faltante: number,
    isPrimary: boolean
  ) => {
    try {
      setLoading(true);
      if (faltante > 0 && isPrimary)
        throw new Error(
          "Al parecer aun falta por pagar, deberas usar credito para pagar"
        );
      if (faltante == 0 && !isPrimary)
        throw new Error(
          "Parece que ya pagaste todo con saldo a favor, ya no queda nada para pagar a credito"
        );
      let logs = {};
      Object.entries(state).forEach(([key, value]) => {
        let propiedades = verificar(key, value, before[key]);
        if (!propiedades) return;
        logs = { ...logs, ...propiedades };
      });
      const cambios = { logs, keys: Object.keys(logs) };
      if (cambios.keys.length == 0)
        throw new Error("No se detectaron cambios a realizar");

      const body = {
        saldos,
        faltante,
        cambios,
        before,
        current: state,
        viaje_aereo: vuelo,
      };

      const { message, data } =
        await VuelosServices.getInstance().editarViajeAereo(body);
      console.log(data);

      // const { message, data } = await VuelosServices.getInstance().createVuelo(
      //   faltante,
      //   saldos,
      //   state.flat().filter((item): item is Vuelo => !Array.isArray(item)),
      //   details,
      //   agente
      // );
      //

      // dispatch({ type: "RESET", payload: null });
      showNotification("success", message);
      // setOpen(false);
      // onSubmit();
    } catch (error) {
      console.log(error);
      showNotification("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ViajerosService.getInstance()
      .obtenerViajerosPorAgente(vuelo.id_agente)
      .then((res) => {
        setViajeros(res.data || []);
      })
      .catch((error) =>
        showNotification("error", error.message || "Error al obtener viajeros")
      );
    ExtraService.getInstance()
      .getAerolineas()
      .then((res) => {
        setAerolineas(res.data || []);
      })
      .catch((error) =>
        showNotification("error", error.message || "Error al obtener aerolinea")
      );
    ExtraService.getInstance()
      .getAeropuerto()
      .then((res) => {
        setAeropuertos(res.data || []);
      })
      .catch((error) =>
        showNotification("error", error.message || "Error con aeropuerto")
      );
    VuelosServices.getInstance()
      .getVueloById(vuelo.id_viaje_aereo)
      .then((response) => {
        dispatch({ type: "LOAD_VUELO", payload: response.data });
        dispatchBefore({ type: "LOAD_VUELO", payload: response.data });
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <>
      {open && (
        <Modal
          onClose={() => {
            setOpen(false);
          }}
          title="Selecciona con que pagar"
          subtitle="Puedes escoger solo algunos y pagar lo restante con credito"
        >
          <>
            <MostrarSaldos
              id_agente={vuelo.id_agente}
              precio={Number(state.precio) - Number(before.precio)}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </>
        </Modal>
      )}
      {save && (
        <Modal
          onClose={() => {
            setSave(null);
          }}
          title={`Agregar ${save == "vuelo" ? "aerolinea" : "aeropuerto"}`}
          subtitle={`Agrega los valores de la nueva ${save == "vuelo" ? "aerolinea" : "aeropuerto"
            } para agregarla`}
        >
          <GuardadoRapido
            onSaveProveedor={handleGuardarAerolinea}
            type={save}
            onSaveAeropuerto={handleGuardarAeropuerto}
          />
        </Modal>
      )}
      <div className="w-full h-full p-2 space-y-4 relative">
        <div className="w-full grid grid-cols-3 gap-4 p-2">
          <ComboBox2
            value={
              state.viajero
                ? {
                  name: state.viajero.nombre_completo,
                  content: state.viajero,
                }
                : null
            }
            label="Viajero"
            onChange={(value: ComboBoxOption<ViajeroService>) => {
              handleUpdateViaje("viajero", value.content);
            }}
            options={viajeros.map((viajero) => ({
              name: viajero.nombre_completo,
              content: viajero,
            }))}
          />
          <TextInput
            value={state.codigo}
            label="Código de reservación"
            placeholder="HJK1243..."
            onChange={(value: string) => {
              handleUpdateViaje("codigo", value);
            }}
          />
          <Dropdown
            label="Estado"
            value={state.status}
            onChange={(value: string) => {
              handleUpdateViaje("status", value);
            }}
            options={["confirmada", "cancelada"]}
          />
        </div>
        <div className="space-y-4 mx-4">
          {state.vuelos.map((item, index) => {
            let vuelo: Vuelo = Array.isArray(item) ? item[0] : item;
            return (
              <div
                key={`${index}-vuelos`}
                className="w-full h-fit bg-blue-50 p-2 rounded-md shadow-md flex flex-col gap-2"
              >
                <h1 className="w-full border-b text-gray-800 p-2 text-base font-semibold">
                  Vuelo {index + 1}
                </h1>
                <div className="grid md:grid-cols-7 gap-4">
                  <Dropdown
                    label="Tipo"
                    value={vuelo.tipo}
                    className="col-span-2"
                    onChange={(value: string) => {
                      handleUpdateVuelo(index, "tipo", value as Vuelo["tipo"]);
                    }}
                    options={["ida", "vuelta", "ida escala", "vuelta escala"]}
                  />
                  <TextInput
                    value={vuelo.folio}
                    className="col-span-2"
                    onChange={(value: string) => {
                      handleUpdateVuelo(index, "folio", value);
                    }}
                    label="Numero de vuelo"
                  />
                  <div className="grid grid-cols-3 gap-4 col-span-3">
                    <ComboBox2
                      value={
                        vuelo.aerolinea
                          ? {
                            name: vuelo.aerolinea.nombre,
                            content: vuelo.aerolinea,
                          }
                          : null
                      }
                      className="col-span-2"
                      label="Aerolinea"
                      onChange={(value: ComboBoxOption2<Proveedor>) => {
                        handleUpdateVuelo(index, "aerolinea", value.content);
                      }}
                      options={aerolineas.map((aerolinea) => ({
                        name: aerolinea.nombre,
                        content: aerolinea,
                      }))}
                    />
                    <Button
                      icon={Plus}
                      size="md"
                      className="mt-6 h-fit"
                      onClick={() => setSave("vuelo")}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
                <div className="grid  md:grid-cols-7 gap-4">
                  <ComboBox2<Aeropuerto>
                    value={
                      vuelo.origen
                        ? {
                          name: vuelo.origen.nombre,
                          content: vuelo.origen,
                        }
                        : null
                    }
                    className="col-span-3"
                    label="Origen"
                    onChange={(value: ComboBoxOption2<Aeropuerto>) => {
                      handleUpdateVuelo(index, "origen", value.content);
                    }}
                    options={aeropuertos.map((aeropuerto) => ({
                      name: aeropuerto.nombre,
                      content: aeropuerto,
                    }))}
                  />
                  <ComboBox2<Aeropuerto>
                    value={
                      vuelo.destino
                        ? {
                          name: vuelo.destino.nombre,
                          content: vuelo.destino,
                        }
                        : null
                    }
                    className="col-span-3"
                    label="Destino"
                    onChange={(value: ComboBoxOption2<Aeropuerto>) => {
                      handleUpdateVuelo(index, "destino", value.content);
                    }}
                    options={aeropuertos.map((aeropuerto) => ({
                      name: aeropuerto.nombre,
                      content: aeropuerto,
                    }))}
                  />
                  <Button
                    icon={Plus}
                    size="md"
                    className="mt-6 h-fit"
                    onClick={() => setSave("aeropuerto")}
                  >
                    Agregar
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <DateTimeInput
                    label="Fecha de salida"
                    value={vuelo.check_in}
                    onChange={(value: string) => {
                      handleUpdateVuelo(index, "check_in", value);
                    }}
                  />
                  <DateTimeInput
                    label="Fecha de llegada"
                    value={vuelo.check_out}
                    onChange={(value: string) => {
                      handleUpdateVuelo(index, "check_out", value);
                    }}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <TextInput
                      label="Asientos"
                      value={vuelo.asiento}
                      onChange={(value: string) => {
                        handleUpdateVuelo(index, "asiento", value);
                      }}
                    />
                    <Dropdown
                      label="Ubicación del asiento"
                      value={vuelo.ubicacion_asiento}
                      onChange={(value: string) => {
                        handleUpdateVuelo(
                          index,
                          "ubicacion_asiento",
                          value as Vuelo["ubicacion_asiento"]
                        );
                      }}
                      options={["Ventana", "En medio", "Pasillo"]}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <TextInput
                      label="Tipo de tarifa"
                      value={vuelo.tipo_tarifa}
                      onChange={(value: string) => {
                        handleUpdateVuelo(index, "tipo_tarifa", value);
                      }}
                    />
                    <TextAreaInput
                      label="Comentarios"
                      value={vuelo.comentarios}
                      onChange={(value: string) => {
                        handleUpdateVuelo(index, "comentarios", value);
                      }}
                    />
                  </div>
                </div>
                {index != 0 && (
                  <Button
                    icon={Trash2}
                    variant="warning"
                    onClick={() => handleDelete(index)}
                  >
                    Eliminar vuelo
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <div className="sticky bottom-0 py-6 px-4 rounded-t-lg bg-gray-100 flex flex-col space-y-4">
          <div className="grid grid-cols-3 gap-2 w-full">
            <NumberInput
              label="Costo proveedor"
              value={state.costo}
              onChange={(value: string) =>
                handleUpdateViaje("costo", Number(value))
              }
            />
            <NumberInput
              label="Precio a cliente"
              value={state.precio}
              onChange={(value: string) =>
                handleUpdateViaje("precio", Number(value))
              }
            />
            <div className="grid grid-cols-2 gap-2 pt-6">
              <Button variant="secondary" icon={Plus} onClick={handleAddVuelo}>
                Agregar vuelo
              </Button>
              <Button icon={CheckCircle} onClick={onPagar}>
                Continuar{" "}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export type ViajeAereoDetails = {
  codigo: string | null;
  viajero: ViajeroService | null;
  costo: number | null;
  precio: number | null;
  status: string | null;
  vuelos: Vuelo[];
};

const initialStateVuelo: Vuelo = {
  tipo: null,
  folio: null,
  origen: null,
  destino: null,
  check_in: null,
  check_out: null,
  aerolinea: null,
  asiento: null,
  comentarios: "",
  ubicacion_asiento: null,
  tipo_tarifa: null,
};

const initialState: ViajeAereoDetails = {
  codigo: null,
  viajero: null,
  costo: null,
  precio: null,
  status: null,
  vuelos: [initialStateVuelo],
};

type Action<K extends keyof ViajeAereoDetails> =
  | { type: "RESET"; payload: null }
  | { type: "ADD_VUELO"; payload: null }
  | { type: "DELETE_VUELO"; payload: number }
  | { type: "LOAD_VUELO"; payload: ViajeAereoDetails }
  | {
    type: "UPDATE_VUELO";
    payload: {
      field: K;
      value: ViajeAereoDetails[K];
    };
  };

const vuelosReducer = (
  state: ViajeAereoDetails,
  action: Action<keyof ViajeAereoDetails>
) => {
  switch (action.type) {
    case "ADD_VUELO":
      return { ...state, vuelos: [...state.vuelos, initialStateVuelo] };
    case "DELETE_VUELO":
      return {
        ...state,
        vuelos: state.vuelos.filter(
          (_, index: number) => index != action.payload
        ),
      };
    case "UPDATE_VUELO":
      return { ...state, [action.payload.field]: action.payload.value };
    case "LOAD_VUELO":
      return { ...action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};
