import { useEffect, useReducer, useState } from "react";
import Button from "../atom/Button";
import {
  ComboBox,
  ComboBoxOption,
  DateTimeInput,
  Dropdown,
  DropdownValues,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "../atom/Input";
import { ViajeroService, ViajerosService } from "@/services/ViajerosService";
import { useNotification } from "@/context/useNotificacion";
import { CheckCircle, Plus, Trash2 } from "lucide-react";

export const PageVuelos = ({ agente }: { agente: Agente }) => {
  const { showNotification } = useNotification();
  const [state, dispatch] = useReducer(vuelosReducer, initialState);
  const [details, setDetails] = useState<{
    codigo: string;
    viajero: ViajeroService;
    costo: number | null;
    precio: number | null;
  }>({ codigo: "", viajero: null, costo: null, precio: null });
  const [viajeros, setViajeros] = useState<ViajeroService[]>([]);

  const handleDelete = (index: number) =>
    dispatch({ type: "DELETE_VUELO", payload: index });

  const handleAddVuelo = () => dispatch({ type: "ADD_VUELO", payload: null });

  const handleUpdateVuelo = (
    index: number,
    value: string,
    field: keyof Vuelo
  ) =>
    dispatch({
      type: "UPDATE_VUELO",
      payload: { index: index, field: field, value: value },
    });

  useEffect(() => {
    ViajerosService.getInstance()
      .obtenerViajerosPorAgente(agente.id_agente)
      .then((res) => {
        console.log(res.data);
        setViajeros(res.data || []);
      })
      .catch((error) =>
        showNotification("error", error.message || "Error al obtener viajeros")
      );
  }, []);
  return (
    <div className="w-full h-fit p-2 space-y-4 relative">
      <div className="w-full grid grid-cols-2 gap-4 p-2">
        <ComboBox
          value={
            details.viajero
              ? {
                  name: details.viajero.nombre_completo,
                  content: details.viajero,
                }
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
          placeholder="HJK1243..."
          onChange={(value: string) => {
            setDetails((prev) => ({ ...prev, codigo: value }));
          }}
        />
      </div>
      <div className="space-y-4 mx-4">
        {state.map((item, index) => {
          let vuelo: Vuelo = Array.isArray(item) ? item[0] : item;
          return (
            <div
              key={`${index}-vuelos`}
              className="w-full h-fit bg-blue-50 p-2 rounded-md shadow-md flex flex-col gap-2"
            >
              <h1 className="w-full border-b text-gray-800 p-2 text-lg font-semibold">
                Vuelo {index + 1}
              </h1>
              <div className="grid md:grid-cols-2 gap-4">
                <Dropdown
                  label="Tipo"
                  value={vuelo.tipo}
                  onChange={(value: string) => {
                    handleUpdateVuelo(index, value, "tipo");
                  }}
                  options={["ida", "vuelta", "ida escala", "vuelta escala"]}
                />
                <TextInput
                  value={vuelo.folio}
                  onChange={(value: string) => {
                    handleUpdateVuelo(index, value, "folio");
                  }}
                  label="Numero de vuelo"
                />
              </div>
              <div className="grid  md:grid-cols-2 gap-4">
                <Dropdown
                  label="Origen"
                  value={vuelo.tipo}
                  onChange={(value: string) => {
                    handleUpdateVuelo(index, value, "tipo");
                  }}
                  options={["ida", "vuelta", "ida escala", "vuelta escala"]}
                />
                <Dropdown
                  label="Destino"
                  value={vuelo.tipo}
                  onChange={(value: string) => {
                    handleUpdateVuelo(index, value, "tipo");
                  }}
                  options={["ida", "vuelta", "ida escala", "vuelta escala"]}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <DateTimeInput
                  label="Fecha de salida"
                  value={vuelo.check_in}
                  onChange={(value: string) => {
                    handleUpdateVuelo(index, value, "check_in");
                  }}
                />
                <DateTimeInput
                  label="Fecha de llegada"
                  value={vuelo.check_out}
                  onChange={(value: string) => {
                    handleUpdateVuelo(index, value, "check_out");
                  }}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Dropdown
                    label="Aerolineas"
                    value={vuelo.tipo}
                    onChange={(value: string) => {
                      handleUpdateVuelo(index, value, "tipo");
                    }}
                    options={["ida", "vuelta", "ida escala", "vuelta escala"]}
                  />
                  <TextInput
                    label="Asientos"
                    value={vuelo.check_out}
                    onChange={(value: string) => {
                      handleUpdateVuelo(index, value, "check_out");
                    }}
                  />
                </div>
                <TextAreaInput
                  label="Comentarios"
                  value={vuelo.check_out}
                  onChange={(value: string) => {
                    handleUpdateVuelo(index, value, "check_out");
                  }}
                />
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
      <div className="sticky bottom-0 pb-6 px-4 rounded-t-lg bg-gray-100 flex flex-col space-y-4">
        <p className="py-4 border-b text-gray-700 font-semibold text-md">
          Cantidad de vuelos: {state.length}
        </p>
        <div className="grid grid-cols-3 gap-2 w-full">
          <NumberInput
            label="Costo proveedor"
            value={details.costo}
            onChange={(value: string) => {}}
          />
          <NumberInput
            label="Precio a cliente"
            value={null}
            onChange={(value: string) => {
              // handleUpdateVuelo(index, value, "tipo");
            }}
          />
          <div className="grid grid-cols-2 gap-2 pt-6">
            <Button variant="secondary" icon={Plus} onClick={handleAddVuelo}>
              Agregar vuelo
            </Button>
            <Button icon={CheckCircle} onClick={handleAddVuelo}>
              Confirmar y pagar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

type Vuelo = {
  tipo: "ida" | "vuelta" | "ida escala" | "vuelta escala" | null;
  folio: string | null;
  origen: string | null;
  destino: string | null;
  check_in: string | null;
  check_out: string | null;
  aerolinea: string | null;
  asiento: string | null;
  comentarios: string | null;
};

const initialState: Vuelo[] = [
  {
    tipo: null,
    folio: null,
    origen: null,
    destino: null,
    check_in: null,
    check_out: null,
    aerolinea: null,
    asiento: null,
    comentarios: null,
  },
];

type Action =
  | { type: "ADD_VUELO"; payload: null }
  | { type: "DELETE_VUELO"; payload: number }
  | {
      type: "UPDATE_VUELO";
      payload: { index: number; field: keyof Vuelo; value: string | null };
    };

const vuelosReducer = (state: Vuelo[], action: Action) => {
  switch (action.type) {
    case "ADD_VUELO":
      return [...state, initialState];
    case "DELETE_VUELO":
      return state.filter((_, index: number) => index != action.payload);
    case "UPDATE_VUELO":
      const newState = [...state];
      newState[action.payload.index] = {
        ...newState[action.payload.index],
        [action.payload.field]: action.payload.value,
      };
      return newState;
    default:
      return state;
  }
};
