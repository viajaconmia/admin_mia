import { useState } from "react";
import {
  InputGoogle,
  PlaceMaps,
  TextInput,
  AddressType,
  ComboBox2,
  ComboBoxOption2,
} from "../atom/Input";
import Button from "../atom/Button";
import { Aeropuerto, ExtraService, Sucursal } from "@/services/ExtraServices";
import { useNotification } from "@/context/useNotificacion";
import { Proveedor } from "@/services/ProveedoresService";

export type ForSave =
  | null
  | "aeropuerto"
  | "vuelo"
  | "renta_carro"
  | "sucursal";

export const GuardadoRapido = ({
  onSaveProveedor,
  onSaveAeropuerto,
  type,
  proveedores,
  onSaveSucursal,
}: {
  onSaveProveedor?: (proveedores: Proveedor[]) => void;
  onSaveAeropuerto?: (aeropuertos: Aeropuerto[]) => void;
  type: ForSave;
  proveedores?: Proveedor[];
  onSaveSucursal?: (sucursales: Sucursal[]) => void;
}) => {
  if (!type) return;
  return (
    <div className={`grid gap-4 items-end`}>
      {(type == "vuelo" || type == "renta_carro") && (
        <GuardadoProveedor onSaveProveedor={onSaveProveedor} type={type} />
      )}
      {type == "aeropuerto" && (
        <GuardarAeropuerto onSaveAeropuerto={onSaveAeropuerto} />
      )}
      {type == "sucursal" && (
        <GuardarSucursal
          proveedores={proveedores}
          onSaveSucursal={onSaveSucursal}
        />
      )}
    </div>
  );
};

const GuardadoProveedor = ({
  onSaveProveedor,
  type,
}: {
  onSaveProveedor: (proveedores: Proveedor[]) => void;
  type: ForSave;
}) => {
  const [nombre, setNombre] = useState<string>("");
  const { showNotification } = useNotification();

  const handleSubmit = () => {
    ExtraService.getInstance()
      .createProveedor({
        nombre: nombre,

        type: type,
      })
      .then((res) => {
        onSaveProveedor(res.data || []);
        showNotification("success", res.message);
      })
      .catch((error) =>
        showNotification(
          "error",
          error.message || "Error al agregar aerolinea",
        ),
      );
  };

  return (
    <div className={`grid gap-4 items-end`}>
      <div className={`grid p-8 py-0 gap-4 items-end`}>
        <TextInput
          value={nombre}
          label="Nombre"
          onChange={(value: string) => setNombre(value)}
        />
      </div>
      <Button onClick={handleSubmit}>Guardar</Button>
    </div>
  );
};

const GuardarAeropuerto = ({
  onSaveAeropuerto,
}: {
  onSaveAeropuerto: (aeropuertos: Aeropuerto[]) => void;
}) => {
  const [codigo, setCodigo] = useState<string>("");
  const [ubicacion, setUbicacion] = useState<string>("");
  const { showNotification } = useNotification();

  const handleAddAeropuerto = () => {
    ExtraService.getInstance()
      .createAeropuerto(codigo, ubicacion)
      .then((res) => {
        onSaveAeropuerto(res.data || []);
        showNotification("success", res.message);
      })
      .catch((error) =>
        showNotification(
          "error",
          error.message || "Error al agregar aeropuerto",
        ),
      );
  };

  return (
    <>
      <TextInput
        value={codigo}
        label="Codigo"
        onChange={(value: string) => setCodigo(value)}
      />
      <TextInput
        value={ubicacion}
        label="Ubicación"
        onChange={(value: string) => setUbicacion(value)}
      />
      <Button onClick={handleAddAeropuerto}>Guardar</Button>
    </>
  );
};

export interface SucursalDetails {
  nombre: string | null;
  direccion: string | null;
  colonia: string | null;
  ciudad: string | null;
  estado: string | null;
  pais: string | null;
  postal_code: string | null;
  calle: string | null;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
  horarios: {
    open_now: boolean;
    periods: any[];
    weekday_text: string[];
  } | null;
}

// === DATOS INICIALES ===
// Objeto de ejemplo para inicializar y mostrar la información
const initialPlaceDetails: SucursalDetails = {
  nombre: null,
  direccion: null,
  colonia: null,
  ciudad: null,
  estado: null,
  pais: null,
  telefono: null,
  latitud: null,
  longitud: null,
  horarios: null,
  postal_code: null,
  calle: null,
};

