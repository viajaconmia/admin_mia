"use client";
import { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  FilterIcon,
} from "lucide-react";
import { fetchReservations } from "@/services/reservas";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchPendientesAgent } from "@/hooks/useFetch";

// Types
interface Reservation {
  id_servicio: string;
  created_at: string;
  is_credito: boolean | null;
  id_solicitud: string;
  confirmation_code: string;
  hotel: string;
  check_in: string;
  check_out: string;
  room: string;
  total: string;
  id_usuario_generador: string;
  id_booking: string | null;
  codigo_reservacion_hotel: string | null;
  id_pago: string | null;
  pendiente_por_cobrar: number;
  monto_a_credito: string;
  id_factura: string | null;
  primer_nombre: string;
  apellido_paterno: string;
}

type TabType = "operaciones" | "pagos" | "facturas" | "cuentas-cobrar";

// Utility Functions
const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("T")[0].split("-");
  const date = new Date(+year, +month - 1, +day);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (amount: string): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(parseFloat(amount));
};

const extractReservationCode = (serviceId: string): string => {
  const parts = serviceId.split("-");
  return parts[1] || serviceId;
};

// Components
const SearchFilter = ({ onSearch }: { onSearch: (value: string) => void }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        placeholder="Buscar reservaciones..."
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || label}</span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const OperacionesRow = ({ reservation }: { reservation: Reservation }) => {
  const [expanded, setExpanded] = useState(false);
  const reservationCode = extractReservationCode(reservation.id_servicio);
  const isProcessed = !!reservation.id_booking;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-gray-900"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            {reservationCode}
          </button>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="font-medium">{reservation.hotel}</div>
          <div className="text-sm text-gray-500">{reservation.room}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div>{formatDate(reservation.check_in)}</div>
          <div className="text-sm text-gray-500">
            {formatDate(reservation.check_out)}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {reservation.primer_nombre} {reservation.apellido_paterno}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {formatCurrency(reservation.total)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isProcessed
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isProcessed ? "Procesada" : "Pendiente"}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Detalles de Reservación</h4>
                <p>ID de Servicio: {reservation.id_servicio}</p>
                <p>
                  Código Hotel: {reservation.codigo_reservacion_hotel || "N/A"}
                </p>
                <p>Creada: {formatDate(reservation.created_at)}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Estado de Procesamiento</h4>
                <p>ID de Booking: {reservation.id_booking || "En proceso"}</p>
                <p>Estado: {isProcessed ? "Procesada" : "Pendiente"}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Información Adicional</h4>
                <p>ID de Usuario: {reservation.id_usuario_generador}</p>
                <p>Tipo de Habitación: {reservation.room}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const PagosRow = ({ reservation }: { reservation: Reservation }) => {
  const [expanded, setExpanded] = useState(false);
  const reservationCode = extractReservationCode(reservation.id_servicio);
  const isPendingPayment = reservation.pendiente_por_cobrar === 1;
  const isCredit = Boolean(reservation.is_credito);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-gray-900"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            {reservationCode}
          </button>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="font-medium">{reservation.hotel}</div>
          <div className="text-sm text-gray-500">
            {formatDate(reservation.check_in)}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {formatCurrency(reservation.total)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isPendingPayment
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {isPendingPayment ? "Pendiente" : "Pagado"}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isCredit
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isCredit ? "Crédito" : "Contado"}
          </span>
        </td>
        {isCredit && (
          <td className="px-4 py-3 whitespace-nowrap">
            {formatCurrency(reservation.monto_a_credito)}
          </td>
        )}
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Detalles del Pago</h4>
                <p>ID de Pago: {reservation.id_pago || "N/A"}</p>
                <p>
                  Estado: {isPendingPayment ? "Pendiente de Pago" : "Pagado"}
                </p>
                <p>Tipo: {isCredit ? "Crédito" : "Contado"}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Información de Crédito</h4>
                <p>
                  Monto a Crédito: {formatCurrency(reservation.monto_a_credito)}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Detalles de Reservación</h4>
                <p>
                  Huésped: {reservation.primer_nombre}{" "}
                  {reservation.apellido_paterno}
                </p>
                <p>Total: {formatCurrency(reservation.total)}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const FacturasRow = ({ reservation }: { reservation: Reservation }) => {
  const [expanded, setExpanded] = useState(false);
  const reservationCode = extractReservationCode(reservation.id_servicio);
  const hasInvoice = !!reservation.id_factura;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-gray-900"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            {reservationCode}
          </button>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="font-medium">{reservation.hotel}</div>
          <div className="text-sm text-gray-500">
            {formatDate(reservation.check_in)}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {reservation.primer_nombre} {reservation.apellido_paterno}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {formatCurrency(reservation.total)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              hasInvoice
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {hasInvoice ? "Facturado" : "Sin Facturar"}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {hasInvoice ? (
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              Ver Factura
            </button>
          ) : (
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Crear Factura
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Detalles de Facturación</h4>
                <p>ID de Factura: {reservation.id_factura || "No facturado"}</p>
                <p>Estado: {hasInvoice ? "Facturado" : "Pendiente"}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Información de Pago</h4>
                <p>ID de Pago: {reservation.id_pago || "N/A"}</p>
                <p>Total: {formatCurrency(reservation.total)}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Datos del Cliente</h4>
                <p>
                  Nombre: {reservation.primer_nombre}{" "}
                  {reservation.apellido_paterno}
                </p>
                <p>ID de Usuario: {reservation.id_usuario_generador}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const CuentasRow = ({ cuenta }: { cuenta: any }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 whitespace-nowrap">
          {/* <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-gray-900"
          > */}
          {/* {expanded ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )} */}
          {cuenta.concepto}
          {/* </button> */}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="font-medium">
            {formatCurrency(cuenta.pago_por_credito)}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {formatCurrency(cuenta.pendiente_por_cobrar)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {cuenta.estado_solicitud}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {new Date(cuenta.fecha_credito).toLocaleDateString()}
        </td>
      </tr>
      {/* {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Detalles de Facturación</h4>
                <p>ID de Factura: {reservation.id_factura || "No facturado"}</p>
                <p>Estado: {hasInvoice ? "Facturado" : "Pendiente"}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Información de Pago</h4>
                <p>ID de Pago: {reservation.id_pago || "N/A"}</p>
                <p>Total: {formatCurrency(reservation.total)}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Datos del Cliente</h4>
                <p>
                  Nombre: {reservation.primer_nombre}{" "}
                  {reservation.apellido_paterno}
                </p>
                <p>ID de Usuario: {reservation.id_usuario_generador}</p>
              </div>
            </div>
          </td>
        </tr>
      )} */}
    </>
  );
};

// Main Component
export default function ReservationManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("operaciones");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cuentas, setCuentas] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    payment: "",
    type: "",
    invoice: "", // New filter for invoices
  });
  const params = useParams();
  const { client } = params;

  useEffect(() => {
    try {
      const clientId = Array.isArray(client) ? client[0] : client;
      const response = fetchReservations(clientId, (data) => {
        setReservations(data);
        setFilteredReservations(data);
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const pendientesData = await fetchPendientesAgent(
        Array.isArray(client) ? client[0] : client
      );
      console.log(pendientesData);
      setCuentas(pendientesData);
    };
    fetchData();
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = [...reservations];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (res) =>
          res.hotel.toLowerCase().includes(term) ||
          res.primer_nombre.toLowerCase().includes(term) ||
          res.apellido_paterno.toLowerCase().includes(term) ||
          res.id_servicio.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((res) =>
        filters.status === "complete" ? !!res.id_booking : !res.id_booking
      );
    }

    // Payment filter
    if (filters.payment) {
      filtered = filtered.filter((res) =>
        filters.payment === "pending"
          ? res.pendiente_por_cobrar === 1
          : res.pendiente_por_cobrar === 0
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter((res) =>
        filters.type === "credit"
          ? res.is_credito === true
          : res.is_credito === false
      );
    }

    // Invoice filter
    if (activeTab === "facturas") {
      if (filters.invoice === "invoiced") {
        filtered = filtered.filter((res) => !!res.id_factura);
      } else if (filters.invoice === "not_invoiced") {
        filtered = filtered.filter((res) => !res.id_factura);
      }
    }

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, filters, activeTab]);

  const renderFilters = () => {
    if (activeTab === "facturas") {
      return (
        <div className="grid grid-cols-2 gap-4 flex-1">
          <FilterDropdown
            label="Estado de Factura"
            options={[
              { value: "", label: "Todas las facturas" },
              { value: "invoiced", label: "Facturadas" },
              { value: "not_invoiced", label: "Sin Facturar" },
            ]}
            value={filters.invoice}
            onChange={(value) => setFilters({ ...filters, invoice: value })}
          />
          <div className="w-full" /> {/* Spacer */}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-4 flex-1">
        <FilterDropdown
          label="Estado"
          options={[
            { value: "", label: "Todos los estados" },
            { value: "pending", label: "Pendiente" },
            { value: "complete", label: "Completado" },
          ]}
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
        />
        <FilterDropdown
          label="Pago"
          options={[
            { value: "", label: "Todos los pagos" },
            { value: "pending", label: "Pendiente" },
            { value: "paid", label: "Pagado" },
          ]}
          value={filters.payment}
          onChange={(value) => setFilters({ ...filters, payment: value })}
        />
        <FilterDropdown
          label="Tipo"
          options={[
            { value: "", label: "Todos los tipos" },
            { value: "credit", label: "Crédito" },
            { value: "cash", label: "Contado" },
          ]}
          value={filters.type}
          onChange={(value) => setFilters({ ...filters, type: value })}
        />
      </div>
    );
  };
  const fetchCuentas = async () => {};
  const renderTable = () => {
    switch (activeTab) {
      case "operaciones":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hotel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fechas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Huésped
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <OperacionesRow
                  key={reservation.id_servicio}
                  reservation={reservation}
                />
              ))}
            </tbody>
          </table>
        );
      case "pagos":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hotel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monto Crédito
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <PagosRow
                  key={reservation.id_servicio}
                  reservation={reservation}
                />
              ))}
            </tbody>
          </table>
        );
      case "facturas":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hotel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <FacturasRow
                  key={reservation.id_servicio}
                  reservation={reservation}
                />
              ))}
            </tbody>
          </table>
        );
      case "cuentas-cobrar":
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Concepto de pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Restante por pagar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha creado
                </th>
                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cuentas.map((cuenta) => (
                <CuentasRow key={cuenta.id_servicio} cuenta={cuenta} />
              ))}
            </tbody>
          </table>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-white relative">
      <Link
        className=" absolute right-4 rounded-sm bg-sky-600 p-2 text-white"
        href={window.location.href + "/create"}
      >
        Crear reservación
      </Link>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("operaciones")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "operaciones"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Operaciones
          </button>
          <button
            onClick={() => setActiveTab("pagos")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pagos"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pagos
          </button>
          <button
            onClick={() => setActiveTab("facturas")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "facturas"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Facturas
          </button>
          <button
            onClick={() => setActiveTab("cuentas-cobrar")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "cuentas-cobrar"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Cuentas por cobrar
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/3">
          <SearchFilter onSearch={setSearchTerm} />
        </div>
        <div className="flex flex-1 items-center gap-4">
          <FilterIcon className="h-4 w-4 text-gray-400" />
          {renderFilters()}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        {renderTable()}
      </div>
    </div>
  );
}
