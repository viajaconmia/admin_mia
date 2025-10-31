"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader } from "./atom/Loader";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Obtenemos tanto `isAuthenticated` como el crucial estado `loading`.
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

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
