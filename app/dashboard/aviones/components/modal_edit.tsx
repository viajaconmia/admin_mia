"use client";

import React, { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

type FieldType = "text" | "number" | "textarea" | "select" | "date";

export type FieldConfig<T> = {
  name: keyof T & string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[]; // para selects
};

interface EditServiceModalProps<T> {
  title?: string;
  initialData: T;
  fields: FieldConfig<T>[];
  onSubmit: (values: Partial<T>) => Promise<void> | void;
  onClose: () => void;
}

export function EditServiceModal<T>({
  title = "Editar",
  initialData,
  fields,
  onSubmit,
  onClose,
}: EditServiceModalProps<T>) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar valores desde initialData solo para los campos de "fields"
  useEffect(() => {
    const init: Record<string, any> = {};
    fields.forEach((f) => {
      init[f.name] = (initialData as any)?.[f.name] ?? "";
    });
    setFormValues(init);
  }, [initialData, fields]);

  const handleChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: Partial<T> = {} as Partial<T>;
      fields.forEach((f) => {
        (payload as any)[f.name] = formValues[f.name];
      });
      await onSubmit(payload);
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Ocurrió un error al guardar los cambios. Inténtalo de nuevo."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="h-fit w-[95vw] max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        {/* Campos */}
        {fields.map((field) => {
          const fieldType = field.type || "text";
          const value = formValues[field.name] ?? "";

          if (fieldType === "textarea") {
            return (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <textarea
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              </div>
            );
          }

          if (fieldType === "select") {
            return (
              <div key={field.name} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <input
                type={
                  fieldType === "number"
                    ? "number"
                    : fieldType === "date"
                      ? "date"
                      : "text"
                }
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          );
        })}

        {/* Botones */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-white ${submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
