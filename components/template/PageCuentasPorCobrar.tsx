"use client";
import React, { useState, useEffect, useReducer, ChangeEvent, useMemo } from "react";
import {
  FileText,
  Tag,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Send,
  Plus,
  DollarSign,
  CreditCard,
  Calendar,
  CheckSquare,
  Square,
  X,
  Pencil,
  Trash2,
  Wallet
} from "lucide-react";

import { Table } from "../Table";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types/index";
import Modal from "../organism/Modal";
import { SaldoFavor, NuevoSaldoAFavor, Saldo } from "@/services/SaldoAFavor";
import { fetchAgenteById, fetchPagosByAgente } from "@/services/agentes";
import { Loader } from "@/components/atom/Loader";

import {
  CheckboxInput,
  DateInput,
  Dropdown,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "../atom/Input";

//const [clients, setClient] = useState<Agente[]>([]);
import { set } from "react-hook-form";
import { render } from "react-dom";
import { formatNumberWithCommas } from "@/helpers/utils";
// ========================================
// TIPOS DE DATOS
// ========================================


interface Reservation {
  id: string;
  clientName: string;
  reservationDate: string;
  totalAmount: number;
  pendingAmount: number;
  description: string;
}

interface PaymentAssignment {
  reservationId: string;
  assignedAmount: number;
}

// ========================================
// SIMULACIÓN DE BACKEND
// ========================================
const simulateApiCall = <T,>(data: T, delay: number = 1000): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// ========================================
// COMPONENTE: MODAL DE PAGOS
// ========================================
interface PaymentModalProps {
  saldoAFavor?: number;
  onClose: () => void;
  agente: Agente;
  initialData?: {
    monto_pagado: number;
    referencia: string;
    paymentMethod: string;
    fecha_De_Pago: string;
    comentario: string;
    facturable: boolean;
    aplicable: boolean;
    link_Stripe: string;
  };
  onSubmit: (paymentData: NuevoSaldoAFavor) => Promise<any>;
  isEditing?: boolean;
}

interface PaymentSummaryProps {
  totalBalance: number;
  assignedBalance: number;
  statusInfo?: {
    puedeCancelar: boolean;
    mensaje: string;
    diferencia: number;
  };
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalBalance,
  assignedBalance,
  statusInfo
}) => {
  const availableBalance = totalBalance - assignedBalance;

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-emerald-100 mb-1">
            Saldo a Favor
          </h2>
          <p className="text-3xl font-bold">
            $
            {availableBalance.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-emerald-100 mt-1">
            Total: $
            {totalBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
            • Asignado: $
            {assignedBalance.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full p-3">
          <DollarSign className="w-8 h-8" />
        </div>
      </div>
      {statusInfo && (
        <div className="mt-4 pt-4 border-t border-emerald-400">
          <p className={`text-sm font-medium ${statusInfo.puedeCancelar ? 'text-emerald-100' : 'text-yellow-200'}`}>
            {statusInfo.mensaje}
          </p>
          <p className="text-xs text-emerald-100 mt-1">
            Diferencia: ${statusInfo.diferencia.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}
    </div>
  );
};

// ========================================
// COMPONENTE: TABLA DE RESERVACIONES
// ========================================
interface ReservationTableProps {
  reservations: Reservation[];
  assignments: PaymentAssignment[];
  availableBalance: number;
  onAssignmentChange: (reservationId: string, amount: number) => void;
  onToggleReservation: (reservationId: string) => void;
}


const ReservationTable: React.FC<ReservationTableProps> = ({
  reservations,
  assignments,
  availableBalance,
  onAssignmentChange,
  onToggleReservation,
}) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="w-4 h-4" />;
      case "bank_transfer":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const isReservationSelected = (reservationId: string) => {
    return assignments.some((a) => a.reservationId === reservationId);
  };

  const getAssignedAmount = (reservationId: string) => {
    const assignment = assignments.find(
      (a) => a.reservationId === reservationId
    );
    return assignment?.assignedAmount || 0;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">
          Asignar a Reservaciones
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Selecciona las reservaciones y asigna montos del saldo a favor
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pendiente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asignar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((reservation) => {
              const isSelected = isReservationSelected(reservation.id);
              const assignedAmount = getAssignedAmount(reservation.id);
              const maxAssignable = Math.min(
                reservation.pendingAmount,
                availableBalance + assignedAmount
              );

              return (
                <tr
                  key={reservation.id}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-emerald-50" : ""
                    }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onToggleReservation(reservation.id)}
                      className="text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.clientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reservation.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reservation.reservationDate).toLocaleDateString(
                      "es-MX"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    $
                    {reservation.totalAmount.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      $
                      {reservation.pendingAmount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={maxAssignable}
                          value={assignedAmount || ""}
                          onChange={(e) =>
                            onAssignmentChange(
                              reservation.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="0.00"
                        />
                        <span className="text-xs text-gray-500">
                          Máx: $
                          {maxAssignable.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

//========================================
//comprobantes pagos
interface Comprobantepago {
  id_Cliente: string;
  archivo?: File | null;
  nombreArchivo?: string;
  tipoArchivo?: string;
  tamañoArchivo?: number;
  fechaSubida?: Date;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
}

interface ComprobanteModalProps {
  idCliente: string;
  cliente: string;
  onClose: () => void;
  onSave: (comprobante: Comprobantepago) => void;
}

const ComprobanteModal: React.FC<ComprobanteModalProps> = ({
  idCliente,
  cliente,
  onClose,
  onSave
}) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      // Validaciones
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setError('Formato no válido. Sube un PDF, JPEG o PNG');
        return;
      }

      if (file.size > maxSize) {
        setError('El archivo es demasiado grande (máx. 5MB)');
        return;
      }

      setError(null);
      setArchivo(file);
    }
  };

  const handleSubmit = () => {
    if (archivo) {
      onSave({
        id_Cliente: idCliente,
        archivo: archivo,
        nombreArchivo: archivo.name,
        tipoArchivo: archivo.type,
        tamañoArchivo: archivo.size,
        fechaSubida: new Date(),
        estado: 'pendiente'
      });
      onClose();
    } else {
      setError('Debes de seleccionar un archivo')
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800">
            Subir Comprobante para {cliente}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            {archivo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">Archivo seleccionado:</p>
                <p>{archivo.name}</p>
                <p className="text-sm text-gray-500">
                  {(archivo.size / 1024).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!archivo}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg ${!archivo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              Guardar Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
interface PageCuentasPorCobrarProps {
  agente: Agente;
  walletAmount?: number;
}

const PageCuentasPorCobrar: React.FC<PageCuentasPorCobrarProps> = ({
  agente,
  walletAmount = 0
}) => {
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [agente, setAgente] = useState<Agente | null>(null);
  const [loading, setLoading] = useState({
    agente: true,
    pagos: true
  });

  const [localWalletAmount, setLocalWalletAmount] = useState(walletAmount || 0);

  // Actualizar cuando cambie el prop
  useEffect(() => {
    setLocalWalletAmount(walletAmount || 0);
  }, [walletAmount]);

  const [filters, setFilters] = useState<TypeFilters>({
    startDate: null,
    endDate: null,
    paymentMethod: "",
    hasDiscount: "",
    id_stripe: null,
    facturable: null,
    comprobante: null,
    paydate: null
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [saldoAFavor, setSaldoAFavor] = useState<number>(0);
  const [lloading, setloading] = useState(false)

  // Función para manejar los filtros
  const handleFilter = (newFilters: TypeFilters) => {
    // Convertir los valores "SI"/"NO" a booleanos si es necesario
    const completeFilters: TypeFilters = {
      startDate: newFilters.startDate || null,
      endDate: newFilters.endDate || null,
      paymentMethod: newFilters.paymentMethod || "",
      hasDiscount: newFilters.hasDiscount || "",
      id_stripe: newFilters.id_stripe || null,
      facturable: typeof newFilters.facturable === 'string' ?
        newFilters.facturable === 'SI' :
        newFilters.facturable,
      comprobante: typeof newFilters.comprobante === 'string' ?
        newFilters.comprobante === 'SI' :
        newFilters.comprobante,
      paydate: newFilters.paydate || null
    };

    setFilters(completeFilters);
    if (completeFilters.paymentMethod) {
      setActiveFilter(completeFilters.paymentMethod);
    } else {
      setActiveFilter("all");
    }
  };

  const updateAgentWallet = async () => {
    try {
      const agenteActualizado = await fetchAgenteById(agente.id_agente);
      setLocalWalletAmount(agenteActualizado.monto_credito || 0);
    } catch (error) {
      console.error('Error al actualizar el saldo del agente:', error);
      setError('Error al actualizar el saldo disponible');
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading({ agente: true, pagos: true });
        await reloadSaldos();
      } catch (err) {
        setError("Error al cargar los datos");
        console.error("Error fetching data:", err);
      } finally {
        setLoading({ agente: false, pagos: false });
      }
    };

    fetchInitialData();
  }, [agente.id_agente]);

  useEffect(() => {
    const fetchData = async () => {
      try {

      } catch (err) {
        setError("Error al cargar los datos");
        console.error("Error fetching data:", err);
      } finally {
        setLoading({ agente: false, pagos: false });
      }
    };

    fetchData();
  }, [agente.id_agente]);

  const [saldos, setSaldos] = useState<Saldo[]>([])

  useEffect(() => {
    setLocalWalletAmount(walletAmount || 0);
  }, [walletAmount]);

  useEffect(() => {
    const fetchSaldoFavor = async () => {
      const response: { message: string, data: Saldo[] } = await SaldoFavor.getPagos(agente.id_agente)
      console.log("esto trae", response.data)
      setSaldos(response.data)
    }
    fetchSaldoFavor()
  }, [])

  const verificarSaldoParaCancelar = (walletAmount: number, pago: Saldo) => {
    // Verificar si el pago está activo
    const isActive = pago.activo === true;

    // Convertir el monto a número
    const montoPago = parseFloat(pago.monto.toString());

    // Comparar con el saldo solo si el pago está activo
    const puedeCancelar = !isActive || walletAmount >= montoPago;

    return {
      puedeCancelar,
      saldo: walletAmount,
      totalAPagar: isActive ? montoPago : 0,
      mensaje: puedeCancelar
        ? isActive
          ? "El saldo es suficiente para cancelar este pago"
          : "El pago ya está inactivo, no requiere cancelación"
        : "Saldo insuficiente para cancelar este pago",
      diferencia: walletAmount - (isActive ? montoPago : 0)

    };
  };

  useEffect(() => {
    const fetchSaldoFavor = async () => {
      try {
        const response: { message: string, data: Saldo[] } = await SaldoFavor.getPagos(agente.id_agente);

        setSaldos(response.data);


      } catch (error) {
        console.error('Error al obtener saldos:', error);
        setError('Error al cargar los saldos');
      }
    };

    fetchSaldoFavor();
  }, [agente.id_agente]);


  const filteredData = useMemo(() => {
    return saldos.filter(saldo => {
      // Filtro por método de pago
      if (filters.paymentMethod && saldo.metodo_pago) {
        const normalizedFilter = filters.paymentMethod.toLowerCase();
        const normalizedMethod = saldo.metodo_pago.toLowerCase();

        if (!normalizedMethod.includes(normalizedFilter)) {
          return false;
        }
      }

      // Filtro por fecha de pago
      if (filters.paydate && saldo.fecha_pago) {
        const paymentDate = new Date(saldo.fecha_pago).toISOString().split('T')[0];
        if (paymentDate !== filters.paydate) {
          return false;
        }
      }

      // Filtro por facturable
      if (filters.facturable !== null) {
        const hasfacturable = Boolean(saldo.is_facturable);
        if (hasfacturable !== filters.facturable) {
          return false;
        }
      }

      // Filtro por comprobante
      if (filters.comprobante !== null) {
        const hasComprobante = Boolean(saldo.comprobante);
        if (hasComprobante !== filters.comprobante) {
          return false;
        }
      }

      // Filtro por rango de fechas
      if (filters.startDate && saldo.created_at) {
        const createdDate = new Date(saldo.created_at);
        if (createdDate < new Date(filters.startDate)) {
          return false;
        }
      }

      if (filters.endDate && saldo.created_at) {
        const createdDate = new Date(saldo.created_at);
        if (createdDate > new Date(filters.endDate)) {
          return false;
        }
      }

      // Filtro por búsqueda de texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesReference = saldo.referencia?.toLowerCase().includes(searchLower);
        const matchesComment = saldo.comentario?.toLowerCase().includes(searchLower);
        const matchesId = saldo.id_saldos?.toString().includes(searchLower);

        if (!matchesReference && !matchesComment && !matchesId) {
          return false;
        }
      }

      return true;
    })
      .map((saldo) => ({
        id_Cliente: saldo,
        cliente: saldo.nombre || '',
        creado: saldo.created_at ? new Date(saldo.created_at).toISOString().split('T')[0] : '',
        monto_pagado: saldo,
        forma_De_Pago: saldo.metodo_pago === 'transferencia'
          ? 'Transferencia Bancaria'
          : saldo.metodo_pago === 'tarjeta credito'
            ? 'Tarjeta de Crédito'
            : saldo.metodo_pago === 'tarjeta debito'
              ? 'Tarjeta de Débito'
              : saldo.metodo_pago || '',
        referencia: saldo.referencia || 'Sin referencia',
        link_stripe: saldo.link_stripe || null,
        fecha_De_Pago: saldo.fecha_pago ? new Date(saldo.fecha_pago).toISOString().split('T')[0] : '',
        aplicable: saldo.is_descuento ? 'Si' : 'No',
        comentario: saldo.notas || saldo.comentario || null,
        facturable: saldo.is_facturable ? 'Si' : 'No',
        comprobante: saldo.comprobante || null,
        acciones: { row: saldo },
      }));
  }, [saldos, filters, searchTerm]);


  const tableRenderers = {
    // Renderizador base que aplica a todas las celdas
    baseRenderer: (props: { value: Saldo }) => {
      const isActive = Boolean(props.value?.activo);
      console.log("Valor de baseRenderer:", props.value);
      return (
        <span className={`${!isActive ? "text-red-500 line-through" : ""}`}>
        </span>
      );
    },

    monto_pagado: ({ value }: { value: Saldo }) => {
      // console.log("Valor de monto_pagado:", value, "Fila:", row);
      const isActive = Boolean(value?.activo);
      return (
        <span className={`font-medium px-2 py-1 rounded ${isActive ? "bg-green-100 text-emerald-600" : "bg-red-100 text-red-600 line-through"
          }`}>
          {formatNumberWithCommas(value.monto)}
        </span>
      );
    },
    id_Cliente: (props: { value: Saldo }) => {
      const isActive = Boolean(props.value?.activo);
      return (
        <span
          className={`font-semibold text-sm px-2 py-1 rounded ${isActive ? "bg-blue-50 text-blue-600" : "bg-red-100 text-red-600 line-through"
            }`}
          title={props.value.id_agente}
        >
          {props.value.id_agente?.split("-").join("").slice(0, 10)}
        </span>
      );
    },

    descuentoAplicado: ({ value }: { value: number }) => (
      <span className="text-red-500">
        ${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
      </span>
    ),

    forma_De_Pago: ({ value, row }: { value: string, row: any }) => {
      const isActive = row?.activo !== false;
      const normalizedValue = value.toLowerCase();
      return (
        <div className={`flex items-center gap-2 ${!isActive ? "text-red-500 line-through" : ""}`}>
          {normalizedValue.includes("crédito") || normalizedValue.includes("credito") ? (
            <CreditCard className="w-4 h-4 text-gray-500" />
          ) : normalizedValue.includes("transferencia") ? (
            <DollarSign className="w-4 h-4 text-blue-500" />
          ) : (
            <DollarSign className="w-4 h-4 text-green-500" />
          )}
          <span>{value}</span>
        </div>
      );
    },

    comprobante: ({ value }: { value: Comprobantepago | null }) => {
      const [showModal, setShowModal] = useState(false);

      const handleDownload = () => {
        if (value) {
          console.log("Descargando comprobante...", value);

          // Lógica de descarga aquí
        }
      };

      const handleView = () => {
        if (value) {
          console.log("Mostrando comprobante...", value);
          // Lógica para visualizar aquí
        }
      };

      if (!value) {
        return (
          <>
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Añadir Comprobante
            </button>
            {showModal && (
              <ComprobanteModal
                idCliente={agente?.id_agente || ""}
                cliente={agente?.nombre_agente_completo || ""}
                onClose={() => setShowModal(false)}
                onSave={(comprobante) => {
                  console.log("Comprobante guardado:", comprobante);
                  setShowModal(false);
                  // Actualizar el estado con el nuevo comprobante
                }}
              />
            )}
          </>
        );
      }

      return (
        <div className="flex gap-2">
          <button
            onClick={handleView}
            className="text-green-600 hover:underline cursor-pointer"
          >
            Ver
          </button>
          <span>|</span>
          <button
            onClick={handleDownload}
            className="text-green-600 hover:underline cursor-pointer"
          >
            Descargar
          </button>
        </div>
      );
    },
    aplicable: ({ value }: { value: 'Si' | 'No' }) => {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'Si'
          ? 'bg-green-200 text-green-1000'
          : 'bg-red-200 text-red-800'
          }`}>
          {value}
        </span>
      );
    },

    facturable: ({ value }: { value: 'Si' | 'No' }) => {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'Si'
          ? 'bg-green-200 text-green-1000'
          : 'bg-red-200 text-red-800'
          }`}>
          {value}
        </span>
      );
    },
    //botones para eliminar y editar informacion
    acciones: ({ value }: { value: { row: any } }) => {
      const { row } = value;
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);
      const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

      // En la función handleEdit
      const handleEdit = async (updatedData: any) => {
        try {
          console.log("Datos recibidos del modal:", updatedData);

          // Validar que los datos requeridos estén presentes
          if (!updatedData) {
            throw new Error("No se recibieron datos del formulario");
          }
          // Validar y normalizar el método de pago
          const metodoPago = updatedData.paymentMethod
            ? normalizePaymentMethod(updatedData.paymentMethod)
            : row.metodo_pago || 'transferencia'; // Valor por defecto
          await reloadSaldos(); // Recargar los datos después de editar

          await updateAgentWallet(); // Actualizar el saldo

          // Transformar los datos al formato que espera la API
          const apiData = {
            id_saldos: row.id_saldos,//si
            monto: updatedData.monto_pagado?.toString() || row.monto,//si
            referencia: updatedData.referencia || row.referencia,//si
            fecha_pago: updatedData.fecha_De_Pago || row.fecha_pago,//si
            comentario: updatedData.comentario || row.notas || null,
            is_facturable: updatedData.is_facturable, // Convertir a 1/0 para la API  //si
            is_descuento: updatedData.descuento_aplicable,  //si
            link_stripe: updatedData.link_stripe || null,//si
            metodo_pago: metodoPago,//si
            tipo_tarjeta: updatedData.tipo_tarjeta || null,//si

            // Mantener los demás campos sin cambios
            activo: row.activo,//si
            comprobante: row.comprobante,//si
            concepto: row.concepto,//si
            currency: row.currency,//si
            id_agente: row.id_agente,//si
            saldo: row.saldo,//si
          };


          console.log("Datos para enviar a la API:", apiData);

          // // Llamar a la API para actualizar
          await SaldoFavor.actualizarPago(apiData);

          // Actualizar la lista de pagos
          const updatedSaldos = await SaldoFavor.getPagos(row.id_agente);
          setSaldos(updatedSaldos.data);
          setLocalWalletAmount(prev => prev - parseFloat(row.monto.toString()));


          // Cerrar el modal
          setIsEditModalOpen(false);

        } catch (error) {
          console.error("Error al actualizar el pago:", error);
          setError(`Error al actualizar el pago: ${error instanceof Error ? error.message : String(error)}`);
        }
      };

      // Función auxiliar para normalizar métodos de pago
      const normalizePaymentMethod = (method: string): string => {
        if (!method) return 'transferencia'; // Valor por defecto

        const methodMap: Record<string, string> = {
          'transferencia': 'transferencia',
          'tarjeta credito': 'tarjeta_credito',
          'tarjeta de credito': 'tarjeta_credito',
          'tarjeta crédito': 'tarjeta_credito',
          'credito': 'tarjeta_credito',
          'tarjeta debito': 'tarjeta_debito',
          'tarjeta débito': 'tarjeta_debito',
          'debito': 'tarjeta_debito',
          'débito': 'tarjeta_debito',
          'wallet': 'wallet'
        };

        const normalizedMethod = method.toLowerCase().trim();
        return methodMap[normalizedMethod] || normalizedMethod.replace(/ /g, '_');
      };

      const handleDelete = async () => {
        try {
          // Verificar si podemos cancelar este pago
          const verificacion = verificarSaldoParaCancelar(walletAmount, row);

          if (!verificacion.puedeCancelar) {
            setError(verificacion.mensaje);
            setIsDeleteModalOpen(false);
            return;
          }

          // Proceder con la eliminación lógica
          const deleteData = {
            id_saldos: row.id_saldos,
            id_agente: row.id_agente,
            saldo: row.saldo,
            monto: row.monto,
            metodo_pago: row.metodo_pago,
            fecha_pago: row.fecha_pago,
            notas: row.notas || null,
            is_facturable: row.is_facturable,
            is_descuento: row.is_descuento,
            link_stripe: row.link_stripe || null,
            tipo_tarjeta: row.tipo_tarjeta,
            activo: false, // Cambiamos a 0 para desactivar
            comentario: row.comentario || null,
            comprobante: row.comprobante,
            concepto: row.concepto,
            currency: row.currency || 'MXN',
            referencia: row.referencia || null,
            Wallet: row.wallet || null
          };

          await SaldoFavor.actualizarPago(deleteData);
          // Actualizar el saldo local ANTES de recargar los datos
          if (row.activo) {
            setLocalWalletAmount(prev => prev - parseFloat(row.monto.toString()));
          }

          const updatedSaldos = await SaldoFavor.getPagos(row.id_agente);
          setSaldos(updatedSaldos.data);
          setIsDeleteModalOpen(false);

        } catch (error) {
          console.error("Error al eliminar el pago:", error);
          setError(`Error al eliminar el pago: ${error instanceof Error ? error.message : String(error)}`);
        }
      };

      return (
        <div className="flex gap-2">
          {/* Botón Editar */}
          <button
            className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            onClick={() => setIsEditModalOpen(true)}
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Botón Eliminar - Solo se muestra si el pago está activo */}
          {(row.activo === 1 || row.activo === true) && (
            <button
              className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              onClick={() => setIsDeleteModalOpen(true)}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Modal de Edición */}
          {isEditModalOpen && (
            <Modal
              title="Editar Pago"
              onClose={() => setIsEditModalOpen(false)}
            >
              <PaymentModal
                saldoAFavor={agente.monto_credito}
                onClose={() => setIsEditModalOpen(false)}
                agente={agente}
                initialData={{
                  monto_pagado: row.monto,
                  referencia: row.referencia,
                  paymentMethod: row.metodo_pago === 'transferencia'
                    ? 'Transferencia'
                    : row.metodo_pago === 'tarjeta credito'
                      ? 'Tarjeta de credito'
                      : row.metodo_pago === 'tarjeta debito'
                        ? 'Tarjeta de debito'
                        : 'Wallet',
                  fecha_De_Pago: row.fecha_pago ? new Date(row.fecha_pago).toISOString().split('T')[0] : '',
                  comentario: row.comentario || row.notas || '',
                  facturable: row.is_facturable,
                  aplicable: row.is_descuento,
                  link_Stripe: row.link_stripe || ''
                }}
                onSubmit={handleEdit}
                isEditing={true}
              />
            </Modal>
          )}

          {/* Modal de Eliminación */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Confirmar Eliminación
                  </h3>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    ¿Estás seguro que deseas eliminar este pago?
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setIsDeleteModalOpen(false);
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    },
  };

  const reloadSaldos = async () => {
    try {
      setLoading(prev => ({ ...prev, pagos: true }));
      const response = await SaldoFavor.getPagos(agente.id_agente);
      setSaldos(response.data);
    } catch (error) {
      console.error('Error al recargar saldos:', error);
      setError('Error al cargar los saldos');
    } finally {
      setLoading(prev => ({ ...prev, pagos: false }));
    }
  };

  //Manejar nuevo pago

  const handleAddPayment = async (paymentData: NuevoSaldoAFavor) => {
    try {
      setLoading(prev => ({ ...prev, pagos: true }));

      // Crear el pago
      await SaldoFavor.crearPago({
        ...paymentData,
        id_cliente: agente.id_agente
      });

      // Actualizar el saldo local sumando el monto del nuevo pago
      setLocalWalletAmount(prev => prev + parseFloat(paymentData.monto_pagado.toString()));

      setAddPaymentModal(false);

    } catch (err) {
      setError("Error al registrar el pago");
      console.error("Error:", err);
    } finally {
      setLoading(prev => ({ ...prev, pagos: false }));
    }
  };

  if (loading.agente) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
        <span className="ml-2">Cargando información del agente...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!agente) {
    return <div className="text-center py-8">No se encontró información del agente</div>;
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Resumen de saldo */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <PaymentSummary
            totalBalance={localWalletAmount}
            assignedBalance={0}
          />

          <div className="flex justify-end items-center">
            <button
              onClick={() => setAddPaymentModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
              disabled={loading.pagos}
            >
              <Plus className="w-5 h-5" />
              {loading.pagos ? 'Cargando...' : 'Agregar Pago'}
            </button>
          </div>
        </div>

        {/* Tabla de pagos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Filters

            onFilter={handleFilter}  // Pasamos handleFilter como prop
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            defaultFilters={filters}
          />

          {loading.pagos ? (
            <div className="p-8 flex justify-center">
              <Loader />
              <span className="ml-2">Cargando pagos...</span>
            </div>
          ) : (
            <Table
              //registros={mappedData}
              registros={filteredData}
              renderers={tableRenderers}
              customColumns={["acciones"]} // Añade la columna de acciones

            />
          )}
        </div>
      </div>

      {/* Modal para agregar pago */}

      {addPaymentModal && agente && (
        <Modal
          title="Agregar Nuevo Pago"
          onClose={() => setAddPaymentModal(false)}
        >
          <PaymentModal
            saldoAFavor={agente.monto_credito}
            onClose={() => setAddPaymentModal(false)}
            agente={agente}
            onSubmit={handleAddPayment}
          />
        </Modal>
      )}
    </div>
  );
};


// Tipos para el formulario
//===========================
interface FormState {
  amount: string;
  reference: string;
  paymentMethod: string;
  paymentDate: string;
  discountApplied: boolean;
  facturable: boolean;
  comments: string;
  link_Stripe: string;
}

interface FormErrors {
  amount?: string;
  reference?: string;
  paymentMethod?: string;
  paymentDate?: string;
}

// Estado inicial
const initialState: FormState = {
  amount: "",
  reference: "",
  paymentMethod: "",
  paymentDate: "",
  discountApplied: false,
  facturable: false,
  comments: "",
  link_Stripe: ""
};

// Tipos de acciones
type ActionType =
  | { type: "SET_FIELD"; field: keyof FormState; value: string | boolean }
  | { type: "RESET_FORM" }
  | { type: "SET_FORM"; payload: FormState };

// Reducer
const formReducer = (state: FormState, action: ActionType): FormState => {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };
    case "RESET_FORM":
      return initialState;
    case "SET_FORM":
      return action.payload;
    default:
      return state;
  }
};

// Validaciones
const validateForm = (state: FormState): FormErrors => {
  const errors: FormErrors = {};

  if (!state.amount || parseFloat(state.amount) <= 0) {
    errors.amount = "El monto debe ser mayor a 0";
  }

  if (!state.reference.trim()) {
    errors.reference = "La referencia es requerida";
  }

  if (!state.paymentMethod) {
    errors.paymentMethod = "Selecciona una forma de pago";
  }

  if (!state.paymentDate) {
    errors.paymentDate = "La fecha de pago es requerida";
  }

  return errors;
};

//Modal de pagos 
//para agregar pagos 
const PaymentModal: React.FC<PaymentModalProps> = ({
  saldoAFavor = 0,
  onClose,
  agente,
  initialData,
  onSubmit,
  isEditing = false
}) => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Inicializar con datos si estamos editando
  useEffect(() => {
    if (isEditing && initialData) {
      dispatch({
        type: "SET_FORM",
        payload: {
          amount: initialData.monto_pagado.toString(),
          reference: initialData.referencia,
          paymentMethod: initialData.paymentMethod,
          paymentDate: initialData.fecha_De_Pago,
          discountApplied: initialData.aplicable,
          facturable: initialData.facturable,
          comments: initialData.comentario,
          link_Stripe: initialData.link_Stripe
        }
      });
    }
  }, [isEditing, initialData]);

  const paymentMethods = [
    "Transferencia",
    "Wallet",
    "Tarjeta de credito",
    "Tarjeta de debito",
  ];

  const handleInputChange = (
    field: keyof FormState,
    value: string | boolean
  ) => {
    dispatch({ type: "SET_FIELD", field, value });
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm(state);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (!state.paymentMethod) {
        throw new Error("El método de pago es requerido");
      }
      const pagoData: NuevoSaldoAFavor = {
        id_cliente: agente.id_agente,
        monto_pagado: Number(state.amount),
        forma_pago: state.paymentMethod.toLowerCase() as
          | "transferencia"
          | "tarjeta de credito"
          | "tarjeta de debito"
          | "wallet",
        is_facturable: state.facturable,
        referencia: state.reference,
        fecha_pago: state.paymentDate,
        ...(state.paymentMethod.includes("Tarjeta") && {
          tipo_tarjeta: state.paymentMethod.includes("credito")
            ? "credito"
            : "debito"
        }),
        link_stripe: state.link_Stripe || "",
        descuento_aplicable: state.discountApplied,
        ...(state.comments && { comentario: state.comments }),
      };

      await onSubmit(pagoData);

      setIsSubmitting(false);
      setIsSubmitted(true);

      if (!isEditing) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setIsSubmitting(false);
      if (error instanceof Error) {
        setErrors({
          ...errors,
          amount: error.message.includes("monto") ? error.message : undefined,
          paymentMethod: error.message.includes("forma de pago") ? error.message : undefined,
        });
      } else {
        setErrors({
          ...errors,
          paymentMethod: "Ocurrió un error al procesar el pago. Intente nuevamente.",
        });
      }
    }
  };

  const resetForm = () => {
    dispatch({ type: "RESET_FORM" });
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="h-fit w-[95vw] max-w-sm relative">
      <div className="max-w-2xl mx-auto">
        {isSubmitted && (
          <div className="bg-green-50 border-b border-green-200 p-6 sticky top-0 z-10">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  {isEditing ? "¡Pago actualizado exitosamente!" : "¡Pago registrado exitosamente!"}
                </h3>
                <p className="text-green-600">
                  La información ha sido guardada correctamente.
                </p>
              </div>
            </div>
          </div>
        )}
        {Object.entries(errors).length > 0 && (
          <div className="bg-red-50 border-b border-red-200 p-6 sticky top-0 z-10">
            <div className="flex items-center">
              <X className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  ¡Ocurrio un error!
                </h3>
                {Object.values(errors).filter(item => !!item).map(item =>
                  <p key={item} className="text-red-600">◾{item}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <NumberInput
              label="Monto Pagado"
              value={Number(state.amount)}
              onChange={(value) => handleInputChange("amount", value)}
            />

            <TextInput
              label="Referencia"
              value={state.reference}
              onChange={(value) => handleInputChange("reference", value)}
              placeholder="Ingresa la referencia del pago"
            />

            <Dropdown
              label="Forma de Pago"
              value={state.paymentMethod}
              onChange={(value) => handleInputChange("paymentMethod", value)}
              options={paymentMethods}
            />

            <DateInput
              label="Fecha de Pago"
              value={state.paymentDate}
              onChange={(value) => handleInputChange("paymentDate", value)}
            />

            <CheckboxInput
              checked={state.discountApplied}
              onChange={(e) => handleInputChange("discountApplied", e)}
              label={"Descuento aplicado"}
            />

            <CheckboxInput
              checked={state.facturable}
              onChange={(e) => handleInputChange("facturable", e)}
              label={"Facturable"}
            />

            <TextInput
              label="Link Stripe"
              value={state.link_Stripe}
              onChange={(value) => handleInputChange("link_Stripe", value)}
              placeholder="Agrega el Link Sprite"
            />

            <TextAreaInput
              label="Comentarios"
              value={state.comments}
              onChange={(value) => handleInputChange("comments", value)}
              placeholder="Agrega comentarios adicionales sobre el pago..."
            />
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {isEditing ? "Actualizar Pago" : "Registrar Pago"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="w-full md:flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageCuentasPorCobrar;
