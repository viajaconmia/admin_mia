"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import {
  fetchHistorialCuentaProveedor,
  aprobarRevisionCuentaProveedor,
} from "@/services/pago_proveedor";

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
  const [showCuentaModal, setShowCuentaModal] = useState(false);
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

    const confirmar = confirm("¿Seguro que deseas aprobar los cambios?");

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

      alert("Cambios aprovados correctamente.");
      router.back();
    } catch (error: any) {
      alert(error?.message || "Error al aprobar cuenta.");
    } finally {
      setAprobandoCuenta(false);
    }
  };

  return (
    <div ref={topRef} className="p-4 sm:p-6 bg-slate-50 min-h-screen">
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
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Proveedor
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  {data.proveedor || "—"}
                </h2>

                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-500">
                  <span>
                    Solicitud:{" "}
                    <strong className="text-slate-700">
                      {data.id_solicitud_proveedor}
                    </strong>
                  </span>
                  <span>
                    Confirmación:{" "}
                    <strong className="text-slate-700">
                      {data.codigo_confirmacion || "—"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCuentaModal(true)}
                  className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
                >
                  Ver cuenta
                </button>

                <button
                  type="button"
                  onClick={handleAprobarCuenta}
                  disabled={aprobandoCuenta || cuentaAprobada}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    cuentaAprobada
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {cuentaAprobada
                    ? "Cambios aprobados aprobada"
                    : aprobandoCuenta
                      ? "Aprobando..."
                      : "Aprobar cambios"}
                </button>

                <button
                  type="button"
                  disabled={!data.caratula}
                  onClick={() => {
                    if (data.caratula) {
                      window.open(
                        data.caratula,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ver carátula
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
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
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">
                        Acción
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">
                        Valor viejo
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">
                        Valor nuevo
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">
                        Quién
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">
                        Fecha
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {historial.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-slate-800">
                            {tituloHistorial(item)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatearAccion(item)}
                          </p>
                        </td>

                        <td className="px-3 py-3 align-top text-slate-700 break-all">
                          {valorHistorial(item, "anterior")}
                        </td>

                        <td className="px-3 py-3 align-top text-slate-700 break-all">
                          {valorHistorial(item, "nuevo")}
                        </td>

                        <td className="px-3 py-3 align-top text-slate-700">
                          {item.nombre_usuario || "Usuario no registrado"}
                        </td>

                        <td className="px-3 py-3 align-top text-slate-500 whitespace-nowrap">
                          {formatearFecha(item.fecha)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showCuentaModal && (
            <CuentaModal
              data={data}
              onClose={() => setShowCuentaModal(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}
function CuentaModal({
  data,
  onClose,
}: {
  data: CuentaRevision;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Datos de la cuenta
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <Info label="Proveedor" value={data.proveedor} />
          <Info label="ID solicitud" value={data.id_solicitud_proveedor} />
          <Info label="Código confirmación" value={data.codigo_confirmacion} />
          <Info label="Banco" value={data.banco} />
          <Info label="Cuenta" value={data.cuenta} />
          <Info label="Titular" value={data.titular_cuenta} />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
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
function tituloHistorial(item: HistorialCuenta) {
  if (esAprobacionCuenta(item)) {
    return "Cuenta aprobada";
  }

  return formatearCampo(item.campo);
}

function valorHistorial(item: HistorialCuenta, tipo: "anterior" | "nuevo") {
  if (esAprobacionCuenta(item)) {
    return tipo === "anterior" ? "Pendiente de revisión" : "Cuenta aprobada";
  }

  const value = tipo === "anterior" ? item.valor_anterior : item.valor_nuevo;

  if (!value) return "—";

  if (item.campo === "url_caratula" && String(value).startsWith("http")) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold"
      >
        Ver carátula
      </a>
    );
  }

  return formatearValor(value);
}
function esAprobacionCuenta(item: HistorialCuenta) {
  return (
    item.accion === "APROBAR_CUENTA" ||
    (item.campo === "revision_pendiente" &&
      String(item.valor_anterior) === "1" &&
      String(item.valor_nuevo) === "0")
  );
}
