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
} from "lucide-react";
import { Table } from "@/components/Table";
import { TypeFilters } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { fetchAgentes, fetchInitSuperAgent } from "@/services/agentes";
import Modal from "@/components/organism/Modal";
import NavContainer from "@/components/organism/NavContainer";
import { AgentDetailsCard } from "./_components/DetailsClient";
import { UsersClient } from "./_components/UsersClient";
import { PageReservasClientes } from "@/components/template/PageReservaClient";
import PageCuentasPorCobrar from "@/components/template/PageCuentasPorCobrar";
import { ToolTip } from "@/components/atom/ToolTip";
import { set } from "date-fns";

function App() {
  const [clients, setClient] = useState<(Agente)[]>([]);
  const [selectedItem, setSelectedItem] = useState<Agente | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<null | string>(null);
  const [defaultTab, setDefaultTab] = useState<string>("");
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  let formatedSolicitudes = clients
    .filter(
      (item) =>
        item.nombre_agente_completo.toUpperCase().includes(searchTerm) ||
        item.id_agente.toUpperCase().replaceAll("-", "").includes(searchTerm)
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
      wallet: item.wallet ? parseFloat(item.wallet) : 0,
      categoria: "Administrador",
      notas_internas: item.notas || "",
      vendedor: item.vendedor || "",
      // saldo_a_favor: item,
      soporte: item,
      detalles: item,
    }));

  let componentes = {
    creado: (props: any) => (
      <span title={props.value}>{formatDate(props.value)}</span>
    ),
    id: (props: { value: string }) => (
      <span className="font-semibold text-sm" title={props.value}>
        {props.value.split("-").join("").slice(0, 10)}
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
    wallet: (props: { value: number }) => <>{props.value}</>,
    categoria: (props: { value: string }) => getRoleBadge(props.value),
    notas_internas: ({ value }: { value: string }) => (
      <ToolTip content={value.toUpperCase()}>
        <span>{value}</span>
      </ToolTip>
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
      console.log("Agentes fetched:", data);
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
      component: (
        <PageReservasClientes
          id_agente={selectedItem ? selectedItem.id_agente : ""}
        ></PageReservasClientes>
      ),
    },
    {
      title: "Facturas",
      tab: "invoices",
      icon: Receipt,
      component: <div>Facturas</div>,
    },
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
          walletAmount={selectedItem?.wallet ? parseFloat(selectedItem.wallet) : 0}
        />
      ),
    },
    {
      title: "Empresas",
      tab: "empresas",
      icon: Building,
      component: <div>Empresas</div>,
    },
    {
      title: "Metodos de pago",
      tab: "metodos-pago",
      icon: CreditCard,
      component: <div>Metodo de pago</div>,
    },
  ];

  useEffect(() => {
    handleFetchClients();
  }, [filters]);

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
