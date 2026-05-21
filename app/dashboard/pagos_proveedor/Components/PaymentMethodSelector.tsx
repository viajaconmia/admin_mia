"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useFetchCardsFinanzas } from "@/hooks/useFetchCard";

type Props = {
  idSolProv: string;
  currentMethod: string;
  currentCardId?: number | null;
  cardOnly?: boolean;
  onSetMethod: (nextMethod: "transfer" | "card") => Promise<boolean>;
  onSetCard: (data: {
    id_tarjeta_solicitada: string | number;
    id_titular: number;
  }) => Promise<boolean>;
};

export default function PaymentMethodSelector({
  idSolProv,
  currentMethod,
  currentCardId,
  cardOnly = false,
  onSetMethod,
  onSetCard,
}: Props) {
  const initialMethod =
    currentMethod === "card"
      ? "card"
      : currentMethod === "credit"
        ? "credit"
        : "transfer";

  const [method, setMethod] = useState<"transfer" | "card" | "credit">(
    initialMethod,
  );
  const [open, setOpen] = useState(false);
  const [cardId, setCardId] = useState<string>("");

  const {
    data: cardsData,
    loading: loadingCards,
    fetchData: fetchCards,
  } = useFetchCardsFinanzas();

  // Solo tarjetas activas para finanzas
  const activeCards = useMemo(() => {
    const list = Array.isArray(cardsData) ? cardsData : [];
    return list.filter(
      (c: any) =>
        (c?.activa === true || c?.activa === "active") &&
        (c?.activa_finanzas === true || c?.activa_finanzas === 1),
    );
  }, [cardsData]);

  const openCardModal = () => {
    fetchCards();
    setOpen(true);
  };

  const changeMethod = async (next: "transfer" | "card") => {
    const prev = method;
    setMethod(next);

    const ok = await onSetMethod(next);
    if (!ok) {
      setMethod(prev as any);
      return;
    }

    if (next === "card") openCardModal();
  };

  const confirmCard = async () => {
    if (!cardId) return;

    const selectedCard = activeCards.find(
      (c: any) => String(c?.id ?? "") === cardId,
    ) as any;
    const idTitular = Number(
      selectedCard?.id_titular ?? selectedCard?.titular_id ?? 0,
    );

    // cardId es el `id` que devuelve la ruta mia/pagar
    const ok = await onSetCard({
      id_tarjeta_solicitada: cardId,
      id_titular: idTitular,
    });
    if (ok) setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {!cardOnly && (
        <select
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
          value={method}
          onChange={(e) =>
            void changeMethod(e.target.value as "transfer" | "card")
          }
          title="Cambiar forma de pago solicitada"
        >
          {method === "credit" && (
            <option value="credit" disabled>
              Ap Crédito (Pendiente)
            </option>
          )}
          <option value="transfer">Transferencia</option>
          <option value="card">Tarjeta</option>
        </select>
      )}

      {(cardOnly || method === "card") && (
        <button
          type="button"
          className="h-8 rounded-md border border-blue-200 bg-blue-50 px-2 text-xs text-blue-700 hover:bg-blue-100"
          onClick={openCardModal}
          title="Cambiar tarjeta"
        >
          {currentCardId ? "Cambiar tarjeta" : "Elegir tarjeta"}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-[min(480px,92vw)] rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Seleccionar tarjeta
                </p>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tarjeta (solo activas)
                </label>
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  disabled={loadingCards}
                >
                  <option value="">
                    {loadingCards
                      ? "Cargando tarjetas…"
                      : "Selecciona una tarjeta…"}
                  </option>
                  {activeCards.map((c: any) => {
                    const id = String(c?.id ?? "");
                    const banco = String(
                      c?.banco_emisor ?? c?.banco ?? "Banco",
                    );
                    const ultimos = String(c?.ultimos_4 ?? c?.last4 ?? "");
                    const titular = String(
                      c?.nombre_titular ?? c?.titular ?? "",
                    );
                    return (
                      <option key={id} value={id}>
                        {`${banco} •••• ${ultimos}${titular ? ` — ${titular}` : ""}`}
                      </option>
                    );
                  })}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
