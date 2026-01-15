import { obtenerPresignedUrl, subirArchivoAS3 } from "@/helpers/utils";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currentDate() {
  const [dia, mes, año] = new Date()
    .toLocaleDateString("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/");
  return `${año}-${mes}-${dia}`;
}

export const verificar = (key: string, current: any, before: any) => {
  if (typeof current !== typeof before) return { [key]: { current, before } };
  if (
    typeof current === "object" &&
    !Array.isArray(current) &&
    current !== null
  ) {
    let data = {};
    let cambio = false;
    Object.entries(current).forEach(([key2, value2]) => {
      let propiedades = verificar(key2, value2, before[key2]);
      if (propiedades) cambio = true;
      data = { ...data, ...propiedades };
    });
    return cambio ? { [key]: { current: data, before } } : undefined;
  }
  if (Array.isArray(current)) {
    let isCambio = current.map((current, index) =>
      verificar(String(index), current, before[index])
    );
    isCambio = isCambio.some((item) => !!item);
    return isCambio ? { [key]: { current, before } } : undefined;
  }
  if (current !== before) return { [key]: { current, before } };
  return undefined;
};

export function updateRoom(room: string) {
  let updated;
  if (room) {
    updated = room;
  } else {
    updated = "";
  }
  if (updated.toUpperCase() == "SINGLE") {
    updated = "SENCILLO";
  }
  if (updated.toUpperCase() == "DOUBLE") {
    updated = "DOBLE";
  }
  return updated;
}

export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  } catch (error) {
    console.error("Error al descargar archivo:", error);
  }
};
export const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};
export const getTodayDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // corrige zona horaria
  return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
};

export const getDatePlusFiveYears = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 5);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
// Función para subir archivo a S3
export const subirArchivoAS3Seguro = async (
  file: File,
  bucket: string = "comprobantes"
) => {
  try {
    const { url: presignedUrl, publicUrl } = await obtenerPresignedUrl(
      file.name,
      file.type,
      bucket
    );

    await subirArchivoAS3(file, presignedUrl);

    return publicUrl;
  } catch (error) {
    console.error(`❌ Error al subir ${file.name} a S3:`, error);
    throw new Error(`Error al subir ${file.name} a S3: ${error.message}`);
  }
};
export const separarByEspacios = (str: string, n: number) => {
  let result = [];
  for (let i = 0; i < str.length; i += n) {
    result.push(str.replaceAll(" ", "").slice(i, i + n));
  }
  return result.join(" ").trim();
};
