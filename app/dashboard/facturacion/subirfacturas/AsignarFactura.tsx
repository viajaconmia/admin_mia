"use client";

import React, { useEffect, useMemo, useState } from "react";
import { URL, API_KEY } from "@/lib/constants/index";
import { Table2 } from "@/components/organism/Table2";

interface AsignarFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  id_factura?: string;
  onAssign?: (payload: any) => void;
  onCloseVistaPrevia?: () => void;
  facturaData?: any;
  empresaSeleccionada?: any;
  clienteSeleccionado?: any;
  archivoPDFUrl?: string | null;
  archivoXMLUrl?: string | null;
  pagoData?: {
    monto: number;
    [key: string]: any;
  };
  saldo: number;
}

interface ReservaConItems {
  id_solicitud: string;
  id_hospedaje: string;
  id_booking: string;
  id_servicio: string;
  id_agente: string;
  id_viajero: string;
  id_hotel: string;
  agente: string;
  empresa: string | null;
  viajero: string;
  telefono_viajero: string | null;
  viajeros_adicionales_reserva: string | null;
  nombre_acompanantes_reserva: string | null;
  correo_cliente: string;
  telefono_cliente: string;
  quien_reservó: string;
  status_reserva: string;
  total_venta: string;
  subtotal_servicio: string;
  total_booking: string;
  check_in: string;
  check_out: string;
  confirmation_code: string;
  nombre_hotel: string;
  cadena_hotel: string | null;
  codigo_reservacion_hotel: string;
  tipo_cuarto: string;
  noches: number;
  is_rembolsable: string | null;
  monto_penalizacion: number | null;
  conciliado: string | null;
  credito: string | null;
  created_at: string;
  updated_at: string;
  comments: string;
  nuevo_incluye_desayuno: string | null;
  items_info: {
    items: Array<{
      id_item: string;
      total: number;
    }>;
  };
}

interface SelectedItem {
  id_item: string;
  saldo: number;
}

const sanitizeCodigoReservacionHotel = (codigo?: string | null) => {
  const v = String(codigo || "");
  return v.includes("_CANCEL_") ? "" : v;
};

