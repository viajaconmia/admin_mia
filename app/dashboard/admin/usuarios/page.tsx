"use client";
import Button from "@/components/atom/Button";
import { ComboBox, ComboBoxOption, TextInput } from "@/components/atom/Input";
import Modal from "@/components/organism/Modal";
import { TableFromMia } from "@/components/organism/TableFromMia";
import { useNotification } from "@/context/useNotificacion";
import { AuthService } from "@/services/AuthService";
import { Permission, Role, User } from "@/types/auth";
import { CheckCircle2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type UserWithPermission = User &
  Role & { permissions_extra: number; active: boolean };

export default function AdministracionUsuarios() {
  const [users, setUsers] = useState<UserWithPermission[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithPermission | null>(
    null
  );
  const [create, setCreate] = useState<boolean>(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { showNotification } = useNotification();

  const handleOpenAddUser = () => {
    setCreate(!create);
  };

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

  const handleAddUser = async (user) => {
    try {
      await AuthService.getInstance().signUp(user);
      fetchUsers();
      handleAddUser();
    } catch (error) {
      showNotification("error", error.message || "Error al crear user");
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await AuthService.getInstance().getRoles();
      setRoles(data);
    } catch (error) {
      showNotification(
        "error",
        error.message || "Error al obtener a los usuarios"
      );
      setRoles([]);
    }
  };

  const handleActiveUser = async (value: boolean, item: UserWithPermission) => {
    try {
      await AuthService.getInstance().updateActiveUser(item.id, value);

      setUsers((prev) =>
        [...prev].map((user) =>
          user.id == item.id ? { ...user, active: value } : user
        )
      );
    } catch (error) {
      showNotification("error", error.message || "Error al actualizar usuario");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);
  useEffect(() => {
    console.log(users);
  }, [users]);

  return (
    <>
      <div className="pt-4 space-y-2 bg-gray-50 rounded-b-xl">
        <div className="px-2 flex justify-end">
          <Button onClick={handleOpenAddUser} icon={Plus} size="sm">
            Agregar usuario
          </Button>
        </div>
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
            {
              component: "button",
              key: null,
              header: "Permiso",
              componentProps: {
                label: "administrar permisos",
                onClick: ({ item }: { item: UserWithPermission }) => {
                  setSelectedUser(item);
                },
              },
            },
            {
              component: "checkbox",
              key: "active",
              header: "Activar",
              componentProps: {
                label: "",
                onChange: handleActiveUser,
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
      {create && (
        <Modal title="Crear usuario" onClose={handleOpenAddUser}>
          <AddUser roles={roles} onSubmit={handleAddUser} />
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

const AddUser = ({
  roles,
  onSubmit,
}: {
  roles: Role[];
  onSubmit: (user: {
    username: string;
    email: string;
    password: string;
    role: Role;
  }) => void;
}) => {
  const [user, setUser] = useState({
    username: "",
    password: "",
    email: "",
    role: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(user);
  };
  return (
    <form className="p-2 space-y-2 w-[90vw] max-w-lg" onSubmit={handleSubmit}>
      <ComboBox
        label="Rol"
        value={
          user.role
            ? { name: user.role.role_name, content: user.role }
            : {
                name: "",
                content: null,
              }
        }
        onChange={(value: ComboBoxOption | null) =>
          setUser((prev) => ({
            ...prev,
            role: value ? (value.content as Role) : null,
          }))
        }
        options={
          roles.map((rol) => ({
            name: rol.role_name,
            content: rol,
          })) as unknown as ComboBoxOption[]
        }
      />
      <TextInput
        value={user.username}
        onChange={(value) => setUser((prev) => ({ ...prev, username: value }))}
        label="Nombre"
      />
      <TextInput
        value={user.email}
        onChange={(value) => setUser((prev) => ({ ...prev, email: value }))}
        label="Email"
      />
      <TextInput
        value={user.password}
        onChange={(value) => setUser((prev) => ({ ...prev, password: value }))}
        label="Contraseña"
      />
      <Button icon={CheckCircle2} type="submit" className="w-full">
        Crear usuario
      </Button>
    </form>
  );
};
