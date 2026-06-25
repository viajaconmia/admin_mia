"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

type CuentaRevision = {
  id_solicitud_proveedor: string;
  proveedor: string;
  codigo_confirmacion: string;
  banco: string | null;
  cuenta: string | null;
  titular_cuenta: string | null;
  caratula: string | null;
};

export default function InformacionCuentaPage() {
  const router = useRouter();
  const [data, setData] = useState<CuentaRevision | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("cuenta_revision_pendiente");

    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Información de la cuenta
      </h1>

      {!data ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500">
          No se encontró información de la cuenta.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Datos bancarios
            </h2>

            <div className="space-y-4 text-sm">
              <Info label="Proveedor" value={data.proveedor} />
              <Info label="ID solicitud" value={data.id_solicitud_proveedor} />
              <Info label="Código confirmación" value={data.codigo_confirmacion} />
              <Info label="Banco" value={data.banco} />
              <Info label="Cuenta" value={data.cuenta} />
              <Info label="Titular" value={data.titular_cuenta} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Carátula bancaria
            </h2>

            {data.caratula ? (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-100 flex justify-center">
                  <img
                    src={data.caratula}
                    alt="Carátula bancaria"
                    className="max-h-[500px] object-contain"
                  />
                </div>

                <a
                  href={data.caratula}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Abrir carátula
                </a>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Esta cuenta no tiene carátula bancaria registrada.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}