"use client";

import React, { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { URL, HEADERS_API } from "@/lib/constants";

type Pago = {
  id_pago_proveedores: number | string;
  url_pdf?: string | null;
  monto_pagado?: number | string | null;
  fecha_pago?: string | null;
};

type SolicitudSpei = {
  id_solicitud_proveedor: string;
  saldo: number;
  monto_solicitado: number;
  hotel?: string | null;
  codigo_confirmacion?: string | null;
  id_proveedor?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  idSolicitudProveedor: string;
  onSuccess: () => void;
};

export function ReasignarPagoModal({ open, onClose, idSolicitudProveedor, onSuccess }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [solicitudesSpei, setSolicitudesSpei] = useState<SolicitudSpei[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPagoId, setSelectedPagoId] = useState<string>("");
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string>("");
  const [monto, setMonto] = useState<string>("");

  const selectedSolicitud = solicitudesSpei.find(
    (s) => s.id_solicitud_proveedor === selectedSolicitudId,
  );

  console.log(selectedSolicitud,"infor")
  const maxMonto = selectedSolicitud?.saldo ?? 0;

  useEffect(() => {
    if (!open || !idSolicitudProveedor) return;
    setError(null);
    setSelectedPagoId("");
    setSelectedSolicitudId("");
    setMonto("");
    setLoadingData(true);

    const fetchDetalles = fetch(
      `${URL}/mia/pago_proveedor/detalles`,
      {
        method: "POST",
        headers: { ...HEADERS_API, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id_solicitud_proveedor: idSolicitudProveedor }),
      },
    ).then((r) => r.json());

    const fetchSpei = fetch(
      `${URL}/mia/pago_proveedor/solicitud?estado_solicitud=DISPERSION&forma_pago=transfer&limite=200`,
      { headers: HEADERS_API, credentials: "include" },
    ).then((r) => r.json());

    Promise.all([fetchDetalles, fetchSpei])
      .then(([detallesJson, speiJson]) => {
        const rawPagos: Pago[] = (detallesJson?.data?.pagos ?? []).filter(
          (p: any) => p?.url_pdf,
        );
        setPagos(rawPagos);
        if (rawPagos.length === 1) {
          setSelectedPagoId(String(rawPagos[0].id_pago_proveedores));
        }

        const idProveedorCancelada = String(
          detallesJson?.data?.solicitud?.id_proveedor ?? "",
        ).trim();

        const speiRows: any[] = speiJson?.data?.spei ?? [];
        const filtradas: SolicitudSpei[] = speiRows
          .filter((r: any) => {
            const estatusPagos = String(r?.estatus_pagos ?? "").toLowerCase();
            const saldo = Number(r?.solicitud_proveedor?.saldo ?? r?.saldo ?? 0);
            const idProv = String(r?.solicitud_proveedor?.id_proveedor ?? r?.id_proveedor ?? "").trim();
            return (
              estatusPagos !== "pagado" &&
              saldo !== 0 &&
              (!idProveedorCancelada || idProv === idProveedorCancelada)
            );
          })
          .map((r: any) => ({
            id_solicitud_proveedor: String(
              r?.solicitud_proveedor?.id_solicitud_proveedor ?? r?.id_solicitud_proveedor ?? "",
            ),
            saldo: Number(r?.solicitud_proveedor?.saldo ?? r?.saldo ?? 0),
            monto_solicitado: Number(
              r?.solicitud_proveedor?.monto_solicitado ?? r?.monto_solicitado ?? 0,
            ),
            hotel: r?.hotel ?? null,
            codigo_confirmacion: r?.codigo_confirmacion ?? null,
            id_proveedor: String(r?.solicitud_proveedor?.id_proveedor ?? r?.id_proveedor ?? ""),
          }))
          .filter((s) => s.id_solicitud_proveedor);

        setSolicitudesSpei(filtradas);
      })
      .catch(() => setError("Error al cargar los datos"))
      .finally(() => setLoadingData(false));
  }, [open, idSolicitudProveedor]);

  useEffect(() => {
    if (selectedSolicitud) {
      setMonto(String(selectedSolicitud.saldo));
    } else {
      setMonto("");
    }
  }, [selectedSolicitud]);

  const handleConfirm = async () => {
    if (!selectedPagoId || !selectedSolicitudId || !monto) return;

    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      setError("El monto debe ser un número positivo");
      return;
    }
    if (maxMonto > 0 && montoNum > maxMonto) {
      setError(`El monto no puede superar el saldo de la solicitud ($${maxMonto.toFixed(2)})`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${URL}/mia/pago_proveedor/reasignar_pago`, {
        method: "PATCH",
        headers: { ...HEADERS_API, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          monto: montoNum,
          id_pago_proveedores: selectedPagoId,
          id_solicitud_nueva: selectedSolicitudId,
          id_solicitud_antigua: idSolicitudProveedor,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? json?.message ?? "Error al reasignar el pago");
        return;
      }
      onSuccess();
    } catch (e: any) {
      setError(e?.message ?? "Error de red");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[min(640px,95vw)] rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Reasignar pago</p>
            <p className="text-xs text-slate-500">
              Solicitud cancelada #{idSolicitudProveedor} — elige destino SPEI
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loadingData ? (
            <p className="text-xs text-slate-500 text-center py-6">Cargando datos…</p>
          ) : (
            <>
              {/* Comprobantes */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Comprobantes de pago
                </p>
                {pagos.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin comprobantes disponibles</p>
                ) : (
                  <div className="space-y-1">
                    {pagos.map((p) => {
                      const id = String(p.id_pago_proveedores);
                      const montoStr = Number(p.monto_pagado ?? 0).toFixed(2);
                      const fecha = p.fecha_pago
                        ? new Date(p.fecha_pago).toLocaleDateString("es-MX")
                        : "—";
                      return (
                        <div
                          key={id}
                          className={[
                            "flex items-center justify-between gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors",
                            selectedPagoId === id
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50",
                          ].join(" ")}
                          onClick={() => setSelectedPagoId(id)}
                        >
                          <p className="text-xs font-medium text-slate-800">
                            Pago #{id} — ${montoStr} — {fecha}
                          </p>
                          {p.url_pdf && (
                            <a
                              href={p.url_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver PDF
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Solicitud SPEI destino */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Solicitud SPEI destino{" "}
                  <span className="font-normal text-slate-400">
                    (DISPERSION · transfer · saldo &gt; 0 · no pagada)
                  </span>
                </label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={selectedSolicitudId}
                  onChange={(e) => setSelectedSolicitudId(e.target.value)}
                >
                  <option value="">
                    {solicitudesSpei.length === 0
                      ? "Sin solicitudes SPEI disponibles"
                      : "Selecciona una solicitud…"}
                  </option>
                  {solicitudesSpei.map((s) => (
                    <option key={s.id_solicitud_proveedor} value={s.id_solicitud_proveedor}>
                      {[
                        s.codigo_confirmacion ? s.codigo_confirmacion : `#${s.id_solicitud_proveedor}`,
                        `Saldo: $${Number(s.saldo).toFixed(2)}`,
                      ].join(" — ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              {selectedSolicitudId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto a asignar{" "}
                    {maxMonto > 0 && (
                      <span className="font-normal text-slate-400">
                        (máx. ${maxMonto.toFixed(2)})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxMonto > 0 ? maxMonto : undefined}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="0.00"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              disabled={!selectedPagoId || !selectedSolicitudId || !monto || saving || loadingData}
              onClick={() => void handleConfirm()}
            >
              {saving ? "Guardando…" : "Reasignar pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
