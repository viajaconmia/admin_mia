"use client";

import { useParams } from "next/navigation";
import { CotizacionIaDetalle } from "@/angel/components/organisms/CotizacionIaDetalle";

export default function CotizacionIaDetallePage() {
  const { id } = useParams<{ id: string }>();

  return <CotizacionIaDetalle id={id} />;
}
