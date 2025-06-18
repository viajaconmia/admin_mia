"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { da, es } from "date-fns/locale";
import { formatDate } from "@/helpers/utils";
import useApi from "@/hooks/useApi";
import { ChevronDownIcon, ChevronUpIcon, Download, Plus } from "lucide-react";
import Modal from "@/components/structure/Modal";
import { createSaldo, getSaldos } from "@/hooks/useDatabase";
import { fetchAgentes } from "@/services/agentes";
import { TypeFilters } from "@/types";
import { Fallback } from "@radix-ui/react-avatar";
import { HEADERS_API, URL } from "@/constant";


const defaultFiltersSolicitudes: TypeFilters = {
  filterType: null,
  startDate: null,
  endDate: null,
  client: null,
  correo: null,
  telefono: null,
  estado_credito: null,
  vendedor: null,
  notas: null,
  startCantidad: null,
  endCantidad: null,
};

type PrepaymentStatus =
  | "pending"    // Saldo pendiente
  | "applied"    // Saldo aplicado
  | "all";       // Todos los estados

interface FilterOptions {
  searchTerm: string;          // Para buscar cliente/agente
  statusFilter: PrepaymentStatus;
  dateRangeFilter: {
    startDate: Date | null;    // Fecha inicial para filtrar
    endDate: Date | null;      // Fecha final para filtrar
  };
  // Removemos priceRangeFilter ya que no es necesario según los requisitos
}

// Status Badge Component
const StatusBadge: React.FC<{ status: PrepaymentStatus }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-yellow-600" />
          Pendiente
        </span>
      );
    case "applied":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-blue-600" />
          Confirmada
        </span>
      );
    default:
      return null;
  }
};

// Loader Component
const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    <span className="ml-3 text-gray-700">Cargando prepagos...</span>
  </div>
);

