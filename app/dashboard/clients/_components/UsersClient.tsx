"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchViajerosByAgente } from "@/services/agentes";
import { useParams } from "next/navigation";
import { fetchCompaniesAgent } from "@/hooks/useFetch";
import { createNewViajero, updateViajero } from "@/hooks/useDatabase";
import { deleteTraveler } from "@/hooks/useDatabase";

// Types
interface Company {
  id_empresa: string;
  razon_social: string;
}

interface Traveler {
  id_agente: string;
  id_viajero: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  nacionalidad: string | null;
  numero_pasaporte: string | null;
  numero_empleado: string | null;
  empresas: Company[];
}

interface FilterState {
  search: string;
  nacionalidad: string;
  empresa: string;
}

type SortDirection = "asc" | "desc";
interface SortState {
  column: keyof Traveler | null;
  direction: SortDirection;
}

const createTraveler = async (
  traveler: Partial<Traveler>
): Promise<Traveler> => {
  // Replace with actual API call
  const response = await fetch("/api/travelers", {
    method: "POST",
    body: JSON.stringify(traveler),
  });
  return response.json();
};

const updateTraveler = async (traveler: Traveler): Promise<Traveler> => {
  // Replace with actual API call
  const response = await fetch(`/api/travelers/${traveler.id_viajero}`, {
    method: "PUT",
    body: JSON.stringify(traveler),
  });
  return response.json();
};

// const deleteTraveler = async (id: string): Promise<void> => {
//   // Replace with actual API call
//   await deleteTraveler(id);
// };

