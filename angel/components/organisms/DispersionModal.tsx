"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Check, Copy, FileDown, Info } from "lucide-react";
import { Modal } from "@/angel/components/molecules/Modal";
import {
  pagoProveedorService,
  type CuentaProveedor,
  type DispersionItem,
  type DispersionBody,
  type FacturaDispersion,
} from "@/angel/services/pago_proveedor";
import { fmtMoney } from "@/angel/lib/format/number";
import { fmtDateCsv } from "@/angel/lib/format/date";
import { generateDispersionId } from "@/angel/services/pago_proveedor/utils";
import { TextInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { useAlert } from "@/context/useAlert";
import { useFile } from "@/hooks/useFile";

// ─── Tipos internos ──────────────────────────────────────────────────────────

type FilaModal = {
  id: string;
  id_proveedor: number;
  id_intermediario: number | null;
  codigo_confirmacion: string;
  proveedor: string;
  check_out: string | null;
  facturas: FacturaDispersion[];
};

type EdicionFila = {
  id_factura: string | null;
  monto: string;
  cuenta: CuentaProveedor | null;
};

type Step = "form" | "success";

interface SuccessData {
  codigoDispersion: string;
  idPagos: string[];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DispersionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  solicitudes: DispersionItem[];
}

// ─── Componente ──────────────────────────────────────────────────────────────

export const DispersionModal = ({
  open,
  onClose,
  onSuccess,
  solicitudes,
}: DispersionModalProps) => {
  const { error } = useAlert();
  const { csvRaw } = useFile();
  const [step, setStep] = useState<Step>("form");
  const [idDispersion, setIdDispersion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [motivoPago, setMotivoPago] = useState("");
  const [cuentas, setCuentas] = useState<CuentaProveedor[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [edicion, setEdicion] = useState<Map<string, EdicionFila>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);
  const initRef = useRef(false);
  const fetchedCuentasRef = useRef(false);

  // Agrupación: N filas por solicitud → 1 FilaModal con array de facturas
  const filas = useMemo<FilaModal[]>(() => {
    const map = new Map<string, FilaModal>();
    for (const s of solicitudes) {
      if (!map.has(s.id)) {
        map.set(s.id, {
          id: s.id,
          id_proveedor: s.id_proveedor,
          id_intermediario: s.id_intermediario,
          codigo_confirmacion: s.codigo_confirmacion,
          proveedor: s.proveedor,
          check_out: s.check_out,
          facturas: [],
        });
      }
      if (s.factura) map.get(s.id)!.facturas.push(s.factura);
    }
    return [...map.values()];
  }, [solicitudes]);

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
      next.set(fila.id, {
        id_factura: primeraFactura?.id_factura ?? null,
        monto: primeraFactura ? String(primeraFactura.monto_asignado) : "",
        cuenta: null,
      });
    }
    setEdicion(next);
  }, [filas]);

  // Generar ID al abrir
  useEffect(() => {
    if (!open) return;
    if (initRef.current) return;
    initRef.current = true;
    setIdDispersion(generateDispersionId());
  }, [open]);

  // Fetch cuentas al abrir (COALESCE: intermediario ?? proveedor)
  useEffect(() => {
    if (!open || filas.length === 0 || fetchedCuentasRef.current) return;
    fetchedCuentasRef.current = true;
    const ids = [
      ...new Set(
        filas.map((f) =>
          f.id_intermediario != null
            ? String(f.id_intermediario)
            : String(f.id_proveedor),
        ),
      ),
    ];
    setLoadingCuentas(true);
    pagoProveedorService
      .getCuentas(ids)
      .then(({ data }) => {
        const lista = data ?? [];
        setCuentas(lista);
        // Auto-seleccionar cuenta por fila si esa fila tiene exactamente 1 cuenta
        setEdicion((prev) => {
          const next = new Map(prev);
          for (const fila of filas) {
            const cuentasFila = lista.filter(
              (c) =>
                c.id_proveedor ===
                (fila.id_intermediario ?? fila.id_proveedor),
            );
            if (cuentasFila.length === 1) {
              const e = next.get(fila.id);
              if (e) next.set(fila.id, { ...e, cuenta: cuentasFila[0] });
            }
          }
          return next;
        });
      })
      .catch((err) =>
        error(err.message || "Error al obtener cuentas del proveedor"),
      )
      .finally(() => setLoadingCuentas(false));
  }, [open, filas]);

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
    setCuentas([]);
    setEdicion(new Map());
    initRef.current = false;
    fetchedCuentasRef.current = false;
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
    const cleanedId = idDispersion.replace(/\s/g, "") || generateDispersionId();

    for (const fila of filas) {
      const e = edicion.get(fila.id);
      if (!e?.cuenta) {
        setFormError(
          `Selecciona una cuenta para ${fila.codigo_confirmacion}.`,
        );
        return;
      }
      if (!e.monto || Number(e.monto) <= 0) {
        setFormError(`El monto de ${fila.codigo_confirmacion} debe ser mayor a 0.`);
        return;
      }
      if (fila.facturas.length > 0 && !e.id_factura) {
        setFormError(
          `Selecciona una factura para ${fila.codigo_confirmacion}.`,
        );
        return;
      }
    }

    const body: DispersionBody = {
      id_dispersion: cleanedId,
      referencia_numerica: referencia,
      motivo_pago: motivoPago,
      layoutUrl: "example-url-to-layout-file.txt",
      solicitudes: filas.map((fila) => {
        const e = edicion.get(fila.id)!;
        const idPagador = fila.id_intermediario ?? fila.id_proveedor;
        return {
          id_solicitud: fila.id,
          id_solicitud_proveedor: fila.id,
          id_pago: null,
          id_proveedor: idPagador,
          clave_proveedor: String(idPagador),
          cuenta_de_deposito: e.cuenta?.clabe ?? e.cuenta?.cuenta ?? "",
          id_proveedor_cuenta: e.cuenta?.id ?? 0,
          tipo_cuenta:
            (e.cuenta?.clabe?.length ?? 0) === 18 ? "Cta Clabe" : "Cta",
          costo_proveedor: e.monto,
          codigo_hotel: null,
          fecha_pago: fila.check_out ?? null,
          id_factura: e.id_factura,
        };
      }),
    };

    setIsSubmitting(true);
    pagoProveedorService
      .dispersar(body)
      .then(({ data }) => {
        setSuccessData({
          codigoDispersion: cleanedId,
          idPagos: data?.id_pagos ?? [],
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
    const { codigoDispersion, idPagos } = successData;

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

    const rows = filas.map((fila, idx) => {
      const e = edicion.get(fila.id)!;
      const idPago = idPagos[idx] ?? "";
      return [
        idPago,
        codigoDispersion,
        "SPEI",
        fmtDateCsv(fila.check_out),
        e.cuenta?.clabe ?? e.cuenta?.cuenta ?? "",
        String(fila.id_intermediario ?? fila.id_proveedor),
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
          <div className="flex gap-2 w-full">
            <Button size="sm" variant="secondary" onClick={handleDescargarCsv}>
              <FileDown className="w-4 h-4 mr-1" />
              Descargar CSV
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
            disabled={isSubmitting || loadingCuentas}
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

        {/* Una tarjeta por solicitud agrupada */}
        <div className="space-y-3">
          {filas.map((fila) => {
            const e = edicion.get(fila.id);
            const cuentasFila = cuentas.filter(
              (c) =>
                c.id_proveedor ===
                (fila.id_intermediario ?? fila.id_proveedor),
            );

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
                      {fmtMoney(Number(e.monto) || 0)}
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
                                monto: String(f.monto_asignado),
                              })
                            }
                          />
                          <span className="font-mono text-xs flex-1">
                            {f.id_factura ?? "Sin ID"}
                          </span>
                          <span className="font-semibold">
                            {fmtMoney(f.monto_asignado)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monto editable */}
                <TextInput
                  label="Monto a dispersar"
                  value={e?.monto ?? ""}
                  onChange={(v) => setEdicionFila(fila.id, { monto: v })}
                />

                {/* Selector de cuenta */}
                {loadingCuentas ? (
                  <p className="text-xs text-gray-400">Cargando cuentas...</p>
                ) : cuentasFila.length > 1 ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Cuenta de depósito
                    </p>
                    <div className="space-y-1">
                      {cuentasFila.map((c) => (
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
                              {c.clabe ?? c.cuenta}
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
                ) : cuentasFila.length === 1 ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Cuenta de depósito
                    </p>
                    <div className="p-2 rounded border border-gray-200 bg-gray-50 text-sm">
                      <p className="font-mono text-xs font-semibold">
                        {cuentasFila[0].clabe ?? cuentasFila[0].cuenta}
                      </p>
                      <p className="text-xs text-gray-400">
                        {cuentasFila[0].banco}
                        {cuentasFila[0].alias
                          ? ` · ${cuentasFila[0].alias}`
                          : ""}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Campos globales */}
        <div className="border-t pt-4 space-y-3">
          <TextInput
            label="ID de dispersión"
            value={idDispersion}
            onChange={setIdDispersion}
          />
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
