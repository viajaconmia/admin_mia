"use client";

import React, {
  useState,
  useRef,
  useEffect,
  SelectHTMLAttributes,
} from "react";
import { FileText, Lock, Eye, EyeOff } from "lucide-react";
import { calcularNoches } from "@/helpers/utils";
import { fetchHotelesFiltro_Avanzado } from "@/services/hoteles";
import { FullHotelData } from "../dashboard/hoteles/_components/hotel-table";
import { ComboBox } from "@/components/atom/Input";

// Tipos
interface CouponData {
  hotel: string;
  direccion: string;
  checkin: string;
  checkout: string;
  noches: number;
  noktos: number;
  desayuno: string;
  notas: string;
  precio: number;
  impuestos: number;
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
const CouponCanvas: React.FC<{ data: CouponData; currency: string }> = ({
  data,
  currency,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    hotel,
    checkin,
    checkout,
    noches,
    noktos,
    desayuno,
    notas,
    precio,
    impuestos,
    direccion,
  } = data;

  const direccionLineas = separarTexto(direccion, 80);
  const precioPersona = acomodarNumero(precio);
  const precioImpuestos = acomodarNumero(impuestos);
  const nota = separarTexto(String(notas) + " " + String(desayuno), 40);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Función para dibujar rectángulos con texto
    function drawTextRect(
      x: number,
      y: number,
      width: number,
      height: number,
      text: string,
      textColor: string,
      bgColor: string
    ) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = textColor;
      ctx.font = "16px Calibri";
      ctx.textAlign = "center";
      ctx.fillText(text, x + width / 2, y + height / 2 + 5);
    }

    // Limpiar canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centro = canvas.width / 2;

    // Encabezado
    ctx.font = "bold 20px Calibri";
    ctx.textAlign = "center";
    ctx.fillStyle = "#002060";
    ctx.fillText("KONE México SA DE CV", centro + centro / 2, 40);
    ctx.fillText("Cotización - Host", centro + centro / 2, 60);

    // Información del hotel
    ctx.font = "20px Calibri";
    ctx.textAlign = "left";
    ctx.fillStyle = "#FF0000";
    ctx.fillText("Nota:", 20, 570);
    ctx.fillStyle = "#002060";
    ctx.fillText("HOTEL", 20, 130);
    ctx.fillText("Dirección", 20, 190);

    // Nombre del hotel
    ctx.fillStyle = "#002060";
    ctx.textAlign = "center";
    ctx.fillText(hotel, centro, 160);

    // Dirección
    ctx.font = "14px Calibri";
    for (let y = 0; y < direccionLineas.length; y++) {
      ctx.fillText(direccionLineas[y], centro, 220 + y * 25);
    }

    // Fechas
    ctx.font = "20px Calibri";
    ctx.fillStyle = "#002060";
    ctx.font = "bold 20px Calibri";
    ctx.fillText("Check in", centro / 2, 280);
    ctx.fillText("Check out", centro + centro / 2, 280);
    ctx.font = "20px Calibri";
    ctx.fillText(checkin, centro / 2, 310);
    ctx.fillText(checkout, centro + centro / 2, 310);
    ctx.fillText(`Total de noches: ${noches}`, centro, 350);

    // Precios
    ctx.textAlign = "right";
    ctx.fillText("Precio por noche por habitación", centro, 390);
    ctx.fillText("Precio por noche por habitación", centro, 450);
    ctx.textAlign = "center";
    ctx.fillText(`Noktos por noche: ${noktos}`, centro, 510);

    ctx.textAlign = "right";
    ctx.fillStyle = "#002060";
    ctx.fillText("(sin impuestos)", centro, 410);
    ctx.fillText("(incluye impuestos)", centro, 470);

    ctx.textAlign = "left";
    ctx.font = "bold 20px Calibri";
    ctx.fillText("$ " + precioPersona + ` ${currency}`, centro + 20, 410);
    ctx.fillText("$ " + precioImpuestos + ` ${currency}`, centro + 20, 470);

