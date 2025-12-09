"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Loader } from "./atom/Loader";
import { useParams } from "wouter";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Obtenemos tanto `isAuthenticated` como el crucial estado `loading`.
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const path = usePathname();

  if (path.includes("/secure-payment")) {
    return <>{children}</>;
  }
  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
  }

  if (!user) {
    router.push("/login");
  }

  return <>{children}</>;
}
