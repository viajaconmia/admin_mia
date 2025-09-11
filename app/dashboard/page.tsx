"use client";

import { WraperContainer } from "@/components/atom/WraperContainer";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  return <WraperContainer></WraperContainer>;
}

// const Man;
