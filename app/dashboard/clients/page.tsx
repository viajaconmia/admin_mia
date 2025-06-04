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
} from "lucide-react";
import { Table } from "@/components/Table";
import { TypeFilters } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { fetchAgentes, fetchInitSuperAgent } from "@/services/agentes";
import Modal from "@/components/structure/Modal";
import NavContainer from "@/components/structure/NavContainer";
import { AgentDetailsCard } from "./_components/DetailsClient";
import { UsersClient } from "./_components/UsersClient";
import { PageReservasClientes } from "@/components/template/PageReservaClient";

function App() {
  const [clients, setClient] = useState<Agente[]>([]);
  const [selectedItem, setSelectedItem] = useState<Agente | null>(null);
  const [searchTerm, setSearchTerm] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<null | string>(null);
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  let formatedSolicitudes = clients
    .filter(
      (item) => item.nombre_agente_completo.toUpperCase().includes(searchTerm)
      // item.correo.to
    )
    .map((item) => ({
      creado: item.created_at,
      id: item.id_agente,
      cliente: item.nombre_agente_completo,
      correo: item.correo,
      telefono: item.telefono,
      estado_verificacion: "",
      estado_credito: Boolean(item.tiene_credito_consolidado),
      credito: item.monto_credito ? Number(item.monto_credito) : 0,
      categoria: "Administrador",
      notas_internas: item.notas || "",
      vendedor: item.vendedor || "",
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
    cliente: ({ value }: { value: string }) => (
      <span className="relative group cursor-pointer font-semibold text-xs max-w-[200px] inline-block">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
          {value.toUpperCase()}
        </div>

        <div className="absolute z-10 right-0 top-full mt-1 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg hidden group-hover:block pointer-events-none whitespace-pre-wrap break-words">
          {value.toUpperCase()}
        </div>
      </span>
    ),
    estado_credito: (props) => getStatusCreditBadge(props.value),
    credito: (props: { value: number }) => getCreditoBadge(props.value),
    categoria: (props: { value: string }) => getRoleBadge(props.value),
    notas_internas: ({ value }: { value: string }) => (
      <span className="relative group cursor-pointer text-xs max-w-[150px] inline-block">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
          {value.toUpperCase()}
        </div>

        <div className="absolute z-10 right-0 top-full mt-1 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg hidden group-hover:block pointer-events-none whitespace-pre-wrap break-words">
          {value.toUpperCase()}
        </div>
      </span>
    ),

    soporte: ({ value }: { value: Agente }) => (
      <button
        onClick={() => {
          handleSuperAgent(value.correo);
        }}
        className="hover:underline font-medium"
      >
        <span className="text-blue-600 hover:underline cursor-pointer">
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
          <a href={link}>Ir al perfil</a>
        </Modal>
      )}
      {selectedItem && (
        <Modal
          onClose={() => {
            handleFetchClients();
            setSelectedItem(null);
          }}
          title="Datos del cliente"
          subtitle="Puedes ver y editar los datos del cliente desde aqui"
        >
          <NavContainer tabs={tabs}></NavContainer>
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
