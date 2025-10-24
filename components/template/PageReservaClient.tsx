"use client";

import React, { useState } from "react";
import Filters from "@/components/Filters";
import { TypeFilters } from "@/types";
import { currentDate } from "@/lib/utils";
import { HotelesTable } from "./HotelesTable";
import { TabsList } from "../molecule/TabList";
import { Building2, CarTaxiFront, Plane, Shuffle } from "lucide-react";
import { VuelosTable } from "./VuelosTable";

type TabsReservation = "hoteles" | "vuelos" | "renta autos" | "todos";

function App({ id_agente, agente }: { id_agente?: string; agente?: any }) {
  const [tab, setTab] = useState<TabsReservation>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState<TypeFilters>(
    defaultFiltersSolicitudes
  );

  const tabs = [
    {
      tab: "todos",
      icon: Shuffle,
    },
    {
      tab: "hoteles",
      icon: Building2,
    },
    {
      tab: "vuelos",
      icon: Plane,
    },
    {
      tab: "renta autos",
      icon: CarTaxiFront,
    },
  ];

  const pageTabs = {
    hoteles: (
      <HotelesTable
        searchTerm={searchTerm}
        id_agente={id_agente}
        agente={agente}
        filters={filters}
      />
    ),
    vuelos: <VuelosTable />,
    "renta autos": <></>,
    todos: <></>,
  };

  return (
    <div className="h-fit">
      <div className="w-full mx-auto rounded-md bg-white shadow-lg">
        <div>
          <TabsList
            tabs={tabs}
            onChange={(tab: string) => setTab(tab as TabsReservation)}
            activeTab={tab}
          />
          <div className="p-4 pb-0">
            <Filters
              defaultFilters={filters}
              onFilter={setFilters}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        </div>
        <div>
          <div className="p-4">{pageTabs[tab]}</div>
        </div>
      </div>
    </div>
  );
}

const defaultFiltersSolicitudes: TypeFilters = {
  codigo_reservacion: null,
  client: null,
  reservante: null,
  reservationStage: null,
  hotel: null,
  status: "Confirmada",
  startDate: currentDate(),
  endDate: currentDate(),
  traveler: null,
  paymentMethod: null,
  id_client: null,
  statusPagoProveedor: null,
  filterType: "Transaccion",
  markup_end: null,
  markup_start: null,
};

export default App;
