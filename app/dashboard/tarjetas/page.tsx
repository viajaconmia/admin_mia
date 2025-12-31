"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Table5 } from "@/components/Table5";
import { URL, API_KEY } from "@/lib/constants/index";

export interface Tarjeta {
  id: string;
  alias: string | null;
  nombre_titular: string | null;
  ultimos_4: string | null;
  numero_completo: string | null;
  banco_emisor: string | null;
  tipo_tarjeta: string | null;
  fecha_vencimiento: string | null; // varchar(10) (ej: "12/27" o "2027-12")
  activa: boolean | number;         // el back te lo puede dar como tinyint o boolean
  cvv: string | null;
  url_identificacion: string | null;
}

type Mode = "create" | "edit";

const BASE_ENDPOINT = `${URL}/mia/pagar/`;

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

const emptyForm = (): Partial<Tarjeta> => ({
  alias: "",
  nombre_titular: "",
  numero_completo: "",
  ultimos_4: "",
  banco_emisor: "",
  tipo_tarjeta: "",
  fecha_vencimiento: "",
  activa: true,
  cvv: "",
  url_identificacion: "",
});

export default function TarjetasCrudTable5() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Tarjeta>>(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchTarjetas = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(BASE_ENDPOINT, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Error HTTP: ${res.status}`);
      }

      const data = (await res.json()) as Tarjeta[];
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

  useEffect(() => {
    fetchTarjetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Table5: registros + renderers
  // -------------------------
  const registros = useMemo(() => {
    return (tarjetas || []).map((t) => ({
      id: t.id,
      alias: t.alias ?? "—",
      nombre_titular: t.nombre_titular ?? "—",
      tarjeta: maskCard(t.numero_completo, t.ultimos_4),
      banco_emisor: t.banco_emisor ?? "—",
      tipo_tarjeta: t.tipo_tarjeta ?? "—",
      fecha_vencimiento: t.fecha_vencimiento ?? "—",
      activa: toBool(t.activa),
      url_identificacion: t.url_identificacion,
      acciones: t, // pasamos el objeto completo a renderer de acciones
      item: t,
    }));
  }, [tarjetas]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (t: Tarjeta) => {
    setMode("edit");
    setEditingId(t.id);
    setForm({
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
      url_identificacion: t.url_identificacion ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSaving(false);
    setErrorMsg(null);
  };

  const handleDelete = async (t: Tarjeta) => {
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

      const res = await fetch(`${BASE_ENDPOINT}${t.id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Error HTTP: ${res.status}`);
      }

      await fetchTarjetas();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error al eliminar tarjeta");
    } finally {
      setSaving(false);
    }
  };

  const buildPayload = () => {
    // id NO se manda para update (va en URL). Para insert, puede omitirse y que el back lo genere.
    const payload: any = {
      alias: form.alias ?? null,
      nombre_titular: form.nombre_titular ?? null,
      numero_completo: form.numero_completo ?? null,
      // si no viene ultimos_4, lo calculamos; si viene, lo respetamos
      ultimos_4:
        (form.ultimos_4 && String(form.ultimos_4).slice(-4)) ||
        (form.numero_completo ? computeLast4(String(form.numero_completo)) : null),
      banco_emisor: form.banco_emisor ?? null,
      tipo_tarjeta: form.tipo_tarjeta ?? null,
      fecha_vencimiento: form.fecha_vencimiento ?? null,
      activa: toBool(form.activa) ? 1 : 0,
      cvv: form.cvv ?? null,
      url_identificacion: form.url_identificacion ?? null,
    };

    // Limpieza: si está vacío string => null
    for (const k of Object.keys(payload)) {
      if (payload[k] === "") payload[k] = null;
    }

    return payload;
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);

      const payload = buildPayload();

      if (mode === "create") {
        const res = await fetch(BASE_ENDPOINT, {
          method: "POST",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error HTTP: ${res.status}`);
        }
      } else {
        if (!editingId) throw new Error("No hay id para editar.");

        const res = await fetch(`${BASE_ENDPOINT}${editingId}`, {
          method: "PUT",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error HTTP: ${res.status}`);
        }
      }

      await fetchTarjetas();
      closeModal();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const renderers: {
    [key: string]: React.FC<{ value: any; item: any; index: number }>;
  } = {
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
      return (
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => openEdit(t)}
            className="px-2 py-1 rounded text-xs border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
            disabled={saving}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(t)}
            className="px-2 py-1 rounded text-xs border bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
            disabled={saving}
          >
            Eliminar
          </button>
        </div>
      );
    },
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow border">
        <div className="px-4 py-3 border-b ">
          <div className="flex gap-2">
            <button
              onClick={fetchTarjetas}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
              disabled={isLoading || saving}
            >
              Recargar
            </button>
            <button
              onClick={openCreate}
              className="text-sm px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={saving}
            >
              Crear tarjeta
            </button>
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
              leyenda={`Mostrando ${registros.length} tarjeta(s)`}
              maxHeight="65vh"
              customColumns={[
                "alias",
                "nombre_titular",
                "tarjeta",
                "banco_emisor",
                "tipo_tarjeta",
                "fecha_vencimiento",
                "activa",
                "url_identificacion",
                "acciones",
              ]}
            />
          )}
        </div>
      </div>

      {/* MODAL CREATE/EDIT */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Alias"
                  value={form.alias ?? ""}
                  onChange={(v) => setForm((p) => ({ ...p, alias: v }))}
                />
                <Field
                  label="Nombre titular"
                  value={form.nombre_titular ?? ""}
                  onChange={(v) => setForm((p) => ({ ...p, nombre_titular: v }))}
                />

                <Field
                  label="Número completo"
                  value={form.numero_completo ?? ""}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      numero_completo: v,
                      ultimos_4: computeLast4(v),
                    }))
                  }
                  placeholder="Opcional (si lo manejas)"
                />

                <Field
                  label="Últimos 4"
                  value={form.ultimos_4 ?? ""}
                  onChange={(v) => setForm((p) => ({ ...p, ultimos_4: v }))}
                  placeholder="Se calcula automático"
                />

                <Field
                  label="Banco emisor"
                  value={form.banco_emisor ?? ""}
                  onChange={(v) => setForm((p) => ({ ...p, banco_emisor: v }))}
                />

                <Field
                  label="Tipo tarjeta"
                  value={form.tipo_tarjeta ?? ""}
                  onChange={(v) => setForm((p) => ({ ...p, tipo_tarjeta: v }))}
                  placeholder="crédito / débito / etc"
                />

                <Field
                  label="Fecha vencimiento"
                  value={form.fecha_vencimiento ?? ""}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, fecha_vencimiento: v }))
                  }
                  placeholder="Ej: 12/27"
                />

                <Field
                  label="CVV"
                  value={form.cvv ?? ""}
                  onChange={(v) => setForm((p) => ({ ...p, cvv: v }))}
                  placeholder="Opcional"
                />

                <Field
                  label="URL identificación"
                  value={form.url_identificacion ?? ""}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, url_identificacion: v }))
                  }
                  placeholder="https://..."
                />

                <div className="flex items-end gap-2">
                  <label className="text-sm text-gray-700">Activa</label>
                  <input
                    type="checkbox"
                    checked={toBool(form.activa)}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, activa: e.target.checked }))
                    }
                    className="h-4 w-4"
                  />
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
                  onClick={handleSubmit}
                  className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : mode === "create" ? "Crear" : "Guardar cambios"}
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Para update/delete se usa el <span className="font-mono">id</span> en la URL y el body solo lleva campos editables.
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
