"use client";

import React, { useEffect, useState } from "react";
import Filters from "@/components/Filters";
import { Table } from "@/components/Table";
import { TypeFilters } from "@/types";
import { Loader } from "@/components/atom/Loader";
import { fetchAgentes } from "@/services/agentes";
import Modal from "@/components/organism/Modal";

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
      id_cliente: item.id_agente,
      nombre_del_cliente: item.nombre_agente_completo || "",
      correo: item.correo,
      telefono: item.telefono,
      estado_verificacion: "",
      estado_credito: Boolean(item.tiene_credito_consolidado),
      credito: item.saldo ? Number(item.saldo) : 0,
      wallet: 0,
      categoria: "Administrador",
      notas_internas: item.notas || "",
      vendedor: item.vendedor || "",
      // saldo_a_favor: item,
      // soporte: item,
      // detalles: item,
    }));

  const componentes = {};

  const handleFetchClients = () => {
    setLoading(true);
    fetchAgentes(filters, {} as TypeFilters, (data) => {
      console.log("Agentes fetched:", data);
      setClient(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    handleFetchClients();
  }, [filters]);

  return (
    <div className="h-fit">
      <h1 className="text-3xl font-bold tracking-tight text-sky-950 my-4">
        Cuentas por cobrar
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
            Estamos en proceso, por favor vuelve a cargar la página.
          </div>
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
