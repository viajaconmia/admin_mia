"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  User,
  PencilIcon,
  Save,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { createNewEmpresa, updateViajero } from "@/hooks/useDatabase";
import { formatDate } from "@/helpers/utils";
import {
  CheckboxInput,
  DateInput,
  Dropdown,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "@/components/atom/Input";
import {
  fetchEmpresasAgentes,
  fetchInitSuperAgent,
  fetchUpdateEmpresasAgentes,
} from "@/services/agentes";
import Modal from "@/components/organism/Modal";

export function AgentDetailsCard({ agente }: { agente: Agente }) {
  const [edicion, setEdicion] = useState({
    empresas: {},
    viajero: {},
    agente: {},
  });
  const [empresas, setEmpresas] = useState<EmpresaFromAgent[]>([]);
  const [link, setLink] = useState<null | string>(null);
  const [form, setForm] = useState({
    numero_empleado: agente.numero_empleado || "",
    vendedor: agente.vendedor || "",
    notas: agente.notas || "",
    numero_pasaporte: agente.numero_pasaporte || "",
    telefono: Number(agente.telefono) || null,
    fecha_nacimiento: agente.fecha_nacimiento
      ? agente.fecha_nacimiento.split("T")[0]
      : "",
    nacionalidad: agente.nacionalidad || "",
    tiene_credito_consolidado: Boolean(agente.tiene_credito_consolidado),
    saldo: Number(agente.saldo) || null,
  });

  // const handleSave = async () => {
  //   try {
  //     const responseCompany = await updateViajero(
  //       agente,
  //       agente.empresas.map((company) => company.id_empresa),
  //       agente.id_viajero
  //     );
  //     if (!responseCompany.success) {
  //       throw new Error("No se pudo actualizar al viajero");
  //     }
  //     console.log(responseCompany);
  //   } catch (error) {
  //     console.error("Error actualizando viajero", error);
  //   }
  // };

  const handleSave = async () => {
    console.log(edicion);
    fetchUpdateEmpresasAgentes(edicion, (data) => {
      console.log(data);
      if (data.details) {
        console.log(data);
      }
      alert("Actualizado correctamente");
      setEdicion({
        empresas: {},
        viajero: {},
        agente: {},
      });
    });
  };

  const handleSuperAgent = (email: string) => {
    fetchInitSuperAgent(email, (data) => {
      setLink(data.link);
    });
  };

  useEffect(() => {
    if (agente.id_agente) {
      fetchEmpresasAgentes(agente.id_agente, (data) => {
        setEmpresas(data);
      });
    }
  }, []);

  return (
    <Card className="w-full mx-auto border-none shadow-none hover:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-xl font-bold">Detalles del Agente</CardTitle>
        <button
          onClick={() => {
            handleSuperAgent(agente.correo);
          }}
          className="hover:underline font-medium"
        >
          <span className="text-red-600 hover:underline cursor-pointer">
            Soporte
          </span>
        </button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información Personal */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center w-full lg:flex-row gap-4 justify-between mb-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {agente.nombre_agente_completo.toUpperCase()}
                  </h2>
                  <p className="text-xs text-gray-500">
                    ID: {agente.id_agente}
                  </p>
                  <p className="text-xs text-gray-500">{agente.correo}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <CheckboxInput
                checked={form.tiene_credito_consolidado}
                onChange={(value) => {
                  setEdicion((prev) => ({
                    ...prev,
                    agente: {
                      ...prev.agente,
                      [agente.id_agente]: {
                        ...prev.agente[agente.id_agente],
                        tiene_credito_consolidado: value ? 1 : 0,
                      },
                    },
                  }));
                  setForm((prev) => ({
                    ...prev,
                    tiene_credito_consolidado: value,
                  }));
                }}
                label="Activar credito"
              />
              <NumberInput
                onChange={(value) => {
                  setEdicion((prev) => ({
                    ...prev,
                    agente: {
                      ...prev.agente,
                      [agente.id_agente]: {
                        ...prev.agente[agente.id_agente],
                        saldo: value,
                      },
                    },
                  }));
                  setForm((prev) => ({
                    ...prev,
                    saldo: Number(value),
                  }));
                }}
                disabled={!form.tiene_credito_consolidado}
                label="Credito aprobado"
                value={form.saldo}
                placeholder="5535..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TextInput
              onChange={(value) => {
                setEdicion((prev) => ({
                  ...prev,
                  agente: {
                    ...prev.agente,
                    [agente.id_agente]: {
                      ...prev.agente[agente.id_agente],
                      vendedor: value,
                    },
                  },
                }));
                setForm((prev) => ({ ...prev, vendedor: value }));
              }}
              label="Vendedor"
              value={form.vendedor}
              placeholder=""
            />
            <NumberInput
              onChange={(value) => {
                setEdicion((prev) => ({
                  ...prev,
                  viajero: {
                    ...prev.viajero,
                    [agente.id_viajero]: {
                      ...prev.viajero[agente.id_viajero],
                      telefono: value,
                    },
                  },
                }));
                setForm((prev) => ({ ...prev, telefono: Number(value) }));
              }}
              label="Numero de telefono"
              value={form.telefono}
              placeholder="5535..."
            />
            <DateInput
              onChange={(value) => {
                setEdicion((prev) => ({
                  ...prev,
                  viajero: {
                    ...prev.viajero,
                    [agente.id_viajero]: {
                      ...prev.viajero[agente.id_viajero],
                      fecha_nacimiento: value,
                    },
                  },
                }));
                setForm((prev) => ({ ...prev, fecha_nacimiento: value }));
              }}
              label="Fecha de nacimiento"
              value={form.fecha_nacimiento}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Datos extra del cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
            <TextInput
              onChange={(value) => {
                setEdicion((prev) => ({
                  ...prev,
                  viajero: {
                    ...prev.viajero,
                    [agente.id_viajero]: {
                      ...prev.viajero[agente.id_viajero],
                      numero_empleado: value,
                    },
                  },
                }));
                setForm((prev) => ({ ...prev, numero_empleado: value }));
              }}
              label="Numero de empleado"
              value={form.numero_empleado}
              placeholder=""
            />
            <TextInput
              onChange={(value) => {
                setEdicion((prev) => ({
                  ...prev,
                  viajero: {
                    ...prev.viajero,
                    [agente.id_viajero]: {
                      ...prev.viajero[agente.id_viajero],
                      numero_pasaporte: value,
                    },
                  },
                }));
                setForm((prev) => ({ ...prev, numero_pasaporte: value }));
              }}
              label="Numero de pasaporte"
              value={form.numero_pasaporte}
              placeholder=""
            />
            <Dropdown
              label="Nacionalidad"
              onChange={(value) => {
                setEdicion((prev) => ({
                  ...prev,
                  viajero: {
                    ...prev.viajero,
                    [agente.id_viajero]: {
                      ...prev.viajero[agente.id_viajero],
                      nacionalidad: value,
                    },
                  },
                }));
                setForm((prev) => ({
                  ...prev,
                  nacionalidad: value,
                }));
              }}
              options={[
                "MX",
                "US",
                "CA",
                "ES",
                "AR",
                "BR",
                "FR",
                "DE",
                "IT",
                "JP",
                "CN",
                "IN",
                "UK",
                "AU",
                "CL",
              ]}
              value={form.nacionalidad}
            />
          </div>
          <TextAreaInput
            onChange={(value) => {
              setEdicion((prev) => ({
                ...prev,
                agente: {
                  ...prev.agente,
                  [agente.id_agente]: {
                    ...prev.agente[agente.id_agente],
                    notas: value,
                  },
                },
              }));
              setForm((prev) => ({ ...prev, notas: value }));
            }}
            label="Notas"
            value={form.notas}
            placeholder=""
          />
        </div>

        {/* Empresas Asociadas */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Empresas Asociadas ({empresas.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {empresas.map((company, id) => (
              <div
                key={company.id_empresa}
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{company.razon_social}</div>
                  <div className="text-xs text-gray-500">
                    ID: {company.id_empresa}
                  </div>
                  <div className="grid grid-cols-4 gap-2 place-items-center mt-2">
                    <CheckboxInput
                      checked={Boolean(company.tiene_credito)}
                      onChange={(value) => {
                        setEdicion((prev) => ({
                          ...prev,
                          empresas: {
                            ...prev.empresas,
                            [company.id_empresa]: {
                              ...prev.empresas[company.id_empresa],
                              tiene_credito: value ? 1 : 0,
                            },
                          },
                        }));
                        setEmpresas((previus) =>
                          previus.map((current_company, current_id) =>
                            current_id == id
                              ? { ...company, tiene_credito: value ? 1 : 0 }
                              : current_company
                          )
                        );
                      }}
                      label=""
                    />
                    {/* Dirección */}
                    {company.calle ||
                    company.colonia ||
                    company.municipio ||
                    company.estado ||
                    company.codigo_postal ? (
                      <div className="text-xs text-gray-600 mt-1">
                        {[
                          company.calle,
                          company.colonia,
                          company.municipio,
                          company.estado,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        {company.codigo_postal
                          ? `, C.P. ${company.codigo_postal}`
                          : ""}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        Sin dirección registrada
                      </div>
                    )}

                    <div className="text-xs text-gray-600 mt-1">
                      RFC: {company.rfc}
                    </div>

                    <div className="col-span-3">
                      <NumberInput
                        onChange={(value) => {
                          setEdicion((prev) => ({
                            ...prev,
                            empresas: {
                              ...prev.empresas,
                              [company.id_empresa]: {
                                ...prev.empresas[company.id_empresa],
                                monto_credito: Number(value),
                              },
                            },
                          }));
                          setEmpresas((previus) =>
                            previus.map((current_company, current_id) =>
                              current_id == id
                                ? { ...company, monto_credito: Number(value) }
                                : current_company
                            )
                          );
                        }}
                        value={company.monto_credito}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fecha de Registro */}
        <div className="text-sm text-gray-500 pt-4 border-t flex justify-between">
          <p>Fecha de registro: {formatDate(agente.created_at)}</p>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-sky-100 bg-sky-600 shadow-md text-sm font-medium rounded-md text-gray-100 hover:bg-gray-50 focus:outline-none focus:ring-2"
          >
            <Save className="w-4 h-4 mr-2" /> Guardar
          </button>
        </div>
      </CardContent>
      {link && (
        <Modal
          onClose={() => {
            setLink(null);
          }}
          title="Soporte al cliente"
          subtitle="Da click para ir al perfil del cliente"
        >
          <div className="w-96 h-16 flex justify-center items-center">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ir al perfil
            </a>
          </div>
        </Modal>
      )}
    </Card>
  );
}
