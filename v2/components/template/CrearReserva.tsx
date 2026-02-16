"use client";

import { TabsList } from "@/components/molecule/TabsList";
import { ReservationForm } from "@/components/organism/FormReservation";
import { CarRentalPage } from "@/components/pages/CarRental";
import { PageVuelos } from "@/components/template/PageVuelos";
import { useNotification } from "@/context/useNotificacion";
import { Building2, CarTaxiFront, Plane } from "lucide-react";
import { useState } from "react";

const App = ({ agente }: { agente: Agente }) => {
  const [tab, setTab] = useState<"hotel" | "vuelo" | "renta">("hotel");
  const { showNotification } = useNotification();

  return (
    <>
      {agente && (
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
                  id_agente: agente.id_agente,
                  agente: agente,
                }}
                edicion={false}
                create={true}
              />
            )}
            {tab == "vuelo" && <PageVuelos agente={agente} />}
            {tab == "renta" && <CarRentalPage agente={agente} />}
          </div>
        </>
      )}
    </>
  );
};
export default App;
