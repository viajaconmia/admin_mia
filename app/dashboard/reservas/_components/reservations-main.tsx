"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fetchReservationsAll } from "@/services/reservas";
import Link from "next/link";

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
  id_pago: string;
  pendiente_por_cobrar: number;
  monto_a_credito: string;
  id_factura: string | null;
  primer_nombre: string | null;
  apellido_paterno: string | null;
}

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "all";

interface FilterOptions {
  searchTerm: string;
  statusFilter: ReservationStatus;
  dateRangeFilter: {
    startDate: Date | null;
    endDate: Date | null;
  };
  priceRangeFilter: {
    min: number | null;
    max: number | null;
  };
}

// Status Badge Component
const StatusBadge: React.FC<{ status: ReservationStatus }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-yellow-600" />
          Pendiente
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-blue-600" />
          Confirmada
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-green-600" />
          Completada
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-red-600" />
          Cancelada
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
    <span className="ml-3 text-gray-700">Cargando reservaciones...</span>
  </div>
);

export function ReservationsMain() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: "",
    statusFilter: "all",
    dateRangeFilter: {
      startDate: null,
      endDate: null,
    },
    priceRangeFilter: {
      min: null,
      max: null,
    },
  });
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState({
    start: "",
    end: "",
  });
  const [localPriceRange, setLocalPriceRange] = useState({
    min: "",
    max: "",
  });

  useEffect(() => {
    setLoading(true);
    fetchReservationsAll((data) => {
      setReservations(data);
      setLoading(false);
    }).catch((err) => {
      setError("Error al cargar las reservaciones");
      setLoading(false);
      console.error(err);
    });
  }, []);

  const getReservationStatus = (
    reservation: Reservation
  ): ReservationStatus => {
    if (reservation.pendiente_por_cobrar > 0) return "pending";
    if (reservation.id_booking) return "confirmed";
    return "completed";
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(parseFloat(value));
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilterOptions((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const applyFilters = (reservations: Reservation[]): Reservation[] => {
    return reservations.filter((reservation) => {
      // Search term filter
      const searchLower = filterOptions.searchTerm.toLowerCase();
      const matchesSearch =
        !filterOptions.searchTerm ||
        reservation.hotel.toLowerCase().includes(searchLower) ||
        reservation.confirmation_code.toLowerCase().includes(searchLower) ||
        `${reservation.primer_nombre} ${reservation.apellido_paterno}`
          .toLowerCase()
          .includes(searchLower);

      // Status filter
      const status = getReservationStatus(reservation);
      const matchesStatus =
        filterOptions.statusFilter === "all" ||
        status === filterOptions.statusFilter;

      // Date range filter
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      const matchesDateRange =
        (!filterOptions.dateRangeFilter.startDate ||
          checkIn >= filterOptions.dateRangeFilter.startDate) &&
        (!filterOptions.dateRangeFilter.endDate ||
          checkOut <= filterOptions.dateRangeFilter.endDate);

      // Price range filter
      const price = parseFloat(reservation.total);
      const matchesPriceRange =
        (filterOptions.priceRangeFilter.min === null ||
          price >= filterOptions.priceRangeFilter.min) &&
        (filterOptions.priceRangeFilter.max === null ||
          price <= filterOptions.priceRangeFilter.max);

      return (
        matchesSearch && matchesStatus && matchesDateRange && matchesPriceRange
      );
    });
  };

  const filteredReservations = applyFilters(reservations);

  return (
    <div className="min-h-screen">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              {/* Basic Filters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar por hotel, código o viajero..."
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
                      statusFilter: e.target.value as ReservationStatus,
                    })
                  }
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              {/* Advanced Filters Toggle */}
              <div>
                <button
                  onClick={() =>
                    setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)
                  }
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isAdvancedFiltersOpen
                    ? "Ocultar filtros avanzados"
                    : "Mostrar filtros avanzados"}
                  <span
                    className={`ml-2 transition-transform duration-200 ${
                      isAdvancedFiltersOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de precio
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Mínimo"
                          value={localPriceRange.min}
                          onChange={(e) => {
                            setLocalPriceRange((prev) => ({
                              ...prev,
                              min: e.target.value,
                            }));
                            handleFilterChange({
                              priceRangeFilter: {
                                ...filterOptions.priceRangeFilter,
                                min: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Máximo"
                          value={localPriceRange.max}
                          onChange={(e) => {
                            setLocalPriceRange((prev) => ({
                              ...prev,
                              max: e.target.value,
                            }));
                            handleFilterChange({
                              priceRangeFilter: {
                                ...filterOptions.priceRangeFilter,
                                max: e.target.value
                                  ? parseFloat(e.target.value)
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
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Hotel
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Código
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Viajero
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Check-in / Check-out
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Habitación
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Estado de pago
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Detalles
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No se encontraron reservaciones con los filtros
                        actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <tr
                        key={reservation.id_servicio}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reservation.hotel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reservation.codigo_reservacion_hotel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reservation.primer_nombre &&
                          reservation.apellido_paterno
                            ? `${reservation.primer_nombre} ${reservation.apellido_paterno}`
                            : "Sin información"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>
                              {format(
                                new Date(reservation.check_in),
                                "dd MMM yyyy",
                                { locale: es }
                              )}
                            </span>
                            <span className="text-xs text-gray-400">al</span>
                            <span>
                              {format(
                                new Date(reservation.check_out),
                                "dd MMM yyyy",
                                { locale: es }
                              )}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {calculateNights(
                                reservation.check_in,
                                reservation.check_out
                              )}{" "}
                              noche(s)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {reservation.room}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(reservation.total)}
                          {reservation.pendiente_por_cobrar > 0 && (
                            <div className="text-xs text-amber-600 mt-1">
                              Pendiente:{" "}
                              {formatCurrency(
                                reservation.pendiente_por_cobrar.toString()
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={getReservationStatus(reservation)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col space-y-1 text-xs">
                            <div>
                              <span className="font-medium">ID servicio:</span>{" "}
                              {reservation.id_servicio.substring(0, 8)}...
                            </div>
                            {reservation.id_booking && (
                              <div>
                                <span className="font-medium">ID booking:</span>{" "}
                                {reservation.id_booking}
                              </div>
                            )}
                            {reservation.codigo_reservacion_hotel && (
                              <div>
                                <span className="font-medium">
                                  Código hotel:
                                </span>{" "}
                                {reservation.codigo_reservacion_hotel}
                              </div>
                            )}
                            {reservation.is_credito && (
                              <div className="text-blue-600">A crédito</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={
                                window.location.href +
                                "/" +
                                reservation.id_booking
                              }
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Ver / Editar
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
