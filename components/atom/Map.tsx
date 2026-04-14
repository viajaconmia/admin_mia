"use client";

import { useEffect, useId } from "react";
import dynamic from "next/dynamic";
import { useMap, useMapEvents } from "react-leaflet";
import { useWindowHeight } from "@/hooks/useWindowWidth";
import { useGeo } from "@/context/geo";

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapContainer = dynamic<any>(
  () => import("react-leaflet").then((mod) => ({ default: mod.MapContainer })),
  { ssr: false },
);

//Este componente lo usare como un componente de logica, donde manejare todos los eventos del mapa para mantener todo en un sololugar
const MapLogic = ({ children }: { children?: React.ReactNode }) => {
  const map = useMap();
  const { center, setCenter } = useGeo();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  useMapEvents({
    click(e) {
      setCenter([e.latlng.lat, e.latlng.lng]);
    },
  });
  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {children}
    </>
  );
};

//Este es el componente donde metere
export const Map = ({ children, ...props }: { children?: React.ReactNode }) => {
  const height = useWindowHeight();
  const { center } = useGeo();
  const mapKey = useId();
  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={14}
      style={{ height: height, width: "100%", zIndex: 0 }}
    >
      <MapLogic {...props}>{children}</MapLogic>
    </MapContainer>
  );
};
