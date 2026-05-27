import React, { useState, useEffect, useRef } from "react";
import { Send, X, Info, Check, Copy, FileDown } from "lucide-react";
import { URL as API_URL, API_KEY } from "@/lib/constants/index";

export type SolicitudProveedorRaw = {
  id_solicitud: string;
  id_pago?: string | null;
  id_proveedor?: number | string | null;
  id_solicitud_proveedor?: number | string | null;

  hotel?: string | null;
  codigo_reservacion_hotel?: string | null;
  codigo_confirmacion?: string | null;
  costo_total?: string | null;
  check_out?: string | null;
  codigo_dispersion?: string | null;
  razon_social?: string | null;
  rfc?: string | null;

  solicitud_proveedor?: {
    id_solicitud_proveedor: number | string;
    fecha_solicitud?: string | null;
    monto_solicitado?: string | null;
    saldo?: string | null;
  } | null;

  tipo_operacion?: string | null;
  cuenta_cargo?: string | null;
  clave_proveedor?: string | null;
  tipo_cuenta?: string | null;
  moneda?: string | null;
  texto_libre?: string | null;
  cuenta_de_deposito?: string | null;

  cuentas_proveedor?: any[];
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [step, setStep] = useState<"form" | "success">("form");
  const [successData, setSuccessData] = useState<{
    codigoDispersion: string;
    idPagos: any[];
    payload: any;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const [cuentasProveedor, setCuentasProveedor] = useState<any[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [errorCuentas, setErrorCuentas] = useState<string | null>(null);
  const [cuentaSeleccionadaMap, setCuentaSeleccionadaMap] = useState<Record<string, { id: string | number | null; clabe: string }>>({});

  const cleanInput = (input: string | undefined): string => {
    return (input ?? "").replace(/\s/g, "");
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

    return "D" + (n % 36 ** 8).toString(36).padStart(6, "0").toUpperCase();
  };

  const generarCSV = (idPago: any[], dispersionId: string) => {
    if (solicitudesSeleccionadas.length === 0) {
      setFormError("No hay solicitudes seleccionadas para generar el archivo.");
      return null;
    }

    console.log(idPago, "idPago recibido para CSV");

    if (!idPago || idPago.length === 0) {
      setFormError("No se ha recibido idPago del backend.");
      return null;
    }

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

      const id_pago = idPago[idx];

      const cuentaCargo =
        cuentaSeleccionadaMap[solicitud.id_solicitud]?.clabe ??
        solicitud.cuenta_de_deposito ??
        "";

      const claveProveedor =
        solicitud.clave_proveedor ||
        (solicitud.id_proveedor != null ? String(solicitud.id_proveedor) : "");

      const tipoCuenta = solicitud.tipo_cuenta || "Cta Clabe";
      const moneda = solicitud.moneda || "Pesos";

      const importe = parseFloat(
        solicitud.solicitud_proveedor?.monto_solicitado || "0"
      ).toFixed(2);

      const textoLibre =
        solicitud.texto_libre || solicitud.razon_social || solicitud.hotel || "";

      const motivoPorSolicitud = [
        solicitud.codigo_reservacion_hotel,
        solicitud.codigo_confirmacion,
      ].filter(Boolean).join(" ");
      const referencia = `wx${dispersionId}xw${id_pago}`;

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
        escapeCsv(motivoPorSolicitud),
        escapeCsv(referencia),
        escapeCsv(textoLibre),
      ].join(",");
    });

    const csvContent = [header, ...csvLines].join("\n");

    const cleanedIdDispersion = cleanInput(dispersionId);

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `dispersion_${
      cleanedIdDispersion || "sin_id"
    }_${new Date().toISOString().split("T")[0]}.csv`;

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

  useEffect(() => {
    const fetchCuentasProveedor = async () => {
      try {
        setLoadingCuentas(true);
        setErrorCuentas(null);

        console.log("Solicitudes recibidas en modal:", solicitudesSeleccionadas);

        const idsProveedor = [
          ...new Set(
            solicitudesSeleccionadas
              .map((s) => s.id_proveedor)
              .filter(
                (id) =>
                  id !== null &&
                  id !== undefined &&
                  String(id).trim() !== ""
              )
              .map((id) => String(id).trim())
          ),
        ];

        console.log("IDs proveedor enviados a /cuentas:", idsProveedor);

        if (!idsProveedor.length) {
          setCuentasProveedor([]);
          return;
        }

        const response = await fetch(`${API_URL}/mia/pago_proveedor/cuentas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({
            id_proveedor: idsProveedor,
          }),
        });

        const data = await response.json();

        console.log("Respuesta /cuentas:", data);

        if (!response.ok) {
          setCuentasProveedor([]);
          setErrorCuentas(
            data?.message || "No se pudieron obtener las cuentas."
          );
          return;
        }

        const cuentas = data?.data ?? [];
        setCuentasProveedor(cuentas);

        // Auto-seleccionar si cada solicitud tiene exactamente 1 cuenta
        const autoMap: Record<string, { id: string | number | null; clabe: string }> = {};
        solicitudesSeleccionadas.forEach((s) => {
          const idProv = String(s.id_proveedor ?? "").trim();
          const cuentasProv: any[] = cuentas.filter(
            (c: any) => String(c.id_proveedor ?? "").trim() === idProv
          );
          if (cuentasProv.length === 1) {
            const c = cuentasProv[0];
            const clabe = c?.clabe ?? c?.cuenta ?? "";
            const id = c?.id ?? c?.id_cuenta ?? null;
            if (clabe) autoMap[s.id_solicitud] = { id, clabe };
          }
        });
        setCuentaSeleccionadaMap(autoMap);
      } catch (error) {
        console.error("Error al consultar cuentas:", error);
        setCuentasProveedor([]);
        setErrorCuentas("Error al consultar cuentas del proveedor.");
      } finally {
        setLoadingCuentas(false);
      }
    };

    fetchCuentasProveedor();
  }, [solicitudesSeleccionadas]);

  const getCuentasParaSolicitud = (s: SolicitudProveedorRaw): any[] => {
    const idProv = String(s.id_proveedor ?? "").trim();
    return cuentasProveedor.filter(
      (c: any) => String(c.id_proveedor ?? "").trim() === idProv
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);

    const cleanedIdDispersion =
      cleanInput(idDispersion) || generateDispersionId();

    console.log(cleanedIdDispersion, "dispersion");

    if (!cleanedIdDispersion) {
      setFormError("El ID de dispersión es obligatorio.");
      return;
    }

    if (solicitudesSeleccionadas.length === 0) {
      setFormError("No hay solicitudes seleccionadas para dispersar.");
      return;
    }

    console.log("seleccionadas", solicitudesSeleccionadas);

    const payload = {
      id_dispersion: cleanedIdDispersion,
      referencia_numerica: "",
      motivo_pago: "",
      layoutUrl: "example-url-to-layout-file.txt",
      solicitudes: solicitudesSeleccionadas.map((s) => {
        return {
          id_solicitud: s.id_solicitud,
          id_solicitud_proveedor:
            s.solicitud_proveedor?.id_solicitud_proveedor ?? null,
          id_pago: s.id_pago ?? null,
          id_proveedor: s.id_proveedor ?? null,
          clave_proveedor:
            s.clave_proveedor ??
            (s.id_proveedor != null ? String(s.id_proveedor) : null),
          cuenta_de_deposito:
            cuentaSeleccionadaMap[s.id_solicitud]?.clabe ??
            s.cuenta_de_deposito ??
            null,
          id_proveedor_cuenta:
            cuentaSeleccionadaMap[s.id_solicitud]?.id ?? null,
          tipo_cuenta: s.tipo_cuenta ?? null,
          costo_proveedor: parseFloat(
            s.solicitud_proveedor?.saldo ??
              s.solicitud_proveedor?.monto_solicitado ??
              s.costo_total ??
              "0"
          ),
          codigo_hotel: s.codigo_reservacion_hotel ?? null,
          fecha_pago:
            s.solicitud_proveedor?.fecha_solicitud ?? s.check_out ?? null,
        };
      }),
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/mia/pago_proveedor/dispersion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Respuesta del backend:", data);

        setStep("success");

        setSuccessData({
          codigoDispersion: cleanedIdDispersion,
          idPagos: data.data?.id_pagos ?? [],
          payload,
        });
      } else {
        console.error("Error al guardar la dispersión:", data.message);

        setFormError(
          data?.message ||
            "Ocurrió un error al guardar la dispersión. Intenta nuevamente."
        );
      }
    } catch (err) {
      console.error("Error inesperado:", err);

      setFormError(
        "Ocurrió un error al guardar la dispersión. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success" && successData) {
    return (
      <div className="h-fit w-[95vw] max-w-xl relative bg-white rounded-xl">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <Check className="w-5 h-5 text-green-600 shrink-0" />

            <div>
              <p className="text-sm font-semibold text-green-800">
                Dispersión generada correctamente
              </p>

              <p className="text-xs text-green-700">
                Guarda el código antes de cerrar
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">
              Código de dispersión
            </p>

            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-lg font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 select-all">
                {successData.codigoDispersion}
              </span>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                onClick={() => {
                  navigator.clipboard.writeText(successData.codigoDispersion);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                title="Copiar código"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}

                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
              onClick={() =>
                generarCSV(successData.idPagos, successData.codigoDispersion)
              }
            >
              <FileDown className="w-4 h-4" />
              Generar CSV
            </button>

            <button
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              onClick={() => {
                onSubmit(successData.payload);
                onClose();
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-fit w-[95vw] max-w-xl relative bg-white">
      <div className="max-w-2xl mx-auto">
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
                          Código confirmación:{" "}
                          <span className="font-mono">
                            {s.codigo_confirmacion ?? "-"}
                          </span>
                        </p>

                        <p className="text-[11px] text-slate-500">
                          RFC:{" "}
                          <span className="font-mono">{s.rfc ?? "-"}</span>
                        </p>

                        <p className="text-[11px] text-slate-500">
                          ID proveedor:{" "}
                          <span className="font-mono">
                            {s.id_proveedor ?? "-"}
                          </span>
                        </p>

                        {/* Selector de cuenta receptora */}
                        {(() => {
                          const cuentas = getCuentasParaSolicitud(s);
                          if (cuentas.length === 0) return null;
                          const selectedEntry = cuentaSeleccionadaMap[s.id_solicitud];
                          if (cuentas.length === 1) {
                            return (
                              <p className="text-[11px] text-slate-500 mt-1">
                                Cuenta:{" "}
                                <span className="font-mono text-green-700">
                                  {cuentas[0].clabe ?? cuentas[0].cuenta ?? "-"}
                                </span>
                                {cuentas[0].banco ? ` (${cuentas[0].banco})` : ""}
                              </p>
                            );
                          }
                          return (
                            <div className="mt-1">
                              <label className="text-[11px] text-slate-500 block mb-0.5">
                                Cuenta receptora:
                              </label>
                              <select
                                className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-blue-300"
                                value={selectedEntry?.clabe ?? ""}
                                onChange={(e) => {
                                  const clabe = e.target.value;
                                  const found = cuentas.find(
                                    (c: any) => (c.clabe ?? c.cuenta ?? "") === clabe
                                  );
                                  setCuentaSeleccionadaMap((prev) => ({
                                    ...prev,
                                    [s.id_solicitud]: {
                                      id: found?.id ?? found?.id_cuenta ?? null,
                                      clabe,
                                    },
                                  }));
                                }}
                              >
                                <option value="">— Seleccionar cuenta —</option>
                                {cuentas.map((c: any, ci: number) => {
                                  const val = c.clabe ?? c.cuenta ?? "";
                                  return (
                                    <option key={ci} value={val}>
                                      {[c.banco, val].filter(Boolean).join(" · ")}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          );
                        })()}
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
          </div>

          <div className="border border-slate-200 rounded-xl bg-white p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Cuentas proveedor
              </span>

              {loadingCuentas && (
                <span className="text-xs text-blue-600 font-medium">
                  Cargando...
                </span>
              )}
            </div>

            {errorCuentas && (
              <p className="text-xs text-red-600 mb-2">{errorCuentas}</p>
            )}

            {!loadingCuentas &&
              cuentasProveedor.length === 0 &&
              !errorCuentas && (
                <p className="text-xs text-slate-500">
                  No se encontraron cuentas para los proveedores seleccionados.
                </p>
              )}

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cuentasProveedor.map((cuenta, idx) => (
                <div
                  key={`${cuenta.id ?? idx}`}
                  className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {cuenta.banco ?? "Banco sin nombre"} —{" "}
                    {cuenta.alias ?? "Sin alias"}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    ID proveedor:{" "}
                    <span className="font-mono">
                      {cuenta.id_proveedor ?? "-"}
                    </span>
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Cuenta:{" "}
                    <span className="font-mono">{cuenta.cuenta ?? "-"}</span>
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Titular: {cuenta.titular ?? "-"}
                  </p>

                  {cuenta.comentarios && (
                    <p className="text-[11px] text-slate-500">
                      Comentarios: {cuenta.comentarios}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                solicitudesSeleccionadas.length === 0 ||
                !idDispersion.trim()
              }
              className={`flex-1 flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 ${
                isSubmitting ||
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