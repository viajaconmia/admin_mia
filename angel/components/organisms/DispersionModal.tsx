"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Check, Copy, FileDown, Info } from "lucide-react";
import { Modal } from "@/angel/components/molecules/Modal";
import {
  pagoProveedorService,
  type CuentaProveedorDispersion,
  type FacturaDispersionDetalle,
  type SolicitudDispersionInfo,
} from "@/angel/services/pago_proveedor";
import {
  dispersionService,
  type CrearDispersionBody,
  type SolicitudDispersionProcesada,
} from "@/angel/services/dispersion";
import { fmtMoney } from "@/angel/lib/format/number";
import { fmtDateCsv } from "@/angel/lib/format/date";
import { TextInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { useAlert } from "@/context/useAlert";
import { useFile } from "@/hooks/useFile";

// ─── Tipos internos ──────────────────────────────────────────────────────────

type FilaModal = {
  id: string;
  codigo_confirmacion: string;
  proveedor: string;
  check_in: string | null;
  check_out: string | null;
  fecha_solicitud: string | null;
  saldo_dispersion: number;
  facturas: FacturaDispersionDetalle[];
  cuentas: CuentaProveedorDispersion[];
};

type EdicionFila = {
  id_factura: number | null;
  monto: string;
  cuenta: CuentaProveedorDispersion | null;
};

type Step = "form" | "success";

interface SuccessData {
  codigoDispersion: string;
  solicitudesProcesadas: SolicitudDispersionProcesada[];
  correoEnviado: boolean;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DispersionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ids: string[];
}

// ─── Componente ──────────────────────────────────────────────────────────────

export const DispersionModal = ({
  open,
  onClose,
  onSuccess,
  ids,
}: DispersionModalProps) => {
  const { error } = useAlert();
  const { csvRaw } = useFile();
  const [step, setStep] = useState<Step>("form");
  const [referencia, setReferencia] = useState("");
  const [motivoPago, setMotivoPago] = useState("");
  const [solicitudesInfo, setSolicitudesInfo] = useState<
    SolicitudDispersionInfo[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [edicion, setEdicion] = useState<Map<string, EdicionFila>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);
  const fetchedRef = useRef(false);

  const filas = useMemo<FilaModal[]>(
    () =>
      solicitudesInfo.map((s) => ({
        id: String(s.id_solicitud_proveedor),
        codigo_confirmacion: s.codigo_confirmacion,
        proveedor: s.proveedor,
        check_in: s.check_in,
        check_out: s.check_out,
        fecha_solicitud: s.fecha_solicitud,
        saldo_dispersion: s.saldo_dispersion,
        facturas: s.facturas,
        cuentas: s.cuentas,
      })),
    [solicitudesInfo],
  );

  const total = useMemo(() => {
    let sum = 0;
    for (const [, e] of edicion) sum += Number(e.monto) || 0;
    return sum;
  }, [edicion]);

  // Inicializar edicion cuando cambian las filas
  useEffect(() => {
    const next = new Map<string, EdicionFila>();
    for (const fila of filas) {
      const primeraFactura = fila.facturas[0] ?? null;
      const cuentaUnica = fila.cuentas.length === 1 ? fila.cuentas[0] : null;
      next.set(fila.id, {
        id_factura: primeraFactura?.id_factura ?? null,
        monto: primeraFactura ? String(primeraFactura.asignado) : "",
        cuenta: cuentaUnica,
      });
    }
    setEdicion(next);
  }, [filas]);

  // Fetch de solicitudes (cuentas + facturas) al abrir
  useEffect(() => {
    if (!open || ids.length === 0 || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    pagoProveedorService
      .getSolicitudesDispersion([...new Set(ids)].map(Number))
      .then(({ data }) => setSolicitudesInfo(data ?? []))
      .catch((err) => error(err.message || "Error al obtener las solicitudes"))
      .finally(() => setLoading(false));
  }, [open, ids]);

  const setEdicionFila = (id: string, patch: Partial<EdicionFila>) =>
    setEdicion((prev) => {
      const current = prev.get(id);
      if (!current) return prev;
      return new Map(prev).set(id, { ...current, ...patch });
    });

  const resetInterno = () => {
    setStep("form");
    setFormError(null);
    setSuccessData(null);
    setCopied(false);
    setSolicitudesInfo([]);
    setEdicion(new Map());
    fetchedRef.current = false;
  };

  const handleClose = () => {
    resetInterno();
    onClose();
  };

  const handleSuccess = () => {
    resetInterno();
    onSuccess();
  };

  const handleSubmit = () => {
    setFormError(null);

    for (const fila of filas) {
      const e = edicion.get(fila.id);
      if (!e?.cuenta) {
        setFormError(`Selecciona una cuenta para ${fila.codigo_confirmacion}.`);
        return;
      }
      const monto = Number(e.monto);
      if (!e.monto || monto <= 0) {
        setFormError(
          `El monto de ${fila.codigo_confirmacion} debe ser mayor a 0.`,
        );
        return;
      }
      if (monto > fila.saldo_dispersion) {
        setFormError(
          `El monto de ${fila.codigo_confirmacion} (${fmtMoney(monto)}) excede el saldo disponible (${fmtMoney(fila.saldo_dispersion)}).`,
        );
        return;
      }
      if (fila.facturas.length > 0 && !e.id_factura) {
        setFormError(
          `Selecciona una factura para ${fila.codigo_confirmacion}.`,
        );
        return;
      }
    }

    const body: CrearDispersionBody = {
      referencia_numerica: referencia,
      motivo_pago: motivoPago,
      solicitudes: filas.map((fila) => {
        const e = edicion.get(fila.id)!;
        return {
          id_solicitud_proveedor: Number(fila.id),
          id_proveedor_cuenta: e.cuenta?.id ?? 0,
          monto_dispersar: Number(e.monto),
          fecha_pago: fila.check_out ?? null,
          id_solicitud: fila.id,
          id_proveedor: e.cuenta?.id_proveedor,
          clave_proveedor: String(e.cuenta?.id_proveedor ?? ""),
          cuenta_de_deposito: e.cuenta?.cuenta ?? "",
          tipo_cuenta:
            e.cuenta?.tipo_cta ||
            ((e.cuenta?.cuenta?.length ?? 0) === 18 ? "Cta Clabe" : "Cta"),
          costo_proveedor: Number(e.monto),
          codigo_hotel: null,
        };
      }),
    };

    setIsSubmitting(true);
    dispersionService
      .crear(body)
      .then(({ data }) => {
        setSuccessData({
          codigoDispersion: data?.id_dispersion ?? "",
          solicitudesProcesadas: data?.solicitudes_procesadas ?? [],
          correoEnviado: data?.correo_enviado ?? true,
        });
        setStep("success");
      })
      .catch((err) =>
        setFormError(err.message || "Error al crear la dispersión."),
      )
      .finally(() => setIsSubmitting(false));
  };

  const handleDescargarCsv = () => {
    if (!successData) return;
    const { codigoDispersion, solicitudesProcesadas } = successData;
    const idPagoPorSolicitud = new Map(
      solicitudesProcesadas.map((s) => [
        String(s.id_solicitud_proveedor),
        s.id_pago,
      ]),
    );

    const headers = [
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
      "ID_FACTURA",
    ];

    const rows = filas.map((fila) => {
      const e = edicion.get(fila.id)!;
      const idPago = idPagoPorSolicitud.get(fila.id) ?? "";
      return [
        idPago,
        codigoDispersion,
        "SPEI",
        fmtDateCsv(fila.check_out),
        String(e.cuenta?.cuenta ?? ""),
        String(e.cuenta?.id_proveedor ?? ""),
        "Cta Clabe",
        "Pesos",
        Number(e.monto).toFixed(2),
        fila.codigo_confirmacion,
        `wx${codigoDispersion}xw${idPago}`,
        fila.proveedor,
        e.id_factura ?? "",
      ];
    });

    csvRaw(
      headers,
      rows,
      `dispersion_${codigoDispersion}_${new Date().toISOString().split("T")[0]}.csv`,
    );
  };

  const handleDescargarReporte = () => {
    if (!successData) return;
    const { codigoDispersion } = successData;

    const headers = [
      "id_Solicitud",
      "Codigo_Dispersion",
      "TIPO_CUENTA",
      "CUENTA_CARGO",
      "Cuenta B",
      "PROVEEDOR",
      "RFC",
      "TITULAR CUENTA BANCARIA",
      "RESERVA (MOTIVO_PAGO)",
      "UUID",
      "IMPORTE PAGADO",
      "Check In",
      "Check Out",
      "FECHA PAGO",
    ];

    const rows = filas.map((fila) => {
      const e = edicion.get(fila.id)!;
      const facturaSeleccionada = fila.facturas.find(
        (f) => f.id_factura === e.id_factura,
      );
      return [
        fila.id,
        codigoDispersion,
        String(e.cuenta?.tipo_cta ?? ""),
        String(e.cuenta?.cuenta ?? ""),
        String(e.cuenta?.cta ?? ""),
        fila.proveedor,
        facturaSeleccionada?.rfc ?? "",
        e.cuenta?.titular ?? "",
        fila.codigo_confirmacion,
        facturaSeleccionada?.uuid ?? "",
        Number(e.monto).toFixed(2),
        fmtDateCsv(fila.check_in),
        fmtDateCsv(fila.check_out),
        fmtDateCsv(fila.fecha_solicitud),
      ];
    });

    csvRaw(
      headers,
      rows,
      `reporte_dispersion_${codigoDispersion}_${new Date().toISOString().split("T")[0]}.csv`,
    );
  };

  const handleCopiar = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.codigoDispersion).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ─── Step: SUCCESS ───────────────────────────────────────────────────────

  if (step === "success" && successData) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        title="Dispersión creada"
        className="max-w-md"
        footer={
          <div className="flex flex-wrap gap-2 w-full">
            <Button size="sm" variant="secondary" onClick={handleDescargarCsv}>
              <FileDown className="w-4 h-4 mr-1" />
              Descargar CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDescargarReporte}
            >
              <FileDown className="w-4 h-4 mr-1" />
              Descargar reporte
            </Button>
            <Button size="sm" onClick={handleSuccess}>
              Cerrar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <Check className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              Dispersión creada exitosamente.
            </p>
          </div>
          {!successData.correoEnviado && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                La dispersión se creó pero no se pudo notificar por correo a
                CxP.
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Código de dispersión</p>
            <div className="flex items-center gap-2">
              <code className="text-base font-mono font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                {successData.codigoDispersion}
              </code>
              <button
                onClick={handleCopiar}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                title="Copiar"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Se procesaron{" "}
            <span className="font-semibold text-gray-900">{filas.length}</span>{" "}
            solicitudes. Descarga el CSV para importarlo a tu sistema de pagos.
          </p>
        </div>
      </Modal>
    );
  }

  // ─── Step: FORM ─────────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Crear dispersión"
      description={`${filas.length} solicitudes · Total: ${fmtMoney(total)}`}
      className="max-w-3xl"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? "Creando..." : "Crear dispersión"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Selecciona la factura y confirma el monto por cada solicitud.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader /> Cargando solicitudes...
          </div>
        )}

        {/* Una tarjeta por solicitud */}
        {!loading && (
          <div className="space-y-3">
            {filas.map((fila) => {
              const e = edicion.get(fila.id);

              return (
                <div
                  key={fila.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {fila.proveedor}
                      </p>
                      <p className="font-mono text-xs text-gray-500">
                        {fila.codigo_confirmacion}
                      </p>
                    </div>
                    {e && (
                      <span className="text-sm font-semibold text-gray-800">
                        Saldo disponible:{" "}
                        {fmtMoney(Number(fila.saldo_dispersion) || 0)}
                      </span>
                    )}
                  </div>

                  {/* Selector de factura */}
                  {fila.facturas.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Factura</p>
                      <div className="space-y-1">
                        {fila.facturas.map((f, idx) => (
                          <label
                            key={f.id_factura ?? idx}
                            className={`flex items-center gap-3 p-2 rounded border cursor-pointer text-sm transition-colors ${
                              e?.id_factura === f.id_factura
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`factura-${fila.id}`}
                              checked={e?.id_factura === f.id_factura}
                              onChange={() =>
                                setEdicionFila(fila.id, {
                                  id_factura: f.id_factura,
                                  monto: String(f.asignado),
                                })
                              }
                            />
                            <span className="font-mono text-xs flex-1">
                              {f.uuid ?? "Sin ID"}
                            </span>
                            <span className="font-semibold">
                              {fmtMoney(f.asignado)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monto editable */}
                  <div className="flex items-end gap-2">
                    <TextInput
                      className="flex-1"
                      label="Monto a dispersar"
                      value={e?.monto ?? ""}
                      onChange={(v) => setEdicionFila(fila.id, { monto: v })}
                    />
                    {fila.facturas.length === 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() =>
                          setEdicionFila(fila.id, {
                            monto: String(fila.saldo_dispersion),
                          })
                        }
                      >
                        Usar saldo
                      </Button>
                    )}
                  </div>

                  {/* Selector de cuenta */}
                  {fila.cuentas.length > 1 ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Cuenta de depósito
                      </p>
                      <div className="space-y-1">
                        {fila.cuentas.map((c) => (
                          <label
                            key={c.id}
                            className={`flex items-start gap-3 p-2 rounded border cursor-pointer text-sm transition-colors ${
                              e?.cuenta?.id === c.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`cuenta-${fila.id}`}
                              checked={e?.cuenta?.id === c.id}
                              onChange={() =>
                                setEdicionFila(fila.id, { cuenta: c })
                              }
                              className="mt-0.5"
                            />
                            <div>
                              <p className="font-mono text-xs font-semibold">
                                {c.cuenta}
                              </p>
                              <p className="text-xs text-gray-400">
                                {c.banco}
                                {c.alias ? ` · ${c.alias}` : ""}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : fila.cuentas.length === 1 ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Cuenta de depósito
                      </p>
                      <div className="p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                        <p className="font-mono text-xs font-semibold">
                          {fila.cuentas[0].cuenta}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fila.cuentas[0].banco}
                          {fila.cuentas[0].alias
                            ? ` · ${fila.cuentas[0].alias}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-red-500">
                      Este proveedor no tiene cuentas activas.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Campos globales */}
        <div className="border-t pt-4 space-y-3">
          <TextInput
            label="Referencia numérica"
            value={referencia}
            onChange={setReferencia}
          />
          <TextInput
            label="Motivo de pago"
            value={motivoPago}
            onChange={setMotivoPago}
          />
        </div>

        {/* Total */}
        <div className="flex justify-between items-center border-t pt-3">
          <span className="text-sm text-gray-600">Total a dispersar</span>
          <span className="text-base font-bold text-gray-900">
            {fmtMoney(total)}
          </span>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </div>
    </Modal>
  );
};
