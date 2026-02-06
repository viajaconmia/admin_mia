"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import { InputToS3 } from "@/components/atom/SendToS3";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { ROUTES } from "@/constant/routes";

export interface Tarjeta {
  id: string;
  alias: string | null;
  ultimos_4: string | null;
  numero_completo: string | null;
  banco_emisor: string | null;
  tipo_tarjeta: string | null;
  fecha_vencimiento: string | null; // varchar(10)
  activa: boolean | number;
  cvv: string | null;

  // opcionales si tu DB los trae (porque Table5 los muestra)
  nombre_titular?: string | null;
}

export interface Titular {
  idTitular: number; // INT
  Titular: string; // VARCHAR(100)
  identificacion: string | null; // TEXT (URL)
}

type Mode = "create" | "edit";
type ViewMode = "tarjetas" | "titulares";

const BASE_ENDPOINT = `${URL}/mia/pagar/`;
const TITULAR_ENDPOINT = `${URL}/mia/pagar/titulares`;

const toBool = (v: any) => v === true || v === 1 || v === "1" || v === "true";

const maskCard = (num: string | null, last4: string | null) => {
  const l4 =
    (last4 && String(last4).slice(-4)) ||
    (num ? String(num).replace(/\D/g, "").slice(-4) : "");
  return l4 ? `**** **** **** ${l4}` : "—";
};

