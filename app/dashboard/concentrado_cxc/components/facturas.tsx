"use client";

import React, { useState } from "react";
import { Table5 } from "@/components/Table5";
import { DetalleFacturaModal } from "./detalles_modal";
import { formatDate } from "@/helpers/utils";
import { PagarModalComponent } from "@/components/template/pagar_saldo";
import { URL, API_KEY } from "@/lib/constants/index";

/* ─────────────────────────────
   Tipos reutilizables
────────────────────────────── */

export interface Factura {
  rfc: string;
  saldo: number;
  total: number;
  estado: string;
  url_pdf: string | null;
  url_xml: string | null;
  subtotal: number;
  id_agente: string | null;
  impuestos: number;
  created_at: string;
  id_empresa: string;
  id_factura: string;
  rfc_emisor: string | null;
  updated_at: string;
  id_facturama: string | null;
  uuid_factura: string;
  fecha_emision: string;
  usuario_creador: string | null;
  fecha_vencimiento: string | null;
  diasRestantes: number;
  diasCredito: number;
  [key: string]: any;
}

/* ─────────────────────────────
   Props del modal principal
────────────────────────────── */

export interface DetallesFacturasProps {
  open: boolean;
  onClose: () => void;
  agente: {
    id_agente: string | null;
  } | null;
  facturas: Factura[];
  money: (n: number) => string;
  pagoData?:any;

  /** Abre el modal de detalle de factura */
  onOpenFacturaDetalle?: (factura: Factura) => void;

  /** Funciones para descargar facturas - OPCIONALES */
  descargarFactura?: (id: string) => Promise<{ Content: string }>;
  descargarFacturaXML?: (id: string) => Promise<{ Content: string }>;
  downloadFile?: (url: string, filename: string) => void;
}


