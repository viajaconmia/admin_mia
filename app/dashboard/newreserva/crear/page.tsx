"use client";

import { ComboBox2 } from "@/components/atom/Input";
import { TabsList } from "@/components/molecule/TabsList";
import { ReservationForm } from "@/components/organism/FormReservation";
import { CarRentalPage } from "@/components/pages/CarRental";
import { PageVuelos } from "@/components/template/PageVuelos";
import { useNotification } from "@/context/useNotificacion";
import { fetchAgentes } from "@/services/agentes";
import { Building2, CarTaxiFront, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "wouter";

const App = () => {
  const [clients, setClients] = useState<Agente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Agente | null>(null);
  const [tab, setTab] = useState<"hotel" | "vuelo" | "renta">("hotel");
  const { showNotification } = useNotification();
  const [parametros, setParametros] = useSearchParams();

  const setClient = (value) => {
    const params = parametros;
    params.set("client", value);
    setParametros(params.toString());
  };

  const handleFetchClients = () => {
    fetchAgentes({}, {}, (data) => {
      const agent = parametros.get("client");
      setClients(data);
      if (agent) {
        setSelectedClient(
          data.filter((client) => client.id_agente == agent)[0] || null
        );
      }
    });
  };

  useEffect(handleFetchClients, []);

  return (
    <>
      <div className="w-full flex justify-center items-center">
        <ComboBox2
          value={{
            name: selectedClient?.nombre_agente_completo ?? "",
            content: selectedClient,
          }}
          onChange={(value) => {
            setClient(value.content.id_agente);
            setSelectedClient(value.content);
          }}
          options={clients.map((client) => ({
            name: client.nombre_agente_completo,
            content: client,
          }))}
        />
      </div>
      {selectedClient && (
        <>
          <TabsList
            tabs={[
              { icon: Building2, label: "hotel", tab: "hotel" },
              { icon: Plane, label: "vuelo", tab: "vuelo" },
              { icon: CarTaxiFront, label: "renta", tab: "renta" },
            ]}
            onChange={function (tab: "hotel" | "vuelo" | "renta"): void {
              setTab(tab);
            }}
            activeTab={tab}
          ></TabsList>
          <div className="w-full flex justify-center">
            {tab == "hotel" && (
              <ReservationForm
                onClose={() => {
                  showNotification("success", "Se ha creado tu reserva");
                }}
                solicitud={{
                  hotel: null,
                  check_in: null,
                  check_out: null,
                  id_agente: selectedClient.id_agente,
                  agente: selectedClient,
                }}
                edicion={false}
                create={true}
              />
            )}
            {tab == "vuelo" && <PageVuelos agente={selectedClient} />}
            {tab == "renta" && <CarRentalPage agente={selectedClient} />}
          </div>
        </>
      )}
    </>
  );
};
export default App;
