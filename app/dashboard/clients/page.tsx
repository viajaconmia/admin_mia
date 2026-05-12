"use client";

import React, { useEffect, useState } from "react";
import Filters from "@/components/Filters";
import {
  formatDate,
  getCreditoBadge,
  getRoleBadge,
  getStatusCreditBadge,
} from "@/helpers/utils";
import {
  Receipt,
  CalendarDays,
  Users,
  Building,
  User,
  CreditCard,
  ExternalLink,
  Banknote,
  Wallet,
  AlertTriangle,
  DollarSign,
  MapPin,
  Plane,
  CarTaxiFrontIcon,
} from "lucide-react";
import { Table } from "@/components/Table";
import { TypeFilters } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { fetchAgentes, fetchInitSuperAgent } from "@/services/agentes";
import Modal from "@/components/organism/Modal";
import NavContainer from "@/components/organism/NavContainer";
import { AgentDetailsCard } from "@/components/organism/DetailsClient";
import { UsersClient } from "@/components/organism/UsersClient";
import PageCuentasPorCobrar from "@/components/template/PageCuentasPorCobrar";
import { ToolTip } from "@/components/atom/ToolTip";
import { Configuration } from "@/components/template/crearEmpresa";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { usePathname } from "next/navigation";
import PageReservas from "@/v2/components/template/PageReserva";
import { Button } from "@/components/ui/button";
import { AgentesService, ResumenAgente } from "@/services/AgentesService";
import { DestinosSection } from "@/components/organism/DestinosSection";

const getWalletBadge = (monto: string | null) => {
  // Convertir el string a número para la verificación
  const montoNum = monto ? parseFloat(monto) : null;

  if (!montoNum) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <AlertTriangle className="w-3 h-3 mr-1 text-gray-500" />
        Sin saldo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
      <DollarSign className="w-3 h-3 mr-1 text-emerald-600" />
      {montoNum.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
    </span>
  );
};

