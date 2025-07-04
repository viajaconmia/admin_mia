"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  DollarSign,
  CreditCard,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";

// ========================================
// TIPOS DE DATOS
// ========================================
interface Payment {
  id: string;
  amount: number;
  date: string;
  description: string;
  method: "credit_card" | "bank_transfer" | "cash";
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

const mockPayments: Payment[] = [
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
];

// Funciones simuladas de API
const apiService = {
  getPayments: () => simulateApiCall(mockPayments, 800),
  getReservations: () => simulateApiCall(mockReservations, 600),
  addPayment: (payment: Omit<Payment, "id">) =>
    simulateApiCall({ ...payment, id: Date.now().toString() }, 1000),
  assignPaymentToReservation: (assignments: PaymentAssignment[]) =>
    simulateApiCall({ success: true, assignments }, 800),
};

// ========================================
// COMPONENTE: MODAL DE PAGOS
// ========================================
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (payment: Omit<Payment, "id">) => void;
  isLoading: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onAddPayment,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    method: "credit_card" as const,
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount && formData.description) {
      onAddPayment({
        amount: parseFloat(formData.amount),
        description: formData.description,
        method: formData.method,
        date: formData.date,
      });
      setFormData({
        amount: "",
        description: "",
        method: "credit_card",
        date: new Date().toISOString().split("T")[0],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Agregar Nuevo Pago
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Descripción del pago"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData({ ...formData, method: e.target.value as any })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
              >
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="bank_transfer">Transferencia Bancaria</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Agregando..." : "Agregar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
                  className={`hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-emerald-50" : ""
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

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
interface PageCuentasPorCobrarProps {
  agente: Agente;
}

const PageCuentasPorCobrar: React.FC<PageCuentasPorCobrarProps> = ({
  agente,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [assignments, setAssignments] = useState<PaymentAssignment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "assign">("overview");
  console.log(agente);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const [paymentsData, reservationsData] = await Promise.all([
          apiService.getPayments(),
          apiService.getReservations(),
        ]);
        setPayments(paymentsData);
        setReservations(reservationsData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Calcular balances
  const totalBalance = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const assignedBalance = assignments.reduce(
    (sum, assignment) => sum + assignment.assignedAmount,
    0
  );
  const availableBalance = totalBalance - assignedBalance;

  const handleAddPayment = async (paymentData: Omit<Payment, "id">) => {
    setIsLoading(true);
    try {
      const newPayment = await apiService.addPayment(paymentData);
      setPayments((prev) => [...prev, newPayment]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentChange = (reservationId: string, amount: number) => {
    setAssignments((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.reservationId === reservationId
      );
      const newAssignments = [...prev];

      if (existingIndex >= 0) {
        if (amount > 0) {
          newAssignments[existingIndex] = {
            ...newAssignments[existingIndex],
            assignedAmount: amount,
          };
        } else {
          newAssignments.splice(existingIndex, 1);
        }
      } else if (amount > 0) {
        newAssignments.push({ reservationId, assignedAmount: amount });
      }

      return newAssignments;
    });
  };

  const handleToggleReservation = (reservationId: string) => {
    const isSelected = assignments.some(
      (a) => a.reservationId === reservationId
    );

    if (isSelected) {
      setAssignments((prev) =>
        prev.filter((a) => a.reservationId !== reservationId)
      );
    } else {
      const reservation = reservations.find((r) => r.id === reservationId);
      if (reservation) {
        const suggestedAmount = Math.min(
          reservation.pendingAmount,
          availableBalance
        );
        setAssignments((prev) => [
          ...prev,
          { reservationId, assignedAmount: suggestedAmount },
        ]);
      }
    }
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      credit_card: "bg-blue-100 text-blue-800",
      bank_transfer: "bg-green-100 text-green-800",
      cash: "bg-yellow-100 text-yellow-800",
    };

    const labels = {
      credit_card: "Tarjeta",
      bank_transfer: "Transferencia",
      cash: "Efectivo",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badges[method as keyof typeof badges]
        }`}
      >
        {labels[method as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Summary */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 place-content-center">
          <PaymentSummary
            totalBalance={totalBalance}
            assignedBalance={assignedBalance}
          />
          <div className="mb-6 flex items-center justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Agregar Pago
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {assignments.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Resumen de Asignaciones
            </h3>
            <div className="space-y-2">
              {assignments.map((assignment) => {
                const reservation = reservations.find(
                  (r) => r.id === assignment.reservationId
                );
                return (
                  <div
                    key={assignment.reservationId}
                    className="flex justify-between items-center py-2"
                  >
                    <span className="text-gray-700">
                      {reservation?.clientName}
                    </span>
                    <span className="font-medium text-emerald-600">
                      $
                      {assignment.assignedAmount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-2 mt-4">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Asignado:</span>
                  <span className="text-emerald-600">
                    $
                    {assignedBalance.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                  <span>Saldo Restante:</span>
                  <span>
                    $
                    {availableBalance.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <MultitabContainer
            tabs={[
              {
                title: "Resumen de pagos",
                tab: "overview",
                icon: DollarSign,
              },
              {
                title: "Asignar Pagos a reservas",
                tab: "assign",
                icon: CreditCard,
              },
            ]}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPayment={handleAddPayment}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PageCuentasPorCobrar;

const MultitabContainer: React.FC<{
  tabs: { title: string; tab: string; icon: React.ComponentType<any> }[];
}> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].tab);
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.tab}
              onClick={() => setActiveTab(tab.tab)}
              className={`py-3 px-1 border-b-2 font-medium text-xs transition-colors ${
                activeTab === tab.tab
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4">
        {activeTab === "overview" && <div>Contenido del resumen de pagos</div>}
        {activeTab === "assign" && (
          <div>Contenido de asignar pagos a reservas</div>
        )}
      </div>
    </div>
  );
};
