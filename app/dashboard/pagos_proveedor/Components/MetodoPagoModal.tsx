"use client";

import React from "react";
import { X, CreditCard, ArrowLeftRight, Loader2 } from "lucide-react";
import { URL, API_KEY } from "@/lib/constants/index";

type Metodo = "transfer" | "card";

/** /mia/pagar/tarjetas */
type TarjetaApi = {
  id: string; // UUID
  alias: string;
  nombre_titular: string | null;
  ultimos_4: string;
  banco_emisor: string;
  tipo_tarjeta: string;
  fecha_vencimiento: string;
  activa: boolean;
  url_identificacion: string | null;

  // NO usar en UI
  numero_completo?: string;
  cvv?: string;
};

/** /mia/pagar/titulares */
type TitularApi = {
  idTitular: number;
  Titular: string;
  identificacion: string | null;
  activa: boolean;
};

type TitularOption = {
  key: string;              // "all" | "none" | "id:4" | "name:xxxx"
  label: string;
  idTitular?: number;
  nombre?: string;
  identificacion?: string | null;
  source: "api" | "synthetic";
};

type TarjetaUI = {
  id: string; // UUID
  alias: string;
  ultimos_4: string;
  banco_emisor: string;
  tipo_tarjeta: string;
  fecha_vencimiento: string;
  activa: boolean;

  // info para UI y matching
  nombre_titular: string;        // lo que venga en tarjeta (si hay)
  titularKey: string;            // "id:4" | "name:xxx" | "none"
  titularLabel: string;          // texto visible del titular
  identificacion?: string | null;
};

const normName = (s?: string | null) =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos

const normUrl = (s?: string | null) => (s ?? "").trim();

