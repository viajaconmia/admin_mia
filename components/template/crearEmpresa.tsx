"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Building2, Plus, FileEdit } from "lucide-react";
import { API_KEY, URL } from "@/lib/constants";

/** =========================
 *  Headers
 *  ========================= */
const AUTH_HEADERS = {
  "x-api-key": API_KEY,
};

/** =========================
 *  Types
 *  ========================= */
export interface TaxInfo {
  id_datos_fiscales?: string; // df-...
  id_empresa: string;         // emp-...
  rfc: string;
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigo_postal_fiscal: string;
  regimen_fiscal: string;
  razon_social: string;
}

export interface Company {
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

export interface CompanyWithTaxInfo extends Company {
  taxInfo?: TaxInfo;
}

/** =========================
 *  Fake auth hook (replace with yours)
 *  ========================= */
const useAuth = () => {
  return { user: { uid: "user123" } };
};

/** =========================
 *  API helpers
 *  ========================= */
export const createNewEmpresa = async (data: any, id_agente: string) => {
  const response = await fetch(`${URL}/mia/empresas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...AUTH_HEADERS,
    },
    body: JSON.stringify({
      agente_id: id_agente,
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

  if (json?.success === true || json?.message === "Agente creado correctamente") {
    return { success: true, empresa_id: json?.data?.id_empresa as string };
  }
  return { success: false as const };
};

export const getEmpresasDatosFiscales = async (agent_id: string) => {
  const response = await fetch(
    `${URL}/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(
      agent_id
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...AUTH_HEADERS,
      },
    }
  );
  return response.json();
};

