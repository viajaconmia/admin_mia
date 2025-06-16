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
