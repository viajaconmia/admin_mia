import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

export default Tooltip;