function normalizeTarjetas(payload: any): TarjetaApi[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeTitulares(payload: any): TitularApi[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/**
 * Construye:
 * - opciones de titulares: All, None, API titulares, + titulares "no registrados" encontrados en tarjetas
 * - tarjetas enriquecidas: con titularKey y label
 */
function buildModel(tarjetas: TarjetaApi[], titulares: TitularApi[]) {
  // Maps para match
  const byUrl = new Map<string, TitularApi>();
  const byName = new Map<string, TitularApi>();

  for (const t of titulares) {
    const u = normUrl(t.identificacion);
    if (u) byUrl.set(u, t);

    const k = normName(t.Titular);
    if (k && !byName.has(k)) byName.set(k, t);
  }

  // Base options
  const options: TitularOption[] = [
    { key: "all", label: "Todos", source: "synthetic" },
    { key: "none", label: "Sin titular", source: "synthetic" },
  ];

  // API titulares
  for (const t of titulares) {
    options.push({
      key: `id:${t.idTitular}`,
      label: t.Titular,
      idTitular: t.idTitular,
      nombre: t.Titular,
      identificacion: t.identificacion,
      source: "api",
    });
  }

  // Crear tarjetas enriquecidas y colectar titulares "no registrados"
  const seenSynthetic = new Set<string>();
  const tarjetasUI: TarjetaUI[] = tarjetas.map((c) => {
    const url = normUrl(c.url_identificacion);
    const hitUrl = url ? byUrl.get(url) : undefined;

    const nt = (c.nombre_titular ?? "").trim();
    const hitName = nt ? byName.get(normName(nt)) : undefined;

    const hit = hitUrl ?? hitName;

    let titularKey = "none";
    let titularLabel = nt || "";

    if (hit) {
      titularKey = `id:${hit.idTitular}`;
      titularLabel = hit.Titular;
    } else if (nt) {
      titularKey = `name:${normName(nt)}`;
      titularLabel = nt;

      // agrega opción synthetic si no existe en titulares
      if (!seenSynthetic.has(titularKey)) {
        seenSynthetic.add(titularKey);
        options.push({
          key: titularKey,
          label: `${nt} (no registrado)`,
          nombre: nt,
          identificacion: c.url_identificacion ?? null,
          source: "synthetic",
        });
      }
    }

    return {
      id: String(c.id),
      alias: String(c.alias ?? ""),
      ultimos_4: String(c.ultimos_4 ?? ""),
      banco_emisor: String(c.banco_emisor ?? ""),
      tipo_tarjeta: String(c.tipo_tarjeta ?? ""),
      fecha_vencimiento: String(c.fecha_vencimiento ?? ""),
      activa: !!c.activa,

      nombre_titular: nt,
      titularKey,
      titularLabel,
      identificacion: c.url_identificacion ?? hit?.identificacion ?? null,
    };
  });

  // Orden opcional: API titulares primero, luego synthetics
  const optionsOrdered = options.sort((a, b) => {
    const aRank = a.key === "all" ? 0 : a.key === "none" ? 1 : a.source === "api" ? 2 : 3;
    const bRank = b.key === "all" ? 0 : b.key === "none" ? 1 : b.source === "api" ? 2 : 3;
    if (aRank !== bRank) return aRank - bRank;
    return a.label.localeCompare(b.label, "es");
  });

  return { options: optionsOrdered, tarjetas: tarjetasUI };
}

async function fetchBoth(
  signal?: AbortSignal,
  endpoints?: { tarjetas?: string; titulares?: string },
) {
  const endpointTarjetas = endpoints?.tarjetas ?? `${URL}/mia/pagar/`;
  const endpointTitulares = endpoints?.titulares ?? `${URL}/mia/pagar/titulares`;

  const common: RequestInit = {
    method: "GET",
    headers: {
      "x-api-key": API_KEY || "",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    signal,
  };

  const [rTar, rTit] = await Promise.all([
    fetch(endpointTarjetas, common),
    fetch(endpointTitulares, common),
  ]);

  const [jTar, jTit] = await Promise.all([
    rTar.json().catch(() => null),
    rTit.json().catch(() => null),
  ]);

  if (!rTar.ok) throw new Error(jTar?.message || `Tarjetas HTTP ${rTar.status}`);
  if (!rTit.ok) throw new Error(jTit?.message || `Titulares HTTP ${rTit.status}`);

  return {
    tarjetas: normalizeTarjetas(jTar),
    titulares: normalizeTitulares(jTit),
  };
}

export type MetodoPagoModalProps = {
  idSolProv: string;

  /** puede venir como estado_solicitud o como método */
  currentMethod: string;

  currentCardId?: string | null;
  onSetMethod: (next: Metodo) => Promise<boolean>;
  onSetCard: (payload: { id_tarjeta_solicitada: string | null }) => Promise<boolean>;
  endpoints?: {
    tarjetas?: string;
    titulares?: string;
  };
};

export default function MetodoPagoModal({
  idSolProv,
  currentMethod,
  currentCardId,
  onSetMethod,
  onSetCard,
  endpoints,
}: MetodoPagoModalProps) {
  const [open, setOpen] = React.useState(false);

  const statusOrMethod = String(currentMethod || "").trim().toUpperCase();

const initialMetodo: Metodo =
  statusOrMethod === "CARD" ||
  statusOrMethod === "CARTA_ENVIADA" ||
  statusOrMethod === "PAGADO TARJETA"
    ? "card"
    : "transfer";

  const [metodo, setMetodo] = React.useState<Metodo>(initialMetodo);

  // ✅ aquí guardamos elección independiente
  const [titularKey, setTitularKey] = React.useState<string>("all");
  const [cardId, setCardId] = React.useState<string>(String(currentCardId ?? ""));

  const [titularesOpts, setTitularesOpts] = React.useState<TitularOption[]>([
    { key: "all", label: "Todos", source: "synthetic" },
    { key: "none", label: "Sin titular", source: "synthetic" },
  ]);

  const [cards, setCards] = React.useState<TarjetaUI[]>([]);
  const [loadingCards, setLoadingCards] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  // Reset al abrir
  React.useEffect(() => {
    if (!open) return;
    setMetodo(initialMetodo);
    setCardId(String(currentCardId ?? ""));
    setTitularKey("all");
    setError("");
  }, [open, initialMetodo, currentCardId]);

  // Fetch cuando abre y método es card
  React.useEffect(() => {
    if (!open) return;
    if (metodo !== "card") return;

    const ac = new AbortController();
    setLoadingCards(true);

    (async () => {
      try {
        const { tarjetas, titulares } = await fetchBoth(ac.signal, endpoints);
        const model = buildModel(tarjetas, titulares);

        // Orden cards: activas primero
        const orderedCards = [...model.tarjetas].sort(
          (a, b) => Number(b.activa) - Number(a.activa),
        );

        setTitularesOpts(model.options);
        setCards(orderedCards);

        // ✅ Si ya hay tarjeta guardada, setea titularKey acorde (solo una vez)
        const cur = String(currentCardId ?? "").trim();
        if (cur) {
          const found = orderedCards.find((c) => c.id === cur);
          if (found) setTitularKey(found.titularKey === "none" ? "none" : found.titularKey);
        }
      } catch (e: any) {
        setCards([]);
        setError(e?.message || "No se pudieron cargar titulares/tarjetas");
      } finally {
        setLoadingCards(false);
      }
    })();

    return () => ac.abort();
  }, [open, metodo, endpoints, currentCardId]);

  // Filtrado de tarjetas según titular elegido
  const filteredCards = React.useMemo(() => {
    if (titularKey === "all") return cards;
    if (titularKey === "none") return cards.filter((c) => c.titularKey === "none");
    return cards.filter((c) => c.titularKey === titularKey);
  }, [cards, titularKey]);

  // Si cambian titular y la tarjeta seleccionada ya no está en el filtro, la reseteamos
  React.useEffect(() => {
    if (metodo !== "card") return;
    if (!cardId) return;
    const exists = filteredCards.some((c) => c.id === cardId);
    if (!exists) setCardId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titularKey]);

  const canSave =
    !saving &&
    (metodo === "transfer" || (metodo === "card" && cardId.trim().length > 0));

  const handleSave = async () => {
    setError("");

    if (!canSave) {
      setError(metodo === "card" ? "Selecciona una tarjeta." : "Completa la información.");
      return;
    }

    setSaving(true);

    const okMethod = await onSetMethod(metodo);
    if (!okMethod) {
      setSaving(false);
      return;
    }

    const okCard =
      metodo === "card"
        ? await onSetCard({ id_tarjeta_solicitada: cardId })
        : await onSetCard({ id_tarjeta_solicitada: null });

    setSaving(false);
    if (okCard) setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
        onClick={() => setOpen(true)}
        title="Cambiar método de pago"
      >
        Método
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            className="relative w-[min(620px,92vw)] rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100">
              <div>
                <div className="text-sm font-semibold text-slate-900">Método de pago</div>
                <div className="text-xs text-slate-500">
                  Solicitud: <span className="font-mono">{idSolProv}</span>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 hover:bg-slate-50"
                onClick={() => setOpen(false)}
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* selector método */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={[
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    metodo === "transfer"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  onClick={() => {
                    setMetodo("transfer");
                    setError("");
                  }}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Transferencia
                </button>

                <button
                  type="button"
                  className={[
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                    metodo === "card"
                      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  onClick={() => {
                    setMetodo("card");
                    setError("");
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  Tarjeta
                </button>
              </div>

              {/* Titular + Tarjeta */}
              {metodo === "card" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-700">
                    Selecciona titular y tarjeta
                  </div>

                  {loadingCards ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando titulares y tarjetas…
                    </div>
                  ) : (
                    <>
                      {/* TITULAR */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-slate-600">
                          Titular
                        </div>
                        <select
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                          value={titularKey}
                          onChange={(e) => {
                            setTitularKey(e.target.value);
                            setError("");
                          }}
                        >
                          {titularesOpts.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* TARJETA */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-slate-600">
                          Tarjeta
                        </div>

                        {filteredCards.length === 0 ? (
                          <div className="text-sm text-slate-600">
                            No hay tarjetas para este titular.
                          </div>
                        ) : (
                          <select
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                            value={cardId}
                            onChange={(e) => {
                              setCardId(e.target.value);
                              setError("");
                            }}
                          >
                            <option value="">— Selecciona —</option>
                            {filteredCards.map((c) => {
                              const label =
                                `•••• ${c.ultimos_4}` +
                                (c.banco_emisor ? ` · ${c.banco_emisor}` : "") +
                                (c.tipo_tarjeta ? ` · ${c.tipo_tarjeta}` : "") +
                                (c.alias ? ` · ${c.alias}` : "") +
                                (c.titularLabel ? ` · ${c.titularLabel}` : "") +
                                (c.activa ? "" : " · (INACTIVA)");

                              return (
                                <option key={c.id} value={c.id}>
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* error */}
              {error && (
                <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              {/* acciones */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className={[
                    "px-3 py-2 rounded-xl text-sm border",
                    canSave
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed",
                  ].join(" ")}
                  onClick={handleSave}
                  disabled={!canSave}
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
