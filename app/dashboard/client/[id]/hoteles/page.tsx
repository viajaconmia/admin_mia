"use client";
import Button from "@/components/atom/Button";
import { TableHotelesPermitidos } from "@/components/tables/HotelesPermitidosTable";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Map } from "@/components/atom/Map";
import { MarkerUser } from "@/components/atom/Marker";
import { useGeo } from "@/context/geo";
import Circle from "@/components/atom/Circle";
import { InputGoogle, PlaceMaps, RangeInput } from "@/components/atom/Input";
import { formatNumberWithCommas } from "@/helpers/formater";

export default function PageHoteles() {
  const [section, setSection] = useState<"hoteles" | "agregar">("hoteles");
  return (
    <section>
      <main>
        <div className="flex justify-end">
          <Button
            size="sm"
            icon={section === "hoteles" ? Plus : X}
            onClick={() =>
              setSection(section === "hoteles" ? "agregar" : "hoteles")
            }
          >
            {section === "hoteles" ? "Agregar hotel" : "Cancelar"}
          </Button>
        </div>
        {section === "hoteles" && <TableHotelesPermitidos />}
        {section === "agregar" && <FormAgregarHotel />}
      </main>
    </section>
  );
}

const FormAgregarHotel = () => {
  const [loading, setLoading] = useState(false);
  const { center, range, setRange, setCenter } = useGeo();
  return (
    <div className="min-w-screen grid md:grid-cols-[auto_1fr] grid-rows-[1fr] pt-4">
      {/* CONTROLS */}
      <div className="h-full p-4 border rounded-l-lg min-w-[300px] flex flex-col gap-4">
        <InputGoogle
          onChange={(place: PlaceMaps) => {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setCenter([lat, lng]);
          }}
        />
        <RangeInput
          label="Radio de busqueda"
          value={range}
          onChange={(e) => setRange(e)}
          min={100}
          max={5000}
          step={100}
          sign="m"
          formatValue={formatNumberWithCommas}
        />
      </div>

      {/* MAPA */}
      <div className="relative col-start-1 md:col-start-2 row-start-1">
        <Map>
          {/* {filtrados.map(({ address, name, id }) => (
            <MarkerRestaurant
              key={id}
              label={name}
              position={[address.location.lat, address.location.lng]}
            />
          ))}
          */}
          <MarkerUser position={center} />
          <Circle center={center} range={range} />
        </Map>

        {loading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/70">
            <span className="text-black dark:text-white text-lg font-medium">
              Loading...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
