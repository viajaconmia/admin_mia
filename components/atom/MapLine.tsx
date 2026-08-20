import { Polyline } from "react-leaflet";

type LineaProps = {
  positions: [Number, Number][];
};

export const MapLine = ({ positions }: LineaProps) => {
  if (positions.length < 2) return;

  return <Polyline positions={positions}></Polyline>;
};
