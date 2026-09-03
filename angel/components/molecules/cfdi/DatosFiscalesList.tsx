"use client";

import { EmpresaDatosFiscales } from "@/angel/lib/cfdi/payload";

type Props = {
  loading: boolean;
  fiscalDataList: EmpresaDatosFiscales[];
  selected: EmpresaDatosFiscales | null;
  onSelect: (data: EmpresaDatosFiscales) => void;
};

export function DatosFiscalesList({ loading, fiscalDataList, selected, onSelect }: Props) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
        <p className="mt-2 text-sm text-gray-500">Cargando datos fiscales...</p>
      </div>
    );
  }

  if (fiscalDataList.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-700">No se encontraron datos fiscales registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fiscalDataList.map((data) => (
        <div
          key={`${data.id_datos_fiscales}-${data.id_empresa}`}
          className={`border rounded-md p-4 cursor-pointer ${
            selected?.id_datos_fiscales === data.id_datos_fiscales
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
          onClick={() => onSelect(data)}
        >
          <div className="flex justify-between">
            <h5 className="font-medium text-gray-900">{data.razon_social_df}</h5>
            <span className="text-sm text-gray-500">RFC: {data.rfc}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Régimen Fiscal: {data.regimen_fiscal}</p>
          <p className="text-sm text-gray-600 mt-1">
            {data.codigo_postal_fiscal}, {data.estado}, {data.municipio}, {data.colonia}, {data.calle}
          </p>
        </div>
      ))}
    </div>
  );
}