function App() {
  const [clients, setClient] = useState<Agente[]>([]);
  const [selectedItem, setSelectedItem] = useState<Agente | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<null | string>(null);
  const [defaultTab, setDefaultTab] = useState<string>("");
  const pathname = usePathname();
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes,
  );
  const [fichaItem, setFichaItem] = useState<Agente | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const { hasAccess } = usePermiso();

  hasAccess(PERMISOS.VISTAS.CLIENTES);

  let formatedSolicitudes = clients
    .filter(
      (item) =>
        item.nombre_agente_completo.toUpperCase().includes(searchTerm) ||
        item.id_agente.toUpperCase().replaceAll("-", "").includes(searchTerm),
      // item.correo.to
    )
    .map((item) => ({
      creado: item.created_at,
      id: item.id_agente,
      cliente: item,
      correo: item.correo,
      telefono: item.telefono,
      estado_verificacion: "",
      estado_credito: Boolean(item.tiene_credito_consolidado),
      credito: item.saldo ? Number(item.saldo) : 0,
      wallet: item.wallet || "0", // Mantenemos como string para getWalletBadge
      categoria: "Administrador",
      notas_internas: item.notas || "",
      vendedor: item.vendedor || "",
      // saldo_a_favor: item,
      soporte: item,
      ficha: item,
      detalles: item,
    }));
  let componentes = {
    creado: (props: any) => (
      <span title={props.value}>
        {props.value ? formatDate(props.value) : ""}
      </span>
    ),
    id: (props: { value: string }) => (
      <span className="font-semibold text-sm" title={props.value}>
        {props.value.slice(0, 12)}
      </span>
    ),
    cliente: ({ value }: { value: Agente }) => (
      <div className="border h-full">
        <ToolTip
          content={value.nombre_agente_completo.toUpperCase()}
          onClick={() => {
            setSelectedItem(value);
          }}
          className="cursor-pointer hover:underline p-2"
        >
          <span>{value.nombre_agente_completo}</span>
        </ToolTip>
      </div>
    ),
    estado_credito: (props) => getStatusCreditBadge(props.value),
    credito: (props: { value: number }) => getCreditoBadge(props.value),
    wallet: (props: { value: string }) => getWalletBadge(props.value), // Modificado para aceptar string
    categoria: (props: { value: string }) => getRoleBadge(props.value),
    notas_internas: ({ value }: { value: string }) => (
      <p className="max-w-sm truncate">
        <span>{value}</span>
      </p>
    ),

    // saldo_a_favor: ({ value }: { value: Agente }) => (
    //   <button
    //     onClick={() => {
    //       setDefaultTab("cobrar");
    //       setSelectedItem(value);
    //     }}
    //     className="hover:underline font-medium"
    //   >
    //     <span className="text-blue-600 hover:underline cursor-pointer">
    //       {value.saldo}
    //     </span>
    //   </button>
    // ),
    ficha: ({ value }: { value: Agente }) => (
      <button
        className="hover:underline font-medium text-blue-700"
        onClick={() => setFichaItem(value)}
      >
        Ficha
      </button>
    ),
    soporte: ({ value }: { value: Agente }) => (
      <button
        onClick={() => {
          handleSuperAgent(value.correo);
        }}
        className="hover:underline font-medium"
      >
        <span className="text-red-600 hover:underline cursor-pointer">
          Soporte
        </span>
      </button>
    ),

    detalles: ({ value }: { value: Agente }) => (
      <button
        onClick={() => {
          setSelectedItem(value);
        }}
        className="hover:underline font-medium"
      >
        <span className="text-blue-600 hover:underline cursor-pointer">
          Detalles
        </span>
      </button>
    ),
  };

  const handleSuperAgent = (email: string) => {
    fetchInitSuperAgent(email, (data) => {
      setLink(data.link);
    });
  };

  const handleFetchClients = () => {
    setLoading(true);
    fetchAgentes(filters, {} as TypeFilters, (data) => {
      setClient(data);
      setLoading(false);
    });
  };

  const tabs = [
    {
      title: "Perfil",
      tab: "",
      icon: User,
      component: <AgentDetailsCard agente={selectedItem}></AgentDetailsCard>,
    },
    {
      title: "Reservaciones",
      tab: "reservations",
      icon: CalendarDays,
      component: <PageReservas agente={selectedItem} />,
    },
    // {
    //   title: "Vuelos",
    //   tab: "vuelos",
    //   icon: Plane,
    //   component: <PageVuelos agente={selectedItem} />,
    // },
    // {
    //   title: "Renta de autos",
    //   tab: "car-rental",
    //   icon: CarTaxiFrontIcon,
    //   component: <CarRentalPage agente={selectedItem} />,
    // },
    // {
    //   title: "Facturas",
    //   tab: "invoices",
    //   icon: Receipt,
    //   component: <div>Facturas</div>,
    // },
    {
      title: "Usuarios",
      tab: "users",
      icon: Users,
      component: <UsersClient agente={selectedItem}></UsersClient>,
    },
    {
      title: "Wallet",
      tab: "wallet",
      icon: Wallet,
      component: (
        <PageCuentasPorCobrar
          agente={selectedItem}
          walletAmount={
            selectedItem?.wallet ? parseFloat(selectedItem.wallet) : 0
          }
        />
      ),
    },
    {
      title: "Empresas",
      tab: "empresas",
      icon: Building,
      component: <Configuration id_agente={selectedItem?.id_agente || null} />,
    },
  ];

  useEffect(() => {
    handleFetchClients();
  }, [filters]);

  useEffect(() => {
    if (selectedItem) {
      setSelectedItem(null);
      setDefaultTab("");
    }
  }, [pathname]);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Clientes
      </h1>
      <div className="w-full mx-auto bg-white p-4 rounded-lg shadow">
        <div>
          <Filters
            defaultFilters={filters}
            onFilter={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Reservations Table */}
        <div className="overflow-hidden">
          {loading ? (
            <Loader />
          ) : (
            <Table
              registros={formatedSolicitudes}
              renderers={componentes}
              defaultSort={defaultSort}
              leyenda={`Haz filtrado ${clients.length} clientes`}
            />
          )}
        </div>
      </div>
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
      {fichaItem && (
        <Modal
          onClose={() => setFichaItem(null)}
          title={`Ficha — ${fichaItem.nombre_agente_completo}`}
          subtitle="Resumen general del agente"
        >
          <FichaResumen id_agente={fichaItem.id_agente} />
        </Modal>
      )}
      {selectedItem && (
        <Modal
          onClose={() => {
            handleFetchClients();
            setSelectedItem(null);
            setDefaultTab("");
          }}
          title={`${selectedItem.nombre_agente_completo}`}
          subtitle="Puedes ver y editar los datos del cliente desde aqui"
        >
          <NavContainer
            defaultTab={defaultTab}
            tabs={tabs}
            title="Cliente"
          ></NavContainer>
        </Modal>
      )}
    </div>
  );
}

