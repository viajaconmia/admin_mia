import React from "react";

export const Pill = ({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "gray" | "green" | "yellow" | "red" | "blue";
}) => {
  const tones: Record<string, string> = {
    gray: "bg-gray-50 text-gray-700 border-gray-200 shadow-sm",
    green: "bg-green-50 text-green-700 border-green-200 shadow-sm",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm",
    red: "bg-red-50 text-red-700 border-red-200 shadow-sm",
    blue: "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-xs font-medium ${tones[tone] || tones.gray}`}
    >
      {text}
    </span>
  );
};

export const pagoTone3 = (estado: string | null) => {
  const v = (estado || "").toLowerCase();
  if (v === "pagado") return "green";
  if (v === "enviado_a_pago") return "blue";
  return "gray";
};

export const facturaTone = (estado: string) =>
  estado === "facturado"
    ? "green"
    : estado === "parcial"
      ? "yellow"
      : estado === "pendiente"
        ? "red"
        : "gray";

export const getFechaPagoColor = (dateStr?: string | Date | null | number) => {
  if (!dateStr || dateStr == 0.0) return "";
  const pagoDate = new Date(dateStr as any);
  if (isNaN(pagoDate.getTime())) return "";

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const pagoSinHora = new Date(
    pagoDate.getFullYear(),
    pagoDate.getMonth(),
    pagoDate.getDate(),
  );

  const diffMs = pagoSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "bg-red-100 text-red-800 border-red-300";
  if (diffDays <= 2) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
};

export const getSolicitudSemaforoRowClass = ({
  categoria,
  fechaSolicitud,
  pagado,
  consolidado,
}: {
  categoria: string;
  fechaSolicitud?: string | Date | null;
  pagado: boolean;
  consolidado: number;
}) => {
  if (Number(consolidado) === 1) return "bg-blue-100";
  if (pagado) return "";
  if (categoria !== "spei" && categoria !== "pago_tdc") return "";
  if (!fechaSolicitud) return "";

  const fecha = new Date(fechaSolicitud as any);
  if (isNaN(fecha.getTime())) return "";

  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fechaSinHora = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  );

  const diffMs = fechaSinHora.getTime() - hoySinHora.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "bg-red-200";
  if (diffDays <= 3) return "bg-yellow-200";
  return "bg-green-200";
};