export const DetallesFacturas: React.FC<DetallesFacturasProps> = ({
  open,
  onClose,
  agente,
  facturas,
  pagoData,
  money,
  onOpenFacturaDetalle,
  // Estas props son opcionales y se pasan al modal de detalle
  descargarFactura,
  descargarFacturaXML,
  downloadFile,
}) => {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(
    null
  );
  const [selectedFacturas, setSelectedFacturas] = useState<Set<string>>(
    new Set()
  );
  const [facturaData, setFacturaData] = useState<any[] | null>(null);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  if (!open) return null;

  /* ────────────────
     Manejo de detalle
  ───────────────── */

  const handleOpenDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setDetalleAbierto(true);

    if (onOpenFacturaDetalle) {
      onOpenFacturaDetalle(factura);
    }
  };

  const handleCloseDetalle = () => {
    setDetalleAbierto(false);
  };

  const handleCloseAll = () => {
    setDetalleAbierto(false);
    setFacturaSeleccionada(null);
    onClose();
  };

  /* ────────────────
     Selección de facturas
  ───────────────── */

  const handleSelectFactura = (id: string, idAgente: string) => {
    setSelectedFacturas((prevSelected) => {
      const newSelected = new Set(prevSelected);
      const wasSelected = newSelected.has(id);

      if (wasSelected) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }

      // Validar que todas las seleccionadas sean del mismo agente
      const seleccionadas = facturas.filter((f) =>
        newSelected.has(f.id_factura)
      );
      const allSameAgent = seleccionadas.every(
        (f) => f.id_agente === idAgente
      );

      if (!allSameAgent) {
        // Revertimos esta última selección si mezcla agentes
        if (!wasSelected) newSelected.delete(id);
        return new Set(newSelected);
      }

      return newSelected;
    });
  };

  const handleDeseleccionarPagos = () => {
    setSelectedFacturas(new Set());
    setFacturaData(null);
    setShowPagarModal(false);
  };

  /* ────────────────
     Crear facturaData y abrir modal de pago
  ───────────────── */

  const handlePagos = () => {
    console.log(facturas,"facturads elegidas")
    const facturasSeleccionadas = facturas.filter((f) =>
      selectedFacturas.has(f.id_factura)
    );


    if (facturasSeleccionadas.length > 0) {
      const datosFacturas = facturasSeleccionadas.map((f) => ({
        monto: f.total,
        saldo: f.saldo,
        facturaSeleccionada: f,
        id_agente: f.id_agente,
        agente: f.nombre_agente, // viene por [key: string]: any;
      }));
      const payload = datosFacturas, pagoData;

      setFacturaData(datosFacturas);   // 👈 aquí se crea y guarda facturaData
      if (pagoData) {
            try {
      const response = await fetch(`${URL}/mia/pagos/aplicarpagoPorSaldoAFavor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error al aplicar el pago por saldo a favor");
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      // Llamar a onSubmit si está definido
      if (onSubmit) {
        onSubmit({
          ...pagoData,
          facturasAsignados: selectedItems,
        });
      }

      // Cerrar el modal después de enviar
      onClose();
    } catch (error) {
      console.error("Error en la petición:", error);
    }
      }else{
        setShowPagarModal(true);  
      }       // 👈 aquí se "llama" el modal de pago
    }
  };

  /* ────────────────
     Registros para Table5
  ───────────────── */

  const registros = facturas.map((f) => ({
    id_factura: f.id_factura, // usado internamente, no se muestra
    uuid_factura: f.uuid_factura,
    fecha_emision: f.fecha_emision,
    fecha_vencimiento: f.fecha_vencimiento,
    rfc: f.rfc,
    total: f.total,
    saldo: f.saldo,
    dias_a_credito: f.diasCredito,
    dias_restantes: f.diasRestantes,
    seleccionar:f,
    item: f,
  }));

  /* ────────────────
     Renderers de columnas
  ───────────────── */

  const renderers: {
    [key: string]: React.FC<{ value: any; item: any; index: number }>;
  } = {
    // Botón "Seleccionar / Seleccionada" por fila
    seleccionar: ({ item }) => {
      const selected = selectedFacturas.has(item.id_factura);

      return (
        <button
          type="button"
          onClick={() =>
            handleSelectFactura(item.id_factura, item.id_agente || "")
          }
          className={`px-2 py-1 rounded text-[11px] md:text-xs border ${
            selected
              ? "bg-emerald-50 text-emerald-700 border-emerald-500"
              : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          {selected ? "Seleccionada" : "Seleccionar"}
        </button>
      );
    },

    uuid_factura: ({ value, item }) => (
      <button
        type="button"
        onClick={() => handleOpenDetalle(item as Factura)}
        className="font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] md:text-xs transition-colors"
        title={value}
      >
        <span>{value}</span>
      </button>
    ),

    rfc: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-gray-700">{value || "—"}</span>
      </div>
    ),

    fecha_emision: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-gray-600">{formatDate(value ?? null)}</span>
      </div>
    ),

    fecha_vencimiento: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-gray-600">{formatDate(value ?? null)}</span>
      </div>
    ),

    total: ({ value }) => (
      <div className="flex justify-end">
        <span className="font-bold text-blue-600">
          {money(parseFloat(value) || 0)}
        </span>
      </div>
    ),

    saldo: ({ value, item }) => {
      const saldo = parseFloat(value) || 0;
      const total = parseFloat(item.total) || 0;
      const porcentajePagado = total > 0 ? ((total - saldo) / total) * 100 : 0;
      const vencido = (item.diasRestantes ?? 0) <= 0;

      return (
        <div className="flex flex-col items-end gap-1">
          <span
            className={`font-bold ${
              !vencido ? "text-green-600" : "text-red-500"
            }`}
          >
            {money(saldo)}
          </span>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`${
                !vencido ? "bg-green-600" : "bg-red-600"
              } h-1.5 rounded-full`}
              style={{
                width: `${100 - porcentajePagado}%`,
              }}
            />
          </div>
        </div>
      );
    },

    dias_a_credito: ({ value }) => (
      <div className="flex justify-center">
        <span className="text-xs text-gray-700">{value ?? "—"}</span>
      </div>
    ),

    dias_restantes: ({ value }) => {
      const dias = Number(value ?? 0);
      const vencida = dias <= 0;

      return (
        <div className="flex justify-center">
          <span
            className={`text-xs font-semibold ${
              vencida ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {vencida ? "Vencida" : `${dias} día(s)`}
          </span>
        </div>
      );
    },
  };

  return (
    <>
      {/* Modal principal de facturas */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Facturas del cliente
              </h2>
              {agente && (
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-semibold">
                    {agente.id_agente ?? ""}
                  </span>
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Body */}
          <div className="p-4 flex-1 overflow-auto">
            {facturas.length === 0 ? (
              <p className="text-sm text-gray-500">
                Este agente no tiene facturas pendientes.
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-2">
                  <Table5<any>
                    registros={registros}
                    renderers={renderers}
                    exportButton={true}
                    leyenda={`Mostrando ${facturas.length} factura(s)`}
                    maxHeight="60vh"
                    customColumns={[
                      "seleccionar", // 👈 botón Seleccionar
                      "rfc",
                      "uuid_factura",
                      "fecha_emision",
                      "total",
                      "saldo",
                      "dias_a_credito",
                      "dias_restantes",
                      "fecha_vencimiento",
                    ]}
                  >
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                      onClick={handlePagos}
                      disabled={selectedFacturas.size === 0}
                    >
                      Asignar Pago
                    </button>
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                      onClick={handleDeseleccionarPagos}
                      disabled={selectedFacturas.size === 0}
                    >
                      Deseleccionar pagos
                    </button>
                  </Table5>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Factura */}
      <DetalleFacturaModal
        open={detalleAbierto}
        factura={facturaSeleccionada}
        onClose={handleCloseDetalle}
        onCloseAll={handleCloseAll}
        formatDate={formatDate}
        money={money}
        downloadFile={downloadFile}
      />

      {/* Modal de pago usando facturaData */}
      {showPagarModal && facturaData && (
              <PagarModalComponent
                onClose={() => setShowPagarModal(false)}
                facturaData={facturaData}
                open={showPagarModal}
              />
            )}
    </>
  );
};

/* Si quieres que este sea el default: */
export default DetallesFacturas;
