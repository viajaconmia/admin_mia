"use client";

import { CheckboxInput } from "@/components/atom/Input";

type ComisionableData = {
  is_comisionable?: boolean | number | null;
  monto_comisionable?: number | string | null;
  porcentaje_comisionable?: number | string | null;
  comentarios_comisionables?: string | null;
};

export type ComisionableFormValue = {
  is_comisionable: 0 | 1;
  porcentaje_comisionable: number | string;
  monto_comisionable: number;
  comentarios_comisionables: string;
};

type CampoComisionable = keyof ComisionableFormValue;

type ComisionableConsultaProps = {
  modo: "consulta";

  data?: ComisionableData | null;
  fallback?: ComisionableData | null;
};

type ComisionableFormularioProps = {
  modo?: "formulario";

  value: ComisionableFormValue;

  onChange: (
    campo: CampoComisionable,
    valor: ComisionableFormValue[CampoComisionable],
  ) => void;
};

type ComisionableProps =
  | ComisionableConsultaProps
  | ComisionableFormularioProps;

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numero = Number(value);

  return Number.isFinite(numero) ? numero : null;
}

const Comisionable = (props: ComisionableProps) => {
  /* =========================================
     MODO CONSULTA
  ========================================= */

  if (props.modo === "consulta") {
    const { data, fallback } = props;

    const isComisionable =
      Number(data?.is_comisionable ?? fallback?.is_comisionable ?? 0) === 1;

    const montoComisionable = toNumberOrNull(
      data?.monto_comisionable ?? fallback?.monto_comisionable,
    );

    const porcentajeComisionable = toNumberOrNull(
      data?.porcentaje_comisionable ?? fallback?.porcentaje_comisionable,
    );

    const comentariosComisionables = String(
      data?.comentarios_comisionables ??
        fallback?.comentarios_comisionables ??
        "",
    ).trim();

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-gray-900">Comisión</p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Es comisionable
            </p>

            <div className="mt-1 text-sm font-semibold text-gray-900">
              {isComisionable ? "Sí" : "No"}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Valor comisionable
            </p>

            <div className="mt-1 text-sm font-semibold text-gray-900">
              {montoComisionable !== null
                ? formatMoney(montoComisionable)
                : porcentajeComisionable !== null
                  ? `${porcentajeComisionable}%`
                  : "—"}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Comentario
            </p>

            <div className="mt-1 text-sm font-semibold text-gray-900">
              {comentariosComisionables || "—"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================
     MODO FORMULARIO
     Sirve para creación y edición
  ========================================= */

  const { value, onChange } = props;

  const isComisionable = Number(value.is_comisionable) === 1;

  return (
    <div className="w-full rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-gray-900">Comisionable</h2>

      <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-12">
        {/* CHECK */}
        <div className="col-span-2 sm:col-span-2">
          <CheckboxInput
            label="Es comisionable?"
            checked={isComisionable}
            onChange={(checked: boolean) => {
              onChange("is_comisionable", checked ? 1 : 0);

              if (!checked) {
                onChange("porcentaje_comisionable", "");

                onChange("monto_comisionable", 0);
              }
            }}
          />
        </div>

        {/* PORCENTAJE Y MONTO */}
        {isComisionable && (
          <>
            {/* PORCENTAJE */}
            <div className="col-span-1 sm:col-span-3">
              <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                Porcentaje
              </label>

              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej. 10.00"
                  value={value.porcentaje_comisionable}
                  disabled={Number(value.monto_comisionable) > 0}
                  onChange={(e) => {
                    const nuevoValor = e.target.value;

                    // Solo números y un punto
                    if (!/^\d*\.?\d*$/.test(nuevoValor)) {
                      return;
                    }

                    // Máximo 100%
                    if (nuevoValor !== "" && Number(nuevoValor) > 100) {
                      return;
                    }

                    onChange("porcentaje_comisionable", nuevoValor);

                    onChange("monto_comisionable", 0);
                  }}
                  onBlur={() => {
                    if (
                      value.porcentaje_comisionable !== "" &&
                      Number(value.porcentaje_comisionable) <= 0
                    ) {
                      onChange("porcentaje_comisionable", "");
                    }
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                  %
                </span>
              </div>
            </div>

            {/* MONTO */}
            <div className="col-span-1 sm:col-span-3">
              <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
                Monto
              </label>

              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej. 100.00"
                  value={value.monto_comisionable || ""}
                  disabled={Number(value.porcentaje_comisionable) > 0}
                  onChange={(e) => {
                    const nuevoValor = e.target.value;

                    // Solo números y un punto
                    if (!/^\d*\.?\d*$/.test(nuevoValor)) {
                      return;
                    }
                    onChange(
                      "monto_comisionable",
                      nuevoValor === "" ? 0 : Number(nuevoValor),
                    );

                    onChange("porcentaje_comisionable", "");
                  }}
                  onBlur={() => {
                    if (Number(value.monto_comisionable) <= 0) {
                      onChange("monto_comisionable", 0);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                  $
                </span>
              </div>
            </div>
          </>
        )}

        {/* COMENTARIOS */}
        <div
          className={
            isComisionable
              ? "col-span-2 sm:col-span-4"
              : "col-span-2 sm:col-span-10"
          }
        >
          <label className="mb-1 block text-[10px] font-bold uppercase text-gray-500">
            Comentarios
          </label>

          <input
            type="text"
            placeholder="Agregar comentarios opcional"
            value={value.comentarios_comisionables}
            onChange={(e) => {
              onChange("comentarios_comisionables", e.target.value);
            }}
            className="h-10 w-full rounded-md border border-gray-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export { Comisionable };
