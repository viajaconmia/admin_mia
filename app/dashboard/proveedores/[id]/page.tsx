"use client";
import Button from "@/components/atom/Button";
import {
  CheckboxInput,
  DateInput,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";
import { Loader } from "@/components/atom/Loader";
import { useNotification } from "@/context/useNotificacion";
import {
  DatosFiscales,
  mapProveedor,
  mapProveedorRentaCarro,
  Proveedor,
  ProveedorCuenta,
  ProveedoresService,
} from "@/services/ProveedoresService";
import { Pencil, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { Plus } from "lucide-react";
import { Table } from "@/component/molecule/Table";
import { ApiResponse } from "@/services/ApiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModalCrearDatosFiscales, ModalCuentasCRUD } from "./_components";
import { InformacionAdicionalProveedor } from "./_components/info_adicional";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";

const App = () => {
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [datosFiscales, setDatosFiscales] = useState<DatosFiscales[]>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiscal, setSelectedFiscal] = useState<DatosFiscales | null>(
    null
  );
  const [cuentas, setCuentas] = useState<ProveedorCuenta[]>([]);
  const [isCuentaOpen, setIsCuentaOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<ProveedorCuenta>(null);

  const handleEditClickCuenta = (cuenta: ProveedorCuenta) => {
    setSelectedCuenta(cuenta); // Guardamos el registro a editar
    setIsCuentaOpen(true); // Abrimos el mismo modal
  };

  const handleAddNewClickCuenta = () => {
    setSelectedCuenta(null); // Limpiamos para que sea un registro nuevo
    setIsCuentaOpen(true);
  };

  const handleSaveCuenta = async (datos: ProveedorCuenta) => {
    try {
      let response: ApiResponse<ProveedorCuenta[]>;
      if (selectedCuenta) {
        response =
          await ProveedoresService.getInstance().updateCuentasProveedor(datos);
      } else {
        response =
          await ProveedoresService.getInstance().createCuentasProveedor(datos);
      }
      setCuentas(response.data);
      showNotification("success", response.message);
    } catch (error) {
      showNotification(
        "error",
        error.message || "Error al isModalOpen datos fiscales"
      );
    } finally {
      setSelectedCuenta(null);
      setIsCuentaOpen(false);
    }
  };

  const handleEditClick = (fiscal: DatosFiscales) => {
    setSelectedFiscal(fiscal); // Guardamos el registro a editar
    setIsModalOpen(true); // Abrimos el mismo modal
  };

  const handleAddNewClick = () => {
    setSelectedFiscal(null); // Limpiamos para que sea un registro nuevo
    setIsModalOpen(true);
  };

  const handleSave = async (
    datos: DatosFiscales & { id_proveedor: number }
  ) => {
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
        const proveedorId = Number(Array.isArray(id) ? id[0] : id);
        const service = ProveedoresService.getInstance();

        const [proveedorRes, datosFiscalesRes, cuentasRes] = await Promise.all([
          service.getProveedores({ id: Number(proveedorId) }),
          service.getDatosFiscales(proveedorId),
          service.getCuentasByProveedor(proveedorId),
        ]);

        if (!proveedorRes.data.length) {
          throw new Error("No hay proveedor");
        }

        const type = await service.getProveedorType(proveedorRes.data[0]);
        console.log(type);

        setProveedor({
          ...mapProveedor(proveedorRes.data[0]),
          ...mapProveedorRentaCarro(type.data),
        });
        setDatosFiscales(datosFiscalesRes.data);
        setCuentas(cuentasRes.data);
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
          cuentas={cuentas}
          handleAddNewClick={handleAddNewClick}
          handleEditClick={handleEditClick}
          handleAddNewClickCuenta={handleAddNewClickCuenta}
          handleEditClickCuenta={handleEditClickCuenta}
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
      <ModalCuentasCRUD
        isOpen={isCuentaOpen}
        onClose={() => setIsCuentaOpen(false)}
        onSave={handleSaveCuenta}
        id_proveedor={Number(Array.isArray(id) ? id[0] : id)}
        selectedCuenta={selectedCuenta}
      ></ModalCuentasCRUD>
    </>
  );
};

export default App;

function ProveedorCard({
  proveedor,
  cuentas,
  handleAddNewClick,
  handleEditClick,
  handleAddNewClickCuenta,
  handleEditClickCuenta,
  datosFiscales,
}: {
  proveedor: Proveedor;
  cuentas: ProveedorCuenta[];
  handleAddNewClick: () => void;
  handleEditClick: (value: DatosFiscales) => void;
  handleAddNewClickCuenta: () => void;
  handleEditClickCuenta: (value: ProveedorCuenta) => void;
  datosFiscales: DatosFiscales[];
}) {
  const { draft, update, hasChanges, getChanges, editar, toggleEdit, save } =
    useProveedorEditor(proveedor);
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState("datos");
  const [activeTable, setActiveTable] = useState("datos_fiscales");
  const { Can, hasPermission } = usePermiso();

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
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">
              ID: {draft.id} • Tipo: {draft.type || "N/A"}
            </p>
            <CheckboxInput
              disabled={!editar}
              label="Es intermediario?"
              checked={draft.intermediario}
              onChange={(v) => update("intermediario", v)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Can permiso={PERMISOS.COMPONENTES.GROUP.PROVEEDORES_EDICIONES}>
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
          </Can>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full bg-white p-4 rounded-md border border-gray-300"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="datos">DATOS BASICOS</TabsTrigger>
          <TabsTrigger value="tarifas">TARIFAS Y SERVICIOS</TabsTrigger>
          <TabsTrigger value="pagos">INFORMACION DE PAGOS</TabsTrigger>
          <TabsTrigger value="extra">INFORMACIÓN ADICIONAL</TabsTrigger>
        </TabsList>

        <TabsContent value="tarifas" className="space-y-4 p-4">
          <div className="grid gap-4">
            <NumberInput
              value={draft.iva}
              label="IVA"
              onChange={(v) => update("iva", v)}
              disabled={!editar}
            />
            {proveedor.type == "hotel" && (
              <NumberInput
                value={draft.ish}
                label="ISH"
                onChange={(v) => update("ish", v)}
                disabled={!editar}
              />
            )}
            {proveedor.type == "vuelo" && (
              <NumberInput
                label="TUA"
                value={draft.tua}
                onChange={(v) => update("tua", v)}
                disabled={!editar}
              />
            )}
            {proveedor.type == "hotel" && (
              <NumberInput
                label="Saneamiento"
                value={draft.saneamiento}
                disabled={!editar}
                onChange={(v) => update("saneamiento", v)}
              />
            )}
            <TextAreaInput
              disabled={!editar}
              label="Notas de tarifas e impuestos"
              value={draft.notas_tarifas_impuestos}
              className="md:col-span-3"
              onChange={(v) => update("notas_tarifas_impuestos", v)}
            ></TextAreaInput>
          </div>
        </TabsContent>
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
              onChange={(e) => update("tipo_pago", e)}
              value={draft.tipo_pago || ""}
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
              className="col-span-2"
            />

            <Tabs
              value={activeTable}
              onValueChange={setActiveTable}
              className="w-full bg-white p-4 rounded-md col-span-2 flex flex-col items-center"
            >
              <TabsList
                className={`grid max-w-3xl w-full ${
                  hasPermission(PERMISOS.VERSION.PROVEEDORES_FINANZAS)
                    ? "grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                <Can permiso={PERMISOS.VERSION.PROVEEDORES_FINANZAS}>
                  <TabsTrigger value="cuentas">CUENTAS</TabsTrigger>
                </Can>
                <TabsTrigger value="datos_fiscales">DATOS FISCALES</TabsTrigger>
              </TabsList>

              <TabsContent
                value="datos_fiscales"
                className="space-y-4 p-4 w-full"
              >
                <div className="flex flex-col gap-2 justify-end items-end h-full max-w-7xl mx-auto w-full col-span-2">
                  <Can
                    permiso={
                      PERMISOS.COMPONENTES.GROUP.PROVEEDORES_EDICIONES_FINANZAS
                    }
                  >
                    <Button
                      onClick={() => {
                        handleAddNewClick();
                      }}
                      size="sm"
                      icon={Plus}
                    >
                      Crear Datos Fiscales
                    </Button>
                  </Can>
                  <Table
                    registros={datosFiscales.map(({ ...rest }) => ({
                      ...rest,
                      edit: { ...rest, id_proveedor: proveedor.id },
                    }))}
                    renderers={{
                      edit: ({ value }: { value: DatosFiscales }) => (
                        <Can
                          permiso={
                            PERMISOS.COMPONENTES.GROUP
                              .PROVEEDORES_EDICIONES_FINANZAS
                          }
                        >
                          <Button
                            icon={Pencil}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(value)}
                          >
                            Editar
                          </Button>
                        </Can>
                      ),
                    }}
                  ></Table>
                </div>
              </TabsContent>
              <TabsContent value="cuentas" className="space-y-4 p-4 w-full">
                <div className="flex flex-col gap-2 justify-end items-end h-full max-w-7xl mx-auto w-full col-span-2">
                  <Can
                    permiso={
                      PERMISOS.COMPONENTES.GROUP.PROVEEDORES_EDICIONES_FINANZAS
                    }
                  >
                    <Button
                      onClick={() => {
                        handleAddNewClickCuenta();
                      }}
                      size="sm"
                      icon={Plus}
                    >
                      Crear Cuenta
                    </Button>
                  </Can>
                  <Table
                    registros={cuentas.map(({ id_proveedor, id, ...rest }) => ({
                      alias: rest.alias,
                      ...rest,
                      edit: { ...rest, id_proveedor, id },
                    }))}
                    renderers={{
                      edit: ({ value }: { value: ProveedorCuenta }) => (
                        <Can
                          permiso={
                            PERMISOS.COMPONENTES.GROUP
                              .PROVEEDORES_EDICIONES_FINANZAS
                          }
                        >
                          <Button
                            icon={Pencil}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClickCuenta(value)}
                          >
                            Editar
                          </Button>
                        </Can>
                      ),
                    }}
                  ></Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
        <TabsContent value="extra" className="space-y-4 p-4 w-full">
          <h1 className="font-semibold text-gray-700 w-full border-b pb-2">
            Tipo de proveedor: {proveedor.type.replaceAll("_", " ")}
          </h1>
          <InformacionAdicionalProveedor
            type={proveedor.type}
            editar={editar}
            update={update}
            draft={draft}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
