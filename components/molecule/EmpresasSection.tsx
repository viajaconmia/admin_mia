"use client";
import { Empresa, ExtraService } from "@/services/ExtraServices";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";

export default function EmpresasSection({
  id_agente,
  select,
  setSelect,
  showError = () => {},
  disabled = false,
  initState,
}: {
  id_agente: string;
  select: Empresa | null;
  setSelect: (empresa: Empresa) => void;
  showError?: (message: string) => void;
  disabled?: boolean;
  initState?: (e: Empresa) => boolean;
}) {
  if (!id_agente) return;
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  useEffect(() => {
    console.log("renderizando");
    fetchEmpresas(id_agente).then((empresas: Empresa[]) => {
      setEmpresas(empresas);
      if (!!initState && !select) {
        const [initialSelect] = empresas.filter(initState);
        if (initState) setSelect(initialSelect);
      }
    });
  }, [id_agente]);

  const handleClick = (e: Empresa) => {
    if (disabled) return;
    if (!e.codigo_postal_fiscal) {
      showError("La empresa no tiene codigo postal, no puede ser seleccionada");
      return;
    }
    setSelect(e);
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
      {empresas.length == 0 && <Loader />}
      {empresas.map((e: Empresa) => (
        <div
          key={e.id_empresa}
          onClick={() => handleClick(e)}
          className={`
          min-w-0 h-full flex flex-col justify-between
          p-4 rounded-lg ${disabled ? "cursor-not-allowed" : "cursor-pointer"} border transition-all duration-150
          ${
            select?.id_empresa === e.id_empresa
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
          }
        `}
        >
          {/* Header */}
          <div className="flex justify-between items-start gap-2 min-w-0">
            <p className="font-semibold text-base truncate">{e.razon_social}</p>
            <p className="text-xs text-gray-500 shrink-0">{e.rfc}</p>
          </div>

          {/* Extra info (opcional pero recomendado) */}
          <div className="mt-2 text-sm text-gray-600 space-y-1 min-w-0 flex justify-between">
            <p className="truncate">
              {e.codigo_postal_fiscal && <>CP: {e.codigo_postal_fiscal}</>}
            </p>
            <p className="truncate">
              {e.regimen_fiscal && <>Regimen: {e.regimen_fiscal}</>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const cache = new Map();

export const fetchEmpresas = async (id_agente: string): Promise<Empresa[]> => {
  if (cache.has(id_agente)) {
    return cache.get(id_agente);
  }

  const res = await ExtraService.getInstance().getEmpresas(id_agente);
  cache.set(id_agente, res.data);
  return res.data;
};
