"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { ROUTES } from "@/constant/routes";

type TipoAcceso = "finanzas" | "operaciones" | "ambos" | "ninguno";

export interface Tarjeta {
  id: string;
  alias: string | null;
  ultimos_4: string | null;
  numero_completo: string | null;
  banco_emisor: string | null;
  tipo_tarjeta: string | null;
  fecha_vencimiento: string | null;
  activa: boolean | number;
  cvv: string | null;
  nombre_titular?: string | null;
  activa_finanzas: boolean | number;
  finanzas_operaciones?: TipoAcceso | null;
}

type Mode = "create" | "edit";

const TARJETAS_ENDPOINT = `${URL}/mia/pagar`;
const BASE_ENDPOINT = `${URL}/mia/pagar/finanzas`;

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
  nombre_titular: "",
  numero_completo: "",
  ultimos_4: "",
  banco_emisor: "",
  tipo_tarjeta: "",
  fecha_vencimiento: "",
  activa: true,
  cvv: "",
  activa_finanzas: true,
  finanzas_operaciones: "finanzas",
});

async function fetchJSON<T>(input: RequestInfo, init: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Error HTTP: ${res.status}`);
  }
  return (await res.json()) as T;
}

export default function TarjetasFinanzas() {
  const router = useRouter();
  const { hasPermission } = usePermiso();

  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingTarjetaId, setEditingTarjetaId] = useState<string | null>(null);
  const [formTarjeta, setFormTarjeta] =
    useState<Partial<Tarjeta>>(emptyFormTarjeta());

  const canView = hasPermission(PERMISOS.VISTAS.FINANZAS_TARJETAS);
  const canCreate = hasPermission(
    PERMISOS.COMPONENTES.BOTON.FINANZAS_TARJETAS_CREAR,
  );
  const canEdit = hasPermission(
    PERMISOS.COMPONENTES.BOTON.FINANZAS_TARJETAS_EDITAR,
  );
  const canDelete = hasPermission(
    PERMISOS.COMPONENTES.BOTON.FINANZAS_TARJETAS_ELIMINAR,
  );

  useEffect(() => {
    if (!canView) router.push(ROUTES.DASHBOARD.UNAUTHORIZED);
  }, [canView, router]);

  const fetchTarjetas = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchJSON<any[]>(BASE_ENDPOINT, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        credentials: "include",
      });
      const normalized = Array.isArray(data)
        ? data.map((t) => ({
            ...t,
            activa: toBool(t.activa),
            activa_finanzas: toBool(t.activa_finanzas),
            finanzas_operaciones: t["finanzas/operaciones"] ?? null,
          }))
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

  useEffect(() => {
    if (!canView) return;
    fetchTarjetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const closeModal = () => {
    setModalOpen(false);
    setSaving(false);
    setErrorMsg(null);
  };

  const openCreateTarjeta = () => {
    if (!canCreate) return;
    setMode("create");
    setEditingTarjetaId(null);
    setFormTarjeta(emptyFormTarjeta());
    setModalOpen(true);
  };

  const openEditTarjeta = (t: Tarjeta) => {
    if (!canEdit) return;
    setMode("edit");
    setEditingTarjetaId(t.id);
    setFormTarjeta({
      id: t.id,
      alias: t.alias ?? "",
      nombre_titular: t.nombre_titular ?? "",
      numero_completo: t.numero_completo ?? "",
      ultimos_4: t.ultimos_4 ?? computeLast4(t.numero_completo ?? ""),
      banco_emisor: t.banco_emisor ?? "",
      tipo_tarjeta: t.tipo_tarjeta ?? "",
      fecha_vencimiento: t.fecha_vencimiento ?? "",
      activa: toBool(t.activa),
      cvv: t.cvv ?? "",
      activa_finanzas: toBool(t.activa_finanzas),
      finanzas_operaciones: t.finanzas_operaciones ?? "finanzas",
    });
    setModalOpen(true);
  };

  const buildTarjetaPayload = () => {
    const payload: any = {
      alias: formTarjeta.alias ?? null,
      nombre_titular: formTarjeta.nombre_titular ?? null,
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
      activa_finanzas: toBool(formTarjeta.activa_finanzas) ? 1 : 0,
      "finanzas/operaciones": formTarjeta.finanzas_operaciones ?? null,
    };
    for (const k of Object.keys(payload)) {
      if (payload[k] === "") payload[k] = null;
    }
    return payload;
  };

  const handleToggleActivaFinanzas = async (t: Tarjeta) => {
    if (!canEdit) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      await fetchJSON(`${BASE_ENDPOINT}/${t.id}/activa`, {
        method: "PATCH",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ activa_finanzas: !toBool(t.activa_finanzas) }),
      });
      await fetchTarjetas();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error al cambiar activa_finanzas");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTarjeta = async (t: Tarjeta) => {
    if (!canDelete) return;
    const ok = confirm(
      `¿Eliminar la tarjeta "${t.alias ?? "Sin alias"}" (${maskCard(t.numero_completo, t.ultimos_4)})?`,
    );
    if (!ok) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      await fetchJSON(`${BASE_ENDPOINT}/${t.id}`, {
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
    if (mode === "create" && !canCreate) return;
    if (mode === "edit" && !canEdit) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      const payload = buildTarjetaPayload();
      if (mode === "create") {
        await fetchJSON(TARJETAS_ENDPOINT, {
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
        await fetchJSON(`${BASE_ENDPOINT}/${editingTarjetaId}`, {
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

  const registros = useMemo(
    () =>
      tarjetas.map((t) => ({
        id: t.id,
        alias: t.alias ?? "—",
        nombre_titular: (t as any).nombre_titular ?? "—",
        tarjeta: maskCard(t.numero_completo, t.ultimos_4),
        banco_emisor: t.banco_emisor ?? "—",
        tipo_tarjeta: t.tipo_tarjeta ?? "—",
        fecha_vencimiento: t.fecha_vencimiento ?? "—",
        activa: toBool(t.activa),
        activa_finanzas: toBool(t.activa_finanzas),
        finanzas_operaciones: t.finanzas_operaciones ?? "—",
        acciones: t,
        item: t,
      })),
    [tarjetas],
  );

  const renderers: {
    [key: string]: React.FC<{ value: any; item: any; index: number }>;
  } = useMemo(
    () => ({
      tarjeta: ({ value }) => (
        <div className="flex justify-center text-center">{value ?? "—"}</div>
      ),
      banco_emisor: ({ value }) => (
        <div className="flex justify-center text-center">{value ?? "—"}</div>
      ),
      tipo_tarjeta: ({ value }) => (
        <div className="flex justify-center text-center">{value ?? "—"}</div>
      ),
      fecha_vencimiento: ({ value }) => (
        <div className="flex justify-center text-center">{value ?? "—"}</div>
      ),

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
              {ok ? "Activa Ops ✓" : "Activa Ops ✗"}
            </span>
          </div>
        );
      },

      activa_finanzas: ({ value, item }) => {
        const ok = toBool(value);
        return (
          <div className="flex justify-center">
            <button
              type="button"
              disabled={!canEdit || saving}
              onClick={() => handleToggleActivaFinanzas(item.item ?? item)}
              className={`text-xs font-semibold px-2 py-1 rounded border transition-colors ${
                ok
                  ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  : "bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={ok ? "Desactivar para finanzas" : "Activar para finanzas"}
            >
              {ok ? "Usar finanzas ✓" : "Usar finanzas ✗"}
            </button>
          </div>
        );
      },

      finanzas_operaciones: ({ value }) => {
        const colorMap: Record<string, string> = {
          finanzas: "bg-blue-50 text-blue-700 border-blue-300",
          operaciones: "bg-orange-50 text-orange-700 border-orange-300",
          ambos: "bg-purple-50 text-purple-700 border-purple-300",
          ninguno: "bg-gray-50 text-gray-500 border-gray-300",
        };
        const cls =
          colorMap[value] ?? "bg-gray-50 text-gray-500 border-gray-300";
        return (
          <div className="flex justify-center">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded border ${cls}`}
            >
              {value ?? "—"}
            </span>
          </div>
        );
      },

      acciones: ({ value }) => {
        const t: Tarjeta = value as Tarjeta;
        if (!canEdit && !canDelete)
          return <span className="text-gray-400">—</span>;
        return (
          <div className="flex gap-2 justify-center">
            {canEdit && (
              <button
                type="button"
                onClick={() => openEditTarjeta(t)}
                className="px-2 py-1 rounded text-xs border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                disabled={saving}
              >
                Editar
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => handleDeleteTarjeta(t)}
                className="px-2 py-1 rounded text-xs border bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                disabled={saving}
              >
                Eliminar
              </button>
            )}
          </div>
        );
      },
    }),
    [saving, canEdit, canDelete, tarjetas],
  );

  const customColumns = [
    "tarjeta",
    "banco_emisor",
    "fecha_vencimiento",
    "activa",
    "activa_finanzas",
    "finanzas_operaciones",
    "acciones",
  ];

  if (!canView) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-gray-800">
              Tarjetas — Finanzas
            </h2>

            <div className="flex gap-2">
              <button
                onClick={fetchTarjetas}
                className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                disabled={isLoading || saving}
              >
                Recargar
              </button>

              {canCreate && (
                <button
                  onClick={openCreateTarjeta}
                  className="text-sm px-3 py-1 rounded text-white bg-emerald-600 hover:bg-emerald-700"
                  disabled={saving}
                >
                  Crear tarjeta
                </button>
              )}
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
              Cargando tarjetas...
            </div>
          ) : (
            <Table5<any>
              registros={registros}
              renderers={renderers}
              exportButton={true}
              leyenda={`Mostrando ${registros.length} registro(s)`}
              maxHeight="65vh"
              customColumns={customColumns}
              respectCustomColumnOrder
            />
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[85vh] overflow-auto">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {mode === "create" ? "Crear tarjeta" : "Editar tarjeta"}
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
              <div className="grid grid-cols-1 gap-3">
                <Field
                  label="Alias"
                  value={formTarjeta.alias ?? ""}
                  onChange={(v) => setFormTarjeta((p) => ({ ...p, alias: v }))}
                />
                {mode === "create" && (
                  <>
                    <Field
                      label="Nombre titular"
                      value={formTarjeta.nombre_titular ?? ""}
                      onChange={(v) =>
                        setFormTarjeta((p) => ({ ...p, nombre_titular: v }))
                      }
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
                      placeholder="Opcional"
                    />

                    <Field
                      label="Últimos 4"
                      value={formTarjeta.ultimos_4 ?? ""}
                      onChange={(v) =>
                        setFormTarjeta((p) => ({ ...p, ultimos_4: v }))
                      }
                      placeholder="Se calcula automático"
                    />

                    <Field
                      label="Banco emisor"
                      value={formTarjeta.banco_emisor ?? ""}
                      onChange={(v) =>
                        setFormTarjeta((p) => ({ ...p, banco_emisor: v }))
                      }
                    />

                    <Field
                      label="Tipo tarjeta"
                      value={formTarjeta.tipo_tarjeta ?? ""}
                      onChange={(v) =>
                        setFormTarjeta((p) => ({ ...p, tipo_tarjeta: v }))
                      }
                      placeholder="crédito / débito / etc"
                    />

                    <Field
                      label="Fecha vencimiento"
                      value={formTarjeta.fecha_vencimiento ?? ""}
                      onChange={(v) =>
                        setFormTarjeta((p) => ({ ...p, fecha_vencimiento: v }))
                      }
                      placeholder="Ej: 12/27"
                    />

                    <Field
                      label="CVV"
                      value={formTarjeta.cvv ?? ""}
                      onChange={(v) =>
                        setFormTarjeta((p) => ({ ...p, cvv: v }))
                      }
                      placeholder="Opcional"
                    />
                  </>
                )}

                {/* finanzas/operaciones */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-700">
                    Acceso (finanzas/operaciones)
                  </label>
                  <select
                    className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    value={formTarjeta.finanzas_operaciones ?? "finanzas"}
                    onChange={(e) =>
                      setFormTarjeta((p) => ({
                        ...p,
                        finanzas_operaciones: e.target.value as TipoAcceso,
                      }))
                    }
                  >
                    <option value="finanzas">Finanzas</option>
                    <option value="operaciones">Operaciones</option>
                    <option value="ambos">Ambos</option>
                    <option value="ninguno">Ninguno</option>
                  </select>
                </div>

                {/* activa */}
                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">
                      Activa Operaciones
                    </label>
                    <input
                      type="checkbox"
                      checked={toBool(formTarjeta.activa)}
                      onChange={(e) =>
                        setFormTarjeta((p) => ({
                          ...p,
                          activa: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">
                      Usar finanzas
                    </label>
                    <input
                      type="checkbox"
                      checked={toBool(formTarjeta.activa_finanzas)}
                      onChange={(e) =>
                        setFormTarjeta((p) => ({
                          ...p,
                          activa_finanzas: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={closeModal}
                  className="text-sm px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSubmitTarjeta}
                  className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={
                    saving || (mode === "create" ? !canCreate : !canEdit)
                  }
                  title={
                    (mode === "create" ? !canCreate : !canEdit)
                      ? "No tienes permiso para esta acción"
                      : undefined
                  }
                >
                  {saving
                    ? "Guardando..."
                    : mode === "create"
                      ? "Crear"
                      : "Guardar cambios"}
                </button>
              </div>
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
