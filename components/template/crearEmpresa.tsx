import React, { useState, useEffect } from "react";
import { X, Building2, Plus, FileEdit } from "lucide-react";
import { API_KEY, URL } from "@/lib/constants";

// Suponiendo que estos archivos existen en tu proyecto
// import { CompanyWithTaxInfo, TaxInfo } from "../types";
// import useAuth from "../hooks/useAuth";

// Constantes y tipos, si no los tienes en archivos separados puedes definirlos aquí
const AUTH = {
  "x-api-key": API_KEY,
};

interface TaxInfo {
  id_datos_fiscales?: string;
  id_empresa: string;
  rfc: string;
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigo_postal_fiscal: string;
  regimen_fiscal: string;
  razon_social: string;
}

interface Company {
  id_empresa: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_persona: string;
  empresa_direccion: string;
  empresa_colonia: string;
  empresa_estado: string;
  empresa_municipio: string;
  empresa_cp: string;
}

interface CompanyWithTaxInfo extends Company {
  taxInfo?: TaxInfo;
}

// Hooks y funciones de API
const useAuth = () => {
  // Simula el hook de autenticación
  return {
    user: {
      uid: "user123",
    },
  };
};

export const createNewEmpresa = async (data: any, id: string) => {
  try {
    const response = await fetch(`${URL}/mia/empresas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        agente_id: id,
        razon_social: data.razon_social,
        nombre_comercial: data.nombre_comercial,
        tipo_persona: data.tipo_persona,
        calle: data.empresa_direccion || null,
        colonia: data.empresa_colonia || null,
        estado: data.empresa_estado || null,
        municipio: data.empresa_municipio || null,
        codigo_postal: data.empresa_cp || null,
      }),
    });

    const json = await response.json();
    if (json.message === "Agente creado correctamente") {
      return {
        success: true,
        empresa_id: json.data.id_empresa,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const getEmpresasDatosFiscales = async (agent_id: string) => {
  try {
    const response = await fetch(
      `${URL}/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    return json;
  } catch (error) {
    throw error;
  }
};

export const fetchEmpresasDatosFiscales = async (
  id_agente: string
): Promise<CompanyWithTaxInfo[]> => {
  try {
    const employeesData = await getEmpresasDatosFiscales(id_agente);
    return employeesData.data || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const createNewDatosFiscales = async (data: any) => {
  try {
    const response = await fetch(`${URL}/mia/datosFiscales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_empresa: data.id_empresa,
        rfc: data.rfc,
        calle: data.calle,
        colonia: data.colonia,
        estado: data.estado,
        municipio: data.municipio,
        codigo_postal_fiscal: data.codigo_postal_fiscal,
        regimen_fiscal: data.regimen_fiscal,
        razon_social: data.razon_social,
      }),
    });

    const json = await response.json();
    if (json.message === "Datos fiscales creados correctamente") {
      return {
        success: true,
        id_datos_fiscales: json.data.id_datos_fiscales,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const updateNewDatosFiscales = async (data: any) => {
  try {
    const response = await fetch(
      `${URL}/mia/datosFiscales/${data.id_datos_fiscales}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
        body: JSON.stringify({
          id_empresa: data.id_empresa,
          rfc: data.rfc,
          calle: data.calle,
          colonia: data.colonia,
          estado: data.estado,
          municipio: data.municipio,
          codigo_postal_fiscal: data.codigo_postal_fiscal,
          regimen_fiscal: data.regimen_fiscal,
          razon_social: data.razon_social,
        }),
      }
    );
    const json = await response.json();
    if (json.message === "Datos fiscales actualizados correctamente") {
      return {
        success: true,
        id_datos_fiscales: json.data.id_datos_fiscales,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

// -- Componente FiscalDataModal --
interface FiscalDataModalProps {
  company: CompanyWithTaxInfo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyId: string, fiscalData: TaxInfo) => void;
}

export function FiscalDataModal({
  company,
  isOpen,
  onClose,
  onSave,
}: FiscalDataModalProps) {
  const { user } = useAuth();
  const [colonias, setColonias] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(!company.taxInfo);
  const [formData, setFormData] = useState<TaxInfo>(
    company.taxInfo || {
      id_datos_fiscales: "",
      id_empresa: company.id_empresa,
      rfc: "",
      calle: "",
      colonia: "",
      municipio: "",
      estado: "",
      codigo_postal_fiscal: "",
      regimen_fiscal: "",
      razon_social: "",
    }
  );
  const regimes: { [key: string]: string } = {
    "601": "General de Ley Personas Morales",
    "602": "Personas Morales con fines no lucrativos (no vigente)",
    "603": "Personas Morales con Fines no Lucrativos",
    "604": "Servicios Profesionales (Honorarios)",
    "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
    "606": "Arrendamiento",
    "607": "Régimen de Enajenación o Adquisición de Bienes",
    "608": "Demás ingresos",
    "609": "Consolidación",
    "610":
      "Residentes en el Extranjero sin Establecimiento Permanente en México",
    "611": "Ingresos por Dividendos (socios y accionistas)",
    "612": "Actividades Empresariales y Profesionales",
    "613": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras (PF)",
    "614": "Ingresos por intereses",
    "615": "Régimen de los ingresos por obtención de premios",
    "616": "Sin obligaciones fiscales",
    "617": "Sociedades Cooperativas de Producción",
    "618": "Sociedades Cooperativas de Consumo",
    "619": "Sociedades Cooperativas de Ahorro y Préstamo",
    "620":
      "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
    "621": "Incorporación Fiscal",
    "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras (PF y PM)",
    "623": "Opcional para Grupos de Sociedades",
    "624": "Coordinados",
    "625": "Actividades Empresariales a través de Plataformas Tecnológicas",
    "626": "Régimen Simplificado de Confianza (RESICO) - Personas Físicas",
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(
        company.taxInfo || {
          id_datos_fiscales: "",
          id_empresa: company.id_empresa,
          rfc: "",
          calle: "",
          colonia: "",
          municipio: "",
          estado: "",
          codigo_postal_fiscal: "",
          regimen_fiscal: "",
          razon_social: "",
        }
      );
      setIsEditing(!company.taxInfo);
      setError("");
    }
  }, [isOpen, company]);

  const [error, setError] = useState("");

  useEffect(() => {
    if (formData.codigo_postal_fiscal.length === 5) {
      fetch(
        `${URL}/sepoMex/buscar-codigo-postal?d_codigo=${formData.codigo_postal_fiscal}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...AUTH,
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length > 0) {
            setColonias(data.data.map((item: any) => item.d_asenta)); // Extraer colonias
            setFormData((prev) => ({
              ...prev,
              municipio: data.data[0].D_mnpio,
              estado: data.data[0].d_estado,
            }));
          } else {
            setColonias([]);
          }
        })
        .catch((error) =>
          console.error("Error obteniendo datos de código postal:", error)
        );
    }
  }, [formData.codigo_postal_fiscal]);

  if (!isOpen) return null;

  const validateRFC = (rfc: string) => {
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    return rfcRegex.test(rfc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      if (!validateRFC(formData.rfc)) {
        setError("El formato del RFC no es válido");
        return;
      }
      let responseCompany;
      if (formData?.id_datos_fiscales) {
        responseCompany = await updateNewDatosFiscales(formData);
        if (!responseCompany.success) {
          throw new Error("No se pudo registrar los datos fiscales");
        }
      } else {
        responseCompany = await createNewDatosFiscales(formData);
        if (!responseCompany.success) {
          throw new Error("No se pudo registrar los datos fiscales");
        }
      }
      onSave(company.id_empresa, formData);
      setIsEditing(false);
      setError("");
    } catch (error) {
      console.error("Error creando nuevos datos fiscales", error);
      setError(
        "Hubo un error al guardar los datos fiscales. Inténtalo de nuevo."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            Datos Fiscales de {company.razon_social}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón social
                </label>
                <input
                  pattern="^[^<>]*$"
                  type="text"
                  value={formData.razon_social}
                  onChange={(e) =>
                    setFormData({ ...formData, razon_social: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC
                </label>
                <input
                  pattern="^[^<>]*$"
                  type="text"
                  value={formData.rfc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rfc: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <input
                  pattern="^[^<>]*$"
                  type="text"
                  value={formData.codigo_postal_fiscal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      codigo_postal_fiscal: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle y número
                </label>
                <input
                  pattern="^[^<>]*$"
                  type="text"
                  value={formData.calle}
                  onChange={(e) =>
                    setFormData({ ...formData, calle: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colonia
                </label>
                <select
                  value={formData.colonia}
                  onChange={(e) =>
                    setFormData({ ...formData, colonia: e.target.value })
                  }
                  className="w-full p-2 border rounded-md bg-white"
                  required
                >
                  <option value="">Selecciona una colonia</option>
                  {colonias.map((colonia, index) => (
                    <option key={index} value={colonia}>
                      {colonia}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Municipio
                </label>
                <input
                  pattern="^[^<>]*$"
                  type="text"
                  value={formData.municipio}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  pattern="^[^<>]*$"
                  type="text"
                  value={formData.estado}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Régimen fiscal
                </label>
                <select
                  name="regimen_fiscal"
                  value={formData.regimen_fiscal}
                  onChange={(e) =>
                    setFormData({ ...formData, regimen_fiscal: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Selecciona un régimen fiscal</option>
                  {Object.entries(regimes).map(([code, description]) => (
                    <option key={code} value={code}>
                      {code} - {description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(
                      company.taxInfo || {
                        id_datos_fiscales: "",
                        id_empresa: company.id_empresa,
                        rfc: "",
                        calle: "",
                        colonia: "",
                        municipio: "",
                        estado: "",
                        codigo_postal_fiscal: "",
                        regimen_fiscal: "",
                        razon_social: "",
                      }
                    );
                    setIsEditing(false);
                    setError("");
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {Object.entries(formData).map(
                  ([key, value]) =>
                    key !== "id_empresa" &&
                    key !== "id_datos_fiscales" && (
                      <div key={key}>
                        <p className="text-sm font-medium text-gray-700">
                          {key.replace(/_/g, " ").toUpperCase()}
                        </p>
                        <p className="mt-1">
                          {key === "regimen_fiscal"
                            ? `${value} - ${regimes[value] || ""}`
                            : value || "N/A"}
                        </p>
                      </div>
                    )
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Editar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Componente CompanyForm --
export function CompanyForm({ onSubmit, onCancel, initialData }: any) {
  const [formData, setFormData] = useState(
    initialData || {
      razon_social: "",
      nombre_comercial: "",
      tipo_persona: "",
      empresa_direccion: "",
      empresa_colonia: "",
      empresa_estado: "",
      empresa_municipio: "",
      empresa_cp: "",
    }
  );
  const [colonias, setColonias] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (formData.empresa_cp.length === 5) {
      fetch(
        `${URL}/sepoMex/buscar-codigo-postal?d_codigo=${formData.empresa_cp}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...AUTH,
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.length > 0) {
            setColonias(data.data.map((item: any) => item.d_asenta));
            setFormData((prev: any) => ({
              ...prev,
              empresa_colonia: data.data[0].d_asenta,
              empresa_municipio: data.data[0].D_mnpio,
              empresa_estado: data.data[0].d_estado,
            }));
          } else {
            setColonias([]);
          }
        })
        .catch((error) =>
          console.error("Error obteniendo datos de código postal:", error)
        );
    } else {
      setColonias([]);
    }
  }, [formData.empresa_cp]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Razón social
        </label>
        <input
          type="text"
          name="razon_social"
          value={formData.razon_social}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre comercial
        </label>
        <input
          type="text"
          name="nombre_comercial"
          value={formData.nombre_comercial}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de persona
        </label>
        <select
          name="tipo_persona"
          value={formData.tipo_persona}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Selecciona</option>
          <option value="Física">Física</option>
          <option value="Moral">Moral</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Calle y número
        </label>
        <input
          type="text"
          name="empresa_direccion"
          value={formData.empresa_direccion}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Código Postal
        </label>
        <input
          type="text"
          name="empresa_cp"
          value={formData.empresa_cp}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Colonia
        </label>
        <select
          name="empresa_colonia"
          value={formData.empresa_colonia}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              empresa_colonia: e.target.value,
            }))
          }
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
          pattern="^[^<>]*$"
          type="text"
          name="empresa_estado"
          value={formData.empresa_estado}
          readOnly
          className="w-full p-2 border rounded-md bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Municipio
        </label>
        <input
          pattern="^[^<>]*$"
          type="text"
          name="empresa_municipio"
          value={formData.empresa_municipio}
          readOnly
          className="w-full p-2 border rounded-md bg-gray-100"
        />
      </div>
      <div className="col-span-2 flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

