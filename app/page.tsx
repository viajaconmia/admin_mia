"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/dashboard/solicitudes");
    } else {
      router.push("/auth/login");
    }
  }, [user, router]);

  return null;
}
