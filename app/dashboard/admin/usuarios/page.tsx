"use client";
import { TableFromMia } from "@/components/organism/TableFromMia";
import { useNotification } from "@/context/useNotificacion";
import { AuthService } from "@/services/AuthService";
import { Role, User } from "@/types/auth";
import { useEffect, useState } from "react";

export default function AdministracionUsuarios() {
  const [users, setUsers] = useState<
    (User & Role & { permissions_extra: number; active: boolean })[]
  >([]);
  const { showNotification } = useNotification();

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

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="mt-8">
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
          { component: "text", key: "role_name", header: "Role" },
          {
            component: "text",
            key: "permissions_extra",
            header: "Permisos",
          },
          { component: "date", key: "created_at", header: "Fecha de creación" },
          { component: "active", key: "active", header: "Activo" },
        ]}
      />
    </div>
  );
}
