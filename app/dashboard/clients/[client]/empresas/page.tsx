"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchEmpresasByAgente } from "@/services/agentes";
import { useParams } from "next/navigation";
import { API_KEY } from "@/lib/constants";
import { createNewEmpresa, updateEmpresa } from "@/hooks/useDatabase";

// Types
// Definición de tipos para la respuesta de la API

interface Company {
  id_empresa: string;
  razon_social: string;
  tipo_persona: string;
  nombre_comercial: string;
  empresa_direccion: string | null;
  empresa_municipio: string | null;
  empresa_estado: string | null;
  empresa_cp: string | null;
  empresa_colonia: string | null;
  id_datos_fiscales: string | null;
  rfc: string | null;
  calle: string | null;
  colonia: string | null;
  estado: string | null;
  municipio: string | null;
  codigo_postal_fiscal: number | null;
  regimen_fiscal: string | null;
  datos_fiscales_created_at: string | null;
  datos_fiscales_updated_at: string | null;
  id_agente: string;
  empresa_agente_created_at: string;
  empresa_agente_updated_at: string;
}

interface FilterState {
  search: string;
  tipoPersona: string;
  estado: string;
}

type SortDirection = "asc" | "desc";
interface SortState {
  column: keyof Company | null;
  direction: SortDirection;
}

// Mock API functions
const fetchCompanies = async (): Promise<Company[]> => {
  // Replace with actual API call
  const response = await fetch("/api/companies");
  return response.json();
};

// const updateCompany = async (company: Company): Promise<Company> => {
//   // Replace with actual API call
//   const response = await fetch(`/api/companies/${company.id_empresa}`, {
//     method: "PUT",
//     body: JSON.stringify(company),
//   });
//   return response.json();
// };

const deleteCompany = async (id: string): Promise<void> => {
  // Replace with actual API call
  await fetch(`/api/companies/${id}`, {
    method: "DELETE",
  });
};

