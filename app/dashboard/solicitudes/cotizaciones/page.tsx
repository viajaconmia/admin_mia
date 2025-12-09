"use client";

import React, { useEffect } from "react";
import { ReservationForm } from "@/components/organism/FormReservation";
// import Filters from "@/components/Filters";
import { Table } from "@/components/Table";
import { fetchHoteles } from "@/services/hoteles";
import Modal from "@/components/organism/Modal";
import { TypeFilters } from "@/types";
import { Loader } from "@/components/atom/Loader";

function App() {
  useEffect(() => {
    handleFetchSolicitudes();
  }, [filters]);

  let formatedSolicitudes = allSolicitudes
    .filter((item) =>
      (item.hotel_solicitud || "").toUpperCase().includes(searchTerm)
    )
    .map((item) => ({
      id_cliente: item.id_agente,
    }));

  let componentes: Record<keyof SolicitudClient, any> = {};

  useEffect(() => {
    fetchHoteles((data) => {
      setHoteles(data);
    });
  }, []);

  return (
    <div>
      <div className="mx-auto bg-white p-4 rounded-b-lg shadow">
        {/* <div>
          <Filters
            defaultFilters={filters}
            onFilter={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div> */}

        {/* Reservations Table */}
        <div className="overflow-hidden0">
          {loading ? (
            <Loader></Loader>
          ) : (
            <Table
              registros={formatedSolicitudes}
              renderers={componentes}
              defaultSort={defaultSort}
            />
          )}
        </div>
        {selectedItem && (
          <Modal
            onClose={() => {
              setSelectedItem(null);
            }}
            title="Crear reserva"
            subtitle="Modifica los detalles de la reserva y creala."
          >
            <ReservationForm
              hotels={hoteles}
              solicitud={{
                check_in: selectedItem.check_in_solicitud,
                check_out: selectedItem.check_out_solicitud,
                id_servicio: selectedItem.id_servicio,
                hotel: selectedItem.hotel_solicitud,
                room: selectedItem.room,
                id_viajero: selectedItem.id_viajero_solicitud,
                id_agente: selectedItem.id_agente,
                id_solicitud: selectedItem.id_solicitud,
                // viajeros_adicionales:selectedItem.viajeros_acompañantes
              }}
              onClose={() => {
                setSelectedItem(null);
                handleFetchSolicitudes();
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

const defaultSort = {
  key: "creado",
  sort: true,
};

const [dia, mes, año] = new Date()
  .toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  .split("/");

const defaultFiltersSolicitudes: TypeFilters = {
  codigo_reservacion: null,
};

export default App;
