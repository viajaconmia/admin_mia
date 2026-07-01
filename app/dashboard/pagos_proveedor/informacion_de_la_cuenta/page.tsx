"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { fetchHistorialCuentaProveedor, aprobarRevisionCuentaProveedor } from "@/services/pago_proveedor";

type CuentaRevision = {
  id_solicitud_proveedor: string;
  id_proveedor_cuenta: number | null;
  proveedor: string;
  codigo_confirmacion: string;
  banco: string | null;
  cuenta: string | null;
  titular_cuenta: string | null;
  caratula: string | null;
};

type HistorialCuenta = {
  id: number;
  id_proveedor_cuenta: number;
  numero_cambio: number | null;
  campo: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  accion: string;
  id_usuario: string | null;
  nombre_usuario: string | null;
  fecha: string;
};

export default function InformacionCuentaPage() {
  const router = useRouter();
  const [data, setData] = useState<CuentaRevision | null>(null);
  const [historial, setHistorial] = useState<HistorialCuenta[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [aprobandoCuenta, setAprobandoCuenta] = useState(false);
  const [cuentaAprobada, setCuentaAprobada] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const subirArriba = () => {
      topRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    requestAnimationFrame(subirArriba);

    const timer1 = setTimeout(subirArriba, 100);
    const timer2 = setTimeout(subirArriba, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  useEffect(() => {
    const stored = sessionStorage.getItem("cuenta_revision_pendiente");

    if (!stored) return;

    const parsed = JSON.parse(stored) as CuentaRevision;
    setData(parsed);

    if (!parsed.id_proveedor_cuenta) return;

    const cargarHistorial = async () => {
      setLoadingHistorial(true);
      setErrorHistorial(null);

      try {
        const result = await fetchHistorialCuentaProveedor(
          parsed.id_proveedor_cuenta,
        );

        setHistorial(result);
      } catch (error: any) {
        setErrorHistorial(
          error?.message || "Error al cargar historial de cambios",
        );
      } finally {
        setLoadingHistorial(false);
      }
    };

    cargarHistorial();
  }, []);
  
  const handleAprobarCuenta = async () => {
    if (!data?.id_proveedor_cuenta) {
      alert("No se encontró el id de la cuenta del proveedor.");
      return;
    }

    const confirmar = confirm(
      "¿Seguro que deseas aprobar esta cuenta?",
    );

    if (!confirmar) return;

    try {
      setAprobandoCuenta(true);

      await aprobarRevisionCuentaProveedor(data.id_proveedor_cuenta);

      setCuentaAprobada(true);

      const nuevoHistorial = await fetchHistorialCuentaProveedor(
        data.id_proveedor_cuenta,
      );

      setHistorial(nuevoHistorial);

      const stored = sessionStorage.getItem("cuenta_revision_pendiente");

      if (stored) {
        const parsed = JSON.parse(stored);
        sessionStorage.setItem(
          "cuenta_revision_pendiente",
          JSON.stringify({
            ...parsed,
            revision_pendiente: 0,
          }),
        );
      }

      alert("Cuenta aprobada correctamente.");
      router.back();
    } catch (error: any) {
      alert(error?.message || "Error al aprobar cuenta.");
    } finally {
      setAprobandoCuenta(false);
    }
  };

  return (
    <div ref={topRef} className="p-6 bg-slate-50 min-h-screen">
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
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleAprobarCuenta}
              disabled={aprobandoCuenta || cuentaAprobada}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                cuentaAprobada
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {cuentaAprobada
                ? "Cuenta aprobada"
                : aprobandoCuenta
                  ? "Aprobando..."
                  : "Aprobar cuenta"}
            </button>
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Últimas modificaciones
            </h2>

            {loadingHistorial ? (
              <p className="text-sm text-slate-400">Cargando historial...</p>
            ) : errorHistorial ? (
              <p className="text-sm text-red-500">{errorHistorial}</p>
            ) : historial.length === 0 ? (
              <p className="text-sm text-slate-400">
                No hay modificaciones registradas para esta cuenta.
              </p>
            ) : (
              <div className="space-y-3">
                {historial.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {esAprobacionCuenta(item) ? "Cuenta aprobada" : formatearCampo(item.campo)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Acción: {esAprobacionCuenta(item) ? "cambios aprobados" : formatearAccion(item)}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500">
                        {formatearFecha(item.fecha)}
                      </p>
                    </div>

                    {esAprobacionCuenta(item) ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 text-xs">
                        <p className="text-green-700 font-medium">
                          Los cambios de la cuenta fueron revisados y aprobados.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white border border-slate-200 rounded-md p-3">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
                            Valor anterior
                          </p>
                          <p className="text-slate-700 break-all">
                            {formatearValor(item.valor_anterior)}
                          </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-md p-3">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
                            Valor nuevo
                          </p>
                          <p className="text-slate-700 break-all">
                            {formatearValor(item.valor_nuevo)}
                          </p>
                        </div>
                      </div>
                    )}
                    

                    <div className="mt-3 text-xs text-slate-500">
                      Modificado por:{" "}
                      <span className="font-medium text-slate-700">
                        {item.nombre_usuario || "Usuario no registrado"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
function formatearCampo(campo: string) {
  const map: Record<string, string> = {
    banco: "Banco",
    cuenta: "Cuenta",
    titular: "Titular",
    url_caratula: "Carátula bancaria",
    active: "Estatus de cuenta",
    revision_pendiente: "Revisión pendiente",
  };

  return map[campo] || campo;
}

function formatearValor(value?: string | null) {
  if (value === null || value === undefined || value === "") return "—";

  if (String(value).startsWith("http")) {
    return "Archivo / URL registrada";
  }

  return value;
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "—";

  return new Date(fecha).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function formatearAccion(item: HistorialCuenta) {
  if (item.accion === "APROBAR_CUENTA") {
    return "Aprobación de cuenta";
  }

  if (
    item.campo === "revision_pendiente" &&
    String(item.valor_anterior) === "1" &&
    String(item.valor_nuevo) === "0"
  ) {
    return "Aprobación de cuenta";
  }

  if (item.accion === "UPDATE") return "Actualización";
  if (item.accion === "INSERT") return "Creación";

  return item.accion || "—";
}
function esAprobacionCuenta(item: HistorialCuenta) {
  return (
    item.accion === "APROBAR_CUENTA" ||
    (
      item.campo === "revision_pendiente" &&
      String(item.valor_anterior) === "1" &&
      String(item.valor_nuevo) === "0"
    )
  );
}