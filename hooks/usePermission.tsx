"use client";
import { ROUTES } from "@/constant/routes";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export const usePermiso = () => {
  const { user } = useAuth();
  const router = useRouter();

  const hasPermission = (permiso: string) => user.permisos.includes(permiso);

  const hasAccess = (permiso: string) => {
    if (!hasPermission(permiso)) router.push(ROUTES.DASHBOARD.UNAUTHORIZED);
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

  return { hasAccess, Can };
};