// -- Componente principal de Configuración --
export const Configuration = ({ id_agente }: { id_agente: string }) => {
  const [companies, setCompanies] = useState<CompanyWithTaxInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyWithTaxInfo | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSaveFiscalData = (companyId: string, fiscalData: TaxInfo) => {
    setCompanies(
      companies.map((company) =>
        company.id_empresa === companyId
          ? { ...company, taxInfo: fiscalData }
          : company
      )
    );
    setShowModal(false);
  };

  const fetchData = async () => {
    const data = await fetchEmpresasDatosFiscales(id_agente);
    if (data && Array.isArray(data)) {
      setCompanies(data);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id_agente]);

  const handleSubmit = async (data: any) => {
    try {
      const responseCompany = await createNewEmpresa(data, id_agente);
      if (!responseCompany.success)
        throw new Error("No se pudo registrar a la empresa");
      fetchData();
      setShowForm(false);
    } catch (error) {
      console.error("Error creando nueva empresa", error);
    }
  };

  return (
    <div>
      <div className="flex justify-center items-center">
        <div className="bg-white rounded-lg shadow mt-8 w-[95vw] max-w-7xl">
          <div className="p-6">
            {showForm ? (
              <CompanyForm
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <>
                <div className="flex justify-end items-center mb-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Añadir nueva empresa
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre de la empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Razón Social
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo de persona
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companies.map((company) => (
                        <tr key={company.id_empresa}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <Building2 className="h-6 w-6 text-gray-500" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {company.nombre_comercial}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company.razon_social || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company.tipo_persona}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                              onClick={() => {
                                setSelectedCompany(company);
                                setShowModal(true);
                              }}
                            >
                              <FileEdit size={16} className="mr-2" />
                              {company.taxInfo
                                ? "Editar datos fiscales"
                                : "Añadir datos fiscales"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {selectedCompany && (
        <FiscalDataModal
          company={selectedCompany}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveFiscalData}
        />
      )}
    </div>
  );
};
