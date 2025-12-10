import React from "react";

// ==========================================
// 1. CONSTANTES Y UTILS (Para separar a /utils)
// ==========================================

export const SOURCE_FLAGS = {
  GEMINI: "AI_PROCESSED", // Origen: Inteligencia Artificial
  STANDARD: "DB_STANDARD", // Origen: Base de datos / Manual
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(amount) || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "---";
  try {
    const date = new Date(dateString);
    // Formato: 11 dic 2025
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

// ==========================================
// 2. EL ADAPTADOR (LOGIC LAYER)
// ==========================================

export const normalizeRequest = (data) => {
  // 🚩 LÓGICA DE BANDERA:
  // Detectamos si existe la estructura profunda de Gemini
  const deepItem = data.objeto_gemini?.item?.item;

  // Asignamos la bandera según la detección
  const currentFlag = deepItem ? SOURCE_FLAGS.GEMINI : SOURCE_FLAGS.STANDARD;

  // Lógica de fallback para ubicación
  const location = deepItem
    ? `${deepItem.ciudad}, ${deepItem.colonia}`
    : "Ubicación por confirmar";

  // Normalización final
  return {
    id: data.id_solicitud,
    sourceType: currentFlag, // <--- Aquí va tu bandera para el UI

    hotelName: data.hotel || deepItem?.hotel || "Hotel desconocido",
    location: location,
    // Usamos placeholder porque el array de imagenes viene vacío en el ejemplo
    image:
      deepItem?.imagenes?.[0] ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",

    checkIn: formatDate(data.check_in),
    checkOut: formatDate(data.check_out),

    // Preferencia al nombre largo del cuarto, fallback al corto
    roomType:
      deepItem?.tipos_cuartos?.[0]?.cuarto ||
      data.room ||
      "Habitación Estándar",

    guestName: data.nombre_viajero || data.viajero_principal || "Huésped",
    totalPrice: formatCurrency(data.total_solicitud),
    status: data.estado_solicitud || "pending",
    confirmationCode: data.confirmation_code || null,

    // Dato extra solo para visualización
    creator: data.quien_reservó || "Sistema",
  };
};

// ==========================================
// 3. ICONOS (Componentes simples SVG)
// ==========================================

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-3 h-3"
  >
    <path
      fillRule="evenodd"
      d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z"
      clipRule="evenodd"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-3 h-3"
  >
    <path
      fillRule="evenodd"
      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
      clipRule="evenodd"
    />
  </svg>
);

// ==========================================
// 4. COMPONENTE CARD (UI LAYER)
// ==========================================

export const HotelCard = ({ hotel }) => {
  // 1. Usamos el adaptador
  const request = normalizeRequest(hotel);

  // 2. Leemos la bandera para decidir estilos
  const isAI = request.sourceType === SOURCE_FLAGS.GEMINI;

  return (
    <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* HEADER: Imagen y Badge de Bandera */}
      <div className="h-40 bg-gray-200 relative group">
        <img
          src={request.image}
          alt={request.hotelName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div
          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-sm ${
            isAI ? "bg-blue-400" : "bg-green-600"
          }`}
        >
          {isAI ? <SparklesIcon /> : <UserIcon />}
          <span>{isAI ? "Propuesta MIA" : "Solicitud Manual"}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-700 shadow-sm uppercase">
          {request.status}
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-4">
          <h2
            className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2"
            title={request.hotelName}
          >
            {request.hotelName}
          </h2>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            📍 {request.location}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid gap-y-3 gap-x-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div>
            <span className="block text-xs text-gray-400 uppercase font-semibold">
              Check-in
            </span>
            <span className="font-medium text-gray-800">{request.checkIn}</span>
          </div>

          <div>
            <span className="block text-xs text-gray-400 uppercase font-semibold">
              Check-out
            </span>
            <span className="font-medium text-gray-800">
              {request.checkOut}
            </span>
          </div>

          <div className="lg:col-span-2 pt-1 border-t border-gray-200 mt-1">
            <span className="block text-xs text-gray-400 uppercase font-semibold">
              Habitación
            </span>
            <span
              className="font-medium text-gray-800 truncate block"
              title={request.roomType}
            >
              {request.roomType}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total</p>
            <p className="text-xl font-bold text-gray-900">
              {request.totalPrice}
            </p>
          </div>

          {/* Botón dinámico según Bandera */}
          <button
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors shadow-sm ${
              isAI
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isAI ? "Validar" : "Ver Detalle"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. DATOS MOCK Y VISTA PRINCIPAL
// ==========================================

const dataGemini = {
  id_solicitud: "sol-bb28f650-3e97",
  objeto_gemini: {
    item: {
      item: {
        hotel: "Hard Rock Hotel Guadalajara",
        ciudad: "Guadalajara",
        colonia: "Camino Real Zapopan",
        imagenes: [],
        tipos_cuartos: [{ cuarto: "Deluxe Room with 1 King Bed" }],
      },
      extra: { room: "Deluxe Room with 1 King Bed" },
    },
  },
  hotel: "Hard Rock Hotel Guadalajara",
  total_solicitud: "22500.00",
  check_in: "2025-12-11T06:00:00.000Z",
  check_out: "2025-12-14T06:00:00.000Z",
  nombre_viajero: "ANGEL CASTAÑEDA",
  estado_solicitud: "pending",
};

const dataStandard = {
  id_solicitud: "sol-64baba6c-f1bd",
  objeto_gemini: { type: "hotel" },
  hotel: "HOTEL MANSION VON HUMBOLDT",
  check_in: "2025-12-09T06:00:00.000Z",
  check_out: "2025-12-11T06:00:00.000Z",
  room: "single",
  total_solicitud: "2018.40",
  estado_solicitud: "confirmed",
  confirmation_code: "11866067",
  quien_reservó: "Angel Castañeda",
};
