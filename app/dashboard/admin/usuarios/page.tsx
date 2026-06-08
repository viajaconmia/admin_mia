"use client";
import Button from "@/components/atom/Button";
import {
  ComboBox,
  ComboBox2,
  ComboBoxOption,
  ComboBoxOption2,
  TextInput,
} from "@/components/atom/Input";
import Modal from "@/components/organism/Modal";
import { TableFromMia } from "@/components/organism/TableFromMia";
import { useAlert } from "@/context/useAlert";
import { AuthService } from "@/services/AuthService";
import { Permission, Role, User } from "@/types/auth";
import { CheckCircle2, KeyRound, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type UserWithPermission = User &
  Role & { permissions_extra: number; active: boolean };

export default function AdministracionUsuarios() {
  const [users, setUsers] = useState<UserWithPermission[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithPermission | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserWithPermission | null>(null);
  const [search, setSearch] = useState<string>("");
  const [create, setCreate] = useState<boolean>(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { showNotification } = useAlert();

  const handleOpenAddUser = () => {
    setCreate(!create);
  };

  const fetchUsers = async () => {
    try {
      const { data } = await AuthService.getInstance().getUsers();
      setUsers(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      showNotification(
        "error",
        error.message || "Error al obtener a los usuarios",
      );
      setUsers([]);
    }
  };

  const handleAddUser = async (user) => {
    try {
      await AuthService.getInstance().signUp(user);
      await fetchUsers();
      setCreate(null);
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
        error.message || "Error al obtener a los usuarios",
      );
      setRoles([]);
    }
  };

  const handleActiveUser = async (value: boolean, item: UserWithPermission) => {
    try {
      await AuthService.getInstance().updateActiveUser(item.id, value);

      setUsers((prev) =>
        [...prev].map((user) =>
          user.id == item.id ? { ...user, active: value } : user,
        ),
      );
    } catch (error) {
      showNotification("error", error.message || "Error al actualizar usuario");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  return (
    <>
      <div className="pt-4 space-y-2 bg-gray-50 rounded-b-xl">
        <div className="p-2">
          <TextInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar usuario..."
          />
        </div>
        <div className="px-2 flex justify-end">
          <Button onClick={handleOpenAddUser} icon={Plus} size="sm">
            Agregar usuario
          </Button>
        </div>
        <TableFromMia
          data={users.filter(
            (user) =>
              user.name.toLowerCase().includes(search.toLowerCase()) ||
              user.email.toLowerCase().includes(search.toLowerCase()),
          )}
          columns={[
            { component: "profile_image", key: "name", header: "" },
            // { component: "copiar_and_button", key: "id", header: "" },
            {
              component: "titles",
              key: "name",
              header: "Usuario",
              componentProps: { subtitle: "email" },
            },
            // { component: "text", key: "role_name", header: "Role" },
            {
              component: "custom",
              key: "role_name",
              header: "Role",
              componentProps: {
                component: ({ item }) => (
                  <ComboBox2
                    value={{
                      name: item.role_name,
                      content: null,
                    }}
                    options={roles.map((rol) => ({
                      name: rol.role_name,
                      content: rol,
                    }))}
                    onChange={async (value) => {
                      try {
                        console.log("WEARE");
                        await AuthService.getInstance().updateUserRole(
                          value.content.role_id,
                          item.id,
                        );
                        setUsers((prev) => [
                          ...prev.map((user) =>
                            user.id == item.id
                              ? {
                                  ...user,
                                  role_id: value.content.role_id,
                                  role_name: value.content.role_name,
                                }
                              : user,
                          ),
                        ]);
                      } catch (error) {}
                    }}
                  ></ComboBox2>
                ),
              },
            },
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
              component: "button",
              key: null,
              header: "Contraseña",
              componentProps: {
                label: "cambiar contraseña",
                onClick: ({ item }: { item: UserWithPermission }) => {
                  setPasswordUser(item);
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
      {passwordUser && (
        <Modal
          title={`Cambiar contraseña — ${passwordUser.name}`}
          subtitle="La sesión del usuario no se cierra tras el cambio"
          onClose={() => setPasswordUser(null)}
        >
          <ResetPasswordForm
            user={passwordUser}
            onSuccess={() => setPasswordUser(null)}
          />
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
  const [permisos, setPermisos] = useState<
    (Permission & { origen?: "roles" | "individual" })[]
  >([]);
  const { showNotification } = useAlert();

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
              onChange: async (
                value: boolean,
                item: Permission & { origen: "roles" | "individual" },
              ) => {
                console.log(value, item, id);
                try {
                  await AuthService.getInstance().updateUserPermission(
                    item.id,
                    id,
                    value,
                  );
                  setPermisos((prev) =>
                    prev.map((permiso) => {
                      if (permiso.id == item.id) {
                        return { ...permiso, active: value };
                      }
                      return permiso;
                    }),
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
          { component: "text", key: "origen", header: "Origen" },
        ]}
      />
    </div>
  );
};

const ResetPasswordForm = ({
  user,
  onSuccess,
}: {
  user: UserWithPermission;
  onSuccess: () => void;
}) => {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nueva !== confirmar) {
      showNotification("error", "Las contraseñas no coinciden");
      return;
    }
    if (nueva.length < 6) {
      showNotification("error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    console.log("resetPassword user object:", user);
    try {
      await AuthService.getInstance().resetPassword(user.id, nueva);
      showNotification("success", "Contraseña actualizada con éxito");
      onSuccess();
    } catch (error) {
      showNotification("error", error.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-2 space-y-3 w-[90vw] max-w-sm" onSubmit={handleSubmit}>
      <TextInput
        label="Nueva contraseña"
        value={nueva}
        onChange={setNueva}
        placeholder="Mínimo 6 caracteres"
      />
      <TextInput
        label="Confirmar contraseña"
        value={confirmar}
        onChange={setConfirmar}
        placeholder="Repite la contraseña"
      />
      <Button
        icon={loading ? undefined : KeyRound}
        loading={loading}
        type="submit"
        className="w-full"
        disabled={!nueva || !confirmar}
      >
        Actualizar contraseña
      </Button>
    </form>
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
      <ComboBox2
        label="Rol"
        value={
          user.role
            ? { name: user.role.role_name, content: user.role }
            : {
                name: "",
                content: null,
              }
        }
        onChange={(value) =>
          setUser((prev) => ({
            ...prev,
            role: value ? (value.content as Role) : null,
          }))
        }
        options={roles.map((rol) => ({
          name: rol.role_name,
          content: rol,
        }))}
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
