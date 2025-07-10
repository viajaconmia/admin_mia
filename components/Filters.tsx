import React, { useState } from "react";
import { Filter, Search, X } from "lucide-react";
import {
  DateInput,
  Dropdown,
  NumberInput,
  TextInput,
} from "@/components/atom/Input";
import { TypeFilters } from "@/types";

const Filters: React.FC<{
  onFilter: (filters: TypeFilters) => void;
  defaultOpen?: boolean;
  defaultFilters?: TypeFilters;
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
}> = ({
  onFilter,
  defaultOpen = false,
  defaultFilters,
  searchTerm,
  setSearchTerm,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="overflow-hidden max-w-full mx-auto relative flex flex-col md:flex-row md:items-center md:flex-wrap justify-between gap-4">
      <div className="relative flex-1 pt-2">
        <div className="absolute inset-y-0 left-0 pl-3 pt-2 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Buscar por código, ID, hotel..."
          value={searchTerm || ""}
          onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
        />
      </div>
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={toggleModal}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>
      <FiltersModal
        onClose={toggleModal}
        isOpen={isOpen}
        onFilter={onFilter}
        defaultFilter={defaultFilters}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
};

const FiltersModal: React.FC<{
  onClose: () => void;
  isOpen: boolean;
  onFilter: (filters: TypeFilters) => void;
  defaultFilter?: TypeFilters;
  setSearchTerm?: (value: string) => void;
}> = ({ onClose, isOpen, onFilter, defaultFilter, setSearchTerm }) => {
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFilter ?? ({} as TypeFilters)
  );

  const handleFilter = () => {
    onFilter(filters);
    onClose();
  };

  const handleResetFilters = () => {
    const updateFilters: TypeFilters = { ...filters };

    Object.keys(filters).forEach((key) => {
      updateFilters[key] = null;
    });
    setFilters(updateFilters || defaultFilter);
    onFilter(updateFilters);
    if (typeof setSearchTerm === "function") {
      setSearchTerm("");
    }
  };

  const handleDeleteFilter = (key: string) => {
    const updatedFilters = { ...filters };
    updatedFilters[key] = null;

    setFilters((prev) => ({
      ...prev,
      [key]: null,
    }));
    onFilter(updatedFilters);
  };

  return (
    <>
      <div>
        <button
          onClick={handleResetFilters}
          className="inline-flex sm:w-full items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <X className="h-4 w-4 mr-2" />
          Limpiar
        </button>
      </div>
      {isOpen && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-[80vh] w-full max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {"codigo_reservacion" in filters && (
                <TextInput
                  label="Código de Reservación"
                  value={filters.codigo_reservacion || ""}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      codigo_reservacion: value,
                    }))
                  }
                />
              )}

              {"startDate" in filters && (
                <DateInput
                  label="Fecha de inicio"
                  value={filters.startDate || ""}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, startDate: value }))
                  }
                />
              )}

              {"endDate" in filters && (
                <DateInput
                  label="Fecha de fin"
                  value={filters.endDate || ""}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, endDate: value }))
                  }
                />
              )}

              {"paydate" in filters && (
                <DateInput
                  label="Fecha de pago"
                  value={filters.paydate?.toString() || ""}
                  onChange={(value: string) =>
                    setFilters((prev) => ({ ...prev, paydate: value }))
                  }
                />
              )}
              {/* Nuevo filtro de descuento */}

              {"hasDiscount" in filters && (
                <Dropdown
                  label="Tiene descuento"
                  value={filters.hasDiscount || ""}
                  onChange={(value: string) => {
                    const newValue =
                      value === "SI" ? "SI" : value === "NO" ? "NO" : "";
                    setFilters((prev) => ({
                      ...prev,
                      hasDiscount: newValue,
                    }));
                  }}
                  options={["SI", "NO"]}
                />
              )}

              {/* Estos son los filtros nuevos adicionales */}

              {"id_stripe" in filters && (
                <TextInput
                  label="ID Stripe"
                  value={filters.id_stripe?.toString() || ""}
                  onChange={(value: string) =>
                    setFilters((prev) => ({ ...prev, id_stripe: value }))
                  }
                />
              )}

              {"facturable" in filters && (
                <Dropdown
                  label="Facturable"
                  value={
                    filters.facturable === true
                      ? "SI"
                      : filters.facturable === false
                      ? "NO"
                      : ""
                  }
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      facturable:
                        value === "SI" ? true : value === "NO" ? false : null,
                    }))
                  }
                  options={["SI", "NO"]}
                />
              )}

              {"comprobante" in filters && (
                <Dropdown
                  label="Comprobante"
                  value={
                    filters.comprobante === true
                      ? "SI"
                      : filters.comprobante === false
                      ? "NO"
                      : ""
                  }
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      comprobante:
                        value === "SI" ? true : value === "NO" ? false : null,
                    }))
                  }
                  options={["SI", "NO"]}
                />
              )}

              {"hotel" in filters && (
                <TextInput
                  label="Hotel"
                  value={filters.hotel}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, hotel: value }))
                  }
                />
              )}

              {"recordCount" in filters && (
                <Dropdown
                  label="Cantidad de Registros"
                  value={filters.recordCount}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, recordCount: value }))
                  }
                  options={[
                    "100 registros",
                    "1,000 registros",
                    "5,000 registros",
                    "10,000 registros",
                  ]}
                />
              )}

              {"estado_credito" in filters && (
                <Dropdown
                  label="Estado de credito"
                  value={String(filters.estado_credito || "")}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      estado_credito: value as TypeFilters["estado_credito"],
                    }))
                  }
                  options={["Activo", "Inactivo"]}
                />
              )}

              {"id_client" in filters && (
                <TextInput
                  label="ID del cliente"
                  value={filters.id_client}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, id_client: value }))
                  }
                />
              )}

              {"vendedor" in filters && (
                <TextInput
                  label="Vendedor"
                  value={filters.vendedor}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, vendedor: value }))
                  }
                />
              )}

              {"client" in filters && (
                <TextInput
                  label="Cliente"
                  value={filters.client}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, client: value }))
                  }
                />
              )}

              {"telefono" in filters && (
                <NumberInput
                  value={filters.telefono}
                  label="Telefono"
                  onChange={(value) => {
                    if (value === "" || isNaN(Number(value))) {
                      setFilters((prev) => ({ ...prev, telefono: null }));
                      return;
                    }
                    setFilters((prev) => ({
                      ...prev,
                      telefono: Number(value),
                    }));
                  }}
                />
              )}

              {"traveler" in filters && (
                <TextInput
                  label="Nombre del viajero"
                  value={filters.traveler}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, traveler: value }))
                  }
                />
              )}

              {"nombre" in filters && (
                <TextInput
                  label="Proveedor (Hotel)"
                  value={filters.nombre}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, nombre: value }))
                  }
                />
              )}

              {"startCantidad" in filters && (
                <NumberInput
                  value={filters.startCantidad}
                  label="Cantidad inicial"
                  onChange={(value) => {
                    if (value === "" || isNaN(Number(value))) {
                      setFilters((prev) => ({ ...prev, startCantidad: null }));
                      return;
                    }
                    setFilters((prev) => ({
                      ...prev,
                      startCantidad: Number(value),
                    }));
                  }}
                />
              )}

              {"endCantidad" in filters && (
                <NumberInput
                  value={filters.endCantidad}
                  label="Cantidad final"
                  onChange={(value) => {
                    if (value === "" || isNaN(Number(value))) {
                      setFilters((prev) => ({ ...prev, endCantidad: null }));
                      return;
                    }
                    setFilters((prev) => ({
                      ...prev,
                      endCantidad: Number(value),
                    }));
                  }}
                />
              )}

              {"status" in filters && (
                <Dropdown
                  label="Estatus de Reservación"
                  value={filters.status}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value as "Confirmada" | "Pendiente" | "Cancelada",
                    }))
                  }
                  options={["Confirmada", "Pendiente", "Cancelada"]}
                />
              )}

              {"reservationStage" in filters && (
                <Dropdown
                  label="Etapa Reservación"
                  value={filters.reservationStage}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      reservationStage: value as
                        | "Reservado"
                        | "In house"
                        | "Check-out",
                    }))
                  }
                  options={["Reservado", "In house", "Check out"]}
                />
              )}
              {"reservante" in filters && (
                <Dropdown
                  label="Tipo de reservante"
                  value={filters.reservante}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      reservante: value as "Operaciones" | "Cliente",
                    }))
                  }
                  options={["Operaciones", "Cliente"]}
                />
              )}

              {"active" in filters && (
                <Dropdown
                  label="Estatus de Reservación"
                  value={filters.active}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      active: value as "Activo" | "Inactivo",
                    }))
                  }
                  options={["Confirmada", "Pendiente", "Cancelada"]}
                />
              )}

              {"paymentMethod" in filters && (
                <Dropdown
                  label="Método de pago"
                  value={filters.paymentMethod}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      paymentMethod: value as
                        | "Tarjeta Debito"
                        | "Tarjeta Credito"
                        | ""
                        | "Credito"
                        | "Contado"
                        | "Wallet"
                        | "Tranferencia",
                    }))
                  }
                  options={[
                    "Tarjeta Debito",
                    "Tarjeta Credito",
                    "Transferencia",
                    "Wallet",
                    "Credito",
                    "Contado",
                  ]}
                />
              )}

              {"hay_convenio" in filters && (
                <Dropdown
                  label="¿Hay convenio?"
                  value={filters.hay_convenio}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      hay_convenio: value as "SI" | "NO",
                    }))
                  }
                  options={["SI", "NO"]}
                />
              )}

              {"tipo_negociacion" in filters && (
                <TextInput
                  label="Tipo de Negociación"
                  value={filters.tipo_negociacion}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, tipo_negociacion: value }))
                  }
                />
              )}
              {"estado" in filters && (
                <Dropdown
                  label="Estado"
                  value={filters.estado || ""}
                  onChange={(val) =>
                    setFilters((prev) => ({ ...prev, estado: val }))
                  }
                  options={[
                    "AGUASCALIENTES",
                    "BAJA CALIFORNIA",
                    "BAJA CALIFORNIA SUR",
                    "CAMPECHE",
                    "CHIAPAS",
                    "CHIHUAHUA",
                    "CIUDAD DE MEXICO",
                    "COAHUILA",
                    "COLIMA",
                    "DURANGO",
                    "GUANAJUATO",
                    "GUERRERO",
                    "HIDALGO",
                    "JALISCO",
                    "ESTADO DE MEXICO",
                    "MICHOACAN",
                    "MORELOS",
                    "NAYARIT",
                    "NUEVO LEÓN",
                    "OAXACA",
                    "PUEBLA",
                    "QUERETARO",
                    "QUINTANA ROO",
                    "SAN LUIS POTOSI",
                    "SINALOA",
                    "SONORA",
                    "TABASCO",
                    "TAMAULIPAS",
                    "TLAXCALA",
                    "VERACRUZ",
                    "YUCATÁN",
                    "ZACATECAS",
                    "OTROS",
                  ]}
                />
              )}

              {"sencilla_costo_min" in filters && (
                <NumberInput
                  label="Costo mínimo hab sencilla"
                  value={filters.sencilla_costo_min}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      sencilla_costo_min: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"sencilla_costo_max" in filters && (
                <NumberInput
                  label="Costo máximo hab sencilla"
                  value={filters.sencilla_costo_max}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      sencilla_costo_max: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"sencilla_precio_min" in filters && (
                <NumberInput
                  label="Precio mínimo hab sencilla"
                  value={filters.sencilla_precio_min}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      sencilla_precio_min: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"sencilla_precio_max" in filters && (
                <NumberInput
                  label="Precio máximo hab sencilla"
                  value={filters.sencilla_precio_max}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      sencilla_precio_max: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"doble_costo_min" in filters && (
                <NumberInput
                  label="Costo mínimo hab doble"
                  value={filters.doble_costo_min}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      doble_costo_min: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"doble_costo_max" in filters && (
                <NumberInput
                  label="Costo máximo hab doble"
                  value={filters.doble_costo_max}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      doble_costo_max: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"doble_precio_min" in filters && (
                <NumberInput
                  label="Precio mínimo hab doble"
                  value={filters.doble_precio_min}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      doble_precio_min: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"doble_precio_max" in filters && (
                <NumberInput
                  label="Precio máximo hab doble"
                  value={filters.doble_precio_max}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      doble_precio_max: value === "" ? null : Number(value),
                    }))
                  }
                />
              )}

              {"incluye_desayuno" in filters && (
                <Dropdown
                  label="¿Incluye desayuno?"
                  value={
                    filters.incluye_desayuno === true
                      ? "SI"
                      : filters.incluye_desayuno === false
                      ? "NO"
                      : ""
                  }
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      incluye_desayuno:
                        value === "SI" ? true : value === "NO" ? false : null,
                    }))
                  }
                  options={["SI", "NO"]}
                />
              )}

              {"acepta_mascotas" in filters && (
                <Dropdown
                  label="¿Acepta mascotas?"
                  value={filters.acepta_mascotas}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      acepta_mascotas: value as "SI" | "NO",
                    }))
                  }
                  options={["SI", "NO"]}
                />
              )}

              {"tiene_transportacion" in filters && (
                <Dropdown
                  label="¿Tiene transportación?"
                  value={filters.tiene_transportacion}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      tiene_transportacion: value as "SI" | "NO",
                    }))
                  }
                  options={["SI", "NO"]}
                />
              )}

              {"tipo_pago" in filters && (
                <Dropdown
                  label="Tipo de pago"
                  value={filters.tipo_pago}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      tipo_pago: value as "PREPAGO" | "CREDITO",
                    }))
                  }
                  options={["PREPAGO", "CREDITO"]}
                />
              )}

              {"rfc" in filters && (
                <TextInput
                  label="RFC"
                  value={filters.rfc}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, rfc: value }))
                  }
                />
              )}

              {"razon_social" in filters && (
                <TextInput
                  label="Razon Social"
                  value={filters.razon_social}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, razon_social: value }))
                  }
                />
              )}
              {"correo" in filters && (
                <TextInput
                  label="Correo"
                  value={filters.correo}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, correo: value }))
                  }
                />
              )}
              {"infoCompleta" in filters && (
                <Dropdown
                  label="Información Completa"
                  value={filters.infoCompleta || ""}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      infoCompleta: value,
                    }))
                  }
                  options={["COMPLETA", "INCOMPLETA"]}
                />
              )}

              {"tipo_hospedaje" in filters && (
                <TextInput
                  label="Tipo de Proveedor"
                  value={filters.tipo_hospedaje}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, tipo_hospedaje: value }))
                  }
                />
              )}

              {"notas" in filters && (
                <TextInput
                  label="Notas"
                  value={filters.notas}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, notas: value }))
                  }
                />
              )}

              {"activo" in filters && (
                <Dropdown
                  label="Estatus (Activo/Inactivo)"
                  value={
                    filters.activo === true
                      ? "ACTIVO"
                      : filters.activo === false
                      ? "INACTIVO"
                      : ""
                  }
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      activo:
                        value === "ACTIVO"
                          ? true
                          : value === "INACTIVO"
                          ? false
                          : null,
                    }))
                  }
                  options={["ACTIVO", "INACTIVO"]}
                />
              )}
              {"pais" in filters && (
                <TextInput
                  label="País"
                  value={filters.pais}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, pais: value }))
                  }
                />
              )}
            </div>
            <div className="w-full max-w-sm mx-auto mb-4">
              {"filterType" in filters && (
                <Dropdown
                  label="Filtrar fecha por:"
                  value={filters.filterType}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      filterType: value as
                        | "Check-in"
                        | "Check-out"
                        | "Transaccion"
                        | "Actualizacion",
                    }))
                  }
                  options={[
                    "Check-in",
                    "Check-out",
                    "Transaccion",
                    "Actualizacion",
                  ]}
                />
              )}
            </div>
            <div className="flex justify-center gap-10">
              <button
                onClick={handleFilter}
                className="px-10 py-2 bg-gradient-to-r from-[#00C0FF] to-[#0080FF] text-white font-medium rounded-md hover:opacity-90 transition-opacity duration-200 shadow-md"
              >
                Filtrar
              </button>
              <button
                onClick={onClose}
                className="px-10 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-md hover:opacity-90 transition-opacity duration-200 shadow-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full">
        {Object.entries(filters).map(([key, value]) => {
          if (!value && value !== false) return null;
          return (
            <label
              className="text-xs font-medium text-sky-900 rounded-full bg-sky-200 px-2 pl-3 py-1 mr-2 mb-2 inline-flex items-center"
              key={key}
            >
              {key === "hasDiscount" && "Descuento: "}
              {key === "paymentMethod" && "Método pago: "}
              {key === "startDate" && "Desde: "}
              {key === "endDate" && "Hasta: "}
              {key === "facturable" && "Facturable: "}
              {key === "comprobante" && "Comprobante: "}
              {key !== "tiene_descuento" &&
                key !== "hasDiscount" &&
                key !== "paymentMethod" &&
                key !== "startDate" &&
                key !== "endDate" &&
                key !== "facturable" &&
                key !== "comprobante" &&
                `${key}: `}

              {typeof value === "string"
                ? value.toLowerCase()
                : typeof value === "boolean"
                ? value
                  ? "SI"
                  : "NO"
                : value.toString()}

              <X
                onClick={() => handleDeleteFilter(key)}
                className="w-3 h-3 ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
              />
            </label>
          );
        })}
      </div>
    </>
  );
};

export default Filters;
