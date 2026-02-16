"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useFetchCards, useFetchTitulares } from "@/hooks/useFetchCard";

type Props = {
  idSolProv: string;
  currentMethod: string; // "credit" originalmente, pero nosotros lo movemos a "transfer" o "card"
  onSetMethod: (nextMethod: "transfer" | "card") => Promise<boolean>;
  onSetCard: (data: { id_tarjeta_solicitada: number }) => Promise<boolean>;
};

export default function PaymentMethodSelector({ idSolProv, currentMethod, onSetMethod, onSetCard }: Props) {
  const [method, setMethod] = useState<"transfer" | "card">(
    currentMethod === "card" ? "card" : "transfer"
  );

  const [open, setOpen] = useState(false);

  // 👇 ejemplo usando tus hooks existentes
  const { titulares, loading: loadingTitulares } = useFetchTitulares();
  const { cards, loading: loadingCards } = useFetchCards();

  const titularesList = useMemo(() => (Array.isArray(titulares) ? titulares : []), [titulares]);
  const cardsList = useMemo(() => (Array.isArray(cards) ? cards : []), [cards]);

  const [titularId, setTitularId] = useState<string>("");
  const [cardId, setCardId] = useState<string>("");

  // Filtra tarjetas por titular (ajusta llaves si tu modelo usa otros nombres)
  const cardsByTitular = useMemo(() => {
    if (!titularId) return [];
    return cardsList.filter((c: any) => String(c?.id_titular ?? c?.titular_id ?? "") === String(titularId));
  }, [cardsList, titularId]);

  useEffect(() => {
    // si cambias método a card, abre modal
    if (method === "card") setOpen(true);
  }, [method]);

  const changeMethod = async (next: "transfer" | "card") => {
    setMethod(next);

    // Persistimos el método inmediatamente
    const ok = await onSetMethod(next);
    if (!ok) {
      // revert si falla
      setMethod(method);
      return;
    }

    if (next === "card") setOpen(true);
  };

  const confirmCard = async () => {
    const id = Number(cardId);
    if (!id) return;

    const ok = await onSetCard({ id_tarjeta_solicitada: id });
    if (ok) setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
        value={method}
        onChange={(e) => void changeMethod(e.target.value as any)}
        title="Cambiar forma de pago solicitada"
      >
        <option value="transfer">Transferencia</option>
        <option value="card">Tarjeta</option>
      </select>

      {method === "card" && (
        <button
          type="button"
          className="h-8 rounded-md border border-blue-200 bg-blue-50 px-2 text-xs text-blue-700 hover:bg-blue-100"
          onClick={() => setOpen(true)}
          title="Elegir tarjeta"
        >
          Elegir tarjeta
        </button>
      )}

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-[min(720px,92vw)] rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Seleccionar tarjeta</p>
                <p className="text-xs text-slate-500">Solicitud: {idSolProv}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titular</label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={titularId}
                  onChange={(e) => {
                    setTitularId(e.target.value);
                    setCardId("");
                  }}
                  disabled={loadingTitulares}
                >
                  <option value="">Selecciona un titular…</option>
                  {titularesList.map((t: any) => (
                    <option key={String(t?.id_titular ?? t?.id ?? t?.value)} value={String(t?.id_titular ?? t?.id ?? t?.value)}>
                      {String(t?.nombre ?? t?.label ?? t?.titular ?? "Titular")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tarjeta</label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  disabled={!titularId || loadingCards}
                >
                  <option value="">{!titularId ? "Primero selecciona un titular…" : "Selecciona una tarjeta…"}</option>
                  {cardsByTitular.map((c: any) => (
                    <option key={String(c?.id_tarjeta ?? c?.id ?? c?.value)} value={String(c?.id_tarjeta ?? c?.id ?? c?.value)}>
                      {`${String(c?.banco_emisor ?? c?.banco ?? "Banco")} •••• ${String(c?.ultimos_4 ?? c?.last4 ?? "")}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  disabled={!cardId}
                  onClick={() => void confirmCard()}
                >
                  Guardar tarjeta
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Al guardar se setea <span className="font-mono">id_tarjeta_solicitada</span> en la solicitud.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
