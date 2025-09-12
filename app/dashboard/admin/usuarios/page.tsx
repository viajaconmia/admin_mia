"use client";
import { TableFromMia } from "@/components/organism/TableFromMia";
import { useNotification } from "@/context/useNotificacion";
import { AuthService } from "@/services/AuthService";
import { Role, User } from "@/types/auth";
import { useEffect, useState } from "react";

export default function AdministracionUsuarios() {
  const [users, setUsers] = useState<
    (User & Role & { permissions_extra: number })[]
  >([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await AuthService.getInstance().getUsers();
        setUsers(data);
      } catch (error) {
        showNotification(
          "error",
          error.message || "Error al obtener a los usuarios"
        );
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  return (
    <>
      <div>
        <TableFromMia
          data={users}
          columns={[
            { component: "profile_image", key: "name", header: "" },
            // { component: "copiar_and_button", key: "id", header: "" },
            {
              component: "titles",
              key: "name",
              header: "Usuario",
              componentProps: { subtitle: "email" },
            },
            {
              component: "text",
              key: "permissions_extra",
              header: "Permisos personalizados",
            },
          ]}
        />
      </div>
    </>
  );
}
