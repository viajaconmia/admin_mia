"use client";
import Modal from "@/components/organism/Modal";
import { TableFromMia } from "@/components/organism/TableFromMia";
import { useNotification } from "@/context/useNotificacion";
import { AuthService } from "@/services/AuthService";
import { Permission, Role, User } from "@/types/auth";
import { useEffect, useState } from "react";

export default function AdministracionUsuarios() {
  const [users, setUsers] = useState<
    (User & Role & { permissions_extra: number; active: boolean })[]
  >([]);
  const [selectedUser, setSelectedUser] = useState<
    (User & Role & { permissions_extra: number; active: boolean }) | null
  >(null);
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
    <>
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
            {
              component: "date",
              key: "created_at",
              header: "Fecha de creación",
            },
            { component: "active", key: "active", header: "Activo" },
            {
              component: "button",
              key: null,
              header: "Permiso",
              componentProps: {
                label: "administrar permisos",
                onClick: ({
                  item,
                }: {
                  item: User &
                    Role & { permissions_extra: number; active: boolean };
                }) => {
                  console.log(item);
                  setSelectedUser(item);
                },
              },
            },
            {
              component: "button",
              key: null,
              header: "Activar",
              componentProps: {
                label: "",
                onClick: ({
                  item,
                }: {
                  item: User &
                    Role & { permissions_extra: number; active: boolean };
                }) => {
                  console.log(item);
                  setSelectedUser(item);
                },
              },
            },
          ]}
        />
      </div>
      {selectedUser && (
        <Modal
          title="Editar permisos del usuario"
          onClose={() => {
            setSelectedUser(null);
          }}
        >
          <PermisosByUser id={selectedUser.id} />
        </Modal>
      )}
    </>
  );
}

const PermisosByUser = ({ id }: { id: string }) => {
  const [permisos, setPermisos] = useState<Permission[]>([]);
  const [ediciones, setEdiciones] = useState(null);

  useEffect(() => {
    AuthService.getInstance()
      .getPermisos(id)
      .then((response) => setPermisos(response.data || []))
      .catch((error) => console.error(error.message));
  }, []);

  return (
    <div>
      <TableFromMia
        data={permisos}
        columns={[
          {
            component: "checkbox",
            header: "✅",
            key: "active",
            componentProps: {
              label: "",
              onChange: (value: boolean, item: Permission) => {
                console.log(value, item);
                setPermisos((prev) =>
                  prev.map((permiso) => {
                    if (permiso.id == item.id) {
                      return { ...permiso, active: value };
                    }
                    return permiso;
                  })
                );
              },
            },
          },
          { component: "text", header: "Nombre", key: "name" },
          { component: "text", key: "description", header: "Descripción" },
        ]}
      />
    </div>
  );
};
