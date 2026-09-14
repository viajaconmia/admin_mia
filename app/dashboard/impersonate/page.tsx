"use client";

/**
 * Vista OCULTA de impersonación de usuarios internos.
 *
 * No está enlazada en ningún menú del dashboard (ver app/dashboard/layout.tsx):
 * se llega solo escribiendo la URL /dashboard/impersonate.
 *
 * "Oculta" != "sin candado":
 *  - hasAccess(PERMISOS.VISTAS.IMPERSONATE) protege la vista en el front.
 *  - El backend revalida sesión + permiso `view.impersonate` y audita cada uso.
 * No existe contraseña maestra.
 */

import { useEffect, useMemo, useState } from "react";
import { UserCog } from "lucide-react";
import { TextInput } from "@/components/atom/Input";
import Button from "@/components/atom/Button";
import { Loader } from "@/components/atom/Loader";
import { useAlert } from "@/context/useAlert";
import { usePermiso } from "@/hooks/usePermission";
import { PERMISOS } from "@/constant/permisos";
import { AuthService } from "@/services/AuthService";
import { Role, User } from "@/types/auth";

type UserRow = User & Role & { active: boolean };

export default function ImpersonatePage() {
  const { hasAccess } = usePermiso();
  const { showNotification } = useAlert();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Protege la vista: si no tiene el permiso, redirige a /unauthorized.
  hasAccess(PERMISOS.VISTAS.IMPERSONATE);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await AuthService.getInstance().getUsers();
      setUsers((data ?? []).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      showNotification("error", error.message || "Error al obtener usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  const handleImpersonate = async (user: UserRow) => {
    const ok = window.confirm(
      `¿Entrar como ${user.name} (${user.email})?\n\nQuedará registrado en la auditoría y podrás volver a tu cuenta desde el banner superior.`,
    );
    if (!ok) return;

    try {
      setImpersonatingId(user.id);
      await AuthService.getInstance().impersonate(user.id);
      // Recarga completa: re-ejecuta verifySession con la nueva cookie.
      window.location.href = "/dashboard";
    } catch (error) {
      showNotification("error", error.message || "No se pudo impersonar");
      setImpersonatingId(null);
    }
  };

  return (
    <div className="h-fit max-w-3xl mx-auto py-6">
      <div className="flex items-center gap-2 mb-1">
        <UserCog className="w-6 h-6 text-sky-950" />
        <h1 className="text-2xl font-bold tracking-tight text-sky-950">
          Impersonar usuario
        </h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Entra como otro usuario interno. Cada acceso queda auditado; vuelve a tu
        cuenta desde el banner superior.
      </p>

      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        <TextInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o correo..."
        />

        {loading ? (
          <Loader />
        ) : (
          <div className="divide-y border rounded-md overflow-hidden">
            {filtered.length === 0 && (
              <p className="p-4 text-sm text-gray-500">Sin resultados.</p>
            )}
            {filtered.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user.name}
                    {!user.active && (
                      <span className="ml-2 text-xs text-red-500">
                        (inactivo)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                <Button
                  size="sm"
                  icon={UserCog}
                  loading={impersonatingId === user.id}
                  disabled={!user.active || impersonatingId !== null}
                  onClick={() => handleImpersonate(user)}
                >
                  Entrar como
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
