"use client";
import Button from "@/components/atom/Button";
import {
  CheckboxInput,
  DateInput,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";
import { Loader } from "@/components/atom/Loader";
import { useNotification } from "@/context/useNotificacion";
import {
  DatosFiscales,
  mapProveedor,
  Proveedor,
  ProveedoresService,
} from "@/services/ProveedoresService";
import { Pencil, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { Plus, X, ReceiptText } from "lucide-react";
import { Table } from "@/component/molecule/Table";
import { ApiResponse } from "@/services/ApiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const App = () => {
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [datosFiscales, setDatosFiscales] = useState<DatosFiscales[]>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiscal, setSelectedFiscal] = useState<DatosFiscales | null>(
    null
  );

  const handleEditClick = (fiscal: DatosFiscales) => {
    setSelectedFiscal(fiscal); // Guardamos el registro a editar
    setIsModalOpen(true); // Abrimos el mismo modal
  };

  const handleAddNewClick = () => {
    setSelectedFiscal(null); // Limpiamos para que sea un registro nuevo
    setIsModalOpen(true);
  };

  const handleSave = async (datos: DatosFiscales) => {
    try {
      let response: ApiResponse<DatosFiscales[]>;
      if (selectedFiscal) {
        response = await ProveedoresService.getInstance().editarFiscalData(
          datos
        );
      } else {
        response = await ProveedoresService.getInstance().crearFiscalData(
          datos
        );
      }
      setDatosFiscales(response.data);
      showNotification("success", response.message);
    } catch (error) {
      showNotification(
        "error",
        error.message || "Error al isModalOpen datos fiscales"
      );
    } finally {
      setSelectedFiscal(null);
      setIsModalOpen(false);
    }
  };

  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const proveedorId = Array.isArray(id) ? id[0] : id;
        const service = ProveedoresService.getInstance();

        const [proveedorRes, datosFiscalesRes] = await Promise.all([
          service.getProveedores({ id: proveedorId }),
          service.getDatosFiscales(proveedorId),
        ]);

        if (!proveedorRes.data.length) {
          throw new Error("No hay proveedor");
        }
        setProveedor(mapProveedor(proveedorRes.data[0]));
        setDatosFiscales(datosFiscalesRes.data);
      } catch (err: any) {
        showNotification(
          "error",
          err?.message || "Error al obtener el proveedor"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (loading || !proveedor)
    return (
      <div className="w-full h-full bg-white rounded-md p-4 flex justify-center items-center">
        <Loader />
      </div>
    );

  return (
    <>
      <div className="w-full max-w-5xl h-full bg-gray-50 rounded-md flex flex-col overflow-y-auto m-auto">
        <ProveedorCard
          proveedor={proveedor}
          datosFiscales={datosFiscales}
          handleAddNewClick={handleAddNewClick}
          handleEditClick={handleEditClick}
        />
      </div>
      <ModalCrearDatosFiscales
        isOpen={isModalOpen}
        onClose={function (): void {
          setIsModalOpen(false);
        }}
        selectedFiscal={selectedFiscal}
        onSave={handleSave}
        id_proveedor={Number(Array.isArray(id) ? id[0] : id)}
      />
    </>
  );
};

export default App;

function ProveedorCard({
  proveedor,
  handleAddNewClick,
  handleEditClick,
  datosFiscales,
}: {
  proveedor: Proveedor;
  handleAddNewClick: () => void;
  handleEditClick: (value: DatosFiscales) => void;
  datosFiscales: DatosFiscales[];
}) {
  const { draft, update, hasChanges, getChanges, editar, toggleEdit, save } =
    useProveedorEditor(proveedor);
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("datos");

  const onSave = async () => {
    try {
      const changes = getChanges();
      const response = await ProveedoresService.getInstance().updateProveedor({
        id: proveedor.id,
        ...changes,
      });
      save();
      showNotification("success", response.message || "bien actualizado");
    } catch (error) {
      showNotification(
        "error",
        error.message || "error al actualizar proveedor"
      );
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto w-full">
      {/* Header de acciones */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {draft.proveedor || "Detalle de Proveedor"}
          </h1>
          <p className="text-sm text-gray-500">
            ID: {draft.id} • Tipo: {draft.type || "N/A"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleEdit}
            icon={Pencil}
          >
            {!editar ? "Editar" : "Cancelar"}
          </Button>
          <Button
            disabled={!hasChanges || !editar}
            onClick={onSave}
            icon={Save}
            size="sm"
          >
            Guardar cambios
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full bg-white p-4 rounded-md border border-gray-300"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="datos">DATOS BASICOS</TabsTrigger>
          {/* <TabsTrigger value="tarifas">TARIFAS Y SERVICIOS</TabsTrigger> */}
          <TabsTrigger value="pagos">INFORMACION DE PAGOS</TabsTrigger>
          <TabsTrigger value="extra">INFORMACIÓN ADICIONAL</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="space-y-4 p-4">
          <div className="grid sm:grid-cols-2 gap-4 mt-4  items-center border-b pb-4">
            <TextInput
              label="Nombre del Proveedor"
              value={draft.proveedor || ""}
              onChange={(e) => update("proveedor", e)}
              disabled={!editar}
            />
            <TextInput
              label="Tipo de negociación"
              value={draft.negociacion || ""}
              onChange={(e) => update("negociacion", e)}
              disabled={!editar}
            />
            <CheckboxInput
              label="¿Tiene Convenio?"
              checked={draft.convenio}
              onChange={(v) => update("convenio", v)}
              disabled={!editar}
            />
            <DateInput
              label="Vigencia del convenio"
              value={draft.vigencia_convenio || ""}
              onChange={(e) => update("vigencia_convenio", e)}
              disabled={!editar}
            />
            <CheckboxInput
              label="Estatus"
              checked={draft.estatus}
              onChange={(v) => update("estatus", v)}
              disabled={!editar}
            />
            <CheckboxInput
              label="Es internacional"
              checked={draft.internacional}
              onChange={(v) => update("internacional", v)}
              disabled={!editar}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4  items-center border-b pb-4">
            <TextInput
              label="Estado"
              value={draft.estado || ""}
              onChange={(e) => update("estado", e)}
              disabled={!editar}
            />
            <TextInput
              label="Ciudad"
              value={draft.ciudad || ""}
              onChange={(e) => update("ciudad", e)}
              disabled={!editar}
            />
            <div className="w-full h-6 bg-gray-100/50 border border-gray-300/50 rounded-lg"></div>
            <TextInput
              label="Código Postal"
              value={draft.codigo_postal || ""}
              onChange={(e) => update("codigo_postal", e)}
              disabled={!editar}
            />
            <TextInput
              label="Calle"
              value={draft.calle || ""}
              onChange={(e) => update("calle", e)}
              disabled={!editar}
            />
            <TextInput
              label="Número"
              value={draft.numero || ""}
              onChange={(e) => update("numero", e)}
              disabled={!editar}
            />
            <TextInput
              label="Colonia"
              value={draft.colonia || ""}
              onChange={(e) => update("colonia", e)}
              disabled={!editar}
            />
            <TextInput
              label="Municipio"
              value={draft.municipio || ""}
              onChange={(e) => update("municipio", e)}
              disabled={!editar}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4  items-center border-b pb-4">
            <TextAreaInput
              label="Formas de reservar"
              value={draft.formas_reservar || ""}
              onChange={(e) => update("formas_reservar", e)}
              disabled={!editar}
            />
            <TextAreaInput
              label="Contactos de Convenio"
              value={draft.contactos_convenio || ""}
              onChange={(e) => update("contactos_convenio", e)}
              disabled={!editar}
            />
            <TextAreaInput
              label="Formas de solicitar disponibilidad"
              value={draft.formas_solicitar_disponibilidad || ""}
              onChange={(e) => update("formas_solicitar_disponibilidad", e)}
              disabled={!editar}
            />
            <TextInput
              label="Imagen (URL)"
              value={draft.imagen || ""}
              onChange={(e) => update("imagen", e)}
              disabled={!editar}
            />
          </div>
          <TextAreaInput
            label="Notas del Proveedor"
            value={draft.notas_proveedor || ""}
            onChange={(e) => update("notas_proveedor", e)}
            disabled={!editar}
            className="col-span-full"
          />
        </TabsContent>
        <TabsContent value="pagos" className="space-y-4 p-4">
          <div className="grid sm:grid-cols-2 gap-4 mt-4  items-center">
            <TextInput
              label="Tipo de Pago (crédito/prepago)"
              value={draft.tipo_pago || ""}
              onChange={(e) => update("tipo_pago", e)}
              disabled={!editar}
            />
            <TextAreaInput
              label="Notas tipo de pago"
              value={draft.notas_tipo_pago || ""}
              onChange={(e) => update("notas_tipo_pago", e)}
              disabled={!editar}
            />
            <TextAreaInput
              label="Notas información de Pagos"
              value={draft.notas_pagos || ""}
              onChange={(e) => update("notas_pagos", e)}
              disabled={!editar}
            />
            <div className="flex flex-col gap-2 justify-end items-end h-full max-w-7xl mx-auto w-full col-span-2">
              <Button
                onClick={() => {
                  handleAddNewClick();
                }}
                size="sm"
                icon={Plus}
              >
                Crear Datos Fiscales
              </Button>
              <Table
                registros={datosFiscales.map(
                  ({ id_datos_fiscales, id, id_proveedor, ...rest }) => ({
                    id_datos_fiscales,
                    ...rest,
                    edit: { ...rest, id: id_datos_fiscales, id_proveedor },
                  })
                )}
                renderers={{
                  edit: ({ value }: { value: DatosFiscales }) => (
                    <Button
                      icon={Pencil}
                      size="sm"
                      onClick={() => handleEditClick(value)}
                    >
                      Editar
                    </Button>
                  ),
                }}
                back={false}
                next={false}
              ></Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- LÓGICA DE REDUCER Y HOOK (Sin cambios, solo tipos actualizados) ---

type ProveedorState = {
  original: Proveedor;
  draft: Proveedor;
  hasChanges: boolean;
  editar: boolean;
};

type Action =
  | { type: "INIT"; payload: Proveedor }
  | { type: "UPDATE_FIELD"; field: keyof Proveedor; value: any }
  | { type: "TOGGLE_EDIT" }
  | { type: "SAVE" }
  | { type: "RESET" };

function proveedorReducer(
  state: ProveedorState,
  action: Action
): ProveedorState {
  switch (action.type) {
    case "INIT":
      return {
        original: action.payload,
        draft: action.payload,
        hasChanges: false,
        editar: false,
      };
    case "SAVE":
      return {
        original: state.draft,
        editar: false,
        hasChanges: false,
        draft: state.draft,
      };
    case "TOGGLE_EDIT":
      return {
        ...state,
        editar: !state.editar,
        ...(state.editar ? { draft: state.original, hasChanges: false } : {}),
      };
    case "UPDATE_FIELD": {
      const draft = { ...state.draft, [action.field]: action.value };
      const hasChanges = (Object.keys(draft) as (keyof Proveedor)[]).some(
        (key) => draft[key] !== state.original[key]
      );
      return { ...state, draft, hasChanges };
    }
    case "RESET":
      return { ...state, draft: state.original, hasChanges: false };
    default:
      return state;
  }
}

function useProveedorEditor(proveedor: Proveedor) {
  const [state, dispatch] = useReducer(proveedorReducer, {
    original: proveedor,
    draft: proveedor,
    hasChanges: false,
    editar: false,
  });

  useEffect(() => {
    dispatch({ type: "INIT", payload: proveedor });
  }, [proveedor]);

  const update = (field: keyof Proveedor, value: any) =>
    dispatch({ type: "UPDATE_FIELD", field, value });

  const onSave = () => dispatch({ type: "SAVE" });

  const getChanges = () => {
    const changes: any = {};
    (Object.keys(state.draft) as (keyof Proveedor)[]).forEach((key) => {
      if (state.draft[key] !== state.original[key]) {
        changes[key] = state.draft[key];
      }
    });
    return changes;
  };

  return {
    editar: state.editar,
    toggleEdit: () => dispatch({ type: "TOGGLE_EDIT" }),
    draft: state.draft,
    hasChanges: state.hasChanges,
    update,
    save: onSave,
    reset: () => dispatch({ type: "RESET" }),
    getChanges,
  };
}

interface ModalCrearDatosFiscalesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (datos: DatosFiscales) => void;
  id_proveedor: number;
  selectedFiscal: DatosFiscales | null;
}

const ModalCrearDatosFiscales = ({
  isOpen,
  onClose,
  onSave,
  id_proveedor,
  selectedFiscal,
}: ModalCrearDatosFiscalesProps) => {
  const [formData, setFormData] = useState<Partial<DatosFiscales>>({
    rfc: "",
    alias: "",
    id_proveedor,
  });

  const handleChange = (field: keyof DatosFiscales, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (!formData.rfc || !formData.razon_social) {
      alert("rfc y razon social es obligatorio");
      return;
    }
    onSave(formData as DatosFiscales);
  };

  useEffect(() => {
    if (selectedFiscal) {
      setFormData(selectedFiscal); // Si recibimos datos, los ponemos en el form
    } else {
      setFormData({
        rfc: "",
        alias: "",
        id_proveedor,
      });
    }
  }, [selectedFiscal, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header con estilo más limpio */}
        <div className="p-5 border-b flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ReceiptText size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Nueva Información Fiscal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <TextInput
                label="Razon social"
                value={formData.razon_social || ""}
                onChange={(v) => handleChange("razon_social", v)}
                placeholder="Ej: NOKTOS SA de CV"
              />
            </div>
            <div className="col-span-1">
              <TextInput
                label="rfc *"
                value={formData.rfc || ""}
                onChange={(v) => handleChange("rfc", v)}
                placeholder="XAXX010101000"
              />
            </div>
            <div className="col-span-1">
              <TextInput
                label="Alias del registro"
                value={formData.alias || ""}
                onChange={(v) => handleChange("alias", v)}
                placeholder="Ej: Cuenta Principal"
              />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} icon={Plus} size="sm">
            Guardar Información
          </Button>
        </div>
      </div>
    </div>
  );
};
