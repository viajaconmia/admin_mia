"use client";

import { useState } from "react";

import { TextInput } from "../atom/Input";
import Modal from "./Modal";

import { formatMoneyMXN } from "@/helpers/formater";

interface CotizadorProps {
  onClose: () => void;
}

const VALOR_BASE_NOKTO = 168.2;
const MARGEN_BASE_PORCENTAJE = 13;

function calcularCotizacionInterna(precioProveedorInput: string) {
  const precioProveedor = parseFloat(precioProveedorInput);

  if (!precioProveedor || Number.isNaN(precioProveedor)) {
    return {
      noktos: 0,
      costo: 0,
      porcentaje: 0,
    };
  }

  const margen = MARGEN_BASE_PORCENTAJE / 100;

  const noktosEstimados = (precioProveedor * (1 + margen)) / VALOR_BASE_NOKTO;

  let noktos = Math.floor(noktosEstimados);

  const margenReal =
    100 *
    (Number((VALOR_BASE_NOKTO * noktos).toFixed(1)) / precioProveedor - 1);

  if (Number(margenReal.toFixed(1)) < 100 * margen) {
    noktos += 1;
  }

  // ====================================================
  // COSTO
  //
  // Fórmula original:
  //
  // Math.ceil(168.2 * Noktos)
  //
  // Ejemplo:
  // 1 Nokto = 168.2 -> 169
  // 4 Noktos = 672.8 -> 673
  // ====================================================

  let costo = VALOR_BASE_NOKTO * noktos;

  if (Number.isNaN(costo)) {
    costo = 0;
  }

  // ====================================================
  // PORCENTAJE REAL
  // ====================================================

  let porcentaje = -100 * (precioProveedor / costo - 1);

  if (Number.isNaN(porcentaje)) {
    porcentaje = 0;
  }

  return {
    noktos,
    costo,
    porcentaje,
  };
}

// ======================================================
// COTIZADOR EXTERNO
//
// Aquí seguimos la fórmula del Excel:
//
// COSTO:
//
// precioProveedor
// --------------------
// 1 - porcentaje
//
// NOKTOS:
//
// ceil(costo / 168.2)
//
// Aquí el porcentaje SÍ afecta directamente el costo.
// ======================================================

function calcularCotizacionExterna(
  precioProveedorInput: string,
  porcentajeInput: string,
) {
  const precioProveedor = parseFloat(precioProveedorInput);

  const porcentaje = parseFloat(porcentajeInput);

  // ====================================================
  // VALIDAR PRECIO
  // ====================================================

  if (!precioProveedor || Number.isNaN(precioProveedor)) {
    return {
      noktos: 0,
      costo: 0,
    };
  }

  // ====================================================
  // VALIDAR PORCENTAJE
  // ====================================================

  if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje >= 100) {
    return {
      noktos: 0,
      costo: 0,
    };
  }

  // ====================================================
  // COSTO
  //
  // Fórmula de Excel:
  //
  // = B3 / (1 - C3)
  //
  // Ejemplo:
  //
  // Precio = 1000
  // Porcentaje = 20%
  //
  // 1000 / (1 - 0.20)
  // = 1250
  //
  // Si porcentaje cambia a 21:
  //
  // 1000 / (1 - 0.21)
  // = 1265.82
  //
  // EL COSTO SÍ CAMBIA.
  // ====================================================

  const noktos = Math.ceil(
    precioProveedor / (1 - porcentaje / 100) / VALOR_BASE_NOKTO,
  );
  const costo = noktos * VALOR_BASE_NOKTO;

  // ====================================================
  // NOKTOS
  //
  // Fórmula Excel:
  //
  // REDONDEAR.MAS(
  //   costo / (145 * 1.16),
  //   0
  // )
  //
  // 145 * 1.16 = 168.2
  // ====================================================

  return {
    noktos,
    costo,
  };
}

// ======================================================
// COMPONENTE
// ======================================================

