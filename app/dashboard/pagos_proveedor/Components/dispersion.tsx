import React, { useState, useEffect, useRef } from "react";
import { Send, X, Info } from "lucide-react";
import { URL as API_URL, API_KEY } from "@/lib/constants/index";
import { es } from "date-fns/locale";

export type SolicitudProveedorRaw = {
  id_solicitud: string;
  id_pago?: string | null;
  hotel?: string | null;
  codigo_reservacion_hotel?: string | null;
  costo_total?: string | null;
  check_out?: string | null;
  codigo_dispersion?: string | null;
  razon_social?: string | null;
  rfc?: string | null;
  solicitud_proveedor?: {
    id_solicitud_proveedor: number | string;
    fecha_solicitud?: string | null;
    monto_solicitado?: string | null;
  } | null;
  // Campos adicionales para CSV (antes XML)
  tipo_operacion?: string | null;
  cuenta_cargo?: string | null;
  clave_proveedor?: string | null;
  tipo_cuenta?: string | null;
  moneda?: string | null;
  texto_libre?: string | null;
  cuenta_de_deposito?: string | null;

};

type DispersionModalProps = {
  solicitudesSeleccionadas: SolicitudProveedorRaw[];
  onClose: () => void;
  onSubmit: (payload: {
    id_dispersion: string;
    referencia_numerica: string;
    motivo_pago: string;
    solicitudes: Array<{
      id_solicitud: string;
      id_solicitud_proveedor: number | string | null;
      id_pago?: string | null;
      costo_proveedor: number;
      codigo_hotel: string | null;
      fecha_pago: string | null;
      saldo: String | null;
    }>;
  }) => Promise<void> | void;
};

