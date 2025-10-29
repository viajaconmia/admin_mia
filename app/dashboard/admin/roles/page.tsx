"use client";

import Button from "@/components/atom/Button";
import { TextInput } from "@/components/atom/Input";
import Modal from "@/components/organism/Modal";
import { TableFromMia } from "@/components/organism/TableFromMia";
import { useNotification } from "@/context/useNotificacion";
import { AuthService } from "@/services/AuthService";
import { Permission, Role, User } from "@/types/auth";
import { CheckCircle2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdministracionUsuarios() {
  const [roles, setRoles] = useState([]);
  const [create, setCreate] = useState<boolean>(false);
  const { showNotification } = useNotification();

  const fetchRoles = async () => {
    try {
      const { data } = await AuthService.getInstance().getRoles();
      console.log(data);
      setRoles(data);
    } catch (error) {
      showNotification(
        "error",
        error.message || "Error al obtener a los usuarios"
      );
      setRoles([]);
    }
  };

  const handleOpenAddRole = () => {
    setCreate(!create);
  };

  const handleAddRole = async (role: string) => {
    try {
      await AuthService.getInstance().crearRole(role);
      fetchRoles();
    } catch (error) {
      showNotification(
        "error",
        error.message || "Error al obtener a los usuarios"
      );
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <>
      <div className="pt-4 space-y-2 bg-gray-50 rounded-b-xl">
        <div className="px-2 flex justify-end">
          <Button onClick={handleOpenAddRole} icon={Plus} size="sm">
            Agregar nuevo rol
          </Button>
        </div>
        <TableFromMia<Role>
          data={roles}
          columns={[
            {
              component: "text",
              key: "role_id",
              header: "ID",
            },
            {
              component: "titles",
              key: "role_name",
              header: "Role",
            },
            {
              component: "button",
              key: null,
              header: "Permisos",
              componentProps: {
                label: "administrar permisos",
                onClick: ({
                  item,
                }: {
                  item: User &
                    Role & { permissions_extra: number; active: boolean };
                }) => {
                  //setSelectedUser(item);
                },
              },
            },
          ]}
        />
      </div>
      {/* {selectedUser && (
        <Modal
          title="Editar permisos del usuario"
          onClose={() => {
            setSelectedUser(null);
          }}
        >
          <PermisosByUser id={selectedUser.id} />
        </Modal>
      )} */}
      {create && (
        <Modal title="Crea un nuevo rol" onClose={handleOpenAddRole}>
          <AddRole onSubmit={handleAddRole} />
        </Modal>
      )}
    </>
  );
}

const AddRole = ({ onSubmit }: { onSubmit: (role: string) => void }) => {
  const [role, setRole] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(role);
  };
  return (
    <form className="p-2 space-y-2 w-[90vw] max-w-lg" onSubmit={handleSubmit}>
      <TextInput
        value={role}
        onChange={(value) => setRole(value)}
        label="Nombre del rol"
      />
      <Button icon={CheckCircle2} type="submit" className="w-full">
        Crear Rol
      </Button>
    </form>
  );
};

const PermisosByUser = ({ id }: { id: string }) => {
  const [permisos, setPermisos] = useState<Permission[]>([]);

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
