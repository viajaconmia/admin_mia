"use client";
import React, { useState, useEffect, useReducer, ChangeEvent } from "react";
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
  X
} from "lucide-react";

import { Table } from "../Table";
import Filters from "@/components/Filters";
import Modal from "../organism/Modal";
import { SaldoFavor, NuevoSaldoAFavor, Saldo } from "@/services/SaldoAFavor";
import { fetchAgenteById, fetchPagosByAgente } from "@/services/agentes";
import { Loader } from "@/components/atom/Loader";


//import { UsersClient } from "./_components/UsersClient";

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
// ========================================
// TIPOS DE DATOS
// ========================================
export interface TypeFilters {
  startDate: string | null;
  endDate: string | null;
  paymentMethod: "Tarjeta Debito" | "Tarjeta Credito" | "Transferencia" | "Wallet" | "";
  hasDiscount: "SI" | "NO" | "";
  id_stripe: string | null;
  facturable: boolean | null;
  comprobante: boolean | null;
  paydate: string | null;
  // ... otros campos si son necesarios
}

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

/*const mockPayments: Payment[] = [
  {
    id: "1",
    amount: 1500,
    date: "2024-01-15",
    description: "Pago Juan Pérez - Evento Corporativo",
    method: "bank_transfer",

  },
  {
    id: "2",
    amount: 800,
    date: "2024-01-18",
    description: "Pago María García - Boda",
    method: "credit_card",
  },
];
*/
/*
const mockReservations: Reservation[] = [
  {
    id: "1",
    clientName: "Juan Pérez",
    reservationDate: "2024-02-15",
    totalAmount: 2500,
    pendingAmount: 1000,
    description: "Evento Corporativo - Salón Principal",
  },
  {
    id: "2",
    clientName: "María García",
    reservationDate: "2024-02-20",
    totalAmount: 3200,
    pendingAmount: 2400,
    description: "Boda - Jardín y Salón",
  },
  {
    id: "3",
    clientName: "Carlos Rodríguez",
    reservationDate: "2024-03-01",
    totalAmount: 1800,
    pendingAmount: 1800,
    description: "Quinceañera - Salón VIP",
  },
  {
    id: "4",
    clientName: "Ana Martínez",
    reservationDate: "2024-03-10",
    totalAmount: 4500,
    pendingAmount: 2000,
    description: "Evento Empresarial - Toda la instalación",
  },
];*/

/* Funciones simuladas de API
const apiService = {
  getPayments: () => simulateApiCall(mockPayments, 800),
  getReservations: () => simulateApiCall(mockReservations, 600),
  addPayment: (payment: Omit<Payment, "id">) =>
    simulateApiCall({ ...payment, id: Date.now().toString() }, 1000),
  assignPaymentToReservation: (assignments: PaymentAssignment[]) =>
    simulateApiCall({ success: true, assignments }, 800),
};
*/
//pagos wallet
interface Pago {
  id: string;
  id_Cliente: string;
  cliente: string;
  creado: string;
  monto_pagado: number;
  forma_De_Pago: string;
  referencia: string;
  fecha_De_Pago: string;
  descuentoAplicado: number;
  motivo: string;
  comentario: string;
  aplicable: string;
  comprobante: File | null;
}


// ========================================
// COMPONENTE: MODAL DE PAGOS
// ========================================
interface PaymentModalProps {
  isOpen: boolean;
  saldoAFavor?: number;
  onClose: () => void;
  onAddPayment: (payment: Omit<Payment, "id">) => void;
  isLoading: boolean;
  agente: Agente;
}

