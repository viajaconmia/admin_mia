import {
  Clock,
  CheckCircle2,
  HandCoins,
  CreditCard,
  CalendarClock,
  BedDouble,
  LogOut,
  Headset,
  User,
  ShieldCheck,
  CalendarPlus,
  AlertTriangle,
  DollarSign,
  Skull,
} from "lucide-react";

export const getEstatus = (estatus: string) => {
  let data = estatus;
  switch (data) {
    case "pending":
      data = "En proceso";
      break;
    case "complete":
      data = "Confirmada";
      break;
    case "canceled":
      data = "Cancelada";
      break;
    default:
      break;
  }
  return data;
};

export function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Texto copiado al portapapeles");
    })
    .catch((err) => {
      console.error("Error al copiar al portapapeles:", err);
    });
}

export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("T")[0].split("-");
  const date = new Date(+year, +month - 1, +day);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatRoom = (room: string) => {
  let response = room;
  if (response.toUpperCase() == "SINGLE") {
    response = "SENCILLO";
  } else if (response.toUpperCase() == "DOUBLE") {
    response = "DOBLE";
  }
  return response;
};

export function quitarAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function calcularNoches(
  checkIn: string | Date,
  checkOut: string | Date
): number {
  const entrada = new Date(checkIn);
  const salida = new Date(checkOut);

  // Aseguramos que la parte de la hora no afecte el cálculo
  entrada.setHours(0, 0, 0, 0);
  salida.setHours(0, 0, 0, 0);

  const diferenciaMs = salida.getTime() - entrada.getTime();
  const noches = diferenciaMs / (1000 * 60 * 60 * 24);

  return Math.max(0, noches); // Nunca devolver negativo
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
    case "En proceso":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          En proceso
        </span>
      );
    case "complete":
    case "Confirmada":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmado
        </span>
      );
    case "canceled":
    case "Cancelada":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Skull className="w-3 h-3 mr-1" />
          Cancelada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};
export const getPaymentBadge = (status: string) => {
  switch (status) {
    case "credito":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <CreditCard className="w-3 h-3 mr-1" />
          Credito
        </span>
      );
    case "contado":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <HandCoins className="w-3 h-3 mr-1" />
          Contado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};
export const getWhoCreateBadge = (status: string) => {
  switch (status) {
    case "Operaciones":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
          <Headset className="w-3 h-3 mr-1" />
          Operaciones
        </span>
      );
    case "Cliente":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <User className="w-3 h-3 mr-1" />
          Cliente
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export const getStageBadge = (status: string) => {
  switch (status) {
    case "Reservado":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <CalendarClock className="w-3 h-3 mr-1" />
          Reservado
        </span>
      );
    case "In house":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <BedDouble className="w-3 h-3 mr-1" />
          In house
        </span>
      );
    case "Check-out":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <LogOut className="w-3 h-3 mr-1" />
          Check out
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export const exportToCSV = (data, filename = "archivo.csv") => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.map((key) => key.replace(/_/g, " ").toUpperCase()).join(","),
    ...data.map((row) =>
      headers
        .map((field) => {
          const val = row[field];
          return `"${(val ?? "").toString().replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = window.URL.createObjectURL(blob); link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function formatNumberWithCommas(numberStr: string): string {
  // 1. Separar la parte entera de la parte decimal
  const parts = numberStr.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : undefined;

  // 2. Formatear la parte entera
  // Invertimos la parte entera para facilitar la inserción de comas cada tres dígitos desde la derecha
  const reversedInteger = integerPart.split("").reverse().join("");
  let formattedReversedInteger = "";

  for (let i = 0; i < reversedInteger.length; i++) {
    if (i > 0 && i % 3 === 0) {
      formattedReversedInteger += ",";
    }
    formattedReversedInteger += reversedInteger[i];
  }

  // Volvemos a invertir la parte entera formateada para obtener el orden correcto
  const formattedInteger = formattedReversedInteger
    .split("")
    .reverse()
    .join("");

  // 3. Unir la parte entera formateada con la parte decimal (si existe)
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  } else {
    return formattedInteger;
  }
}

export const getStatusCreditBadge = (status: boolean) => {
  if (status === null || status === undefined) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Sin datos
      </span>
    );
  }
  if (status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Con credito
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <HandCoins className="w-3 h-3 mr-1" />
        Sin credito
      </span>
    );
  }
};

export const getRoleBadge = (role: string) => {
  switch (role.toUpperCase()) {
    case "ADMINISTRADOR":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Administrador
        </span>
      );
    case "RESERVANTE":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <CalendarPlus className="w-3 h-3 mr-1" />
          Reservante
        </span>
      );
    case "VIAJERO":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
          <User className="w-3 h-3 mr-1" />
          Viajero
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {role}
        </span>
      );
  }
};

export const getCreditoBadge = (monto: number | null) => {
  if (!monto) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <AlertTriangle className="w-3 h-3 mr-1 text-gray-500" />
        Sin crédito
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
      <DollarSign className="w-3 h-3 mr-1 text-emerald-600" />
      {monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
    </span>
  );
};

// utils/fileUpload.ts
import { API_KEY, URL } from "@/lib/constants";

export interface UploadResponse {
  publicUrl: string;
  url: string;
}

/**
 * Solicita una URL firmada para subir archivos al bucket S3.
 * @param filename Nombre del archivo, puede incluir una carpeta, ej: `comprobantes/mi-archivo.xml`
 * @param filetype Tipo MIME, ej: application/pdf o image/jpeg
 * @param endpoint Endpoint a utilizar (por defecto es el general)
 */
export async function obtenerPresignedUrl(
  filename: string,
  filetype: string,
  folder: string,
  endpointBase = "/mia/utils/cargar-archivos"
): Promise<UploadResponse> {
  const url = `${URL}${endpointBase}/${folder}?filename=${filename}&filetype=${filetype}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener presigned URL: ${res.statusText}`);
  }

  return res.json();
}

export async function subirArchivoAS3(file: File, presignedUrl: string): Promise<void> {
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadRes.ok) {
    throw new Error("Error al subir archivo a S3");
  }
}