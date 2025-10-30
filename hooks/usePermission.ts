"use client";
import { ROUTES } from "@/constant/routes";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useLocation } from "wouter";

export const usePermiso = () => {
  const { user } = useAuth();
  const router = useRouter();
  // const [_, setLocation] = useLocation();

  const hasPermission = (permiso: string) => {
    if (!user.permisos.includes(permiso))
      router.push(ROUTES.DASHBOARD.UNAUTHORIZED);
    // setLocation(ROUTES.DASHBOARD.UNAUTHORIZED);
  };

  return { hasPermission };
};