// const PaymentModal: React.FC<PaymentModalProps> = ({
//   isOpen,
//   onClose,
//   onAddPayment,
//   isLoading,
// }) => {
//   const [formData, setFormData] = useState({
//     amount: "",
//     description: "",
//     method: "credit_card" as const,
//     date: new Date().toISOString().split("T")[0],
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (formData.amount && formData.description) {
//       onAddPayment({
//         amount: parseFloat(formData.amount),
//         description: formData.description,
//         method: formData.method,
//         date: formData.date,
//       });
//       setFormData({
//         amount: "",
//         description: "",
//         method: "credit_card",
//         date: new Date().toISOString().split("T")[0],
//       });
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
//         <div className="flex items-center justify-between p-6 border-b border-gray-100">
//           <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
//             <Plus className="w-5 h-5 text-emerald-600" />
//             Agregar Nuevo Pago
//           </h3>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6">
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Monto
//               </label>
//               <div className="relative">
//                 <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="number"
//                   step="0.01"
//                   value={formData.amount}
//                   onChange={(e) =>
//                     setFormData({ ...formData, amount: e.target.value })
//                   }
//                   className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
//                   placeholder="0.00"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Descripción
//               </label>
//               <input
//                 type="text"
//                 value={formData.description}
//                 onChange={(e) =>
//                   setFormData({ ...formData, description: e.target.value })
//                 }
//                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
//                 placeholder="Descripción del pago"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Método de Pago
//               </label>
//               <select
//                 value={formData.method}
//                 onChange={(e) =>
//                   setFormData({ ...formData, method: e.target.value as any })
//                 }
//                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
//               >
//                 <option value="credit_card">Tarjeta de Crédito</option>
//                 <option value="bank_transfer">Transferencia Bancaria</option>
//                 <option value="cash">Efectivo</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Fecha
//               </label>
//               <div className="relative">
//                 <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="date"
//                   value={formData.date}
//                   onChange={(e) =>
//                     setFormData({ ...formData, date: e.target.value })
//                   }
//                   className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
//                   required
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
//             >
//               Cancelar
//             </button>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? "Agregando..." : "Agregar Pago"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// ========================================
// COMPONENTE: RESUMEN DE PAGOS
// ========================================

interface PaymentSummaryProps {
  totalBalance: number;
  assignedBalance: number;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalBalance,
  assignedBalance,
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

//====================================
//modal comprobante recordar de borrar
/*interface Comprobantepago {
  comprobante: File | null;
}
*/
/*const ComprobantePagoModal: React.FC<Comprobantepago> = ({
  comprobante: initialComprobante = null
}) => {
  const [addComprobante, setAddComprobante] = useState(false);
  const [comprobante, setComprobante] = useState<File | null>(initialComprobante);
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
      setComprobante(file);
      setAddComprobante(false); // Cierra el modal después de seleccionar
    }
  };

  return (
    <div className="comprobante-container">
      {!comprobante ? (
        <button
          onClick={() => setAddComprobante(true)}
          className="btn-subir-comprobante"
        >
          Subir Comprobante
        </button>
      ) : (
        <div className="comprobante-info">
          <p>Comprobante cargado: {comprobante.name}</p>
          <button
            onClick={() => setComprobante(null)}
            className="btn-eliminar"
          >
            Eliminar
          </button>
        </div>
      )}

      {addComprobante && (
        <div className="modal">
          <div className="modal-content">
            <h3>Selecciona tu comprobante de pago</h3>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            {error && <p className="error-message">{error}</p>}
            <button
              onClick={() => setAddComprobante(false)}
              className="btn-cerrar"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};*/
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
                  {(archivo.size / 1024).toFixed(2)} KB
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
}

// interface Agente {
//   id_agente: string;
//   nombre_agente_completo: string;
//   correo: string;
//   telefono: string;
//   // otras propiedades del agente...
// }

const PageCuentasPorCobrar: React.FC<PageCuentasPorCobrarProps> = ({
  agente,
}) => {
  //const [payments, setPayments] = useState<Payment[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [agente, setAgente] = useState<Agente | null>(null);
  const [loading, setLoading] = useState({
    agente: true,
    pagos: true
  });
  const [assignments, setAssignments] = useState<PaymentAssignment[]>([]);
  const [filters, setFilters] = useState<TypeFilters>({
    startDate: null,
    endDate: null,
    hasDiscount: "",
    paymentMethod: "",
    id_stripe: "",
    facturable: null,
    comprobante: null,
    paydate: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [saldoAFavor, setSaldoAFavor] = useState<number>(0);
  const [lloading, setloading] = useState(false)

  // Función para manejar los filtros
  const handleFilter = (newFilters: TypeFilters) => {
    setFilters(newFilters);
    if (newFilters.paymentMethod) {
      setActiveFilter(newFilters.paymentMethod);
    } else {
      setActiveFilter("all");
    }
  };

  // Datos de ejemplo para la tabla
  const paymentRecords = [
    {
      id: "1",
      id_Cliente: "CL001",
      cliente: "Juan Pérez",
      creado: "2024-01-10",
      monto_pagado: 1500.00,
      forma_De_Pago: "Transferencia Bancaria",
      referencia: "TRF-123456",
      fecha_De_Pago: "2024-01-15",
      descuentoAplicado: 1.00,
      motivo: "Anticipo evento",
      comentario: "Pago parcial del evento corporativo",
      aplicable: "Si",
      endDay: "2025-05-02",
      startDay: "2025-05-02",
      comprobante: null
    },
    {
      id_Cliente: "CL002",
      cliente: "María García",
      creado: "2024-01-12",
      monto_pagado: 800.00,
      forma_De_Pago: "Tarjeta de Crédito",
      referencia: "TC-789012",
      fecha_De_Pago: "2024-01-18",
      descuentoAplicado: 100.00,
      motivo: "Descuento promocional",
      comentario: "Pago con descuento por temporada",
      aplicable: "Si",
      startDay: "2024-02-05",
      endDay: "2024-08-09",
      comprobante: File
    },
    {
      id_Cliente: "CL003",
      cliente: "Carlos López",
      creado: "2024-01-14",
      monto_pagado: 1200.00,
      forma_De_Pago: "Efectivo",
      referencia: "EF-456789",
      fecha_De_Pago: "2024-01-16",
      descuentoAplicado: 50.00,
      motivo: "Pago en efectivo",
      comentario: "Pago completo en efectivo",
      aplicable: "No",
      startDay: "2024-02-05",
      endDay: "2024-08-09",
      comprobante: null
    },
  ].filter(item => item.cliente.includes(searchTerm));

  const paymentRecords1 = []

  // Filtrar los registros según los filtros aplicados
  // Filtrar los registros según los filtros aplicados
  const filteredRecords = paymentRecords

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener información del agente
        // const agenteData = await fetchAgenteById(agente.id_agente);
        // setAgente(agenteData);

        // 2. Obtener pagos del agente
        // const pagosData = await fetchPagosByAgente(agente.id_agente);
        // setPagos(pagosData);

      } catch (err) {
        setError("Error al cargar los datos");
        console.error("Error fetching data:", err);
      } finally {
        setLoading({ agente: false, pagos: false });
      }
    };

    fetchData();
  }, [agente.id_agente]);

  useEffect(() => {
    const fetchSaldoFavor = async () => {
      const response: { message: string, data: Saldo[] } = await SaldoFavor.getPagos(agente.id_agente)
      console.log(response.data)
    }
    fetchSaldoFavor()
  }, [])


  // Renderers para las columnas especiales
  const tableRenderers = {
    monto_pagado: ({ value }: { value: number }) => (
      <span className="font-medium text-emerald-600">
        ${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
      </span>
    ),
    descuentoAplicado: ({ value }: { value: number }) => (
      <span className="text-red-500">
        ${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
      </span>
    ),
    forma_De_Pago: ({ value }: { value: string }) => (
      <div className="flex items-center gap-2">
        {value === "Tarjeta de Crédito" ? (
          <CreditCard className="w-4 h-4 text-gray-500" />
        ) : value === "Transferencia Bancaria" ? (
          <DollarSign className="w-4 h-4 text-blue-500" />
        ) : (
          <DollarSign className="w-4 h-4 text-green-500" />
        )}
        <span>{value}</span>
      </div>
    ),
    comprobante: ({ value }: { value: Comprobantepago | null }) => {
      const [showModal, setShowModal] = useState(false);
      const handleDownload = () => {
        console.log("Descarga comprobante ...");
        //logica de descarga
      }
      const handleView = () => {
        console.log("Mostrando comprobante")
      }
      if (!value) {
        return (
          <>
            <button onClick={() => setShowModal(true)}
              className="text-blue-600 hover:underline cursorpointer">
              Añadir_Comprobante
            </button>

            {showModal && (
              <ComprobanteModal
                idCliente={value?.id_Cliente || ""}
                cliente=""
                onClose={() => setShowModal(false)}
                onSave={(comprobante) => {
                  console.log("Comprobante guardado:", comprobante);
                  setShowModal(false);
                  // Aquí deberías actualizar el estado para reflejar el nuevo comprobante
                }}
              />
            )}
          </>)
      }
      return (
        <>
          <button
            onClick={handleView}
            className="hover:underline font-medium"
          >
            <span className="text-green-600 hover:underline cursor-pointer">
              ver_comprobante
            </span>
          </button >
          <span>|</span>
          < button
            onClick={handleDownload}
            className="hover:underline font-medium"
          >            <span className="text-green-600 hover:underline cursor-pointer">
              descargar_comprobante
            </span>
          </button >
        </>
      );
    },
    acciones: ({ value }: { value: any }) => (
      <div className="flex gap-2">
        <button className="p-1 text-gray-500 hover:text-gray-700">
          <span className="text-xs">Editar</span>
        </button>
        <button className="p-1 text-red-500 hover:text-red-700">
          <span className="text-xs">Eliminar</span>
        </button>
      </div>
    ),
  };


  // Renderers para las columnas de la tabla
  const tableRenderers1 = {
    monto: ({ value }: { value: number }) => (
      <span className="font-medium text-emerald-600">
        ${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
      </span>
    ),
    forma_pago: ({ value }: { value: string }) => (
      <div className="flex items-center gap-2">
        {value.toLowerCase().includes("tarjeta") ? (
          <CreditCard className="w-4 h-4 text-gray-500" />
        ) : (
          <DollarSign className="w-4 h-4 text-blue-500" />
        )}
        <span className="capitalize">{value.toLowerCase()}</span>
      </div>
    ),
    fecha_pago: ({ value }: { value: string }) => (
      <span>{new Date(value).toLocaleDateString('es-MX')}</span>
    ),
    aplicable: ({ value }: { value: boolean }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {value ? 'Sí' : 'No'}
      </span>
    )
  };

  // Mapear pagos al formato esperado por la tabla
  const pagosParaTabla = pagos.map(pago => ({
    ...pago,
    cliente: agente?.nombre_agente_completo || pago.cliente,
    monto_pagado: pago.monto,
    forma_De_Pago: pago.forma_pago,
    fecha_De_Pago: pago.fecha_pago,
    descuentoAplicado: pago.descuento,
    comentario: pago.comentarios,
    aplicable: pago.aplicable ? 'Sí' : 'No',
    comprobante: pago.comprobante_url
  }));

  // Manejar nuevo pago
  const handleAddPayment = async (paymentData: NuevoSaldoAFavor) => {
    try {
      setLoading(prev => ({ ...prev, pagos: true }));

      // Crear pago a través de la API
      const response = await SaldoFavor.crearPago({
        ...paymentData,
        id_cliente: agente.id_agente
      });

      // Actualizar lista de pagos
      // const nuevosPagos = await fetchPagosByAgente(agente.id_agente);
      // setPagos(nuevosPagos);

      // // Actualizar saldo del agente
      // if (agente) {
      //   const agenteActualizado = await fetchAgenteById(agente.id_agente);
      //   setAgente(agenteActualizado);
      // }

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
            totalBalance={agente.saldo_a_favor}
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

        {/* Información del agente */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-2">{agente.nombre_agente_completo}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Correo</p>
              <p>{agente.correo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p>{agente.telefono || 'No disponible'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID Agente</p>
              <p className="font-mono">{agente.id_agente}</p>
            </div>
          </div>
        </div>

        {/* Tabla de pagos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Filters
            onFilter={(filters) => {
              // Implementar lógica de filtrado real aquí
              console.log('Aplicar filtros:', filters);
            }}
            searchTerm=""
            setSearchTerm={(term) => {
              // Implementar búsqueda
              console.log('Buscar:', term);
            }}
          />

          {loading.pagos ? (
            <div className="p-8 flex justify-center">
              <Loader />
              <span className="ml-2">Cargando pagos...</span>
            </div>
          ) : (
            <Table
              registros={pagosParaTabla}
              renderers={tableRenderers}
              leyenda={`Mostrando ${pagos.length} pagos de ${agente.nombre_agente_completo}`}
            />
          )}
        </div>
      </div>

      {/* Modal para agregar pago */}
      {addPaymentModal && agente && (
        <Modal
          title="Agregar Nuevo Pago"
          onClose={() => setAddPaymentModal(false)}
          size="lg"
        >
          <PaymentModal
            saldoAFavor={agente.saldo_a_favor}
            onClose={() => setAddPaymentModal(false)}
            onAddPayment={handleAddPayment}
            agente={agente}
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
  agente
}) => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formErrors = validateForm(state);
    if (Object.keys(formErrors).length > 0) {
      console.log(formErrors)
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Mapear los datos del formulario al formato esperado por el backend
      const pagoData: NuevoSaldoAFavor = {
        id_cliente: agente.id_agente, // Debes obtener este valor del contexto o props
        monto_pagado: Number(state.amount),
        forma_pago: state.paymentMethod.toLowerCase() as
          | "transferencia"
          | "tarjeta de credito"
          | "tarjeta de debito"
          | "wallet",
        is_facturable: state.facturable,
        referencia: state.reference,
        fecha_pago: state.paymentDate,
        // Solo incluir tipo_tarjeta si es pago con tarjeta
        ...(state.paymentMethod.includes("Tarjeta") && {
          tipo_tarjeta: state.paymentMethod.includes("credito")
            ? "credito"  // Cambiado de "credito" a "credit"
            : "debito"   // Cambiado de "debito" a "debit"
        }),

        link_stripe: state.link_Stripe || "",
        descuento_aplicable: state.discountApplied,
        ...(state.comments && { comentario: state.comments }),
      };

      // Llamar al servicio para crear el pago
      const response = await SaldoFavor.crearPago(pagoData);

      // Manejar respuesta exitosa
      setIsSubmitting(false);
      setIsSubmitted(true);

      // 1. Mostrar en consola los datos que se enviarán
      console.log("Datos del formulario a enviar:", {
        ...pagoData,
        // Mostrar el saldo actual para referencia
        saldo_actual: saldoAFavor,
        saldo_restante: saldoAFavor - Number(state.amount)
      });

      // 2. Mostrar el payload que se enviará a la API
      console.log("Payload para la API:", pagoData);

      // 3. Mostrar la respuesta de la API
      //console.log("Respuesta de la API:", response);

      // Resetear después de mostrar success
      setTimeout(() => {
        setIsSubmitted(false);
        dispatch({ type: "RESET_FORM" });
      }, 3000);

    } catch (error) {
      setIsSubmitting(false);

      // Mostrar error al usuario
      if (error instanceof Error) {
        setErrors({
          ...errors,
          // Mapeo de errores del back
          amount: error.message.includes("monto") ? error.message : undefined,
          paymentMethod: error.message.includes("forma de pago") ? error.message : undefined,
        });
      } else {
        setErrors({
          ...errors,
          // Error generico
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

        {/* Mostrar saldo a favor en la parte superior */}
        {/* <div className="bg-blue-50 border-b border-blue-200 p-4 mb-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Saldo a favor:</span>
            <span className="text-lg font-bold text-blue-600">
              ${saldoAFavor.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div> */}

        {/* Formulario */}
        <div className="">
          {/* Success State */}
          {isSubmitted && (
            <div className="bg-green-50 border-b border-green-200 p-6 sticky top-0 z-10">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    ¡Pago registrado exitosamente!
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
                  {Object.values(errors).filter(item => !!item).map(item => <p key={item} className="text-red-600">
                    ◾{item}
                  </p>)}

                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
              {/* Monto */}
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

              {/* Forma de Pago */}
              <Dropdown
                label="Forma de Pago"
                value={state.paymentMethod}
                onChange={(value) => handleInputChange("paymentMethod", value)}
                options={paymentMethods}
              />

              {/* Fecha de Pago */}
              <DateInput
                label="Fecha de Pago"
                value={state.paymentDate}
                onChange={(value) => handleInputChange("paymentDate", value)}
              />

              {/* Descuento Aplicado */}
              <CheckboxInput
                checked={state.discountApplied}
                onChange={(e) => handleInputChange("discountApplied", e)}
                label={"Descuento aplicado"}
              />

              {/* Facturable */}
              <CheckboxInput
                checked={state.facturable}
                onChange={(e) => handleInputChange("facturable", e)}
                label={"Facturable"}
              />

              {/* Link Stripe */}
              <TextInput
                label="Link Stripe"
                value={state.link_Stripe}
                onChange={(value) => handleInputChange("link_Stripe", value)}
                placeholder="Agrega el Link Sprite"
              />

              {/* Comentarios */}
              <TextAreaInput
                label="Comentarios"
                value={state.comments}
                onChange={(value) => handleInputChange("comments", value)}
                placeholder="Agrega comentarios adicionales sobre el pago..."
              />
            </div>

            {/* Botones */}
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
                    Registrar Pago
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
    </div>
  );
};

export default PageCuentasPorCobrar;
/*
const MultitabContainer: React.FC<{
  tabs: TabMultitab[];
}> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState<TabMultitab>(tabs[0]);
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
                activeTab.tab === tab.tab
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="inline-block mr-2 w-4 h-4" />
              {tab.title}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4">
        <Table
          maxHeight="10rem"
          registros={activeTab.registros || []}
          renderers={activeTab.columnRender || {}}
          leyenda={activeTab.leyenda || ""}
        />
      </div>
    </div>
  );
};

interface TabMultitab {
  title: string;
  tab: string;
  icon: React.ComponentType<any>;
  registros?: { [key: string]: any }[];
  columnRender?: Record<string, (props: any) => React.ReactNode>;
  leyenda?: string;
}
*/

