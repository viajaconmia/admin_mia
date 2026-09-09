"use client";

import React, { useEffect, useState } from "react";

export type TarjetaDetalle = {
  id: string;
  alias: string | null;
  ultimos_4: string | null;
  numero_completo: string | null;
  banco_emisor: string | null;
  tipo_tarjeta: string | null;
  fecha_vencimiento: string | null;
  activa: boolean | number;
  cvv: string | null;
  nombre_titular?: string | null;
};

const SEGUNDOS_VISIBLE = 30;

const toBool = (v: any) => v === true || v === 1 || v === "1" || v === "true";

const soloDigitos = (v: string | null) => String(v ?? "").replace(/\D/g, "");

const agruparDigitos = (num: string | null) => {
  const digits = soloDigitos(num);
  if (!digits) return "—";
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const terminacion = (t: TarjetaDetalle) => {
  const l4 =
    (t.ultimos_4 && String(t.ultimos_4).slice(-4)) ||
    soloDigitos(t.numero_completo).slice(-4);
  return l4 ? `**** **** **** ${l4}` : "—";
};

function Dato({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span
        className={`text-sm text-gray-900 ${mono ? "font-mono" : "font-medium"}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

export function DetalleTarjetaModal({
  tarjeta,
  onClose,
  puedeVerSensible,
}: {
  tarjeta: TarjetaDetalle | null;
  onClose: () => void;
  puedeVerSensible: boolean;
}) {
  const [revelado, setRevelado] = useState(false);
  const [restante, setRestante] = useState(SEGUNDOS_VISIBLE);
  const [copiado, setCopiado] = useState<string | null>(null);

  // Si cambiamos de tarjeta (o se cierra), volvemos a ocultar los datos
  useEffect(() => {
    setRevelado(false);
    setRestante(SEGUNDOS_VISIBLE);
    setCopiado(null);
  }, [tarjeta?.id]);

  // Auto-ocultar: los datos sensibles solo permanecen visibles unos segundos
  useEffect(() => {
    if (!revelado) return;

    const finaliza = Date.now() + SEGUNDOS_VISIBLE * 1000;
    setRestante(SEGUNDOS_VISIBLE);

    const intervalo = setInterval(() => {
      const seg = Math.ceil((finaliza - Date.now()) / 1000);
      if (seg <= 0) {
        setRevelado(false);
        setRestante(SEGUNDOS_VISIBLE);
      } else {
        setRestante(seg);
      }
    }, 500);

    return () => clearInterval(intervalo);
  }, [revelado]);

  if (!tarjeta) return null;

  const copiar = async (texto: string, campo: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(campo);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      // El portapapeles no está disponible (http o permiso denegado)
    }
  };

  const activa = toBool(tarjeta.activa);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[85vh] overflow-auto">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">
            Detalles de la tarjeta
          </h3>

          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Dato label="Alias" value={tarjeta.alias || "—"} />
            <Dato label="Terminación" value={terminacion(tarjeta)} mono />
            <Dato
              label="Fecha de vencimiento"
              value={tarjeta.fecha_vencimiento || "—"}
              mono
            />
            <Dato
              label="Estado"
              value={
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded border ${
                    activa
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-gray-50 text-gray-600 border-gray-300"
                  }`}
                >
                  {activa ? "Activa" : "Inactiva"}
                </span>
              }
            />
          </div>

          {puedeVerSensible ? (
            <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
              {!revelado ? (
                <>
                  <p className="text-xs text-gray-600">
                    El número completo y el CVV se ocultan automáticamente
                    después de {SEGUNDOS_VISIBLE} segundos.
                  </p>

                  <button
                    type="button"
                    onClick={() => setRevelado(true)}
                    className="w-full text-sm px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Mostrar número completo y CVV
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Se ocultan en {restante}s
                    </span>

                    <button
                      type="button"
                      onClick={() => setRevelado(false)}
                      className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100"
                    >
                      Ocultar ahora
                    </button>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <Dato
                      label="Número completo"
                      value={agruparDigitos(tarjeta.numero_completo)}
                      mono
                    />

                    {tarjeta.numero_completo ? (
                      <button
                        type="button"
                        onClick={() =>
                          copiar(soloDigitos(tarjeta.numero_completo), "numero")
                        }
                        className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100 shrink-0"
                      >
                        {copiado === "numero" ? "Copiado" : "Copiar"}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <Dato label="CVV" value={tarjeta.cvv || "—"} mono />

                    {tarjeta.cvv ? (
                      <button
                        type="button"
                        onClick={() => copiar(String(tarjeta.cvv), "cvv")}
                        className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100 shrink-0"
                      >
                        {copiado === "cvv" ? "Copiado" : "Copiar"}
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 border rounded-lg p-3 bg-gray-50">
              No tienes permiso para ver el número completo ni el CVV de esta
              tarjeta.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