const computeLast4 = (num: string) => {
  const digits = String(num ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : "";
};

const emptyFormTarjeta = (): Partial<Tarjeta> => ({
  alias: "",
  numero_completo: "",
  ultimos_4: "",
  banco_emisor: "",
  tipo_tarjeta: "",
  fecha_vencimiento: "",
  activa: true,
  cvv: "",
});

const emptyFormTitular = (): Partial<Titular> => ({
  Titular: "",
  identificacion: "",
});

async function fetchJSON<T>(input: RequestInfo, init: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Error HTTP: ${res.status}`);
  }
  return (await res.json()) as T;
}

export default function TarjetasCrudTable5() {
  const router = useRouter();
  const { hasPermission } = usePermiso();

  const [view, setView] = useState<ViewMode>("tarjetas");

  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [titulares, setTitulares] = useState<Titular[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");

  const [editingTarjetaId, setEditingTarjetaId] = useState<string | null>(null);
  const [editingTitularId, setEditingTitularId] = useState<number | null>(null);

  const [formTarjeta, setFormTarjeta] = useState<Partial<Tarjeta>>(emptyFormTarjeta());
  const [formTitular, setFormTitular] = useState<Partial<Titular>>(emptyFormTitular());

  // ===== Permisos de VISTA =====
  const canViewTarjetas = hasPermission(PERMISOS.VISTAS.MIA_TARJETAS);
  const canViewTitulares = hasPermission(PERMISOS.VISTAS.MIA_TITULARES);

  // ===== Permisos de ACCIONES (tarjetas) =====
  const canCreateTarjeta = hasPermission(PERMISOS.COMPONENTES.BOTON.MIA_TARJETAS_CREAR);
  const canEditTarjeta = hasPermission(PERMISOS.COMPONENTES.BOTON.MIA_TARJETAS_EDITAR);
  const canDeleteTarjeta = hasPermission(PERMISOS.COMPONENTES.BOTON.MIA_TARJETAS_ELIMINAR);

  // ===== Permisos de ACCIONES (titulares) =====
  const canCreateTitular = hasPermission(PERMISOS.COMPONENTES.BOTON.MIA_TITULARES_CREAR);
  const canEditTitular = hasPermission(PERMISOS.COMPONENTES.BOTON.MIA_TITULARES_EDITAR);
  const canDeleteTitular = hasPermission(PERMISOS.COMPONENTES.BOTON.MIA_TITULARES_ELIMINAR);

  const canSubmitCurrent =
    view === "tarjetas"
      ? mode === "create"
        ? canCreateTarjeta
        : canEditTarjeta
      : mode === "create"
      ? canCreateTitular
      : canEditTitular;

  // -------------------------
  // Guardia de vista
  // -------------------------
  useEffect(() => {
    if (!canViewTarjetas && !canViewTitulares) {
      router.push(ROUTES.DASHBOARD.UNAUTHORIZED);
      return;
    }

    if (view === "tarjetas" && !canViewTarjetas && canViewTitulares) setView("titulares");
    if (view === "titulares" && !canViewTitulares && canViewTarjetas) setView("tarjetas");
  }, [canViewTarjetas, canViewTitulares, view, router]);

  // -------------------------
  // Fetchers
  // -------------------------
  const fetchTarjetas = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchJSON<Tarjeta[]>(BASE_ENDPOINT, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        credentials: "include",
      });

      const normalized = Array.isArray(data)
        ? data.map((t) => ({ ...t, activa: toBool((t as any).activa) }))
        : [];

      setTarjetas(normalized);
    } catch (e: any) {
      console.error(e);
      setTarjetas([]);
      setErrorMsg(e?.message || "Error al cargar tarjetas");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTitulares = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchJSON<Titular[]>(TITULAR_ENDPOINT, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        credentials: "include",
      });

      setTitulares(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setTitulares([]);
      setErrorMsg(e?.message || "Error al cargar titulares");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === "tarjetas") {
      if (!canViewTarjetas) return;
      fetchTarjetas();
    } else {
      if (!canViewTitulares) return;
      fetchTitulares();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, canViewTarjetas, canViewTitulares]);

  // -------------------------
  // Modal helpers
  // -------------------------
  const closeModal = () => {
    setModalOpen(false);
    setSaving(false);
    setErrorMsg(null);
  };

  // -------------------------
  // CRUD TARJETAS
  // -------------------------
  const openCreateTarjeta = () => {
    if (!canCreateTarjeta) return;
    setMode("create");
    setEditingTarjetaId(null);
    setFormTarjeta(emptyFormTarjeta());
    setModalOpen(true);
  };

  const openEditTarjeta = (t: Tarjeta) => {
    if (!canEditTarjeta) return;
    setMode("edit");
    setEditingTarjetaId(t.id);
    setFormTarjeta({
      id: t.id,
      alias: t.alias ?? "",
      numero_completo: t.numero_completo ?? "",
      ultimos_4: t.ultimos_4 ?? computeLast4(t.numero_completo ?? ""),
      banco_emisor: t.banco_emisor ?? "",
      tipo_tarjeta: t.tipo_tarjeta ?? "",
      fecha_vencimiento: t.fecha_vencimiento ?? "",
      activa: toBool(t.activa),
      cvv: t.cvv ?? "",
    });
    setModalOpen(true);
  };

  const buildTarjetaPayload = () => {
    const payload: any = {
      alias: formTarjeta.alias ?? null,
      numero_completo: formTarjeta.numero_completo ?? null,
      ultimos_4:
        (formTarjeta.ultimos_4 && String(formTarjeta.ultimos_4).slice(-4)) ||
        (formTarjeta.numero_completo
          ? computeLast4(String(formTarjeta.numero_completo))
          : null),
      banco_emisor: formTarjeta.banco_emisor ?? null,
      tipo_tarjeta: formTarjeta.tipo_tarjeta ?? null,
      fecha_vencimiento: formTarjeta.fecha_vencimiento ?? null,
      activa: toBool(formTarjeta.activa) ? 1 : 0,
      cvv: formTarjeta.cvv ?? null,
    };

    for (const k of Object.keys(payload)) {
      if (payload[k] === "") payload[k] = null;
    }
    return payload;
  };

  const handleDeleteTarjeta = async (t: Tarjeta) => {
    if (!canDeleteTarjeta) return;

    const ok = confirm(
      `¿Eliminar la tarjeta "${t.alias ?? "Sin alias"}" (${maskCard(
        t.numero_completo,
        t.ultimos_4
      )})?`
    );
    if (!ok) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      await fetchJSON(`${BASE_ENDPOINT}${t.id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      await fetchTarjetas();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error al eliminar tarjeta");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTarjeta = async () => {
    if (mode === "create" && !canCreateTarjeta) return;
    if (mode === "edit" && !canEditTarjeta) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload = buildTarjetaPayload();

      if (mode === "create") {
        await fetchJSON(BASE_ENDPOINT, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        if (!editingTarjetaId) throw new Error("No hay id para editar.");
        await fetchJSON(`${BASE_ENDPOINT}${editingTarjetaId}`, {
          method: "PUT",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      await fetchTarjetas();
      closeModal();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error al guardar tarjeta");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------
  // CRUD TITULARES
  // -------------------------
  const openCreateTitular = () => {
    if (!canCreateTitular) return;
    setMode("create");
    setEditingTitularId(null);
    setFormTitular(emptyFormTitular());
    setModalOpen(true);
  };

  const openEditTitular = (t: Titular) => {
    if (!canEditTitular) return;
    setMode("edit");
    setEditingTitularId(t.idTitular);
    setFormTitular({
      idTitular: t.idTitular,
      Titular: t.Titular ?? "",
      identificacion: t.identificacion ?? "",
    });
    setModalOpen(true);
  };

  const buildTitularPayload = () => {
    const payload: any = {
      Titular: (formTitular.Titular ?? "").trim() || null,
      identificacion: (formTitular.identificacion ?? "").trim() || null,
    };
    return payload;
  };

  const handleDeleteTitular = async (t: Titular) => {
    if (!canDeleteTitular) return;

    const ok = confirm(`¿Eliminar el titular "${t.Titular}" (id: ${t.idTitular})?`);
    if (!ok) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      await fetchJSON(`${TITULAR_ENDPOINT}/${t.idTitular}`, {
        method: "DELETE",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      await fetchTitulares();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error al eliminar titular");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTitular = async () => {
    if (mode === "create" && !canCreateTitular) return;
    if (mode === "edit" && !canEditTitular) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload = buildTitularPayload();

      if (mode === "create") {
        await fetchJSON(TITULAR_ENDPOINT, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        if (!editingTitularId) throw new Error("No hay idTitular para editar.");
        await fetchJSON(`${TITULAR_ENDPOINT}/${editingTitularId}`, {
          method: "PUT",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      await fetchTitulares();
      closeModal();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error al guardar titular");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------
  // Table5: registros + renderers por vista
  // -------------------------
  const registros = useMemo(() => {
    if (view === "tarjetas") {
      return (tarjetas || []).map((t) => ({
        id: t.id,
        alias: t.alias ?? "—",
        nombre_titular: (t as any).nombre_titular ?? "—",
        tarjeta: maskCard(t.numero_completo, t.ultimos_4),
        banco_emisor: t.banco_emisor ?? "—",
        tipo_tarjeta: t.tipo_tarjeta ?? "—",
        fecha_vencimiento: t.fecha_vencimiento ?? "—",
        activa: toBool(t.activa),
        acciones: t,
        item: t,
      }));
    }

    return (titulares || []).map((t) => ({
      idTitular: t.idTitular,
      Titular: t.Titular ?? "—",
      identificacion: t.identificacion ?? null,
      acciones: t,
      item: t,
    }));
  }, [view, tarjetas, titulares]);

  const renderers: {
    [key: string]: React.FC<{ value: any; item: any; index: number }>;
  } = useMemo(() => {
    const Center: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <div className="flex items-center justify-center w-full h-full text-center">
        {children}
      </div>
    );

    if (view === "tarjetas") {
      return {
        activa: ({ value }) => {
          const ok = toBool(value);
          return (
            <div className="flex justify-center">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded border ${
                  ok
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-gray-50 text-gray-600 border-gray-300"
                }`}
              >
                {ok ? "Activa" : "Inactiva"}
              </span>
            </div>
          );
        },

        url_identificacion: ({ value }) => {
          if (!value) return <span className="text-gray-500">—</span>;
          return (
            <a
              className="text-blue-600 hover:underline text-xs"
              href={String(value)}
              target="_blank"
              rel="noreferrer"
            >
              Ver
            </a>
          );
        },

        acciones: ({ value }) => {
          const t: Tarjeta = value as Tarjeta;

          if (!canEditTarjeta && !canDeleteTarjeta) {
            return <span className="text-gray-400">—</span>;
          }

          return (
            <div className="flex gap-2 justify-center">
              {canEditTarjeta ? (
                <button
                  type="button"
                  onClick={() => openEditTarjeta(t)}
                  className="px-2 py-1 rounded text-xs border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  disabled={saving}
                >
                  Editar
                </button>
              ) : null}

              {canDeleteTarjeta ? (
                <button
                  type="button"
                  onClick={() => handleDeleteTarjeta(t)}
                  className="px-2 py-1 rounded text-xs border bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                  disabled={saving}
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          );
        },
      };
    }

    // =========================
    // TITULARES (TODO CENTRADO)
    // =========================
    return {
      idTitular: ({ value }) => <Center>{value ?? "—"}</Center>,

      Titular: ({ value }) => <Center>{value ?? "—"}</Center>,

      identificacion: ({ value }) => {
        if (!value)
          return (
            <Center>
              <span className="text-gray-500">—</span>
            </Center>
          );
        return (
          <Center>
            <a
              className="text-blue-600 hover:underline text-xs"
              href={String(value)}
              target="_blank"
              rel="noreferrer"
            >
              Ver
            </a>
          </Center>
        );
      },

      acciones: ({ value }) => {
        const t: Titular = value as Titular;

        if (!canEditTitular && !canDeleteTitular) {
          return (
            <Center>
              <span className="text-gray-400">—</span>
            </Center>
          );
        }

        return (
          <Center>
            <div className="flex gap-2">
              {canEditTitular ? (
                <button
                  type="button"
                  onClick={() => openEditTitular(t)}
                  className="px-2 py-1 rounded text-xs border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  disabled={saving}
                >
                  Editar
                </button>
              ) : null}

              {canDeleteTitular ? (
                <button
                  type="button"
                  onClick={() => handleDeleteTitular(t)}
                  className="px-2 py-1 rounded text-xs border bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                  disabled={saving}
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </Center>
        );
      },
    };
  }, [
    view,
    saving,
    canEditTarjeta,
    canDeleteTarjeta,
    canEditTitular,
    canDeleteTitular,
  ]);

  const customColumns =
    view === "tarjetas"
      ? [
          "alias",
          "nombre_titular",
          "tarjeta",
          "banco_emisor",
          "tipo_tarjeta",
          "fecha_vencimiento",
          "activa",
          "acciones",
        ]
      : ["idTitular", "Titular", "identificacion", "acciones"];

  const handleReload = () => (view === "tarjetas" ? fetchTarjetas() : fetchTitulares());

  const handleCreate = () => (view === "tarjetas" ? openCreateTarjeta() : openCreateTitular());

  const handleSubmit = () => (view === "tarjetas" ? handleSubmitTarjeta() : handleSubmitTitular());

  // Si cambias la vista, por seguridad cerramos modal
  const toggleView = (next: ViewMode) => {
    if (saving) return;

    if (next === "tarjetas" && !canViewTarjetas) return;
    if (next === "titulares" && !canViewTitulares) return;

    if (modalOpen) closeModal();
    setView(next);
  };

  // Opcional: deshabilitar switch si solo tiene una vista
  const canToggle = canViewTarjetas && canViewTitulares;

  // Si no tiene ninguna vista, mientras redirige no renderizamos
  if (!canViewTarjetas && !canViewTitulares) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Switch Tarjetas / Titulares */}
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${
                  view === "tarjetas" ? "font-semibold text-gray-900" : "text-gray-500"
                }`}
              >
                Tarjetas
              </span>

              <button
                type="button"
                onClick={() => toggleView(view === "tarjetas" ? "titulares" : "tarjetas")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  view === "titulares" ? "bg-blue-600" : "bg-gray-300"
                } ${!canToggle ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Cambiar vista"
                disabled={saving || !canToggle}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    view === "titulares" ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>

              <span
                className={`text-sm ${
                  view === "titulares" ? "font-semibold text-gray-900" : "text-gray-500"
                }`}
              >
                Titulares
              </span>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <button
                onClick={handleReload}
                className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                disabled={isLoading || saving}
              >
                Recargar
              </button>

              {view === "tarjetas" ? (
                canCreateTarjeta ? (
                  <button
                    onClick={handleCreate}
                    className="text-sm px-3 py-1 rounded text-white bg-emerald-600 hover:bg-emerald-700"
                    disabled={saving}
                  >
                    Crear tarjeta
                  </button>
                ) : null
              ) : canCreateTitular ? (
                <button
                  onClick={handleCreate}
                  className="text-sm px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  Crear titular
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4">
          {errorMsg && (
            <div className="mb-3 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-600">
              {view === "tarjetas" ? "Cargando tarjetas..." : "Cargando titulares..."}
            </div>
          ) : (
            <Table5<any>
              registros={registros}
              renderers={renderers}
              exportButton={true}
              leyenda={`Mostrando ${registros.length} registro(s)`}
              maxHeight="65vh"
              customColumns={customColumns}
            />
          )}
        </div>
      </div>

      {/* MODAL CREATE/EDIT (dinámico según vista) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[85vh] overflow-auto">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {view === "tarjetas"
                  ? mode === "create"
                    ? "Crear tarjeta"
                    : "Editar tarjeta"
                  : mode === "create"
                  ? "Crear titular"
                  : "Editar titular"}
              </h3>

              <button
                onClick={closeModal}
                className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                disabled={saving}
              >
                Cerrar
              </button>
            </div>

            <div className="p-4 space-y-4">
              {view === "tarjetas" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Alias"
                    value={formTarjeta.alias ?? ""}
                    onChange={(v) => setFormTarjeta((p) => ({ ...p, alias: v }))}
                  />

                  <Field
                    label="Número completo"
                    value={formTarjeta.numero_completo ?? ""}
                    onChange={(v) =>
                      setFormTarjeta((p) => ({
                        ...p,
                        numero_completo: v,
                        ultimos_4: computeLast4(v),
                      }))
                    }
                    placeholder="Opcional (si lo manejas)"
                  />

                  <Field
                    label="Últimos 4"
                    value={formTarjeta.ultimos_4 ?? ""}
                    onChange={(v) => setFormTarjeta((p) => ({ ...p, ultimos_4: v }))}
                    placeholder="Se calcula automático"
                  />

                  <Field
                    label="Banco emisor"
                    value={formTarjeta.banco_emisor ?? ""}
                    onChange={(v) => setFormTarjeta((p) => ({ ...p, banco_emisor: v }))}
                  />

                  <Field
                    label="Tipo tarjeta"
                    value={formTarjeta.tipo_tarjeta ?? ""}
                    onChange={(v) => setFormTarjeta((p) => ({ ...p, tipo_tarjeta: v }))}
                    placeholder="crédito / débito / etc"
                  />

                  <Field
                    label="Fecha vencimiento"
                    value={formTarjeta.fecha_vencimiento ?? ""}
                    onChange={(v) => setFormTarjeta((p) => ({ ...p, fecha_vencimiento: v }))}
                    placeholder="Ej: 12/27"
                  />

                  <Field
                    label="CVV"
                    value={formTarjeta.cvv ?? ""}
                    onChange={(v) => setFormTarjeta((p) => ({ ...p, cvv: v }))}
                    placeholder="Opcional"
                  />

                  <div className="flex items-end gap-2">
                    <label className="text-sm text-gray-700">Activa</label>
                    <input
                      type="checkbox"
                      checked={toBool(formTarjeta.activa)}
                      onChange={(e) =>
                        setFormTarjeta((p) => ({ ...p, activa: e.target.checked }))
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Titular"
                    value={formTitular.Titular ?? ""}
                    onChange={(v) => setFormTitular((p) => ({ ...p, Titular: v }))}
                    placeholder="Nombre del titular"
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-700">Identificación (PDF)</label>

                    <InputToS3
                      setUrl={(url) => {
                        setFormTitular((p) => ({
                          ...p,
                          identificacion: url,
                        }));
                      }}
                    />

                    <div className="flex items-center justify-between gap-2">
                      {formTitular.identificacion ? (
                        <a
                          className="text-blue-600 hover:underline text-xs"
                          href={String(formTitular.identificacion)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">Sin archivo</span>
                      )}

                      {formTitular.identificacion ? (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border bg-gray-50 hover:bg-gray-100"
                          onClick={() => setFormTitular((p) => ({ ...p, identificacion: null }))}
                          disabled={saving}
                        >
                          Quitar
                        </button>
                      ) : null}
                    </div>

                    <p className="text-xs text-gray-400">
                      Sube un PDF y se guardará su URL en el titular.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={closeModal}
                  className="text-sm px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSubmit}
                  className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={saving || !canSubmitCurrent}
                  title={!canSubmitCurrent ? "No tienes permiso para esta acción" : undefined}
                >
                  {saving ? "Guardando..." : mode === "create" ? "Crear" : "Guardar cambios"}
                </button>
              </div>

              <p className="text-xs text-gray-500">
                {view === "tarjetas"
                  ? "Para update/delete se usa el id (UUID) en la URL y el body solo lleva campos editables."
                  : "Para update/delete se usa idTitular (INT) en la URL y el body puede llevar Titular/identificacion."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