const Page = () => {
  const queryClient = useQueryClient();
  const { client } = useParams();
  const clientId = Array.isArray(client) ? client[0] : client;
  // Queries and Mutations
  const fetchCompaniesData = async () => {
    try {
      const response = await fetchEmpresasByAgente(client);
      return response;
    } catch (error) {
      console.error("Error fetching empresas:", error);
      throw error;
    }
  };

  // En tu useQuery:
  const {
    data: companies = [],
    isLoading,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompaniesData, // Usa la función aquí
  });

  // Hook de mutación mejorado
  // const createMutation = useMutation<Company, Error, Partial<Company>>({
  //   mutationFn: createCompany,
  //   onSuccess: (newCompany) => {
  //     queryClient.invalidateQueries({ queryKey: ["companies"] });
  //     // Puedes hacer más cosas con newCompany si necesitas
  //   },
  //   onError: (error) => {
  //     console.error("Error en la mutación:", error.message);
  //     // Aquí podrías mostrar una notificación al usuario
  //   }
  // });

  // const updateMutation = useMutation({
  //   mutationFn: updateCompany,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companies"] }),
  // });

  const deleteMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companies"] }),
  });

  // State
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tipoPersona: "",
    estado: "",
  });

  const [sort, setSort] = useState<SortState>({
    column: "razon_social",
    direction: "asc",
  });

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">(
    "view"
  );
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [tipoPersona, setTipoPersona] = useState(
    selectedCompany?.tipo_persona || "fisica"
  );
  const [colonias, setColonias] = useState<string[]>([]);
  const [estado, setEstado] = useState(selectedCompany?.empresa_estado || "");
  const [municipio, setMunicipio] = useState(
    selectedCompany?.empresa_municipio || ""
  );
  const [calle, setCalle] = useState(selectedCompany?.empresa_direccion || "");
  const [colonia, setColonia] = useState(
    selectedCompany?.empresa_colonia || ""
  );
  const [codigoPostal, setCodigoPostal] = useState(
    selectedCompany?.empresa_cp || ""
  );
  const [idEmpresa, setIdEmpresa] = useState(selectedCompany?.id_empresa || "");

  useEffect(() => {
    if (codigoPostal.length > 4) {
      fetch(`${URL}/sepoMex/buscar-codigo-postal?d_codigo=${codigoPostal}`, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length > 0) {
            setColonias(data.data.map((item: any) => item.d_asenta)); // Extraer colonias
            setMunicipio(data.data[0].D_mnpio);
            setEstado(data.data[0].d_estado);
          } else {
            setColonias([]);
          }
        })
        .catch((error) =>
          console.error("Error obteniendo datos de código postal:", error)
        );
    }
  }, [codigoPostal]);

  // Computed values
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        company.razon_social.toLowerCase().includes(searchTerm) ||
        company.nombre_comercial.toLowerCase().includes(searchTerm) ||
        (company.rfc?.toLowerCase().includes(searchTerm) ?? false);

      const matchesTipoPersona =
        !filters.tipoPersona || company.tipo_persona === filters.tipoPersona;

      const matchesEstado =
        !filters.estado || company.empresa_estado === filters.estado;

      return matchesSearch && matchesTipoPersona && matchesEstado;
    });
  }, [companies, filters]);

  const sortedCompanies = useMemo(() => {
    if (!sort.column) return filteredCompanies;

    return [...filteredCompanies].sort((a, b) => {
      const aValue = a[sort.column!];
      const bValue = b[sort.column!];

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredCompanies, sort]);

  const availableEstados = useMemo(() => {
    const estados = new Set<string>(
      companies
        .map((c) => c.empresa_estado)
        .filter((estado): estado is string => !!estado)
    );
    return Array.from(estados).sort();
  }, [companies]);

  // Handlers
  const handleSort = (column: keyof Company) => {
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
    company?: Company
  ) => {
    setModalMode(mode);
    setSelectedCompany(company || null);
    setTipoPersona(company?.tipo_persona || "fisica");
    setMunicipio(company?.empresa_municipio || "");
    setCalle(company?.empresa_direccion || "");
    setColonia(company?.empresa_colonia || "");
    setEstado(company?.empresa_estado || "");
    setCodigoPostal(company?.empresa_cp || "");
    setFormData(company || {});
    setFormData(company || {});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
    setTipoPersona("fisica");
    setColonias([]);
    setMunicipio("");
    setCalle("");
    setColonia("");
    setEstado("");
    setCodigoPostal("");
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        await createCompany();
        await refetchCompanies();
      } else if (modalMode === "edit" && selectedCompany) {
        await updateCompany();
        await refetchCompanies();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta empresa?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting company:", error);
      }
    }
  };

  const createCompany = async () => {
    try {
      const responseCompany = await createNewEmpresa(
        {
          ...formData,
          // Asegúrate de que estos campos no sean null si son requeridos
          empresa_direccion: formData.empresa_direccion || calle,
          empresa_municipio: formData.empresa_municipio || municipio,
          empresa_estado: formData.empresa_estado || estado,
          empresa_cp: formData.empresa_cp || codigoPostal,
          empresa_colonia: formData.empresa_colonia || colonia,
          tipo_persona: tipoPersona,
          razon_social: formData.nombre_comercial,
        },
        clientId
      );
      if (!responseCompany.success) {
        throw new Error("No se pudo registrar a la empresa");
      }
      console.log(responseCompany);
    } catch (error) {
      console.error("Error creando nueva empresa", error);
    }
  };

  const updateCompany = async () => {
    try {
      const responseCompany = await updateEmpresa(
        {
          ...formData,
          // Asegúrate de que estos campos no sean null si son requeridos
          empresa_direccion: calle,
          empresa_municipio: municipio,
          empresa_estado: estado,
          empresa_cp: codigoPostal,
          empresa_colonia: colonia,
          tipo_persona: tipoPersona,
          razon_social: formData.nombre_comercial,
          // Otros campos que puedan necesitar actualización
        },
        formData.id_empresa,
        clientId
      );
      if (!responseCompany.success) {
        throw new Error("No se pudo registrar a la empresa");
      }
      console.log(responseCompany);
    } catch (error) {
      console.error("Error creando nueva empresa", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    <div className="h-fit bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Empresas</h1>
          <button
            onClick={() => handleOpenModal("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Empresa
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
                placeholder="Buscar por nombre o RFC..."
                value={filters.search}
                onChange={handleFilterChange}
                className="pl-10 w-full h-10 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              name="tipoPersona"
              value={filters.tipoPersona}
              onChange={handleFilterChange}
              className="h-10 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tipo de Persona</option>
              <option value="moral">Moral</option>
              <option value="fisica">Física</option>
            </select>

            <select
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="h-10 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Estado</option>
              {availableEstados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
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
                  {["Razón Social", "Tipo", "RFC", "Estado", "Acciones"].map(
                    (header, index) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        onClick={() => {
                          const columns: (keyof Company)[] = [
                            "razon_social",
                            "tipo_persona",
                            "rfc",
                            "empresa_estado",
                          ];
                          if (index < columns.length)
                            handleSort(columns[index]);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{header}</span>
                          {index < 4 &&
                            sort.column ===
                              [
                                "razon_social",
                                "tipo_persona",
                                "rfc",
                                "empresa_estado",
                              ][index] &&
                            (sort.direction === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCompanies.map((company) => (
                  <tr key={company.id_empresa} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {company.razon_social}
                        </div>
                        <div className="text-sm text-gray-500">
                          {company.nombre_comercial}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          company.tipo_persona === "moral"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        )}
                      >
                        {company.tipo_persona === "moral" ? "Moral" : "Física"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.rfc || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.empresa_estado || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal("view", company)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal("edit", company)}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id_empresa)}
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
                  ? "Detalles de la Empresa"
                  : modalMode === "edit"
                  ? "Editar Empresa"
                  : "Nueva Empresa"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMode === "view" && selectedCompany ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Información General
                    </h3>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">Razón Social</dt>
                        <dd className="text-sm font-medium">
                          {selectedCompany.razon_social}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">
                          Nombre Comercial
                        </dt>
                        <dd className="text-sm font-medium">
                          {selectedCompany.nombre_comercial}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">RFC</dt>
                        <dd className="text-sm font-medium">
                          {selectedCompany.rfc || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Dirección
                    </h3>
                    <dl className="mt-2 space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">Dirección</dt>
                        <dd className="text-sm font-medium">
                          {selectedCompany.empresa_direccion || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Estado</dt>
                        <dd className="text-sm font-medium">
                          {selectedCompany.empresa_estado || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Municipio</dt>
                        <dd className="text-sm font-medium">
                          {selectedCompany.empresa_municipio || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Persona
                    </label>
                    <select
                      name="tipo_persona"
                      required
                      value={tipoPersona}
                      onChange={(e) => setTipoPersona(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="fisica">Persona Física</option>
                      <option value="moral">Persona Moral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {tipoPersona === "fisica"
                        ? "Nombre de la Persona Física"
                        : "Nombre Comercial de la Empresa"}
                    </label>
                    <input
                      type="text"
                      name="nombre_comercial"
                      defaultValue={selectedCompany?.nombre_comercial}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Calle y número
                    </label>
                    <input
                      type="text"
                      name="calle"
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      name="codigo_postal"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Colonia
                    </label>
                    <select
                      name="colonia"
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Seleccione una colonia</option>
                      {colonias.map((colonia, index) => (
                        <option key={index} value={colonia}>
                          {colonia}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <input
                      type="text"
                      name="estado"
                      value={estado}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Municipio
                    </label>
                    <input
                      type="text"
                      name="municipio"
                      value={municipio}
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                    />
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
};

export default Page;