export function UsersClient({ agente }: { agente: Agente }) {
  const queryClient = useQueryClient();
  const client  = agente.id_agente;


  // Queries and Mutations
  const fetchCompaniesData = async () => {
    try {
      const response = await fetchViajerosByAgente(
        Array.isArray(client) ? client[0] : client
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error("Error fetching travelers:", error);
      throw error;
    }
  };

  const {
    data: travelers = [],
    isLoading,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["travelers", client],
    queryFn: fetchCompaniesData, // Usa la función aquí
  });

  // const createMutation = useMutation({
  //   mutationFn: createTraveler,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["travelers"] }),
  // });

  // const updateMutation = useMutation({
  //   mutationFn: updateTraveler,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["travelers"] }),
  // });

  const deleteMutation = useMutation({
    mutationFn: deleteTraveler,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["travelers"] }),
  });

  const createTraveler = async () => {
    try {
      const responseCompany = await createNewViajero(
        formData,
        selectedEmpresas
      );
      if (!responseCompany.success) {
        throw new Error("No se pudo registrar al viajero");
      }
      console.log(responseCompany);
    } catch (error) {
      console.error("Error creando al nuevo viajero", error);
    }
  };

  const updateTraveler = async () => {
    try {
      const responseCompany = await updateViajero(
        formData,
        selectedEmpresas,
        selectedTraveler.id_viajero
      );
      if (!responseCompany.success) {
        throw new Error("No se pudo actualizar al viajero");
      }
      console.log(responseCompany);
    } catch (error) {
      console.error("Error actualizando viajero", error);
    }
  };
  // State
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    nacionalidad: "",
    empresa: "",
  });

  const [sort, setSort] = useState<SortState>({
    column: "primer_nombre",
    direction: "asc",
  });

  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">(
    "view"
  );
  const [formData, setFormData] = useState<Partial<Traveler>>({});

  // Computed values
  const filteredTravelers = useMemo(() => {
    return travelers.filter((traveler) => {
      const searchTerm = filters.search.toLowerCase();
      const fullName = `${traveler.primer_nombre} ${
        traveler.segundo_nombre || ""
      } ${traveler.apellido_paterno} ${
        traveler.apellido_materno || ""
      }`.toLowerCase();

      const matchesSearch =
        !filters.search ||
        fullName.includes(searchTerm) ||
        (traveler.correo?.toLowerCase().includes(searchTerm) ?? false) ||
        (traveler.numero_empleado?.toLowerCase().includes(searchTerm) ?? false);

      const matchesNacionalidad =
        !filters.nacionalidad || traveler.nacionalidad === filters.nacionalidad;

      const matchesEmpresa =
        !filters.empresa ||
        traveler.empresas.some((emp) => emp.id_empresa === filters.empresa);

      return matchesSearch && matchesNacionalidad && matchesEmpresa;
    });
  }, [travelers, filters]);

  const sortedTravelers = useMemo(() => {
    if (!sort.column) return filteredTravelers;

    return [...filteredTravelers].sort((a, b) => {
      const aValue = a[sort.column!];
      const bValue = b[sort.column!];

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredTravelers, sort]);

  const availableNacionalidades = useMemo(() => {
    const nacionalidades = new Set(
      travelers
        .map((t) => t.nacionalidad)
        .filter((nacionalidad): nacionalidad is string => !!nacionalidad)
    );
    return Array.from(nacionalidades).sort();
  }, [travelers]);

  const availableEmpresas = useMemo(() => {
    const empresasSet = new Set<Company>();
    travelers.forEach((traveler) => {
      traveler.empresas.forEach((empresa) => {
        empresasSet.add(empresa);
      });
    });
    return Array.from(empresasSet).sort((a, b) =>
      a.razon_social.localeCompare(b.razon_social)
    );
  }, [travelers]);

  const [empresas, setEmpresas] = useState<Company[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState(
    selectedTraveler?.empresas?.map((e) => e.id_empresa) || []
  );
  const handleCheckboxChange = (event: any) => {
    const { value, checked } = event.target;
    setSelectedEmpresas((prev) =>
      checked ? [...prev, value] : prev.filter((id) => id !== value)
    );
  };

  const fetchData = async () => {
    const data = await fetchCompaniesAgent(
      Array.isArray(client) ? client[0] : client
    );
    setEmpresas(data);
  };
  useEffect(() => {
    fetchData();
    fetchCompaniesData();
  }, [modalMode]);

  // Handlers
  const handleSort = (column: keyof Traveler) => {
    setSort((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (
    mode: "view" | "edit" | "create",
    traveler?: Traveler
  ) => {
    setModalMode(mode);
    fetchData();
    setSelectedTraveler(traveler || null);
    setFormData(traveler || {});
    setSelectedEmpresas(traveler?.empresas?.map((e) => e.id_empresa) || []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTraveler(null);
    setFormData({});
    setSelectedEmpresas([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        await createTraveler();
        await refetchCompanies();
      } else if (modalMode === "edit" && selectedEmpresas) {
        await updateTraveler();
        await refetchCompanies();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este viajero?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting traveler:", error);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Viajeros</h1>
          <button
            onClick={() => handleOpenModal("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Viajero
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Buscar por nombre, correo o número de empleado..."
                value={filters.search}
                onChange={handleFilterChange}
                className="pl-10 w-full h-10 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              name="nacionalidad"
              value={filters.nacionalidad}
              onChange={handleFilterChange}
              className="h-10 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Nacionalidad</option>
              {availableNacionalidades.map((nacionalidad) => (
                <option
                  key={nacionalidad as string}
                  value={nacionalidad as string}
                >
                  {nacionalidad as string}
                </option>
              ))}
            </select>

            <select
              name="empresa"
              value={filters.empresa}
              onChange={handleFilterChange}
              className="h-10 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Empresa</option>
              {availableEmpresas.map((empresa) => (
                <option key={empresa.id_empresa} value={empresa.id_empresa}>
                  {empresa.razon_social}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Nombre",
                    "Correo",
                    "Nacionalidad",
                    "Empresas",
                    "Acciones",
                  ].map((header, index) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      onClick={() => {
                        const columns: (keyof Traveler)[] = [
                          "primer_nombre",
                          "correo",
                          "nacionalidad",
                          "empresas",
                        ];
                        if (index < columns.length) handleSort(columns[index]);
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{header}</span>
                        {index < 4 &&
                          sort.column ===
                            [
                              "primer_nombre",
                              "correo",
                              "nacionalidad",
                              "empresas",
                            ][index] &&
                          (sort.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTravelers.map((traveler) => (
                  <tr key={traveler.id_viajero} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`${traveler.primer_nombre} ${
                            traveler.segundo_nombre || ""
                          } ${traveler.apellido_paterno}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {traveler.numero_empleado || "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {traveler.correo || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          "bg-blue-100 text-blue-800"
                        )}
                      >
                        {traveler.nacionalidad || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {traveler.empresas.map((empresa) => (
                          <span
                            key={empresa.id_empresa}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs"
                          >
                            {empresa.razon_social}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal("view", traveler)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal("edit", traveler)}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(traveler.id_viajero)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {modalMode === "view"
                  ? "Detalles del Viajero"
                  : modalMode === "edit"
                  ? "Editar Viajero"
                  : "Nuevo Viajero"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === "view" && selectedTraveler ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Información Personal
                    </h3>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">
                          Nombre Completo
                        </dt>
                        <dd className="text-sm font-medium">
                          {`${selectedTraveler.primer_nombre} ${
                            selectedTraveler.segundo_nombre || ""
                          } ${selectedTraveler.apellido_paterno} ${
                            selectedTraveler.apellido_materno || ""
                          }`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Correo</dt>
                        <dd className="text-sm font-medium">
                          {selectedTraveler.correo || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Teléfono</dt>
                        <dd className="text-sm font-medium">
                          {selectedTraveler.telefono || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Información Adicional
                    </h3>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">Nacionalidad</dt>
                        <dd className="text-sm font-medium">
                          {selectedTraveler.nacionalidad || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">
                          Número de Pasaporte
                        </dt>
                        <dd className="text-sm font-medium">
                          {selectedTraveler.numero_pasaporte || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">
                          Número de Empleado
                        </dt>
                        <dd className="text-sm font-medium">
                          {selectedTraveler.numero_empleado || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Empresas Asignadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTraveler.empresas.map((empresa) => (
                      <span
                        key={empresa.id_empresa}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm"
                      >
                        {empresa.razon_social}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Primer Nombre
                    </label>
                    <input
                      type="text"
                      name="primer_nombre"
                      value={formData.primer_nombre || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primer_nombre: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      name="segundo_nombre"
                      value={formData.segundo_nombre || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          segundo_nombre: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Apellido Paterno
                    </label>
                    <input
                      type="text"
                      name="apellido_paterno"
                      value={formData.apellido_paterno || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apellido_paterno: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Apellido Materno
                    </label>
                    <input
                      type="text"
                      name="apellido_materno"
                      value={formData.apellido_materno || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apellido_materno: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Correo
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, correo: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Fecha de nacimiento
                      </label>
                      <input
                        type="date"
                        name="fecha_nacimiento"
                        defaultValue={
                          formData?.fecha_nacimiento
                            ? new Date(formData.fecha_nacimiento)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fecha_nacimiento: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nacionalidad
                      </label>
                      <select
                        name="nacionalidad"
                        defaultValue={formData?.nacionalidad || ""}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nacionalidad: e.target.value,
                          })
                        }
                      >
                        <option value="">Selecciona una nacionalidad</option>
                        <option value="MX">Mexicana</option>
                        <option value="US">Estadounidense</option>
                        <option value="CA">Canadiense</option>
                        <option value="ES">Española</option>
                        <option value="AR">Argentina</option>
                        <option value="BR">Brasileña</option>
                        <option value="FR">Francesa</option>
                        <option value="DE">Alemana</option>
                        <option value="IT">Italiana</option>
                        <option value="JP">Japonesa</option>
                        <option value="CN">China</option>
                        <option value="IN">India</option>
                        <option value="UK">Británica</option>
                        <option value="AU">Australiana</option>
                        <option value="CL">Chilena</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Número de Pasaporte
                      </label>
                      <input
                        type="text"
                        name="numero_pasaporte"
                        value={formData.numero_pasaporte || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numero_pasaporte: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Número de Empleado
                      </label>
                      <input
                        type="text"
                        name="numero_empleado"
                        value={formData.numero_empleado || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numero_empleado: e.target.value,
                          })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Género
                      </label>
                      <select
                        name="genero"
                        value={formData.genero || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, genero: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Empresas <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {empresas.map((empresa) => (
                          <label
                            key={empresa.id_empresa}
                            className="relative flex items-start"
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                name="empresa"
                                value={empresa.id_empresa}
                                checked={selectedEmpresas.includes(
                                  empresa.id_empresa
                                )}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                required={selectedEmpresas.length === 0} // Solo requiere si no hay ninguno seleccionado
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <span className="font-medium text-gray-700">
                                {empresa.razon_social}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {selectedEmpresas.length === 0 && (
                        <p className="text-red-500 text-sm mt-2">
                          Debes seleccionar al menos una empresa.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {modalMode === "create" ? "Crear" : "Guardar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

