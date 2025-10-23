// handleSubmitReserva.ts
import { updateReserva } from "@/services/reservas";
import { ReservaForm, EdicionForm, Solicitud2, Viajero } from "@/types";

export const handleSubmitReserva = async (
  data: {
    nuevo_incluye_desayuno: boolean | null;
    acompanantes: Viajero[];
    edicionForm: EdicionForm;
    solicitud: Solicitud2;
    form: ReservaForm;
  },
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setCobrar: React.Dispatch<React.SetStateAction<boolean>>,
  setForm: React.Dispatch<React.SetStateAction<ReservaForm>>,
  onClose: () => void
) => {
  const { nuevo_incluye_desayuno, acompanantes, edicionForm, solicitud, form } = data;
  setLoading(true);
  const submitData = { ...edicionForm, nuevo_incluye_desayuno, acompanantes };
  console.log(submitData);
  
  try {
    let response;
    if (edicionForm) {
      response = await updateReserva(submitData, solicitud.id_booking);
    }
    console.log(response);
    alert("Reserva creada correctamente");
    onClose();
  } catch (error) {
    console.error(error);
    alert("Error al guardar la reserva");
  } finally {
    setLoading(false);
  }
};
