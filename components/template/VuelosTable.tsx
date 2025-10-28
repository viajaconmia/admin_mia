import { useEffect, useState } from "react";
import { TableFromMia } from "../organism/TableFromMia";
import { ViajeAereo, VuelosServices } from "@/services/VuelosServices";
import Modal from "../organism/Modal";
import { EditarVuelos } from "./EditarVuelos";

export const VuelosTable = () => {
  const [vuelos, setVuelos] = useState<ViajeAereo[]>([]);
  const [selected, setSelected] = useState(null);

  const fetchVuelos = () => {
    VuelosServices.getInstance()
      .getVuelos()
      .then((response) => {
        // Suponiendo que la respuesta tiene una propiedad 'data' con los vuelos
        setVuelos(response.data ?? []);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  useEffect(() => {
    fetchVuelos();
  }, []);
  return (
    <>
      {selected && (
        <Modal
          title="Edita el vuelo"
          subtitle="Modifica los datos del vuelo"
          onClose={() => setSelected(null)}
        >
          <EditarVuelos
            vuelo={selected}
            onSubmit={() => {
              setSelected(null);
              fetchVuelos();
            }}
          ></EditarVuelos>
        </Modal>
      )}
      <TableFromMia
        data={vuelos}
        columns={[
          { header: "ID", component: "text", key: "codigo_confirmacion" },
          {
            header: "action",
            key: "id_booking",
            component: "button",
            componentProps: {
              label: "editar",
              onClick: ({ item }) => {
                setSelected(item);
              },
            },
          },
        ]}
      />
    </>
  );
};
