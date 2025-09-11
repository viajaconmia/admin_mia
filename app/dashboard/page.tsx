"use client";

import { WraperContainer } from "@/components/atom/WraperContainer";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      <h1>
        seguimos en proceso pero hola {user.name}, esta es tu pagina de inicio
      </h1>
    </>
  );
}

// const Man;
