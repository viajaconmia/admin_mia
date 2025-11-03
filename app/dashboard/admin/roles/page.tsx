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
  const [selectedRole, setSelectedRole] = useState<Role>(null);
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
      setCreate(null);
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
                  setSelectedRole(item);
                },
              },
            },
          ]}
        />
      </div>
      {selectedRole && (
        <Modal
          title="Editar permisos del usuario"
          onClose={() => {
            setSelectedRole(null);
          }}
        >
          <PermisosByRole id={selectedRole.role_id} />
        </Modal>
      )}
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

const PermisosByRole = ({ id }: { id: number }) => {
  const [permisos, setPermisos] = useState<Permission[]>([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    AuthService.getInstance()
      .getPermisosByRole(id)
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
              onChange: async (value: boolean, item: Permission) => {
                console.log(value, item, id);
                try {
                  await AuthService.getInstance().updateRolePermission(
                    item.id,
                    id,
                    value
                  );
                  setPermisos((prev) =>
                    prev.map((permiso) => {
                      if (permiso.id == item.id) {
                        return { ...permiso, active: value };
                      }
                      return permiso;
                    })
                  );
                } catch (error) {
                  showNotification("error", error.message);
                }
              },
            },
          },
          { component: "text", header: "Nombre", key: "name" },
          { component: "text", key: "categoria", header: "Tipo" },
          { component: "text", key: "description", header: "Descripción" },
        ]}
      />
    </div>
  );
};
