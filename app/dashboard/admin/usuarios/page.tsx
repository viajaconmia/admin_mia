import { TableFromMia } from "@/components/organism/TableFromMia";

export default function AdministracionUsuarios() {
  return (
    <>
      <div>
        <TableFromMia
          data={[{ id: "hola", name: "viendo" }]}
          columns={[
            { component: "profile_image", key: "id", header: "" },
            // { component: "copiar_and_button", key: "id", header: "" },
            { component: "text", key: "name", header: "Usuario" },
          ]}
        />
      </div>
    </>
  );
}
