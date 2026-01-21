import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import {
  CheckboxInput,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";
import {
  Proveedor,
  ProveedoresService,
  ProveedorVuelo,
} from "@/services/ProveedoresService";
import { ArrowBigUpDash, CircleCheck, Pencil, Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useSearch } from "wouter";

type InfoAdicionalProps = Pick<Proveedor, "type"> & {
  editar: boolean;
  update: (field: keyof Proveedor, value: any) => void;
  draft: Proveedor;
};

export const InformacionAdicionalProveedor = ({
  type,
  editar,
  draft,
  update,
}: InfoAdicionalProps) => {
  if (type == "renta_carro")
    return (
      <div className="flex flex-col gap-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <CheckboxInput
              disabled={!editar}
              label={"Servicio sin chofer"}
              checked={draft.auto?.is_sin_chofer || false}
              onChange={(checked: boolean) => {
                update("auto", { ...draft.auto, is_sin_chofer: checked });
              }}
            ></CheckboxInput>
            <TextAreaInput
              disabled={!editar}
              label={"Comentarios"}
              value={draft.auto?.notas_sin_chofer || ""}
              onChange={function (value: string): void {
                update("auto", { ...draft.auto, notas_sin_chofer: value });
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <CheckboxInput
              disabled={!editar}
              label={"Servicio con chofer"}
              checked={draft.auto?.is_con_chofer || false}
              onChange={function (checked: boolean): void {
                update("auto", {
                  ...draft.auto,
                  is_con_chofer: checked,
                  is_chofer_bilingue: !checked
                    ? false
                    : !!draft.auto?.is_chofer_bilingue,
                });
              }}
            ></CheckboxInput>
            <TextAreaInput
              disabled={!editar}
              label={"Comentarios"}
              value={draft.auto?.notas_con_chofer || ""}
              onChange={function (value: string): void {
                update("auto", { ...draft.auto, notas_con_chofer: value });
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <CheckboxInput
              disabled={!editar || !draft.auto?.is_con_chofer}
              label={"Servicio con chofer bilingüe"}
              checked={draft.auto?.is_chofer_bilingue || false}
              onChange={function (checked: boolean): void {
                update("auto", { ...draft.auto, is_chofer_bilingue: checked });
              }}
            ></CheckboxInput>
            <TextAreaInput
              label={"Comentarios"}
              disabled={!editar}
              value={draft.auto?.notas_chofer_bilingue || ""}
              onChange={function (value: string): void {
                update("auto", { ...draft.auto, notas_chofer_bilingue: value });
              }}
            />
          </div>
        </div>
        <TextAreaInput
          label={"Que hacer ante una incidencia"}
          disabled={!editar}
          value={draft.auto?.incidencia || ""}
          onChange={function (value: string): void {
            update("auto", { ...draft.auto, incidencia: value });
          }}
        />
        <TextAreaInput
          label="Notas generales"
          disabled={!editar}
          value={draft.auto?.notas_generales || ""}
          onChange={function (value: string): void {
            update("auto", { ...draft.auto, notas_generales: value });
          }}
        />
      </div>
    );

  /**
   *
   * TODO:
   * - Angel, aqui vas a realizar lo mismo como si fuera un modal, ni modo, va a ser actualizar vuelos, cuando den guarda y cierras el show form, es sencillo porque ya esta el este que sirve para eso,
   * flujo
   * 1.- si se aprieta el selectedRow vas a editar y guardas el id, si existe id en el row entonces lo editas, lo mandas y se edita
   * 2.- si no hay id entonces creas uno
   * 3.- al final en el endpoint si o si deberas hacer una peticion por el proveedor id, por eso no hay problema porque creo que lo recibes, entonces facilito y limpio como te mama
   *
   *
   *
   *
   */

  if (type == "hotel")
    return (
      <div>
        <TextAreaInput
          value={draft.hotel?.mascotas || ""}
          label="Mascotas"
          disabled={true}
          onChange={
            (value: string) => console.log(value)
            // update("hotel", { ...draft.hotel, mascotas: value })
          }
        />
        <TextAreaInput
          disabled={true}
          value={draft.hotel?.salones || ""}
          label="Salones"
          onChange={
            (value: string) => console.log(value)
            // update("hotel", { ...draft.hotel, salones: value })
          }
        />
        <TextAreaInput
          disabled={true}
          value={draft.hotel?.transportacion || ""}
          label="Transportación"
          onChange={
            (value: string) => console.log(value)
            // update("hotel", { ...draft.hotel, transportacion: value })
          }
        />
        <TextAreaInput
          disabled={true}
          value={draft.hotel?.comentarios || ""}
          label="Notas generales"
          onChange={
            (value: string) => console.log(value)
            // update("hotel", { ...draft.hotel, Comentarios: value })
          }
        />
      </div>
    );

  const [showForm, setShowForm] = useState(false);
  const [selectedRow, setSelecetRow] = useState<ProveedorVuelo | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(draft);
    const servicio = ProveedoresService.getInstance();
    if (selectedRow.id) {
      const response = await servicio.updateProveedorVuelo(selectedRow);
      update("vuelo", response.data);
    } else {
      const response = await servicio.createProveedorVuelo({
        ...selectedRow,
        id_proveedor: draft.id,
      });
      update("vuelo", response.data);
    }
    setSelecetRow(null);
    setShowForm(false);
    console.log(selectedRow);
  };

  const handleEdit = (field: keyof ProveedorVuelo, value: any) => {
    setSelecetRow((prev) => ({ ...prev, [field]: value }));
  };

  const renders = {
    editar: ({ value }) => (
      <div className="w-full flex justify-center">
        <Button icon={Pencil} size="sm" onClick={() => setSelecetRow(value)} />
      </div>
    ),
  };

  if (type == "vuelo")
    return (
      <div className="flex flex-col gap-2">
        {(showForm || selectedRow) && (
          <div>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-3 gap-4 border border-t-0 p-4 rounded-b-md shadow-lg mb-4 bg-gradient-to-b from-white to-gray-50"
            >
              <TextAreaInput
                label="Tarifa"
                value={selectedRow?.tarifa || ""}
                onChange={(v) => {
                  handleEdit("tarifa", v);
                }}
              />
              <TextAreaInput
                label="Articulo personal"
                value={selectedRow?.articulo_personal || ""}
                onChange={(v) => {
                  handleEdit("articulo_personal", v);
                }}
              />
              <TextAreaInput
                label="Equipaje de mano / carry on"
                value={selectedRow?.equipaje_mano_o_carry_on}
                onChange={(v) => {
                  handleEdit("equipaje_mano_o_carry_on", v);
                }}
              />
              <TextAreaInput
                label="Equipaje documentado"
                value={selectedRow?.equipaje_documentado}
                onChange={(v) => {
                  handleEdit("equipaje_documentado", v);
                }}
              />
              <TextAreaInput
                label="Servicios adicionales"
                value={selectedRow?.servicios_adicionales}
                onChange={(v) => {
                  handleEdit("servicios_adicionales", v);
                }}
              />
              <div className="flex flex-col gap-2 justify-end">
                <Button size="sm" type="submit" icon={CircleCheck}>
                  Confirmar cambios
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  type="button"
                  icon={ArrowBigUpDash}
                  onClick={() => {
                    setShowForm(false);
                    setSelecetRow(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <Table
          renderers={renders}
          registros={draft.vuelo.map(
            ({ id, id_proveedor, created_at, updated_at, ...rest }) => ({
              ...rest,
              editar: { id, id_proveedor, ...rest },
              // articulo_personal: { id: rest.id, data: rest.articulo_personal },
            })
          )}
        />
        <div className="w-full flex justify-end">
          <Button
            icon={Plus}
            size="sm"
            onClick={() => {
              setShowForm(true);
              setSelecetRow({
                id: null,
                id_proveedor: null,
                articulo_personal: "",
                equipaje_mano_o_carry_on: "",
                servicios_adicionales: "",
                equipaje_documentado: "",
                tarifa: "",
              });
            }}
          >
            Agregar tarifa
          </Button>
        </div>
      </div>
    );

  return <h1>Ocurrio un error, no encontramos el tipo de proveedor</h1>;
};
