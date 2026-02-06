"use client";
import { ROUTES } from "@/constant/routes";
import { useAuth } from "@/context/AuthContext";
import { environment } from "@/lib/constants";
import { useRouter } from "next/navigation";

export const usePermiso = () => {
  const { user } = useAuth();
  const router = useRouter();

  const isDev = process.env.NODE_ENV !== "production";

  const hasPermission = (permiso: string) =>
    (user?.permisos?.includes?.(permiso) ?? false) || (isDev && !!environment);

  const hasAccess = (permiso: string) => {
    const ok = hasPermission(permiso);
    if (!ok) router.push(ROUTES.DASHBOARD.UNAUTHORIZED);
    return ok; // <- no rompe usos actuales; solo agrega retorno útil
  };

  const Can = ({
    children,
    permiso,
  }: {
    permiso: string;
    children: React.ReactNode;
  }) => {
    if (!hasPermission(permiso)) return null;
    return <>{children}</>;
  };

  return { hasAccess, Can, hasPermission };
};
