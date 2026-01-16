import { Table } from "@/component/molecule/Table";
import Button from "@/components/atom/Button";
import {
  CheckboxInput,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";
import { Proveedor, ProveedorVuelo } from "@/services/ProveedoresService";
import { ArrowBigUpDash, Plus } from "lucide-react";
import { useState } from "react";
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

  const [showForm, setShowForm] = useState(false);
  const [selectedRow, setSelecetRow] = useState<ProveedorVuelo | null>(null);
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
  if (type == "vuelo")
    return (
      <div className="flex flex-col gap-2">
        {showForm && (
          <div className="grid grid-cols-3 gap-4 border border-t-0 p-4 rounded-b-md shadow-lg mb-4 bg-gradient-to-b from-white to-gray-50">
            <TextAreaInput
              label="Tarifa"
              value={selectedRow?.tarifa || ""}
              onChange={(v) => {}}
            />
            <TextAreaInput
              label="Articulo personal"
              value={""}
              onChange={(v) => {}}
            />
            <TextAreaInput
              label="Equipaje de mano / carry on"
              value={""}
              onChange={(v) => {}}
            />
            <TextAreaInput
              label="Equipaje documentado"
              value={""}
              onChange={(v) => {}}
            />
            <TextAreaInput
              label="Servicios adicionales"
              value={""}
              onChange={(v) => {}}
            />
            <div className="flex justify-end items-end">
              <Button
                variant="warning"
                size="sm"
                icon={ArrowBigUpDash}
                onClick={() => {
                  setShowForm(false);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}

        <Table
          // renderers={renders}
          registros={draft.vuelo.map(({ id_proveedor, ...rest }) => ({
            ...rest,
            // articulo_personal: { id: rest.id, data: rest.articulo_personal },
          }))}
        ></Table>
        <div className="w-full flex justify-end">
          <Button
            icon={Plus}
            size="sm"
            onClick={() => {
              setShowForm(true);
            }}
          >
            Agregar tarifa
          </Button>
        </div>
      </div>
    );

  return <h1>Ocurrio un error, no encontramos el tipo de proveedor</h1>;
};
