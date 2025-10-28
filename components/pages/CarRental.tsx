import { useEffect, useReducer, useState } from "react";
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

export const CarRentalPage = ({ agente }: { agente: Agente }) => {
  const [state, dispatch] = useReducer(vuelosReducer, initialState);
  const [viajeros, setViajeros] = useState<ViajeroService[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [save, setSave] = useState<ForSave>(null);
  const { showNotification } = useNotification();

  const handleUpdateCarRental = <K extends keyof CarRental>(
    field: K,
    value: CarRental[K]
  ) => {
    if (field == "conductores") {
      console.log(state);
    }
    dispatch({
      type: "UPDATE_CAR_RENTAL",
      payload: { field: field, value: value },
    });
  };

  const onPagar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (state.precio <= 0) throw new Error("El precio debe ser mayor a 0");

      if (isSomeNull(state, ["comentarios"])) {
        throw new Error("Parece ser que dejaste algunos campos vacios");
      }
      setOpen(true);
    } catch (error) {
      showNotification("error", error.message || "Error al ir a pagar");
    }
  };

  const handleGuardarProveedor = (proveedores: Proveedor[]) => {
    setProveedores(proveedores);
    setSave(null);
  };

  const handleSubmit = async (
    saldos: (Saldo & { restante: number; usado: boolean })[],
    faltante: number,
    isPrimary: boolean
  ) => {
    try {
      setLoading(true);
      if (faltante != 0 && isPrimary)
        throw new Error(
          "No puedes pagar con este, por favor si quieres pagar con credito usa el otro boton"
        );
      if (faltante == 0 && !isPrimary)
        throw new Error(
          "Parece que ya pagaste todo con saldo a favor, ya no queda nada para pagar a credito"
        );
      const { data, message } =
        await CarRentalServices.getInstance().createCarRentalOperaciones({
          ...state,
          saldos,
          faltante: faltante.toFixed(2),
          id_agente: agente.id_agente,
        });
      //Aqui se hace la petición

      dispatch({ type: "RESET", payload: null });
      setOpen(false);
      showNotification("success", message);
    } catch (error) {
      showNotification("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSucursal = (sucursales: Sucursal[]) => {
    setSucursales(sucursales);
    setSave(null);
  };

  useEffect(() => {
    ViajerosService.getInstance()
      .obtenerViajerosPorAgente(agente.id_agente)
      .then((res) => {
        setViajeros(res.data || []);
      })
      .catch((error) =>
        showNotification("error", error.message || "Error al obtener viajeros")
      );
    ExtraService.getInstance()
      .getProveedoresCarros()
      .then((res) => {
        setProveedores(res.data || []);
      })
      .catch((error) =>
        showNotification(
          "error",
          error.message || "Error al obtener aeropuerto"
        )
      );
    ExtraService.getInstance()
      .getSucursales()
      .then((res) => {
        setSucursales(res.data || []);
      })
      .catch((error) =>
        showNotification(
          "error",
          error.message || "Error al obtener aeropuerto"
        )
      );
  }, []);

  // useEffect(() => {
  //   console.log(state);
  // }, [state]);

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
          <MostrarSaldos
            id_agente={agente.id_agente}
            precio={state.precio}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </Modal>
      )}
      {save && (
        <Modal
          onClose={() => {
            setSave(null);
          }}
          title={`Agregar ${
            save == "renta_carro" ? "proveedor de renta de carro" : "sucursal"
          }`}
          subtitle={`Agrega los valores de ${
            save == "renta_carro" ? "el nuevo proveedor" : "la nueva sucursal"
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
      <form
        className="w-full h-full relative p-2 flex flex-col gap-2"
        onSubmit={onPagar}
      >
        <div className="w-full grid md:grid-cols-3 gap-2 rounded-md">
          <SectionForm
            legend={"Detalles de renta"}
            icon={CarFront}
            className="col-span-2"
          >
            <div className="grid lg:grid-cols-2 gap-4">
              <TextInput
                value={state.codigo}
                label="Código de reservación"
                placeholder="HJK1243..."
                onChange={(value: string) => {
                  handleUpdateCarRental("codigo", value);
                }}
              />
              <div className="flex gap-2">
                <ComboBox2
                  label="Proveedor"
                  className="w-full"
                  value={
                    state.proveedor
                      ? {
                          name: state.proveedor.nombre,
                          content: state.proveedor,
                        }
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
                  onClick={() => {
                    setSave("renta_carro");
                  }}
                >
                  Agregar
                </Button>
              </div>
              <Dropdown
                label="Estado"
                value={state.status}
                onChange={(value: string) => {
                  handleUpdateCarRental("status", value);
                }}
                options={["Confirmada", "Cancelada"]}
              />
              <TextInput
                value={state.seguro}
                label="Seguro"
                placeholder=""
                onChange={(value: string) => {
                  handleUpdateCarRental("seguro", value);
                }}
              />
              <Dropdown
                value={state.tipo_vehiculo}
                onChange={(value: string) => {
                  handleUpdateCarRental("tipo_vehiculo", value);
                }}
                label="Tipo de vehiculo"
                options={["AUTOMATICO", "ESTANDAR"]}
              />
              <TextInput
                value={state.auto_descripcion}
                onChange={(value: string) => {
                  handleUpdateCarRental("auto_descripcion", value);
                }}
                label="Descripción auto"
              />
              <Dropdown
                label="Edad"
                value={state.edad}
                onChange={(value: string) => {
                  handleUpdateCarRental("edad", value as CarRental["edad"]);
                }}
                options={["21", "22", "23", "24", "+25"]}
              />
              <NumberInput
                label="Numero maximo de pasajeros"
                value={state.max_pasajeros}
                onChange={(value: string) =>
                  handleUpdateCarRental("max_pasajeros", Number(value))
                }
              />
            </div>
          </SectionForm>
          <SectionForm
            legend={"Conductores"}
            icon={User2}
            className="flex flex-col w-full"
          >
            <div className="grid gap-2 h-full flex-1">
              {state.conductores.map((conductor, index) => (
                <ComboBox2
                  key={`Conductor-Car-Rental-${index}`}
                  value={
                    conductor
                      ? {
                          name: conductor.nombre_completo,
                          content: conductor,
                        }
                      : null
                  }
                  className="flex-1"
                  label={`Conductor #${index + 1}`}
                  onChange={(value: ComboBoxOption<ViajeroService>) => {
                    const newConductores = [...state.conductores].map(
                      (conductor, i) => (i == index ? value.content : conductor)
                    );
                    handleUpdateCarRental("conductores", newConductores);
                  }}
                  options={viajeros.map((conductor) => ({
                    name: conductor.nombre_completo,
                    content: conductor,
                  }))}
                />
              ))}
              <div className="grid md:grid-cols-2 items-end w-full">
                <Button
                  className="w-full"
                  type="button"
                  disabled={state.conductores.length <= 1}
                  variant="warning"
                  onClick={() => {
                    handleUpdateCarRental(
                      "conductores",
                      [...state.conductores].slice(0, -1)
                    );
                  }}
                >
                  Borrar conductor
                </Button>
                <Button
                  className="w-full"
                  type="button"
                  onClick={() => {
                    handleUpdateCarRental("conductores", [
                      ...state.conductores,
                      null,
                    ]);
                  }}
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
                  onChange={(value: ComboBoxOption2<Sucursal>) => {
                    handleUpdateCarRental("recogida_lugar", value.content);
                  }}
                  options={sucursales.map((sucursal) => ({
                    name: `${sucursal.nombre} - ${sucursal.direccion}`,
                    content: sucursal,
                  }))}
                />
                <Button
                  icon={Plus}
                  className="self-end"
                  type="button"
                  onClick={() => {
                    setSave("sucursal");
                  }}
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
                  if (state.check_out == null)
                    handleUpdateCarRental("check_out", value);
                }}
              />
            </div>
          </SectionForm>

          <SectionForm legend={"Devolución"} icon={Goal}>
            <div className=" grid gap-2 mx-2">
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
                    onChange={(value: ComboBoxOption2<Sucursal>) => {
                      handleUpdateCarRental("devuelta_lugar", value.content);
                    }}
                    options={sucursales.map((sucursal) => ({
                      name: `${sucursal.nombre} - ${sucursal.direccion}`,
                      content: sucursal,
                    }))}
                  />
                  <Button
                    icon={Plus}
                    type="button"
                    className="self-end"
                    onClick={() => {
                      setSave("sucursal");
                    }}
                  >
                    Agregar
                  </Button>
                </div>
                {!state.devuelta_lugar && !!state.recogida_lugar && (
                  <p
                    onClick={() => {
                      dispatch({ payload: null, type: "DUPLICAR_LUGAR" });
                    }}
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
                onChange={(value: string) => {
                  handleUpdateCarRental("check_out", value);
                }}
              />
            </div>
          </SectionForm>
        </div>

        <div className="py-6 px-4 rounded-t-lg bg-sky-50 flex flex-col space-y-4">
          <div className="grid grid-cols-7 gap-2 w-full">
            <NumberInput
              label="Costo proveedor"
              value={state.costo}
              className="col-span-2"
              onChange={(value: string) =>
                handleUpdateCarRental("costo", Number(value))
              }
            />
            <NumberInput
              label="Precio a cliente"
              className="col-span-2"
              value={state.precio}
              onChange={(value: string) =>
                handleUpdateCarRental("precio", Number(value))
              }
            />
            <TextAreaInput
              rows={1}
              label="Comentarios"
              value={state.comentarios || ""}
              className="col-span-2"
              onChange={(value: string) => {
                handleUpdateCarRental("comentarios", value);
              }}
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
  auto_descripcion: string | null;
  max_pasajeros: number | null;
  tipo_vehiculo: string | null;
  seguro: string | null;
  comentarios: string | null;
  recogida_lugar: Sucursal | null;
  devuelta_lugar: Sucursal | null;
};

const initialState: CarRental = {
  costo: null,
  precio: null,
  conductores: [null],
  codigo: null,
  status: null,
  edad: null,
  check_in: null,
  check_out: null,
  proveedor: null,
  auto_descripcion: null,
  max_pasajeros: null,
  tipo_vehiculo: null,
  seguro: null,
  comentarios: null,
  recogida_lugar: null,
  devuelta_lugar: null,
};

type Action =
  | { type: "RESET"; payload: null }
  | { type: "DUPLICAR_LUGAR"; payload: null }
  | {
      type: "UPDATE_CAR_RENTAL";
      payload: {
        field: keyof CarRental;
        value: CarRental[keyof CarRental];
      };
    };

const vuelosReducer = (state: CarRental, action: Action) => {
  switch (action.type) {
    case "UPDATE_CAR_RENTAL":
      return { ...state, [action.payload.field]: action.payload.value };
    case "RESET":
      return initialState;
    case "DUPLICAR_LUGAR":
      return { ...state, devuelta_lugar: state.recogida_lugar };
    default:
      return state;
  }
};
