import { useState } from "react";
import { useGeo } from "@/context/geo";
import { InputGoogle, PlaceMaps, RangeInput } from "@/components/atom/Input";
import { formatNumberWithCommas } from "@/helpers/formater";
import { Map } from "@/components/atom/Map";
import { MarkerHotel, MarkerUser } from "@/components/atom/Marker";
import Circle from "@/components/atom/Circle";
import Button from "@/components/atom/Button";
import { Plus } from "lucide-react";

export const FormAgregarHotel = () => {
  const [loading, setLoading] = useState(false);
  const { center, range, setRange, setCenter, filtrados } = useGeo();

  return (
    <div className="min-w-screen grid md:grid-cols-[auto_1fr] grid-rows-[1fr] pt-4">
      {/* CONTROLS */}
      <div className="h-[calc(100vh-250px)] overflow-y-auto p-4 border rounded-l-lg min-w-[300px] flex flex-col gap-4">
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
        <div className="flex flex-col gap-4">
          {filtrados.map((hotel) => (
            <div
              key={hotel.id_hotel}
              className="w-full flex border rounded-lg overflow-hidden"
            >
              <img
                src={hotel.imagenes[0]}
                alt=""
                className="w-32 h-32 object-cover"
              />
              <div className="flex flex-col justify-between p-3">
                <div className="flex flex-col">
                  <p className="truncate w-96 font-bold">
                    {hotel.nombre_hotel}
                  </p>
                  <p className="truncate w-96 font-semibold text-xs text-gray-500">
                    {hotel.Estado}, {hotel.Ciudad_Zona}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm font-semibold">
                    {hotel.tipos_cuartos[0].precio
                      ? "$" +
                        formatNumberWithCommas(hotel.tipos_cuartos[0].precio)
                      : "Precio no disponible"}
                  </p>
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setCenter([
                        Number(hotel.geo.latitud),
                        Number(hotel.geo.longitud),
                      ]);
                    }}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAPA */}
      <div className="relative col-start-1 md:col-start-2 row-start-1">
        <Map>
          {filtrados.map(({ geo, nombre_hotel, id_hotel }) => (
            <MarkerHotel
              key={id_hotel}
              label={nombre_hotel}
              position={[Number(geo.latitud), Number(geo.longitud)]}
            />
          ))}

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