// Devuelve el long_name del componente de dirección que coincida con todos los tipos requeridos
export function getAddressComponentLongName(
  place: PlaceMaps,
  requiredTypes: AddressType[],
): string | null {
  const components = place.address_components ?? [];
  const match = components.find((component) =>
    requiredTypes.every((type) => component.types.includes(type)),
  );
  return match?.long_name ?? null;
}

export const GuardarSucursal = ({
  proveedores = [],
  onSaveSucursal,
}: {
  proveedores: Proveedor[];
  onSaveSucursal: (sucursales: Sucursal[]) => void;
}) => {
  const [sucursalDetails, setSucursalDetails] =
    useState<SucursalDetails>(initialPlaceDetails);
  const [proveedor, setProveedor] = useState<Proveedor>(null);
  const { showNotification } = useNotification();

  const handleUpdatePlace = (place: PlaceMaps) => {
    const details_place: SucursalDetails = {
      nombre: place.name || null,
      direccion: place.formatted_address || place.vicinity || null,
      colonia: getAddressComponentLongName(place, [
        "sublocality",
        "sublocality_level_1",
      ]),
      ciudad: getAddressComponentLongName(place, ["political", "locality"]),
      estado: getAddressComponentLongName(place, [
        "administrative_area_level_1",
      ]),
      pais: getAddressComponentLongName(place, ["country"]),
      telefono: place.international_phone_number || null,
      latitud: place.geometry?.location?.lat() || null,
      longitud: place.geometry?.location?.lng() || null,
      horarios: place.opening_hours || null,
      postal_code: getAddressComponentLongName(place, ["postal_code"]),
      calle: getAddressComponentLongName(place, ["route"]),
    };

    setSucursalDetails(details_place);
  };

  const handleSubmit = () => {
    ExtraService.getInstance()
      .createSucursal({ ...sucursalDetails, proveedor })
      .then((res) => {
        onSaveSucursal(res.data || []);
        showNotification("success", res.message);
      })
      .catch((error) =>
        showNotification(
          "error",
          error.message || "Error al agregar aeropuerto",
        ),
      );
  };

  const renderHorarios = () => {
    return (
      sucursalDetails.horarios?.weekday_text?.map(
        (text: string, index: number) => (
          <li key={index} className="text-sm text-gray-700">
            {text}
          </li>
        ),
      ) || (
        <p className="text-sm text-gray-500">
          Busca una sucursal para ver sus horarios.
        </p>
      )
    );
  };

  return (
    <div className="w-fit max-w-5xl flex flex-col justify-between items-center gap-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span>Buscador:</span>
          <InputGoogle onChange={handleUpdatePlace} />
        </div>
        <ComboBox2
          label="Proveedor"
          className="w-full"
          value={
            proveedor
              ? {
                  name: proveedor.proveedor,
                  content: proveedor,
                }
              : null
          }
          onChange={(value: ComboBoxOption2<Proveedor>) => {
            setProveedor(value.content);
          }}
          options={proveedores.map((proveedor) => ({
            name: proveedor.proveedor,
            content: proveedor,
          }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className=" grid grid-cols-2 gap-4 max-w-96">
          <TextInput
            value={sucursalDetails.nombre}
            label="Nombre establecimiento"
            onChange={(value: string) => {
              setSucursalDetails((prev) => ({ ...prev, nombre: value }));
            }}
          ></TextInput>
          <TextInput
            value={sucursalDetails.direccion}
            label="Dirección"
            onChange={(value: string) => {}}
          ></TextInput>
          <TextInput
            value={sucursalDetails.colonia}
            label="Colonia"
            onChange={(value: string) => {}}
          ></TextInput>
          <TextInput
            value={sucursalDetails.ciudad}
            label="Ciudad"
            onChange={(value: string) => {}}
          ></TextInput>
          <TextInput
            value={sucursalDetails.estado}
            label="Estado"
            onChange={(value: string) => {}}
          ></TextInput>
          <TextInput
            value={sucursalDetails.pais}
            label="Pais"
            onChange={(value: string) => {}}
          ></TextInput>
          <TextInput
            value={sucursalDetails.telefono}
            label="Telefono"
            onChange={(value: string) => {}}
          ></TextInput>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Horarios de Operación
          </h3>
          <ul className="p-3 bg-gray-50 border border-gray-200 rounded-md divide-y divide-gray-200">
            {renderHorarios()}
          </ul>
        </div>
        <Button onClick={handleSubmit}>done</Button>
      </div>
    </div>
  );
};
