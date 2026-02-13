"use client";

import React, { useState, useRef, useEffect } from "react";
import { calcularNoches } from "@/helpers/utils";
import { fetchHotelesFiltro_Avanzado } from "@/services/hoteles";
import { ComboBox } from "@/components/atom/Input";

// Tipos
interface CouponData {
  aerolinea: string;
  origen: string;
  destino: string;
  fecha_salida: string;
  horario_salida: string;
  fecha_llegada: string;
  horario_llegada: string;
  asiento: string;
  pasajero: string;
  vuelo: string;
  codigo_confirmacion_aerolinea: string;
  equipaje: string;
  noktos: number;
  tarifa: string;
  fecha_emision: string;
}

// Utilidades
function separarTexto(texto: string, maxLength: number): string[] {
  if (!texto) return [""];

  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let lineaActual = "";

  for (const palabra of palabras) {
    if ((lineaActual + palabra).length <= maxLength) {
      lineaActual += (lineaActual ? " " : "") + palabra;
    } else {
      if (lineaActual) {
        lineas.push(lineaActual);
      }
      lineaActual = palabra;
    }
  }

  if (lineaActual) {
    lineas.push(lineaActual);
  }

  return lineas.length ? lineas : [""];
}

function acomodarNumero(numero: number | string): string {
  const num = typeof numero === "string" ? parseFloat(numero) : numero;
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Componente de Canvas
const CouponCanvas: React.FC<{ data: CouponData }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    aerolinea,
    origen,
    destino,
    fecha_salida,
    horario_salida,
    fecha_llegada,
    horario_llegada,
    asiento,
    pasajero,
    vuelo,
    codigo_confirmacion_aerolinea,
    equipaje,
    noktos,
    tarifa,
    fecha_emision,
  } = data;

  // const direccionLineas = separarTexto(direccion, 80);
  // const precioPersona = acomodarNumero(precio);
  // const precioImpuestos = acomodarNumero(impuestos);
  // const nota = separarTexto(String(notas) + " " + String(desayuno), 40);

  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   // Función para dibujar rectángulos con texto
  //   function drawTextRect(
  //     x: number,
  //     y: number,
  //     width: number,
  //     height: number,
  //     text: string,
  //     textColor: string,
  //     bgColor: string,
  //   ) {
  //     ctx.fillStyle = bgColor;
  //     ctx.fillRect(x, y, width, height);

  //     ctx.fillStyle = textColor;
  //     ctx.font = "16px Calibri";
  //     ctx.textAlign = "center";
  //     ctx.fillText(text, x + width / 2, y + height / 2 + 5);
  //   }

  //   // Limpiar canvas
  //   ctx.fillStyle = "#FFFFFF";
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);

  //   const centro = canvas.width / 2;

  //   // Encabezado
  //   ctx.font = "bold 20px Calibri";
  //   ctx.textAlign = "center";
  //   ctx.fillStyle = "#002060";
  //   ctx.fillText("KONE México SA DE CV", centro + centro / 2, 40);
  //   ctx.fillText("Cotización - Host", centro + centro / 2, 60);

  //   // Información del hotel
  //   ctx.font = "20px Calibri";
  //   ctx.textAlign = "left";
  //   ctx.fillStyle = "#FF0000";
  //   ctx.fillText("Nota:", 15, 520);
  //   ctx.fillStyle = "#002060";
  //   ctx.fillText("HOTEL", 20, 130);
  //   ctx.fillText("Dirección", 20, 190);

  //   // Nombre del hotel
  //   ctx.fillStyle = "#002060";
  //   ctx.textAlign = "center";
  //   ctx.fillText(hotel, centro, 160);

  //   // Dirección
  //   ctx.font = "14px Calibri";
  //   for (let y = 0; y < direccionLineas.length; y++) {
  //     ctx.fillText(direccionLineas[y], centro, 220 + y * 25);
  //   }

  //   // Fechas
  //   ctx.font = "20px Calibri";
  //   ctx.fillStyle = "#002060";
  //   ctx.font = "bold 20px Calibri";
  //   ctx.fillText("Check in", centro / 2, 280);
  //   ctx.fillText("Check out", centro + centro / 2, 280);
  //   ctx.font = "20px Calibri";
  //   ctx.fillText(checkin, centro / 2, 310);
  //   ctx.fillText(checkout, centro + centro / 2, 310);
  //   ctx.fillText(`Total de noches: ${noches}`, centro, 350);

  //   // Precios
  //   ctx.textAlign = "right";
  //   ctx.fillText("Precio por noche por habitación", centro, 390);
  //   ctx.fillText("Precio por noche por habitación", centro, 450);

  //   ctx.textAlign = "right";
  //   ctx.fillStyle = "#002060";
  //   ctx.fillText("(sin impuestos)", centro, 410);
  //   ctx.fillText("(incluye impuestos)", centro, 470);

  //   ctx.textAlign = "left";
  //   ctx.font = "bold 20px Calibri";
  //   ctx.fillText("$ " + precioPersona + ` ${currency}`, centro + 20, 410);
  //   ctx.fillText("$ " + precioImpuestos + ` ${currency}`, centro + 20, 470);

  //   // Notas
  //   ctx.font = "20px Calibri";
  //   ctx.textAlign = "left";
  //   ctx.fillStyle = "#002060";
  //   for (let y = 0; y < nota.length; y++) {
  //     ctx.fillText(nota[y], 70, 520 + y * 25);
  //   }

  //   // Footer
  //   ctx.textAlign = "center";
  //   drawTextRect(0, 580, canvas.width, 85, "", "#002060", "#ffffff");

  //   ctx.font = "bold 20px Calibri";
  //   ctx.fillStyle = "#06304b";
  //   ctx.fillText(
  //     "Tarifa no reembolsable (No aplica cambio y/o cancelaciones)",
  //     centro,
  //     590,
  //   );
  //   ctx.fillText("Tarifa sujeto disponibilidad", centro, 615);

  //   // Firma
  //   ctx.textAlign = "left";
  //   ctx.fillStyle = "#002060";
  //   ctx.fillText("Quedo al pendiente del Vo.Bo.", 10, 640);
  //   ctx.fillText("Saludos,", 10, 660);
  //   ctx.fillText("Noktos", 10, 690);

  //   // Cargar imágenes
  //   const img = new Image();
  //   img.src =
  //     "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCCnXXDdUwbDQkIKpIgnllhb-febE-E2isQQ&s";
  //   img.onload = () => {
  //     ctx.drawImage(img, 20, 18, 80, 60);
  //   };

  //   const kone = new Image();
  //   kone.src = "https://cdn.worldvectorlogo.com/logos/kone-3.svg";
  //   kone.onload = () => {
  //     ctx.drawImage(kone, 150, 20, 110, 55);
  //   };
  // }, [
  //   data,
  //   currency,
  //   direccionLineas,
  //   precioPersona,
  //   precioImpuestos,
  //   nota,
  //   hotel,
  //   checkin,
  //   checkout,
  //   noches,
  //   noktos,
  // ]);

  return (
    <div className="flex flex-col border transform scale-75">
      <canvas
        ref={canvasRef}
        width={700}
        height={750}
        className="border  border-gray-300 shadow-lg w-full h-full rounded-lg"
      />
    </div>
  );
};

function App() {
  const [couponData, setCouponData] = useState<CouponData>({
    aerolinea: "VOLARIS",
    origen:
      "GDL Don Miguel Hidalgo y Costilla international Airport Guadalajara Jalisco MXN",
    destino:
      "SID Los Cabos International Airport San Jose del Cabo Baja California Sur MX",
    fecha_salida: "26/01/2026",
    horario_salida: "10:58 a.m.",
    fecha_llegada: "26/01/2026",
    horario_llegada: "10:58 a.m.",
    asiento: "6C",
    pasajero: "HECTOR RENE CONTRERAS HERNANDEZ",
    vuelo: "Y4 1144",
    codigo_confirmacion_aerolinea: "MCIEQC",
    equipaje: "1 articulo personal + 15 kg de mano documentado",
    noktos: 0,
    tarifa: "No reembolsable",
    fecha_emision: "yes",
  });

  // Si está autenticado, mostrar la aplicación principal
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-center items-center">
          <div className="">
            <div className="sticky top-8">
              <CouponCanvas data={couponData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