export default function Cotizador({ onClose }: CotizadorProps) {
  // ====================================================
  // COTIZADOR INTERNO
  // ====================================================

  const [precioProveedorInterno, setPrecioProveedorInterno] = useState("");

  const cotizacionInterna = calcularCotizacionInterna(precioProveedorInterno);

  // ====================================================
  // COTIZADOR EXTERNO
  // ====================================================

  const [precioProveedorExterno, setPrecioProveedorExterno] = useState("");

  const [porcentajeExterno, setPorcentajeExterno] = useState("");

  const cotizacionExterna = calcularCotizacionExterna(
    precioProveedorExterno,
    porcentajeExterno,
  );

  // ====================================================
  // VALIDAR PORCENTAJE
  // ====================================================

  const cambiarPorcentajeExterno = (value: string) => {
    if (value === "") {
      setPorcentajeExterno("");
      return;
    }

    const numero = Number(value);

    if (!Number.isNaN(numero) && numero >= 0 && numero < 100) {
      setPorcentajeExterno(value);
    }
  };

  // ====================================================
  // JSX
  // ====================================================

  return (
    <Modal onClose={onClose}>
      <div className="w-[95vw] max-w-6xl overflow-visible rounded-xl bg-white p-4">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Cotización</h2>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* ==================================================
              COTIZADOR INTERNO
          ================================================== */}

          <div className="overflow-hidden rounded-md border border-gray-300">
            {/* TITULO */}

            <div className="bg-blue-900 px-3 py-3 text-center">
              <h3 className="font-bold text-white">Cotizador Interno</h3>
            </div>

            {/* ==================================================
                PRECIO PROVEEDOR
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr] border-b border-gray-300">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Costo proveedor
              </div>

              <div className="flex items-center gap-2 bg-white p-2">
                <span className="w-4 text-center text-sm text-gray-500">$</span>

                <TextInput
                  value={precioProveedorInterno}
                  onChange={setPrecioProveedorInterno}
                  type="number"
                  placeholder="0.00"
                  className="flex-1"
                />
              </div>
            </div>

            {/* ==================================================
                NOKTOS
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr] border-b border-gray-300">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Noktos
              </div>

              <div className="bg-gray-100 p-2">
                <TextInput value={String(cotizacionInterna.noktos)} disabled />
              </div>
            </div>

            {/* ==================================================
                COSTO
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr] border-b border-gray-300">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Precio cliente
              </div>

              <div className="bg-gray-100 p-2">
                <TextInput
                  value={formatMoneyMXN(cotizacionInterna.costo)}
                  disabled
                />
              </div>
            </div>

            {/* ==================================================
                PORCENTAJE
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr]">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Porcentaje
              </div>

              <div className="bg-gray-100 p-2">
                <TextInput
                  value={`${cotizacionInterna.porcentaje.toFixed(2)}%`}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* ==================================================
              COTIZADOR EXTERNO
          ================================================== */}

          <div className="overflow-hidden rounded-md border border-gray-300">
            {/* TITULO */}

            <div className="bg-blue-900 px-3 py-3 text-center">
              <h3 className="font-bold text-white">Cotizador Externo</h3>
            </div>

            {/* ==================================================
                Costo proveedor
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr] border-b border-gray-300">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Costo proveedor
              </div>

              <div className="flex items-center gap-2 bg-white p-2">
                <span className="w-4 text-center text-sm text-gray-500">$</span>

                <TextInput
                  value={precioProveedorExterno}
                  onChange={setPrecioProveedorExterno}
                  type="number"
                  placeholder="0.00"
                  className="flex-1"
                />
              </div>
            </div>

            {/* ==================================================
                NOKTOS
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr] border-b border-gray-300">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Noktos
              </div>

              <div className="bg-gray-100 p-2">
                <TextInput value={String(cotizacionExterna.noktos)} disabled />
              </div>
            </div>

            {/* ==================================================
                COSTO

                ESTE SÍ CAMBIA DIRECTAMENTE
                CON EL PORCENTAJE
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr] border-b border-gray-300">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Precio cliente
              </div>

              <div className="bg-gray-100 p-2">
                <TextInput
                  value={formatMoneyMXN(cotizacionExterna.costo)}
                  disabled
                />
              </div>
            </div>

            {/* ==================================================
                PORCENTAJE EDITABLE
            ================================================== */}

            <div className="grid grid-cols-[200px_1fr]">
              <div className="flex items-center justify-center bg-blue-900 px-3 py-2 text-center text-sm font-semibold text-white">
                Porcentaje
              </div>

              <div className="flex items-center gap-2 bg-white p-2">
                <TextInput
                  value={porcentajeExterno}
                  onChange={cambiarPorcentajeExterno}
                  type="number"
                  placeholder="0"
                  className="flex-1"
                />

                <span className="w-4 text-center text-sm text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            VALOR NOKTO
        ================================================== */}
      </div>
    </Modal>
  );
}