export const DispersionModal: React.FC<DispersionModalProps> = ({
  solicitudesSeleccionadas,
  onClose,
  onSubmit,
}) => {
  const [idDispersion, setIdDispersion] = useState("");
  const [referenciaNumerica, setReferenciaNumerica] = useState("");
  const [motivoPago, setMotivoPago] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const cleanInput = (input: string | undefined): string => {
    return (input ?? "")
      .replace(/\s/g, ''); // Elimina todos los espacios
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateForCSV = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper para escapar valores en CSV
  const escapeCsv = (value: string | number | null | undefined): string => {
    const str = value ?? "";
    const s = String(str);
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };


const generateDispersionId = () => {
  let n;

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    n = arr[0];
  } else {
    n = Math.floor(Math.random() * 0xffffffff);
  }

  // "D" + 6 chars base36
  return "D" + (n % (36 ** 8)).toString(36).padStart(6, "0").toUpperCase();
};

  // Esta función solo genera y descarga el CSV
const generarCSV = (idPago, dispersionId: string) => {
    if (solicitudesSeleccionadas.length === 0) {
      setFormError("No hay solicitudes seleccionadas para generar el archivo.");
      return null;
    }

    console.log(idPago, "🐨🐨🐨🐨🐨🐨🐨🐨")
    // Asegúrate de que idPago esté disponible
    if (!idPago || idPago.length === 0) {
      setFormError("No se ha recibido idPago del backend.");
      return null;
    }

    // Encabezado (si el banco NO lo quiere, puedes quitarlo)
    const header = [
      "Id_Solicitud",
      "Codigo_Dispersion",
      "TIPO_OPERACION",
      "FECHA_PAGO",
      "CUENTA_CARGO",
      "CLAVE_PROVEEDOR",
      "TIPO_CUENTA",
      "MONEDA",
      "IMPORTE",
      "MOTIVO_PAGO",
      "REFERENCIA_NUMERICA",
      "TEXTO_LIBRE",
    ]
      .map(escapeCsv)
      .join(",");

    const csvLines = solicitudesSeleccionadas.map((solicitud, idx) => {
      const tipoOperacion = solicitud.tipo_operacion || "SPEI";
      const fechaPago = formatDateForCSV(
        solicitud.solicitud_proveedor?.fecha_solicitud || ""
      );

      const id_pago = idPago[idx]; // Usamos idPago por índice
      const cuentaCargo = solicitud.cuenta_cargo;
      const claveProveedor =
        solicitud.clave_proveedor;
      const tipoCuenta = solicitud.cuenta_de_deposito || "Cta Clabe";
      const moneda = solicitud.moneda || "Pesos";
      const importe = parseFloat(
        solicitud.solicitud_proveedor?.monto_solicitado || "0"
      ).toFixed(2);
      const textoLibre =
        solicitud.texto_libre || solicitud.razon_social || solicitud.hotel || "";
      const referencia = referenciaNumerica + " "+`wx${dispersionId}${id_pago}xw`
      console.log("fefef",referencia)
      return [
        escapeCsv(id_pago),
        escapeCsv(dispersionId),
        escapeCsv(tipoOperacion),
        escapeCsv(fechaPago),
        escapeCsv(cuentaCargo),
        escapeCsv(claveProveedor),
        escapeCsv(tipoCuenta),
        escapeCsv(moneda),
        escapeCsv(importe),
        escapeCsv(motivoPago || "Pago servicios"),
        escapeCsv(referencia || `REF${solicitud.id_solicitud}`),
        escapeCsv(textoLibre),
      ].join(",");
    });

    const csvContent = [header, ...csvLines].join("\n");
const cleanedIdDispersion = cleanInput(dispersionId);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispersion_${cleanedIdDispersion || "sin_id"}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();  
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return csvContent;
  };

  const initRef = useRef(false);

useEffect(() => {
  if (initRef.current) return;
  initRef.current = true;

  const autoId = generateDispersionId();
  setIdDispersion(autoId);
}, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    

    const cleanedIdDispersion = cleanInput(idDispersion) || generateDispersionId();
    console.log(cleanedIdDispersion, "dispersion");
    const cleanedReferenciaNumerica = cleanInput(referenciaNumerica);
    const cleanedMotivoPago = cleanInput(motivoPago);

    if (!cleanedIdDispersion) {
      setFormError("El ID de dispersión es obligatorio.");
      return;
    }

    if (solicitudesSeleccionadas.length === 0) {
      setFormError("No hay solicitudes seleccionadas para dispersar.");
      return;
    }

    console.log("seleccionadas", solicitudesSeleccionadas)
    // Armar payload
    const payload = {
      id_dispersion: cleanedIdDispersion,
      referencia_numerica: referenciaNumerica,
      motivo_pago: motivoPago,
      layoutUrl: "example-url-to-layout-file.txt",
      solicitudes: solicitudesSeleccionadas.map((s) => {
        return {
          id_solicitud: s.id_solicitud,
          id_solicitud_proveedor:
            s.solicitud_proveedor?.id_solicitud_proveedor ?? null,
          id_pago: s.id_pago ?? null,
          costo_proveedor: parseFloat(
            s.solicitud_proveedor?.saldo || "0"
          ),
          codigo_hotel: s.codigo_reservacion_hotel ?? null,
          fecha_pago:
            s.solicitud_proveedor?.fecha_solicitud ?? s.check_out ?? null,
        };
      }),
    };

    try {
      setIsSubmitting(true);

      // Llamada al backend
      const response = await fetch(`${API_URL}/mia/pago_proveedor/dispersion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json(); // Recibe la respuesta en formato JSON

      if (response.ok) {
        // Si la respuesta es exitosa, actualizamos el estado de idPago
        console.log("Respuesta del backend:", data);
        // Generar el CSV después de que se haya recibido la respuesta
        generarCSV(data.data.id_pagos, cleanedIdDispersion);

        setIsSubmitting(false);

      } else {
        // Si no es exitosa, maneja el error
        console.error("Error al guardar la dispersión:", data.message);
        setIsSubmitting(false);
        setFormError(
          "Ocurrió un error al guardar la dispersión. Intenta nuevamente."
        );
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setIsSubmitting(false);
      setFormError(
        "Ocurrió un error al guardar la dispersión. Intenta nuevamente."
      );
    }
    onClose();
  };

  return (
    <div className="h-fit w-[95vw] max-w-xl relative bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Banner de info / error */}
        <div className="sticky top-0 z-10">
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">
                Crear dispersión
              </h3>
              <p className="text-xs text-blue-700">
                Asigna un{" "}
                <span className="font-semibold">ID de dispersión</span> que se
                aplicará a todos los pagos seleccionados.
              </p>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex gap-3 items-start">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  ¡Ocurrió un error!
                </h3>
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Form and layout */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="border border-slate-200 rounded-xl bg-slate-50 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Solicitudes seleccionadas
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {solicitudesSeleccionadas.length} elemento
                {solicitudesSeleccionadas.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {solicitudesSeleccionadas.map((s, idx) => {
                const costoProveedor =
                  s.costo_total ??
                  s.solicitud_proveedor?.monto_solicitado ??
                  "0.00";
                const fechaPago =
                  s.solicitud_proveedor?.fecha_solicitud ?? s.check_out;
                return (
                  <div
                    key={`${s.id_solicitud}-${idx}`}
                    className="border border-slate-200 bg-white rounded-lg px-3 py-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800">
                          {s.hotel ?? "Hotel sin nombre"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Código hotel:{" "}
                          <span className="font-mono">
                            {s.codigo_reservacion_hotel ?? "-"}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          RFC:{" "}
                          <span className="font-mono">{s.rfc ?? "-"}</span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] text-slate-600">
                        <p>
                          Costo proveedor:{" "}
                          <span className="font-semibold text-slate-800">
                            ${Number(costoProveedor).toFixed(2)}
                          </span>
                        </p>
                        <p>Fecha pago: {formatDate(fechaPago)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {solicitudesSeleccionadas.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No hay solicitudes seleccionadas.
                </p>
              )}
            </div>

            {/* Campos del formulario */}
            <div className="space-y-4 px-4 pb-4">
              <div>
                <label
                  htmlFor="referencia-numerica"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Referencia numérica
                </label>
                <input
                  id="referencia-numerica"
                  type="text"
                  value={referenciaNumerica}
                  onChange={(e) => setReferenciaNumerica(e.target.value)}
                  placeholder="Ingresa la referencia numérica"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Se usará para todas las solicitudes en el archivo.
                </p>
              </div>

              <div>
                <label
                  htmlFor="motivo-pago"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Motivo de pago / Referencia CIE
                </label>
                <input
                  id="motivo-pago"
                  type="text"
                  value={motivoPago}
                  onChange={(e) => setMotivoPago(e.target.value)}
                  placeholder="Ingresa el motivo de pago"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Se usará para todas las solicitudes en el archivo.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                solicitudesSeleccionadas.length === 0 ||
                !idDispersion.trim()
              }
              className={`flex-1 flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 ${isSubmitting ||
                solicitudesSeleccionadas.length === 0 ||
                !idDispersion.trim()
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generando dispersión...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generar dispersión
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 text-sm bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
