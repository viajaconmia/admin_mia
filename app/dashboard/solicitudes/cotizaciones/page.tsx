"use client";

import React, { useEffect, useState } from "react";
import { Loader } from "@/components/atom/Loader";
import { BookingsService } from "@/services/BookingService";
import { TableFromMia } from "@/components/organism/TableFromMia";
import { Building2, Car, Plane } from "lucide-react";
import { formatDate } from "@/helpers/formater";
import Modal from "@/components/organism/Modal";
import { Tabs, TabsTrigger, TabsContent, TabsList } from "@/components/ui/tabs";
import { HotelCard } from "./_pages_to_proccess/Hotel";
import { VueloCard } from "./_pages_to_proccess/Vuelo";
import { RentalCartCard } from "./_pages_to_proccess/RentaCarro";

type ServiceGroup = {
  types: Record<"flight" | "rental_car" | "hotel", number>;
  data: any[];
};

function App() {
  const [servicios, setServicios] = useState<ServiceGroup[] | null>(null);
  const [selected, setSelected] = useState<ServiceGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hotel");

  useEffect(() => {
    const booking = new BookingsService();
    booking
      .obtenerCotizaciones()
      .then(({ data }) => {
        setServicios(data as unknown as ServiceGroup[]);
        setLoading(false);
      })
      .catch((erro) => console.error(erro));
  }, []);

  const hoteles =
    selected?.data?.filter(
      (obj) => !obj.objeto_gemini || obj.objeto_gemini.type == "hotel"
    ) || [];

  const vuelo =
    selected?.data?.filter((obj) => obj.objeto_gemini.type == "flight") || [];

  const car_rental =
    selected?.data?.filter((obj) => obj.objeto_gemini.type == "car_rental") ||
    [];

  return (
    <>
      <button
        onClick={() => {
          console.log(hoteles);
          console.log(servicios);
        }}
      >
        aqui
      </button>
      <div>
        <div className="mx-auto bg-white p-4 rounded-b-lg shadow">
          <div className="overflow-hidden0">
            {loading ? (
              <Loader></Loader>
            ) : (
              <TableFromMia
                data={servicios}
                columns={[
                  {
                    header: "",
                    component: "custom",
                    key: "types",
                    componentProps: {
                      component: ({ item }: { item: ServiceGroup }) => {
                        return (
                          <div className="flex gap-1">
                            {Object.entries(item.types).map(([key, value]) => {
                              const IconComponent =
                                types[key as keyof typeof types];

                              if (!IconComponent) return null;

                              return (
                                <span
                                  key={key}
                                  className={`text-xs flex items-center gap-2 bg-${
                                    types_color[key as keyof typeof types_color]
                                  }-100 rounded-full p-1 px-4`}
                                >
                                  {value.toString()}
                                  <IconComponent className="w-3 h-3" />
                                </span>
                              );
                            })}
                          </div>
                        );
                      },
                    },
                  },
                  {
                    component: "custom",
                    header: "Cliente",
                    key: null,
                    componentProps: {
                      component: ({ item }) => (
                        <span>
                          {(item.data[0].nombre_cliente || "").toUpperCase()}
                        </span>
                      ),
                    },
                  },
                  {
                    component: "custom",
                    header: "Creado el",
                    key: null,
                    componentProps: {
                      component: ({ item }) => (
                        <span>{formatDate(item.data[0].created_at)}</span>
                      ),
                    },
                  },
                  {
                    component: "button",
                    header: "Procesar",
                    key: null,
                    componentProps: {
                      onClick: (value) => {
                        setSelected(value.item);
                      },
                      label: "Procesar",
                    },
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>
      {selected && (
        <Modal
          onClose={() => {
            setSelected(null);
          }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-[80vw]"
          >
            <TabsList
              className={`grid w-full grid-cols-${
                Object.values(selected.types).length
              }`}
            >
              {hoteles.length > 0 && (
                <TabsTrigger value="hotel">Hotel</TabsTrigger>
              )}
              {vuelo.length > 0 && (
                <TabsTrigger value="vuelo">Vuelo</TabsTrigger>
              )}
              {car_rental.length > 0 && (
                <TabsTrigger value="renta">Renta de carros</TabsTrigger>
              )}
            </TabsList>

            {hoteles.length > 0 && (
              <TabsContent value="hotel" className="p-4 space-y-4">
                {hoteles.map((hotel) => (
                  <HotelCard key={hotel.id_solicitud} hotel={hotel}></HotelCard>
                ))}
              </TabsContent>
            )}

            {vuelo.length > 0 && (
              <TabsContent value="vuelo" className="space-y-4">
                {vuelo.map((fly) => (
                  <VueloCard key={fly.id_solicitud} vuelo={fly}></VueloCard>
                ))}
              </TabsContent>
            )}

            {car_rental.length > 0 && (
              <TabsContent value="renta" className="space-y-4">
                {car_rental.map((car) => (
                  <RentalCartCard
                    key={car.id_solicitud}
                    cart={car}
                  ></RentalCartCard>
                ))}
              </TabsContent>
            )}
          </Tabs>
        </Modal>
      )}
    </>
  );
}

const types: Record<"flight" | "car_rental" | "hotel", React.ElementType> = {
  flight: Plane,
  hotel: Building2,
  car_rental: Car,
};
const types_color: Record<"flight" | "car_rental" | "hotel", string> = {
  flight: "green",
  hotel: "blue",
  car_rental: "yellow",
};

export default App;
