import dynamic from "next/dynamic";

const Pointer = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});

export default Pointer;
