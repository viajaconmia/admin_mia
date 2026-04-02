import dynamic from "next/dynamic";
import Pointer from "./Pointer";
import Tooltip from "./ToolTipMark";

const UserMark = dynamic(
  () =>
    import("leaflet").then((L) => {
      const customIcon = L.icon({
        iconUrl:
          "https://cdn.iconscout.com/icon/premium/png-512-thumb/map-marker-icon-svg-download-png-3553998.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
      return ({ position }: { position: [number, number] }) => (
        <Pointer position={position} icon={customIcon} />
      );
    }),
  { ssr: false },
);

const HotelMark = dynamic(
  () =>
    import("leaflet").then((L) => {
      const customIcon = L.icon({
        iconUrl: "https://cdn-icons-png.freepik.com/256/16977/16977350.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
      return ({
        position,
        label,
      }: {
        position: [number, number];
        label?: string;
      }) => (
        <Pointer position={position} icon={customIcon}>
          {label && <Tooltip>{label}</Tooltip>}
        </Pointer>
      );
    }),
  { ssr: false },
);

export const MarkerUser = ({ position }: { position: [number, number] }) => (
  <UserMark position={position} />
);
export const MarkerHotel = (props: {
  position: [number, number];
  label?: string;
}) => <HotelMark {...props} />;