const safeJsonParse = (raw: string) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AsignarFacturaModal: React.FC<AsignarFacturaProps> = ({
  isOpen,
  onClose,
  onAssign,
  onCloseVistaPrevia,
  facturaData,
  id_factura,
  clienteSeleccionado,
  pagoData,
  saldo,
}) => {
  const [montoSeleccionado, setMontoSeleccionado] = useState<number>(0);
  const [montoRestante, setMontoRestante] = useState<number>(0);

  const [reservas, setReservas] = useState<ReservaConItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const [maxMontoPermitido, setMaxMontoPermitido] = useState<number>(() => {
    if (pagoData?.monto) return Number(pagoData.monto) || 0;
    const total =
      facturaData?.comprobante?.total ?? facturaData?.total ?? saldo ?? 0;
    return typeof total === "number" ? total : Number(total) || 0;
  });

  useEffect(() => {
    if (pagoData?.monto) {
      setMaxMontoPermitido(Number(pagoData.monto) || 0);
    } else {
      const total =
        facturaData?.comprobante?.total ?? facturaData?.total ?? saldo ?? 0;
      setMaxMontoPermitido(typeof total === "number" ? total : Number(total) || 0);
    }
  }, [pagoData, facturaData, saldo]);

  useEffect(() => {
    const suma = selectedItems.reduce(
      (acc, it) => acc + (Number(it.saldo) || 0),
      0
    );
    setMontoSeleccionado(suma);
    setMontoRestante(Math.max(0, maxMontoPermitido - suma));
  }, [selectedItems, maxMontoPermitido]);

  useEffect(() => {
    if (isOpen && clienteSeleccionado) {
      fetchReservasConItems();
    }
    // opcional: limpiar selección cada vez que se abre
    if (isOpen) {
      setSelectedItems([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clienteSeleccionado]);

  const fetchReservasConItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const cliente =
        clienteSeleccionado?.id_agente === undefined
          ? String(clienteSeleccionado || "")
          : String(clienteSeleccionado?.id_agente || "");

      const endpoint = `${URL}/mia/reservas/reservasConItems?id_agente=${encodeURIComponent(
        cliente
      )}`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      });

      // ✅ LEER EL BODY SOLO UNA VEZ (evita: body stream already read)
      const raw = await response.text();
      const json = safeJsonParse(raw);

      if (!response.ok) {
        const msg =
          json?.message ||
          json?.error ||
          `Error al obtener reservas (HTTP ${response.status})`;
        throw new Error(msg);
      }

      // tu API manda: { message, data: [...] }
      const list = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : [];

      const filtered = list.filter(
        (r: ReservaConItems) => !isReservaCanceladaPorCodigo(r.codigo_reservacion_hotel)
      );

      setReservas(filtered);

    } catch (err: any) {
      console.error("Error fetching reservations:", err);
      setError(err?.message || "Error al cargar las reservas");
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (id_item: string, saldoItem: number) => {
    setSelectedItems((prev) => {
      const yaEsta = prev.some((i) => i.id_item === id_item);

      if (yaEsta) {
        return prev.filter((i) => i.id_item !== id_item);
      }

      const currentSum = prev.reduce(
        (acc, it) => acc + (Number(it.saldo) || 0),
        0
      );
      const candidateSum = currentSum + (Number(saldoItem) || 0);

      if (candidateSum > maxMontoPermitido) {
        alert(
          `No puedes exceder el monto total ${
            pagoData ? "del pago" : "de la factura"
          } ($${maxMontoPermitido.toFixed(2)})`
        );
        return prev;
      }

      return [...prev, { id_item, saldo: Number(saldoItem) || 0 }];
    });
  };

  const isItemSelected = (id_item: string) =>
    selectedItems.some((item) => item.id_item === id_item);

  const isReservaCanceladaPorCodigo = (codigo?: string | null) =>
  String(codigo || "").includes("_CANCEL_");


  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatIdItem = (id: string) =>
    id?.length > 4 ? `...${id.slice(-4)}` : id || "";

  const buildRenderers = () => ({
    id_item: ({ value }: { value: string }) => (
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
        {formatIdItem(value)}
      </span>
    ),
    seleccionado: ({ value }: { value: { id_item: string; total: number } }) => (
      <input
        type="checkbox"
        checked={isItemSelected(value.id_item)}
        disabled={maxMontoPermitido < value.total}
        onChange={() => handleItemSelection(value.id_item, value.total)}
        className="h-4 w-4 focus:ring-blue-500 border-gray-300 rounded"
      />
    ),
    precio: ({ value }: { value: number }) => (
      <span className="font-semibold text-sm px-2 py-1 rounded flex items-center justify-center bg-blue-50 text-blue-600">
        ${Number(value || 0).toFixed(2)}
      </span>
    ),
    fecha_uso: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-600">{formatDate(value)}</span>
    ),
    fecha_salida: ({ value }: { value: string }) => (
      <span className="text-sm text-gray-600">{formatDate(value)}</span>
    ),
    descripcion: ({ value }: { value: string }) => (
      <span className="font-medium text-gray-800">{value}</span>
    ),
    codigo: ({ value }: { value: string }) => {
      const v = String(value || "");
      if (!v) return null; // ✅ si está cancelado (""), no se muestra nada
      return (
        <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-sm border border-yellow-100">
          {v}
        </span>
      );
    },
  });

  const SectionReserva: React.FC<{ reserva: ReservaConItems }> = ({ reserva }) => {
    const codigoHotel = sanitizeCodigoReservacionHotel(
      reserva.codigo_reservacion_hotel
    );

    const registros = (reserva.items_info?.items || []).map((item) => ({
      id_item: item.id_item,
      codigo: codigoHotel, // ✅ muestra codigo_reservacion_hotel, vacío si trae _CANCEL_
      descripcion: reserva.nombre_hotel,
      fecha_uso: reserva.check_in,
      fecha_salida: reserva.check_out,
      precio: item.total,
      seleccionado: item,
      item,
    }));

    return (
      <div className="border rounded-lg mb-5 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 flex flex-wrap justify-between items-center">
          <div className="space-y-0.5">
            <div className="font-semibold">{reserva.nombre_hotel}</div>

            <div className="text-sm text-gray-600">
              {/* ✅ solo mostrar etiqueta si no está cancelado */}
              {codigoHotel ? (
                <>
                  Código hotel: <span className="font-mono">{codigoHotel}</span> ·{" "}
                </>
              ) : null}
              Check-in: {formatDate(reserva.check_in)} · Check-out:{" "}
              {formatDate(reserva.check_out)} · Noches: {reserva.noches}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Reserva: <span className="font-mono">{reserva.confirmation_code}</span>
          </div>
        </div>

        <div className="p-3">
          {registros.length === 0 ? (
            <div className="text-gray-500 p-4 bg-gray-50 rounded">
              No hay items en esta reserva.
            </div>
          ) : (
            <Table2
              registros={registros}
              renderers={buildRenderers()}
              showButtons={false}
              maxHeight="260px"
              customColumns={[
                "seleccionado",
                "id_item",
                "codigo",
                "descripcion",
                "fecha_uso",
                "fecha_salida",
                "precio",
              ]}
              leyenda=""
            />
          )}
        </div>
      </div>
    );
  };

  const handleAssign = async () => {
    try {
      const itemsAsignados = reservas
  .filter((r) => !isReservaCanceladaPorCodigo(r.codigo_reservacion_hotel))
  .flatMap((reserva) => reserva.items_info?.items || [])
  .filter((item) => selectedItems.some((s) => s.id_item === item.id_item));


      let asignacionPayload: any = null;
      let endpoint: string | null = null;
      let method: string | undefined;

      if (pagoData) {
        endpoint = `${URL}/mia/pagos/AsignarPagoItems`;
        method = "PATCH";
        asignacionPayload = {
          ...pagoData,
          items: JSON.stringify(itemsAsignados),
          monto_asignado: montoSeleccionado,
        };
      } else if (id_factura) {
        endpoint = `${URL}/mia/factura/AsignarFacturaItems`;
        method = "PATCH";
        asignacionPayload = {
          id_factura,
          items: JSON.stringify(itemsAsignados),
        };
      } else {
        // Flujo de creación: regreso al padre
        onAssign?.({
          itemsAsignados,
          monto_asignado: montoSeleccionado,
        });
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify(asignacionPayload),
        });

        const raw = await response.text();
        const json = safeJsonParse(raw);

        if (!response.ok) {
          const msg =
            json?.message || `Error al asignar los items (HTTP ${response.status})`;
          throw new Error(msg);
        }
      }

      onClose();
      onCloseVistaPrevia?.();
    } catch (e: any) {
      console.error("Error al asignar items:", e);
      alert(e?.message || "Ocurrió un error al asignar. Revisa consola.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl border">
          <div className="px-4 sm:px-6 py-3 border-b">
            <h2 className="text-lg font-semibold">
              {pagoData
                ? "Asignar Pago a Items de Reservación"
                : "Asignar Factura a Items de Reservación"}
            </h2>
          </div>

          <div className="px-4 sm:px-6 py-4 max-h-[70vh] overflow-y-auto">
            <p className="text-sm text-gray-700">
              Selecciona los items específicos a los que quieres asignar{" "}
              {pagoData ? "este pago" : "esta factura"}.
            </p>

            <div className="grid grid-cols-3 gap-4 my-4">
              <div>
                <p className="text-xs text-gray-600">
                  {pagoData ? "Monto pago:" : "Monto factura:"}
                </p>
                <p className="text-base font-semibold">
                  ${maxMontoPermitido.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Monto restante:</p>
                <p className="text-base text-green-600 font-semibold">
                  ${montoRestante.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Seleccionado:</p>
                <p
                  className={`text-base font-semibold ${
                    montoSeleccionado > maxMontoPermitido
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  ${montoSeleccionado.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Cargando reservas...</div>
              ) : error ? (
                <div className="text-red-500 p-4 bg-red-50 rounded">{error}</div>
              ) : reservas.length === 0 ? (
                <div className="text-gray-500 p-4 bg-gray-50 rounded">
                  No hay reservas con items pendientes de{" "}
                  {pagoData ? "pago" : "facturación"}
                </div>
              ) : (
                <div className="space-y-4">
                  {reservas
  .filter((r) => !isReservaCanceladaPorCodigo(r.codigo_reservacion_hotel))
  .map((res) => (
    <SectionReserva key={res.id_booking || res.id_solicitud} reserva={res} />
  ))}

                </div>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 border-t flex justify-end gap-3">
            <button
              onClick={() => {
                onClose();
                onCloseVistaPrevia?.();
              }}
              className="px-3 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors text-sm"
            >
              Cancelar
            </button>

            <button
              onClick={handleAssign}
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
            >
              Confirmar Asignación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarFacturaModal;
