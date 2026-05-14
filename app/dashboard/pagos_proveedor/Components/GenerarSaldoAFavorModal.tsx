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

type Props = {
  open: boolean;
  onClose: () => void;
  idSolicitudProveedor: string;
  onSuccess: () => void;
};

export function GenerarSaldoAFavorModal({ open, onClose, idSolicitudProveedor, onSuccess }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPagoId, setSelectedPagoId] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [comentarios, setComentarios] = useState<string>("");

  useEffect(() => {
    if (!open || !idSolicitudProveedor) return;
    setError(null);
    setSelectedPagoId("");
    setMotivo("");
    setComentarios("");
    setLoadingData(true);

    fetch(`${URL}/mia/pago_proveedor/detalles`, {
      method: "POST",
      headers: { ...HEADERS_API, "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_solicitud_proveedor: idSolicitudProveedor }),
    })
      .then((r) => r.json())
      .then((json) => {
        const rawPagos: Pago[] = json?.data?.pagos ?? [];
        setPagos(rawPagos);
        if (rawPagos.length === 1) {
          setSelectedPagoId(String(rawPagos[0].id_pago_proveedores));
        }
      })
      .catch(() => setError("Error al cargar los datos"))
      .finally(() => setLoadingData(false));
  }, [open, idSolicitudProveedor]);

  const handleConfirm = async () => {
    if (!selectedPagoId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${URL}/mia/pago_proveedor/generar_saldo_a_favor`, {
        method: "PATCH",
        headers: { ...HEADERS_API, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id_solicitud_pago: selectedPagoId,
          motivo,
          comentarios,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? json?.message ?? "Error al generar saldo a favor");
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
      <div className="relative w-[min(580px,95vw)] rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Generar saldo a favor</p>
            <p className="text-xs text-slate-500">
              Solicitud #{idSolicitudProveedor} — convierte el pago en saldo a favor del proveedor
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
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Selecciona el comprobante de pago
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
                              ? "border-emerald-300 bg-emerald-50"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Ej. Cancelación de reserva, pago duplicado…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comentarios</label>
                <textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Notas adicionales…"
                />
              </div>
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
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              disabled={!selectedPagoId || saving || loadingData}
              onClick={() => void handleConfirm()}
            >
              {saving ? "Guardando…" : "Generar saldo a favor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
