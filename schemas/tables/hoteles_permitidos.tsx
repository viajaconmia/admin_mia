import Button from "@/components/atom/Button";
import {
  HotelPermitido,
  HotelPermitidoDTO,
  mapHotelPermitido,
} from "@/services/ExtraServices";
import { Precio } from "@/v3/atom/TableItemsComponent";

export type HotelPermitidoItem = Omit<
  HotelPermitido,
  | "id_agente"
  | "razon_social"
  | "rfc"
  | "id_hotel"
  | "Ciudad_Zona"
  | "tipo_hospedaje"
  | "calificacion"
  | "score_operaciones"
  | "cliente_nombre"
>;

export const mapHotelPermitidoItem = (
  hotel: HotelPermitidoDTO,
): HotelPermitidoItem => {
  const {
    id_agente,
    razon_social,
    rfc,
    id_hotel,
    Ciudad_Zona,
    tipo_hospedaje,
    calificacion,
    score_operaciones,
    cliente_nombre,
    ...hotelPermitido
  } = mapHotelPermitido(hotel);
  return hotelPermitido;
};

export const createHotelRenderers = ({
  onVerDetalle,
}: {
  onVerDetalle: (hotel: HotelPermitido) => void;
}) => {
  return {
    precio_sencilla: ({ value }: { value: number }) => (
      <Precio value={value.toString()} />
    ),

    is_allowed: ({ value }: { value: boolean }) => (
      <span>{value ? "✅" : "❌"}</span>
    ),

    activo: ({ value }: { value: boolean }) => (
      <span>{value ? "Activo" : "Inactivo"}</span>
    ),

    calificacion: ({ value }: { value: number | null }) => (
      <span>{value ?? "—"}</span>
    ),

    acciones: ({ value }: { value: HotelPermitido }) => (
      <Button size="sm" variant="secondary" onClick={() => onVerDetalle(value)}>
        Ver detalle
      </Button>
    ),
  };
};