export const createNewDatosFiscales = async (data: TaxInfo) => {
  const response = await fetch(`${URL}/mia/datosFiscales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...AUTH_HEADERS,
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

  if (json?.success === true || json?.message === "Datos fiscales creados correctamente") {
    return { success: true, id_datos_fiscales: json?.data?.id_datos_fiscales as string };
  }
  return { success: false as const };
};

export const updateNewDatosFiscales = async (data: TaxInfo) => {
  const response = await fetch(`${URL}/mia/datosFiscales/${data.id_datos_fiscales}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...AUTH_HEADERS,
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

  if (json?.success === true || json?.message === "Datos fiscales actualizados correctamente") {
    return { success: true, id_datos_fiscales: json?.data?.id_datos_fiscales as string };
  }
  return { success: false as const };
};

/** =========================
 *  Normalizers (match YOUR JSON)
 *  ========================= */
// Tu API ya trae "id_datos_fiscales, rfc, calle, colonia, estado, municipio, codigo_postal_fiscal, regimen_fiscal, razon_social_df".
const buildTaxInfoFromRow = (row: any): TaxInfo | undefined => {
  const id = row?.id_datos_fiscales;
  // Si no hay id, pero quieres precargar con lo que venga (ej: calle/colonia),
  // puedes quitar esta condición. Por defecto: solo consideramos "taxInfo" si existe DF.
  if (!id) return undefined;

  return {
    id_datos_fiscales: id,
    id_empresa: row.id_empresa,
    rfc: (row.rfc ?? "").toString(),
    calle: (row.calle ?? "").toString(),
    colonia: (row.colonia ?? "").toString(),
    municipio: (row.municipio ?? "").toString(),
    estado: (row.estado ?? "").toString(),
    codigo_postal_fiscal: (row.codigo_postal_fiscal ?? "").toString(),
    regimen_fiscal: (row.regimen_fiscal ?? "").toString(),
    razon_social: (row.razon_social_df ?? row.razon_social ?? "").toString(),
  };
};

const normalizeCompanyRow = (row: any): CompanyWithTaxInfo => ({
  id_empresa: row.id_empresa,
  razon_social: (row.razon_social ?? "").toString().trim(),
  nombre_comercial: (row.nombre_comercial ?? "").toString().trim(),
  tipo_persona: (row.tipo_persona ?? "").toString(),
  empresa_direccion: (row.empresa_direccion ?? "").toString(),
  empresa_colonia: (row.empresa_colonia ?? "").toString(),
  empresa_estado: (row.empresa_estado ?? "").toString(),
  empresa_municipio: (row.empresa_municipio ?? "").toString(),
  empresa_cp: (row.empresa_cp ?? "").toString(),
  taxInfo: buildTaxInfoFromRow(row),
});

export const fetchEmpresasDatosFiscales = async (
  id_agente: string
): Promise<CompanyWithTaxInfo[]> => {
  try {
    const resp = await getEmpresasDatosFiscales(id_agente);

    // OJO: tu respuesta a veces viene como array directo (como el que pegaste)
    // o envuelta en { data: [...] }. Soportamos ambas.
    const rows = Array.isArray(resp) ? resp : resp?.data ?? [];
    return Array.isArray(rows) ? rows.map(normalizeCompanyRow) : [];
  } catch (error) {
    console.error("Error fetching empresas:", error);
    return [];
  }
};

/** =========================
 *  FiscalDataModal
 *  ========================= */
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

  const regimes: Record<string, string> = useMemo(
    () => ({
      "601": "General de Ley Personas Morales",
      "602": "Personas Morales con fines no lucrativos (no vigente)",
      "603": "Personas Morales con Fines no Lucrativos",
      "604": "Servicios Profesionales (Honorarios)",
      "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
      "606": "Arrendamiento",
      "607": "Régimen de Enajenación o Adquisición de Bienes",
      "608": "Demás ingresos",
      "609": "Consolidación",
      "610": "Residentes en el Extranjero sin Establecimiento Permanente en México",
      "611": "Ingresos por Dividendos (socios y accionistas)",
      "612": "Actividades Empresariales y Profesionales",
      "613": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras (PF)",
      "614": "Ingresos por intereses",
      "615": "Régimen de los ingresos por obtención de premios",
      "616": "Sin obligaciones fiscales",
      "617": "Sociedades Cooperativas de Producción",
      "618": "Sociedades Cooperativas de Consumo",
      "619": "Sociedades Cooperativas de Ahorro y Préstamo",
      "620": "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
      "621": "Incorporación Fiscal",
      "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras (PF y PM)",
      "623": "Opcional para Grupos de Sociedades",
      "624": "Coordinados",
      "625": "Actividades Empresariales a través de Plataformas Tecnológicas",
      "626": "Régimen Simplificado de Confianza (RESICO) - Personas Físicas",
    }),
    []
  );

  const emptyForm: TaxInfo = useMemo(
    () => ({
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
    }),
    [company.id_empresa]
  );

  const [colonias, setColonias] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<TaxInfo>(
    company.taxInfo?.id_datos_fiscales ? (company.taxInfo as TaxInfo) : emptyForm
  );

  // Si tiene id_datos_fiscales => modo ver; si no => modo editar para "añadir"
  const [isEditing, setIsEditing] = useState<boolean>(
    !(company.taxInfo?.id_datos_fiscales && company.taxInfo.id_datos_fiscales.trim())
  );

  // ✅ Re-sync: cuando abres modal y cuando cambia la company seleccionada
  useEffect(() => {
    if (!isOpen) return;

    const hasTaxInfo =
      !!company.taxInfo?.id_datos_fiscales &&
      !!company.taxInfo.id_datos_fiscales.trim();

    setIsEditing(!hasTaxInfo);
    setFormData(hasTaxInfo ? (company.taxInfo as TaxInfo) : emptyForm);
    setColonias([]);
    setError("");
  }, [isOpen, company, emptyForm]);

  // CP (fiscal) -> colonias/estado/municipio
  useEffect(() => {
    const cp = (formData.codigo_postal_fiscal ?? "").trim();
    if (cp.length !== 5) {
      setColonias([]);
      return;
    }

    fetch(`${URL}/sepoMex/buscar-codigo-postal?d_codigo=${cp}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...AUTH_HEADERS,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data?.data) && data.data.length > 0) {
          setColonias(data.data.map((item: any) => item.d_asenta));
          setFormData((prev) => ({
            ...prev,
            municipio: data.data[0].D_mnpio ?? prev.municipio,
            estado: data.data[0].d_estado ?? prev.estado,
          }));
        } else {
          setColonias([]);
        }
      })
      .catch((e) => console.error("Error obteniendo CP fiscal:", e));
  }, [formData.codigo_postal_fiscal]);

  if (!isOpen) return null;

  const validateRFC = (rfc: string) => {
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    return rfcRegex.test(rfc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) throw new Error("No hay usuario autenticado");

      const rfc = (formData.rfc ?? "").toUpperCase().trim();
      if (!validateRFC(rfc)) {
        setError("El formato del RFC no es válido");
        return;
      }

      const payload: TaxInfo = { ...formData, rfc };

      const hasId =
        !!payload.id_datos_fiscales && !!payload.id_datos_fiscales.trim();

      const resp = hasId
        ? await updateNewDatosFiscales(payload)
        : await createNewDatosFiscales(payload);

      if (!resp.success) throw new Error("No se pudo guardar los datos fiscales");

      const nextData: TaxInfo = {
        ...payload,
        id_datos_fiscales: resp.id_datos_fiscales ?? payload.id_datos_fiscales,
      };

      setFormData(nextData);
      onSave(company.id_empresa, nextData);
      setIsEditing(false);
      setError("");
    } catch (err) {
      console.error("Error guardando datos fiscales:", err);
      setError("Hubo un error al guardar los datos fiscales. Inténtalo de nuevo.");
    }
  };

  const cancelEdit = () => {
    const hasTaxInfo =
      !!company.taxInfo?.id_datos_fiscales &&
      !!company.taxInfo.id_datos_fiscales.trim();

    setFormData(hasTaxInfo ? (company.taxInfo as TaxInfo) : emptyForm);
    setIsEditing(!hasTaxInfo ? true : false); // si no hay DF, sigue en añadir
    setError("");
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
                  Razón social (datos fiscales)
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
                  Código Postal (fiscal)
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
                  {colonias.map((col, index) => (
                    <option key={index} value={col}>
                      {col}
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
                  onClick={cancelEdit}
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
                {Object.entries(formData).map(([key, value]) => {
                  if (key === "id_empresa" || key === "id_datos_fiscales") return null;

                  const display =
                    key === "regimen_fiscal"
                      ? `${String(value ?? "")} - ${
                          regimes[String(value ?? "")] ?? ""
                        }`
                      : String(value ?? "N/A");

                  return (
                    <div key={key}>
                      <p className="text-sm font-medium text-gray-700">
                        {key.replace(/_/g, " ").toUpperCase()}
                      </p>
                      <p className="mt-1">{display || "N/A"}</p>
                    </div>
                  );
                })}
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

/** =========================
 *  CompanyForm (unchanged logic, but typed + safe)
 *  ========================= */
export function CompanyForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}) {
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

  const [colonias, setColonias] = useState<string[]>([]);

  useEffect(() => {
    const cp = (formData.empresa_cp ?? "").trim();
    if (cp.length !== 5) {
      setColonias([]);
      return;
    }

    fetch(`${URL}/sepoMex/buscar-codigo-postal?d_codigo=${cp}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...AUTH_HEADERS,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data?.data) && data.data.length > 0) {
          setColonias(data.data.map((item: any) => item.d_asenta));
          setFormData((prev: any) => ({
            ...prev,
            empresa_colonia: data.data[0].d_asenta ?? prev.empresa_colonia,
            empresa_municipio: data.data[0].D_mnpio ?? prev.empresa_municipio,
            empresa_estado: data.data[0].d_estado ?? prev.empresa_estado,
          }));
        } else {
          setColonias([]);
        }
      })
      .catch((e) => console.error("Error obteniendo CP empresa:", e));
  }, [formData.empresa_cp]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
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
          pattern="^[^<>]*$"
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
          pattern="^[^<>]*$"
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
          <option value="fisica">Física</option>
          <option value="moral">Moral</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Calle y número
        </label>
        <input
          pattern="^[^<>]*$"
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
          pattern="^[^<>]*$"
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
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Seleccione una colonia</option>
          {colonias.map((col, index) => (
            <option key={index} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Estado</label>
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

/** =========================
 *  Configuration (Main)
 *  ========================= */
export const Configuration = ({ id_agente }: { id_agente: string }) => {
  const [companies, setCompanies] = useState<CompanyWithTaxInfo[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [selectedCompany, setSelectedCompany] =
    useState<CompanyWithTaxInfo | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    const data = await fetchEmpresasDatosFiscales(id_agente);
    setCompanies(Array.isArray(data) ? data : []);
    return data;
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_agente]);

  /** ✅ CLAVE:
   *  - Refresca datos desde backend
   *  - Selecciona la empresa por id
   *  - Abre modal con `taxInfo` ya construido desde campos planos
   */
  const openFiscalModal = async (companyId: string) => {
    try {
      const fresh = await fetchData();
      const found = fresh.find((c) => c.id_empresa === companyId);

      // fallback si no la encuentra (por si el fetch falla raro)
      const fallback = companies.find((c) => c.id_empresa === companyId) ?? null;

      setSelectedCompany(found ?? fallback);
      setShowModal(true);
    } catch (e) {
      const fallback = companies.find((c) => c.id_empresa === companyId) ?? null;
      setSelectedCompany(fallback);
      setShowModal(true);
    }
  };

  const handleSaveFiscalData = (companyId: string, fiscalData: TaxInfo) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id_empresa === companyId ? { ...c, taxInfo: fiscalData } : c))
    );

    setSelectedCompany((prev) =>
      prev?.id_empresa === companyId ? { ...prev, taxInfo: fiscalData } : prev
    );

    setShowModal(false);
  };

  const handleSubmit = async (data: any) => {
    try {
      const resp = await createNewEmpresa(data, id_agente);
      if (!resp.success) throw new Error("No se pudo registrar a la empresa");
      await fetchData();
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
                      {companies.map((company) => {
                        const hasDF =
                          !!company.taxInfo?.id_datos_fiscales &&
                          !!company.taxInfo.id_datos_fiscales.trim();

                        return (
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
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                onClick={() => openFiscalModal(company.id_empresa)}
                              >
                                <FileEdit size={16} className="mr-2" />
                                {hasDF ? "Editar datos fiscales" : "Añadir datos fiscales"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
          // ✅ key para forzar que el modal “resetea” cuando cambias de empresa
          key={`${selectedCompany.id_empresa}-${selectedCompany.taxInfo?.id_datos_fiscales ?? "new"}`}
          company={selectedCompany}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveFiscalData}
        />
      )}
    </div>
  );
};