const FacturacionModal = ({ setModal, onConfirm }) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MXN");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [reference, setReference] = useState("");
  const [chargeId, setChargeId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [processingDate, setProcessingDate] = useState("");
  const [stayId, setStayId] = useState("");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [clients, setClientes] = useState([])
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  // Mock client data
  // const clients = [
  //   { id: 1, name: "Ana García", email: "ana.garcia@email.com" },
  //   { id: 2, name: "Juan Pérez", email: "juan.perez@email.com" },
  //   { id: 3, name: "María López", email: "maria.lopez@email.com" },
  // ];

  const fetchClients = () => {
    fetchAgentes(filters, {} as TypeFilters, (data) => {
      console.log("Agentes fetched:", data);
      setClientes(data);
    });
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreatePaymentLink = async () => {
    try {
      const saldoData = {
        id_agente: selectedClient?.id_agente || null,
        id_proveedor: null,
        monto: amount,
        moneda: currency,
        forma_pago: "link",
        fecha_procesamiento: null,
        referencia: null,
        id_hospedaje: stayId || null,
        charge_id: null,
        transaction_id: null,
        motivo: reason || null,
        comentarios: comments || null,
        estado: "pending",
        estado_link: "pending"
      };

      // Crear el registro en tu base de datos
      const result = await createSaldo(saldoData);

      if (result.success) {
        // Luego llamar a tu backend para crear el link de pago en Stripe
        const paymentLinkResponse = await fetch(`${URL}/stripe/create-payment-link`, {
          method: 'POST',
          headers: HEADERS_API,
          body: JSON.stringify({
            amount: parseFloat(amount) * 100,
            currency: currency.toLowerCase(),
            customer_email: selectedClient.correo,
            metadata: {
              saldo_id: result.id_saldo,
              agente_id: selectedClient.id_agente,
              motivo: reason || "Saldo a favor"
            },
            description: `Saldo a favor para ${selectedClient.nombre}`,
          }),
        });

        const paymentLinkData = await paymentLinkResponse.json();

        if (paymentLinkData.url) {
          // Aquí puedes enviar el link al cliente por correo o mostrarlo
          // Por ahora, solo lo mostramos en consola
          console.log("Link de pago generado:", paymentLinkData.url);
          setPaymentLink(paymentLinkData.url);

          // onConfirm(
          //   saldoData
          // );
          // setModal(false);
        } else {
          throw new Error("No se pudo generar el link de pago");
        }
      }
    } catch (error) {
      console.error("Error al generar link de pago:", error);
    }
  };

  const handleSubmit = async () => {
    if (paymentMethod === "link") {
      await handleCreatePaymentLink();
    }
    else {
      try {
        // Format the data according to backend requirements
        const saldoData = {
          id_agente: selectedClient?.id_agente || null,
          id_proveedor: null,
          monto: amount,
          moneda: currency,
          forma_pago: paymentMethod == "manual" ? "carga" : paymentMethod,
          fecha_procesamiento: paymentMethod === "spei" ? paymentDate :
            paymentMethod === "manual" ? processingDate : null,
          referencia: paymentMethod === "spei" ? reference : null,
          id_hospedaje: stayId || null,
          charge_id: paymentMethod === "manual" ? chargeId : null,
          transaction_id: paymentMethod === "manual" ? transactionId : null,
          motivo: reason || null,
          comentarios: comments || null,
        };

        const result = await createSaldo(saldoData);

        if (result.success) {
          onConfirm(saldoData);
          setModal(false);
        }
      } catch (error) {
        console.error("Error creating saldo:", error);
      }
    }
  };

  return (
    <Modal
      onClose={() => setModal("")}
      title="Crear nuevo saldo a favor"
      subtitle="Crea un nuevo saldo a favor"
    >
      <div className="max-h-[70vh] overflow-y-auto px-4 max-w-2xl ">
        <div className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedClient?.id_agente || ""}
              onChange={(e) => {
                const client = clients.find(c => c.id_agente === e.target.value);
                setSelectedClient(client);
              }}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id_agente} value={client.id_agente}>
                  {client.nombre} - {client.correo}
                </option>
              ))}
            </select>
          </div>

          {selectedClient && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Cliente seleccionado
              </h3>
              <p className="font-medium">{selectedClient.nombre}</p>
              <p className="text-sm text-gray-600">{selectedClient.correo}</p>
            </div>
          )}

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ingresa el monto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Americano</option>
              </select>
            </div>
          </div>

          {/* Payment Method - Improved Styling */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pago
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("spei")}
                className={`p-4 border rounded-lg transition-all duration-200 ${paymentMethod === "spei" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-300 hover:border-blue-300"}`}
              >
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === "spei" ? "border-blue-500 bg-blue-500" : "border-gray-400"}`}>
                    {paymentMethod === "spei" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-sm font-medium">SPEI / Transferencia</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("link")}
                className={`p-4 border rounded-lg transition-all duration-200 ${paymentMethod === "link" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-300 hover:border-blue-300"}`}
              >
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === "link" ? "border-blue-500 bg-blue-500" : "border-gray-400"}`}>
                    {paymentMethod === "link" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-sm font-medium">Link de Pago Stripe</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("manual")}
                className={`p-4 border rounded-lg transition-all duration-200 ${paymentMethod === "manual" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-300 hover:border-blue-300"}`}
              >
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === "manual" ? "border-blue-500 bg-blue-500" : "border-gray-400"}`}>
                    {paymentMethod === "manual" && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-sm font-medium">Carga Manual Stripe</span>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Method Specific Fields */}
          <div className="transition-all duration-300">
            {/* SPEI/Transferencia Fields */}
            {paymentMethod === "spei" && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Referencia de la transferencia"
                  />
                </div>
              </div>
            )}

            {/* Carga Manual Stripe Fields */}
            {paymentMethod === "manual" && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-100">
                <div>
                  <h4 className="font-medium text-gray-900">Carga Manual de Stripe</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Para registrar un pago que ya fue procesado directamente en Stripe Dashboard.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Charge ID de Stripe
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={chargeId}
                    onChange={(e) => setChargeId(e.target.value)}
                    placeholder="ch_1A2B3C4D5E6F..."
                  />
                  <p className="text-xs text-gray-500 mt-1">ID del cargo en Stripe Dashboard</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="ID de la transacción"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Procesamiento
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={processingDate}
                    onChange={(e) => setProcessingDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Link de Pago Stripe Info */}
            {paymentMethod === "link" && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-900">Link de Pago con Stripe</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Se generará un link de pago seguro que se enviará al cliente. Una vez que complete el pago,
                  el saldo se agregará automáticamente a su cuenta.
                </p>
              </div>
            )}
          </div>

          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Hospedaje (Opcional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={stayId}
                onChange={(e) => setStayId(e.target.value)}
                placeholder="ID del hospedaje relacionado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo del saldo a favor
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo por el que se agrega saldo a favor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios (Opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Comentarios adicionales sobre el pago..."
              />
            </div>
          </div>
          {paymentLink && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
              Link de pago generado:&nbsp;
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {paymentLink}
              </a>
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 pb-2">
            <button
              type="button"
              onClick={() => setModal("")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedClient || !amount || !paymentMethod}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!selectedClient || !amount || !paymentMethod ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {paymentMethod === "link" ? "Generar link de pago" : "Registrar saldo a favor"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export function ReservationsMain() {
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: "",
    statusFilter: "pending", // Default to show pending payments
    dateRangeFilter: {
      startDate: null,
      endDate: null,
    },
  });
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState({
    start: "",
    end: "",
  });
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [prepagos, setPrepagos] = useState([]);

  const fetchSaldos = async () => {
    setLoading(true);
    const response = await getSaldos();
    setPrepagos(response);
    setLoading(false);
  }

  useEffect(() => {
    fetchSaldos();
  }, []);

  const confirmSaldo = async () => {
    setLoading(true);
    await fetchSaldos();
    setLoading(false);
  }

  const applyFilters = (reservations: any): any[] => {
    return reservations.filter((reservation) => {
      // Search term filter (for client/agent)
      const searchLower = filterOptions.searchTerm.toLowerCase();
      const matchesSearch =
        !filterOptions.searchTerm ||
        reservation.nombre?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        filterOptions.statusFilter === "all" ||
        reservation.estado === filterOptions.statusFilter;

      // Date range filter
      const paymentDate = new Date(reservation.fecha_generado);
      const matchesDateRange =
        (!filterOptions.dateRangeFilter.startDate ||
          paymentDate >= filterOptions.dateRangeFilter.startDate) &&
        (!filterOptions.dateRangeFilter.endDate ||
          paymentDate <= filterOptions.dateRangeFilter.endDate);

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  };
  const filteredReservations = applyFilters(prepagos);
  // Calculate summary statistics
  const calculateSummary = () => {
    const totalBalance = prepagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const filteredBalance = filteredReservations.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const pendingCount = prepagos.filter(p => p.estado === 'pending').length;

    // Current month applied payments
    const currentMonthApplied = prepagos.filter(p => {
      const paymentDate = new Date(p.fecha);
      const now = new Date();
      return p.estado === 'applied' &&
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear();
    }).length;

    // Filter period applied payments
    const filteredApplied = filteredReservations.filter(p => p.estado === 'applied').length;

    return {
      totalBalance,
      filteredBalance,
      pendingCount,
      currentMonthApplied,
      filteredApplied
    };
  };

  const summary = calculateSummary();

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilterOptions((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };





  const togglePaymentDetails = (paymentId: string) => {
    setExpandedPayment(expandedPayment === paymentId ? null : paymentId);
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Summary Header */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Total saldo por aplicar</h3>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalBalance)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Saldo por aplicar (filtros)</h3>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(summary.filteredBalance)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800">Pagos por aplicar</h3>
                <p className="text-2xl font-bold text-yellow-900">{summary.pendingCount}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Aplicados este mes</h3>
                <p className="text-2xl font-bold text-purple-900">{summary.currentMonthApplied}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-indigo-800">Aplicados en periodo</h3>
                <p className="text-2xl font-bold text-indigo-900">{summary.filteredApplied}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {/* Basic Filters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar cliente/agente..."
                    value={filterOptions.searchTerm}
                    onChange={(e) =>
                      handleFilterChange({ searchTerm: e.target.value })
                    }
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                </div>

                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterOptions.statusFilter}
                  onChange={(e) =>
                    handleFilterChange({
                      statusFilter: e.target.value as "pending" | "applied" | "all",
                    })
                  }
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Saldo pendiente</option>
                  <option value="applied">Saldo aplicado</option>
                </select>

                <button
                  onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isAdvancedFiltersOpen ? "Ocultar filtros" : "Mostrar filtros"}
                  <span className={`ml-2 transition-transform duration-200 ${isAdvancedFiltersOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                <button
                  onClick={() => setShowFacturacionModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="mr-2">
                    <Plus></Plus>
                  </span>
                  Crear Nuevo Saldo a Favor

                </button>
              </div>

              {/* Advanced Filters */}
              {isAdvancedFiltersOpen && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de fechas
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={localDateRange.start}
                          onChange={(e) => {
                            setLocalDateRange((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }));
                            handleFilterChange({
                              dateRangeFilter: {
                                ...filterOptions.dateRangeFilter,
                                startDate: e.target.value
                                  ? new Date(e.target.value)
                                  : null,
                              },
                            });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={localDateRange.end}
                          onChange={(e) => {
                            setLocalDateRange((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }));
                            handleFilterChange({
                              dateRangeFilter: {
                                ...filterOptions.dateRangeFilter,
                                endDate: e.target.value
                                  ? new Date(e.target.value)
                                  : null,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Table */}
          {loading ? (
            <Loader />
          ) : error ? (
            <div className="p-6 bg-red-50 border-t border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Original
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Pendiente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        No se encontraron prepagos con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <React.Fragment key={reservation.id_servicio}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {reservation.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(reservation.fecha_generado), "dd MMM yyyy", { locale: es })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reservation.forma_pago}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reservation.referencia || reservation.charge_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(reservation.monto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(reservation.restante)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reservation.estado === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                              }`}>
                              {reservation.estado === 'pending' ? 'Pendiente' : 'Aplicado'}
                            </span>
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => togglePaymentDetails(reservation.id_servicio)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {expandedPayment === reservation.id_servicio ? 'Ocultar' : 'Ver'} detalles
                            </button>
                          </td> */}
                        </tr>

                        {/* Expanded payment details */}
                        {expandedPayment === reservation.id_servicio && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-gray-900">Detalles del pago:</h4>
                                  <p className="text-sm text-gray-500">
                                    {reservation.metodo === 'Tarjeta' && (
                                      <>
                                        <span className="block">Últimos 4 dígitos: {reservation.cardLast4}</span>
                                        <span className="block">Referencia: {reservation.referencia}</span>
                                        <span className="block">Autorización: {reservation.authCode}</span>
                                        <span className="block">Banco: {reservation.banco}</span>
                                        <span className="block">Charge ID: {reservation.chargeId}</span>
                                        <span className="block">Transaction ID: {reservation.transactionId}</span>
                                      </>
                                    )}
                                    {reservation.metodo === 'Transferencia' && (
                                      <>
                                        <span className="block">Referencia: {reservation.referencia}</span>
                                        <span className="block">Banco: {reservation.banco}</span>
                                        <span className="block">Cuenta: {reservation.cuenta}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">Aplicaciones:</h4>
                                  {reservation.aplicaciones?.length > 0 ? (
                                    <ul className="text-sm text-gray-500">
                                      {reservation.aplicaciones.map((app, index) => (
                                        <li key={index} className="mb-1">
                                          {formatCurrency(app.monto)} a reservación {app.reservacion} el {format(new Date(app.fecha), "dd MMM yyyy", { locale: es })}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-500">No hay aplicaciones registradas</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Facturación Modal */}
        {showFacturacionModal && (
          <FacturacionModal
            setModal={setShowFacturacionModal}
            onConfirm={confirmSaldo}
          />
        )}
      </main>

    </div>

  );
}
