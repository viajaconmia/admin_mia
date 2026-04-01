import dynamic from "next/dynamic";

const Circle = dynamic(() => import("react-leaflet").then((m) => m.Circle), {
  ssr: false,
});

const Range = ({
  center,
  range,
}: {
  center: [number, number];
  range: number;
}) => <Circle center={center} radius={range} />;

export default Range;
