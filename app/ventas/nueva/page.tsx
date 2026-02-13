"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileText, Lock, Eye, EyeOff, Hotel } from "lucide-react";
import { calcularNoches } from "@/helpers/utils";
import { fetchHotelesFiltro_Avanzado } from "@/services/hoteles";
import { FullHotelData } from "../../dashboard/hoteles/_components/hotel-table";
import { ComboBox } from "@/components/atom/Input";

// Tipos
interface CouponData {
  hotel: string;
  direccion: string;
  checkin: string;
  checkout: string;
  noches: number;
  habitaciones: number;
  noktosNoche: number;
  noktosTotal: number;
  desayuno: string;
  notas: string;
  precioNocheSinImpuestos: number;
  precioNocheConImpuestos: number;
  precioTotal: number;
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
// helper fecha dd/mm/aaaa
function fechaDMY(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

const CouponCanvas: React.FC<{ data: CouponData; currency: string }> = ({
  data,
  currency,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);

  const {
    hotel,
    direccion,
    checkin,
    checkout,
    noches,
    habitaciones,
    noktosNoche,
    noktosTotal,
    notas,
    precioNocheSinImpuestos,
    precioNocheConImpuestos,
    precioTotal,
  } = data;

  function wrap(txt: string, maxChars: number) {
    if (!txt) return [""];
    const out: string[] = [];
    let line = "";
    txt.split(" ").forEach((w) => {
      const t = line ? line + " " + w : w;
      if (t.length <= maxChars) line = t;
      else {
        if (line) out.push(line);
        line = w;
      }
    });
    if (line) out.push(line);
    return out;
  }

  const dirLines = wrap(direccion, 70);
  const notaLines = wrap(String(notas), 60);

  const f0 = acomodarNumero(precioNocheSinImpuestos);
  const f1 = acomodarNumero(precioNocheConImpuestos);
  const f2 = acomodarNumero(precioTotal);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // Lienzo fijo (no usar transform scale)
    const W = (c.width = 700);
    const H = (c.height = 900);

    // Guía: pares nombre-valor
    const M = 40; // margen
    const LBL_X = M; // columna de nombre
    const VAL_X = W - M; // columna de valor (alineado a la derecha)
    const azul = "#002060";

    const drawPair = (
      label: string,
      value: string,
      y: number,
      boldValue = false,
    ) => {
      ctx.textAlign = "left";
      ctx.fillStyle = azul;
      ctx.font = "bold 18px Calibri";
      ctx.fillText(label, LBL_X, y);
      ctx.textAlign = "right";
      ctx.fillStyle = "#111827";
      ctx.font = (boldValue ? "bold " : "") + "18px Calibri";
      ctx.fillText(value, VAL_X, y);
    };

    // limpiar
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    // encabezado
    ctx.textAlign = "center";
    ctx.fillStyle = azul;
    ctx.font = "bold 22px Calibri";
    ctx.fillText("CENTRO DE TECNOLOGIA DEL SURESTE", W / 2, 50);
    ctx.font = "bold 18px Calibri";
    ctx.fillText("Cotización - Host", W / 2, 80);

    // logos (coloca tus URLs reales)
    const logo1 = new Image();
    const logo2 = new Image();
    logo1.src = "https://luiscastaneda-tos.github.io/log/files/cts.jpg";
    logo1.onload = () => ctx.drawImage(logo1, 10, 20, 130, 90);
    logo2.onload = () => ctx.drawImage(logo2, 110, 42, 34, 34);

    // Hotel
    let y = 130;
    ctx.textAlign = "left";
    ctx.fillStyle = azul;
    ctx.font = "bold 20px Calibri";
    ctx.fillText("Hotel", LBL_X, y);

    y += 28;
    ctx.font = "bold 18px Calibri";
    ctx.fillText(hotel, LBL_X, y);

    // Dirección
    y += 35;
    ctx.font = "bold 20px Calibri";
    ctx.fillText("Dirección", LBL_X, y);

    y += 30;
    ctx.font = "16px Calibri";
    ctx.fillStyle = "#111827";
    dirLines.forEach((ln, i) => ctx.fillText(ln, LBL_X, y + i * 22));
    y += dirLines.length * 22 + 6;

    // Bloque doble: Check in (izquierda) / Check out (derecha)
    ctx.fillStyle = azul;
    ctx.textAlign = "left";
    ctx.font = "bold 18px Calibri";
    ctx.fillText("Check in", LBL_X, y);
    ctx.textAlign = "right";
    ctx.fillText("Check out", VAL_X, y);

    ctx.textAlign = "left";
    ctx.fillStyle = "#111827";
    ctx.font = "18px Calibri";
    ctx.fillText(fechaDMY(checkin), LBL_X, y + 24);
    ctx.textAlign = "right";
    ctx.fillText(fechaDMY(checkout), VAL_X, y + 24);

    y += 52;

    // De aquí en adelante: NOMBRE IZQ / VALOR DER
    drawPair("Total de Noches", String(noches || 0), y);
    y += 28;

    drawPair("Numero de Habitaciones", String(habitaciones || 0), y);
    y += 36;

    // Precios
    drawPair(
      "Precio por noche por habitación (sin  impuestos)",
      `$ ${f0} ${currency}`,
      y,
    );
    y += 28;

    drawPair(
      "Precio por noche por habitación (incluye impuestos)",
      `$ ${f1} ${currency}`,
      y,
    );
    y += 28;

    drawPair(
      "Precio por toda la estancia (incluye impuestos)",
      `$ ${f2} ${currency}`,
      y,
      true,
    );
    y += 36;

    // NOKTOS
    drawPair("NOKTOS  POR  NOCHE", String(noktosNoche || 0), y);
    y += 28;
    drawPair("NOKTOS  POR  TODA  LA  ESTANCIA", String(noktosTotal || 0), y);
    y += 36;

    // Nota
    ctx.textAlign = "left";
    ctx.fillStyle = "#FF0000";
    ctx.font = "bold 18px Calibri";
    ctx.fillText("Nota:", LBL_X, y);
    ctx.fillStyle = "#111827";
    ctx.font = "16px Calibri";
    notaLines.forEach((ln, i) => ctx.fillText(ln, LBL_X + 55, y + i * 22));
    y += notaLines.length * 22 + 28;

    // Footer
    const fy = Math.max(y, H - 80);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FF0000";
    ctx.font = "bold 16px Calibri";
    ctx.fillText(
      "Tarifa No Reembolsable (no hay cambios, ni cancelaciones)",
      W / 2,
      fy,
    );
    ctx.fillText("Tarifa sujeta a disponibilidad", W / 2, fy + 24);
  }, [
    hotel,
    direccion,
    checkin,
    checkout,
    noches,
    habitaciones,
    noktosNoche,
    noktosTotal,
    notas,
    precioNocheSinImpuestos,
    precioNocheConImpuestos,
    precioTotal,
    currency,
  ]);