    // Notas
    ctx.font = "20px Calibri";
    ctx.textAlign = "left";
    ctx.fillStyle = "#002060";
    for (let y = 0; y < nota.length; y++) {
      ctx.fillText(nota[y], 70, 570 + y * 25);
    }

    // Footer
    ctx.textAlign = "center";
    drawTextRect(0, 580, canvas.width, 85, "", "#002060", "#ffffff");

    ctx.font = "bold 20px Calibri";
    ctx.fillStyle = "#06304b";
    ctx.fillText(
      "Tarifa no reembolsable (No aplica cambio y/o cancelaciones)",
      centro,
      615
    );
    ctx.fillText("Tarifa sujeto disponibilidad", centro, 645);

    // Firma
    ctx.textAlign = "left";
    ctx.fillStyle = "#002060";
    ctx.fillText("Quedo al pendiente del Vo.Bo.", 10, 690);
    ctx.fillText("Saludos,", 10, 720);
    ctx.fillText("Noktos", 10, 750);

    // Cargar imágenes
    const img = new Image();
    img.src =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCCnXXDdUwbDQkIKpIgnllhb-febE-E2isQQ&s";
    img.onload = () => {
      ctx.drawImage(img, 20, 18, 80, 60);
    };

    const kone = new Image();
    kone.src = "https://cdn.worldvectorlogo.com/logos/kone-3.svg";
    kone.onload = () => {
      ctx.drawImage(kone, 150, 20, 110, 55);
    };
  }, [
    data,
    currency,
    direccionLineas,
    precioPersona,
    precioImpuestos,
    nota,
    hotel,
    checkin,
    checkout,
    noches,
    noktos,
  ]);

  return (
    <div className="flex flex-col border transform scale-75">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{hotel}</h2>
      <canvas
        ref={canvasRef}
        width={700}
        height={750}
        className="border  border-gray-300 shadow-lg w-full h-full rounded-lg"
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
    value: string | number
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
  useEffect(() => {
    if (data.noktos) {
      onDataChange({
        ...data,
        precio: Number((data.noktos * 145).toFixed(2)),
        impuestos: Number((data.noktos * 168.2).toFixed(2)),
      });
    }
  }, [data.noktos]);

  useEffect(() => {
    if (data.checkin && data.checkout) {
      handleInputChange(
        "noches",
        calcularNoches(data.checkin, data.checkout) || 0
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
            {/* <label htmlFor="">Selecciona el hotel</label> */}
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

        {/* Noches y Noktos */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Noktos por noche
            </label>
            <input
              type="number"
              step="0.01"
              value={data.noktos}
              onChange={(e) => {
                handleInputChange("noktos", parseFloat(e.target.value) || 0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        {/* Desayuno */}
        <div className="grid grid-cols-2 gap-4">
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
              placeholder="Notas adicionales"
            />
          </div>
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

// Componente de Login
export const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const correctPassword = "noktos2025"; // Cambia esta contraseña por la que desees
  const password_reservas = "123456";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simular un pequeño delay para mejor UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === correctPassword) {
      onLogin();
    } else {
      setError("Contraseña incorrecta. Inténtalo de nuevo.");
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h1>
            <p className="text-gray-600">Generador de Cupones KONE</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verificando...
                </div>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Sistema protegido • Solo personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Principal
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [couponData, setCouponData] = useState<CouponData>({
    hotel: "",
    direccion: "",
    checkin: "",
    checkout: "",
    noches: 0,
    noktos: 0,
    desayuno: "",
    notas: "",
    precio: 0,
    impuestos: 0,
  });

  const [currency, setCurrency] = useState<string>("MXN");

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

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
      noktos: 0,
      desayuno: "",
      notas: "",
      precio: 0,
      impuestos: 0,
    });
  };

  // Si no está autenticado, mostrar pantalla de login
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Si está autenticado, mostrar la aplicación principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Generador de Cupones
              </h1>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario - Lado Izquierdo */}
          <div className="order-2 lg:order-1">
            <CouponForm
              data={couponData}
              currency={currency}
              onDataChange={handleDataChange}
              onCurrencyChange={handleCurrencyChange}
              onReset={handleReset}
            />
          </div>

          {/* Cupón - Lado Derecho */}
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