const MESES: Record<number, string> = {
  1: "Ene",
  2: "Feb",
  3: "Mar",
  4: "Abr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dic",
};

function FichaResumen({ id_agente }: { id_agente: string }) {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenAgente | null>(null);

  useEffect(() => {
    AgentesService.getInstance()
      .getResumen(id_agente)
      .then((res) => {
        if (res.data) setResumen(res.data);
      })
      .finally(() => setLoading(false));
  }, [id_agente]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-48 w-full">
        <Loader />
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="flex justify-center items-center min-h-48 w-full text-gray-400 text-sm">
        Sin información disponible
      </div>
    );
  }

  return (
    <div className="w-[900px] max-w-full space-y-8 p-4">
      {/* Gasto Mensual */}
      <section>
        <h2 className="text-base font-semibold text-sky-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-sky-600" />
          Gasto mensual
        </h2>
        <div className="overflow-x-auto rounded-xl border border-sky-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-sky-600 uppercase tracking-wide w-36 border-r border-sky-200">
                  Concepto
                </th>
                {resumen.gasto_mensual.map((g) => (
                  <th
                    key={g.mes}
                    className="px-4 py-3 text-center text-xs font-semibold text-sky-700 uppercase tracking-wide"
                  >
                    {MESES[g.numero_mes]} {g.anio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-sky-100 bg-white hover:bg-sky-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-600 border-r border-sky-200">
                  Reservas
                </td>
                {resumen.gasto_mensual.map((g) => (
                  <td
                    key={g.mes}
                    className="px-4 py-3 text-center font-bold text-sky-900"
                  >
                    {g.total_reservas}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-sky-100 bg-sky-50/30 hover:bg-sky-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-600 border-r border-sky-200">
                  Noches
                </td>
                {resumen.gasto_mensual.map((g) => (
                  <td
                    key={g.mes}
                    className="px-4 py-3 text-center font-bold text-sky-900"
                  >
                    {g.noches}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-sky-200 bg-white hover:bg-sky-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-600 border-r border-sky-200">
                  Gasto total
                </td>
                {resumen.gasto_mensual.map((g) => (
                  <td
                    key={g.mes}
                    className="px-4 py-3 text-center font-bold text-emerald-700"
                  >
                    $
                    {Number(g.gasto_total).toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Destinos */}
      <section>
        <h2 className="text-base font-semibold text-sky-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600" />
          Destinos más utilizados
        </h2>
        <DestinosSection id_agente={id_agente} estados={resumen.estado} />
      </section>

      {/* Tipo Negociación */}
      <section>
        <h2 className="text-base font-semibold text-sky-900 mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-sky-600" />
          Tipo de negociación
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {resumen.tipo_negociacion.map((t) => (
            <div
              key={t.tipo_negociacion}
              className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between"
            >
              <p className="text-sm font-medium text-slate-700 truncate mr-3 capitalize lowercase first-letter:uppercase">
                {t.tipo_negociacion.charAt(0) +
                  t.tipo_negociacion.slice(1).toLowerCase()}
              </p>
              <div className="flex gap-3 text-xs text-slate-500 shrink-0">
                <span>
                  <span className="font-bold text-slate-800">
                    {t.total_reservas}
                  </span>{" "}
                  Reservas.
                </span>
                <span>
                  <span className="font-bold text-slate-800">
                    {t.total_noches}
                  </span>{" "}
                  Noches.
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const defaultSort = {
  key: "creado",
  sort: false,
};

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

export default App;
