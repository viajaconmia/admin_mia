"use client";

import { TabsList } from "@/components/molecule/TabsList";
import { ReservationForm } from "@/components/organism/FormReservation";
import { CarRentalPage } from "@/components/pages/CarRental";
import { PageVuelos } from "@/components/template/PageVuelos";
import { DriverPage } from "@/components/pages/DriverPage";
import { useAlert } from "@/context/useAlert";
import { Building2, CarTaxiFront, Plane, UserRound } from "lucide-react";
import { useState } from "react";

const App = ({ agente }: { agente: Agente }) => {
  const [tab, setTab] = useState<
    "hotel" | "vuelo" | "renta" | "viaje_con_chofer"
  >("hotel");
  const { showNotification } = useAlert();

  return (
    <>
      {agente && (
        <>
          <TabsList
            tabs={[
              { icon: Building2, label: "hotel", tab: "hotel" },
              { icon: Plane, label: "vuelo", tab: "vuelo" },
              { icon: CarTaxiFront, label: "renta", tab: "renta" },
              {
                icon: UserRound,
                label: "viaje con chofer",
                tab: "viaje_con_chofer",
              },
            ]}
            onChange={function (
              tab: "hotel" | "vuelo" | "renta" | "viaje_con_chofer",
            ): void {
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
            {tab == "viaje_con_chofer" && <DriverPage agente={agente} />}
          </div>
        </>
      )}
    </>
  );
};
export default App;
