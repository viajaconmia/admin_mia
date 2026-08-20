"use client";

import React from "react";

import { useFormContext } from "@/context/FormContext";

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;

  min?: number;
  max?: number;

  maxDecimals?: number;
}

export default function FormField({
  name,
  label,
  type = "text",
  placeholder,
  min,
  max,
  maxDecimals,
}: FormFieldProps) {
  const { values, errors, setValue } = useFormContext<Record<string, any>>();

  // ============================================
  // CAMBIO DEL INPUT
  // ============================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.value;

    // ============================================
    // INPUT NUMÉRICO
    // ============================================

    if (type === "number") {
      // Permitir borrar todo el contenido
      if (nuevoValor === "") {
        setValue(name, "");
        return;
      }

      // Solo permite:
      //
      // 10
      // 10.
      // 10.5
      // 10.25
      //
      // No permite:
      //
      // letras
      // -
      // +
      // e
      // más de un punto
      if (!/^\d*\.?\d*$/.test(nuevoValor)) {
        return;
      }

      // ==========================================
      // LIMITAR DECIMALES
      // ==========================================

      if (maxDecimals !== undefined) {
        const partes = nuevoValor.split(".");

        const decimales = partes[1];

        if (decimales !== undefined && decimales.length > maxDecimals) {
          return;
        }
      }

      const numero = Number(nuevoValor);

      // ==========================================
      // VALIDAR MÍNIMO
      // ==========================================

      if (min !== undefined && numero < min) {
        return;
      }

      // ==========================================
      // VALIDAR MÁXIMO
      // ==========================================

      if (max !== undefined && numero > max) {
        return;
      }
    }

    setValue(name, nuevoValor);
  };

  return (
    <div className="flex w-full flex-col gap-1">
      {/* LABEL */}

      <label htmlFor={name} className="text-xs font-semibold text-gray-700">
        {label}
      </label>

      {/* INPUT */}

      <input
        id={name}
        name={name}
        /*
          Aunque desde afuera mandamos:
          
          type="number"

          internamente usamos text para tener control
          total sobre lo que puede escribir el usuario.
        */
        type={type === "number" ? "text" : type}
        /*
          En celular mostrará teclado numérico
          con punto decimal.
        */
        inputMode={type === "number" ? "decimal" : undefined}
        value={values[name] ?? ""}
        placeholder={placeholder}
        onChange={handleChange}
        className="
          h-10
          w-full
          rounded-md
          border
          border-gray-300
          bg-white
          px-3
          text-sm
          text-gray-900
          outline-none
          transition
          placeholder:text-gray-400
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
      />

      {/* ERROR DEL FORM CONTEXT */}

      {errors?.[name] && (
        <span className="text-xs font-medium text-red-600">
          {String(errors[name])}
        </span>
      )}
    </div>
  );
}
