"use client";
import Button from "@/components/atom/Button";
import {
  CheckboxInput,
  EmailInput,
  NumberInput,
  TextInput,
} from "@/components/atom/Input";
import { Loader } from "@/components/atom/Loader";
import { SectionForm } from "@/components/atom/SectionForm";
import { useNotification } from "@/context/useNotificacion";
import {
  mapProveedor,
  Proveedor,
  ProveedoresService,
} from "@/services/ProveedoresService";
import { Building, Pencil, Save, User2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

const App = () => {
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [proveedor, setProveedor] = useState(null);
  const [datosFiscales, setDatosFiscales] = useState(null);

  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const proveedorId = Array.isArray(id) ? id[0] : id;
        const service = ProveedoresService.getInstance();

        const [proveedor, datosFiscales] = await Promise.all([
          service.getProveedores({ id: proveedorId }),
          service.getDatosFiscales(proveedorId),
        ]);

        if (!proveedor.data.length) {
          throw new Error("No hay proveedor");
        }
        setProveedor(mapProveedor(proveedor.data[0]));
        setDatosFiscales(datosFiscales.data);
      } catch (err: any) {
        showNotification(
          "error",
          err?.message || "Error al obtener el proveedor"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading)
    return (
      <div className="w-full h-full bg-white rounded-md p-4 flex justify-center items-center">
        <Loader></Loader>
      </div>
    );
  return (
    <div className="w-full h-full bg-white rounded-md flex flex-col overflow-scroll">
      <ProveedorCard proveedor={proveedor} />
    </div>
  );
};

export default App;

function ProveedorCard({ proveedor }: { proveedor: Proveedor }) {
  const { draft, update, hasChanges, getChanges, editar, toggleEdit, save } =
    useProveedorEditor(proveedor);

  const onSave = () => {
    const changes = getChanges();
    ProveedoresService.getInstance().updateProveedor({
      id: proveedor.id,
      ...changes,
    });
    save();
  };

  return (
    <div>
      <div className="bg-white rounded-xl p-6 space-y-4">
        <div className="flex gap-2 w-full justify-end">
          <Button
            disabled={!hasChanges || !editar}
            onClick={onSave}
            icon={Save}
            size="sm"
          >
            Guardar cambios
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleEdit}
            icon={Pencil}
          >
            {!editar ? "Editar" : "Cancelar"}
          </Button>
        </div>
        <SectionForm legend={draft.proveedor || ""} icon={User2}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <TextInput
              label="Nombre"
              value={draft.proveedor || ""}
              onChange={(e) => update("proveedor", e)}
              disabled={!editar}
            />

            <TextInput
              value={draft.nombre_contacto ?? ""}
              onChange={(e) => update("nombre_contacto", e || null)}
              label="Contacto"
              disabled={!editar}
            />

            <TextInput
              value={draft.sitio_web ?? ""}
              onChange={(e) => update("sitio_web", e || null)}
              label="Sitio web"
              disabled={!editar}
            />

            <TextInput
              value={draft.cobertura ?? ""}
              onChange={(e) => update("cobertura", e || null)}
              label="Cobertura"
              disabled={!editar}
            />

            <TextInput
              value={draft.pais ?? ""}
              onChange={(e) => update("pais", e || null)}
              label="Pais"
              disabled={!editar}
            />

            <NumberInput
              value={Number(draft.telefono) || null}
              onChange={(e) => update("telefono", e || null)}
              label="Telefono"
              disabled={!editar}
            />

            <EmailInput
              label="Email"
              value={draft.email ?? ""}
              onChange={(e) => update("email", e || null)}
              disabled={!editar}
            />
          </div>
        </SectionForm>
        <SectionForm legend={"Caracteristicas"} icon={Building}>
          <div className="flex flex-wrap justify-between gap-3 gap-x-10">
            <CheckboxInput
              label={"Bilingüe"}
              checked={draft.bilingue}
              onChange={(v) => update("bilingue", v)}
              disabled={!editar}
            />
            <CheckboxInput
              label={"Extranjero"}
              checked={draft.extranjero}
              onChange={(v) => update("extranjero", v)}
              disabled={!editar}
            />
            <CheckboxInput
              label={"Acepta a credito"}
              checked={draft.credito}
              onChange={(v) => update("credito", v)}
              disabled={!editar}
            />
          </div>
        </SectionForm>
      </div>
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
        changes[key] = state.draft[key] as Partial<Proveedor>;
      }
    });

    return changes;
  };

  const toggleEdit = () => {
    dispatch({ type: "TOGGLE_EDIT" });
  };

  return {
    editar: state.editar,
    toggleEdit,
    draft: state.draft,
    hasChanges: state.hasChanges,
    update,
    save: onSave,
    reset: () => dispatch({ type: "RESET" }),
    getChanges,
  };
}