  return (
    <div className="flex flex-col border">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{hotel}</h2>
      <canvas
        ref={ref}
        width={700}
        height={900}
        className="border border-gray-300 shadow-lg w-[700px] h-[900px] rounded-lg bg-white"
      />
    </div>
  );
};

// Componente de Formulario
const CouponForm: React.FC<{
  data: CouponData;
  currency: string;
  onDataChange: (data: CouponData) => void;
  onCurrencyChange: (currency: string) => void;
  onReset: () => void;
}> = ({ data, currency, onDataChange, onCurrencyChange, onReset }) => {
  const [hoteles, setHoteles] = useState<FullHotelData[]>([]);
  const [hotelSelected, setHotelSelected] = useState<string>("");

  const handleInputChange = (
    field: keyof CouponData,
    value: string | number,
  ) => {
    onDataChange({
      ...data,
      [field]: value,
    });
  };

  useEffect(() => {
    fetchHotelesFiltro_Avanzado({}, (data) => {
      setHoteles(data);
    });
  }, []);

  const currencies = ["MXN", "USD", "EUR"];

  // Calcular precios cuando cambian noches, habitaciones o noktos
  useEffect(() => {
    if (data.noktosNoche && data.habitaciones && data.noches) {
      const noktosTotal = data.noktosNoche * data.habitaciones * data.noches;
      const precioNocheSinImpuestos = data.noktosNoche * 145;
      const precioNocheConImpuestos = data.noktosNoche * 168.2;
      const precioTotal =
        precioNocheConImpuestos * data.habitaciones * data.noches;

      onDataChange({
        ...data,
        noktosTotal,
        precioNocheSinImpuestos,
        precioNocheConImpuestos,
        precioTotal,
      });
    }
  }, [data.noktosNoche, data.habitaciones, data.noches]);

  // Calcular noches cuando cambian las fechas
  useEffect(() => {
    if (data.checkin && data.checkout) {
      handleInputChange(
        "noches",
        calcularNoches(data.checkin, data.checkout) || 0,
      );
    }
  }, [data.checkin, data.checkout]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Información del Cupón
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <ComboBox
              value={
                hoteles
                  .filter((hotel) => hotel.id_hotel == hotelSelected)
                  .map((hotel) => ({
                    name: hotel.nombre,
                    content: hotel as FullHotelData,
                  }))[0]
              }
              onChange={(value) => {
                setHotelSelected(value.content.id_hotel);
                onDataChange({
                  ...data,
                  direccion: value.content.direccion,
                  hotel: value.content.nombre,
                  desayuno: value.content.DesayunoIncluido,
                });
              }}
              options={hoteles.map((hotel) => ({
                name: hotel.nombre,
                content: hotel,
              }))}
            ></ComboBox>
          </div>

          {/* Hotel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hotel
            </label>
            <input
              type="text"
              value={data.hotel}
              onChange={(e) => handleInputChange("hotel", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del hotel"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={data.direccion}
              onChange={(e) => handleInputChange("direccion", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Direccion del hotel"
            />
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check in
            </label>
            <input
              type="date"
              value={data.checkin}
              onChange={(e) => handleInputChange("checkin", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check out
            </label>
            <input
              type="date"
              value={data.checkout}
              onChange={(e) => handleInputChange("checkout", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Noches y Habitaciones */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de habitaciones
            </label>
            <input
              type="number"
              value={data.habitaciones}
              onChange={(e) =>
                handleInputChange("habitaciones", parseInt(e.target.value) || 1)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Noktos por noche por habitación
            </label>
            <input
              type="number"
              step="0.01"
              value={data.noktosNoche}
              onChange={(e) => {
                handleInputChange(
                  "noktosNoche",
                  parseFloat(e.target.value) || 0,
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <input
            type="text"
            value={data.notas}
            onChange={(e) => handleInputChange("notas", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notas adicionales (ej: Tarifa Hab Doble)"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <button
          className="border border-gray-900 p-2 rounded-md bg-gray-300 hover:bg-gray-400"
          onClick={onReset}
        >
          Reiniciar formulario
        </button>
      </div>
    </div>
  );
};

// Componente Principal
function App() {
  const [couponData, setCouponData] = useState<CouponData>({
    hotel: "",
    direccion: "",
    checkin: "",
    checkout: "",
    noches: 0,
    habitaciones: 0,
    noktosNoche: 0,
    noktosTotal: 0,
    desayuno: "",
    notas: "",
    precioNocheSinImpuestos: 0,
    precioNocheConImpuestos: 0,
    precioTotal: 0,
  });

  const [currency, setCurrency] = useState<string>("MXN");

  const handleDataChange = (newData: CouponData) => {
    setCouponData(newData);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const handleReset = () => {
    setCouponData({
      hotel: "",
      direccion: "",
      checkin: "",
      checkout: "",
      noches: 0,
      habitaciones: 1,
      noktosNoche: 0,
      noktosTotal: 0,
      desayuno: "",
      notas: "",
      precioNocheSinImpuestos: 0,
      precioNocheConImpuestos: 0,
      precioTotal: 0,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="order-2 lg:order-1">
            <CouponForm
              data={couponData}
              currency={currency}
              onDataChange={handleDataChange}
              onCurrencyChange={handleCurrencyChange}
              onReset={handleReset}
            />
          </div>

          <div className="order-1 lg:order-2">
            <div className="sticky top-8">
              <CouponCanvas data={couponData} currency={currency} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
