"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { URL } from "@/lib/constants";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { API_KEY } from "@/lib/constants";
import { Pencil, Trash2, ArrowLeft, Plus, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const sanitizeUrl = (url: string) => {
  return url.replace(/^httpss:\/\//, "https://");
};

const getValidImageUrl = (url: string | null | undefined) => {
  if (!url || !url.startsWith("http")) {
    return "https://via.placeholder.com/600x400?text=Sin+imagen";
  }
  return sanitizeUrl(url);
};

// Interfaces
interface CodigoPostalData {
  id: number;
  d_codigo: string;
  d_asenta: string;
  d_tipo_asenta: string;
  D_mnpio: string;
  d_estado: string;
  d_ciudad: string;
  c_estado: number;
  c_mnpio: number;
  c_cve_ciudad: number;
}

interface Agente {
  id_agente: string;
  primer_nombre: string;
  correo: string;
  [key: string]: any;
}

interface HabitacionData {
  incluye: boolean;
  tipo_desayuno: string;
  precio: string;
  comentarios: string;
  precio_noche_extra: string;
  precio_persona_extra?: string;
}

interface TarifaData {
  info_agente: string;
  id_tarifa?: number;
  precio?: string;
  id_agente?: string | null;
  id_hotel?: string;
  id_tipos_cuartos?: number; // 1 = sencilla, 2 = doble
  costo?: string;
  incluye_desayuno?: number;
  precio_desayuno?: string | null;
  precio_noche_extra?: string | null;
  comentario_desayuno?: string | null;
  precio_persona_extra?: string | null;
  tipo_desayuno?: string | null;
}

interface TarifaPreferencial {
  id_tarifa_sencilla?: number; // ID for the single room rate (type 1)
  id_tarifa_doble?: number; // ID for the double room rate (type 2)
  id_agente: string;
  nombre_agente: string;
  correo_agente: string;
  costo_q: string;
  precio_q: string;
  costo_qq: string;
  precio_qq: string;
  sencilla: HabitacionData;
  doble: HabitacionData;

  busqueda: {
    nombre: string;
    correo: string;
    resultados: Agente[];
    buscando: boolean;
  };
}

export interface FullHotelData {
  Id_hotel_excel?: number;
  id_hotel?: string;
  nombre?: string;
  id_cadena?: number;
  correo?: string;
  telefono?: string;
  rfc?: string;
  razon_social?: string;
  direccion?: string;
  latitud?: string;
  longitud?: string;
  convenio?: string | null;
  descripcion?: string | null;
  calificacion?: number | null;
  tipo_hospedaje?: string;
  cuenta_de_deposito?: string | null;
  Estado?: string;
  Ciudad_Zona?: string;
  noktosq?: number;
  noktosqq?: number;
  MenoresEdad?: string;
  paxExtraPersona?: string;
  desayunoincluido?: string;
  desayunocomentarios?: string;
  desayunoprecioporpersona?: string;
  Transportacion?: string;
  TransportacionComentarios?: string;
  URLImagenHotel?: string;
  URLImagenHotelQ?: string;
  URLImagenHotelQQ?: string;
  Activo?: boolean | number;
  Comentarios?: string | null;
  id_sepomex?: number | null;
  CodigoPostal?: string;
  contacto_convenio?: string | null;
  contacto_recepcion?: string | null;
  Colonia?: string;
  precio_sencilla?: number | string;
  precio_doble?: number | string;
  costo_q?: string;
  precio_q?: string;
  costo_qq?: string;
  precio_qq?: string;
  iva?: string;
  ish?: string | null;
  otros_impuestos?: string;
  otros_impuestos_porcentaje?: string;
  tipo_negociacion?: string;
  disponibilidad_precio?: string;
  comentario_pago?: string;
  vigencia_convenio?: string;
  comentario_vigencia?: string;
  tipo_pago?: string;
  mascotas?: string;
  salones?: string;
  hay_convenio?: boolean;
  pais?: string;
  score_operaciones?: number;
  score_sistemas?: number;
}

interface HotelRate {
  id_tarifa_sencilla?: number; // ID for the single room rate (type 1)
  id_tarifa_doble?: number; // ID for the double room rate (type 2)
  id_hotel?: string;
  id_agente?: string | null;
  costo_q?: string;
  precio_q?: string;
  costo_qq?: string;
  precio_qq?: string;
  precio_persona_extra?: string;
  sencilla?: {
    incluye: boolean;
    tipo_desayuno: string;
    precio: string;
    comentarios: string;
    precio_noche_extra: string;
  };
  doble?: {
    incluye: boolean;
    tipo_desayuno: string;
    precio: string;
    comentarios: string;
    precio_noche_extra: string;
    precio_persona_extra: string;
  };
}

interface FormData {
  Id_hotel_excel?: string;
  idSepomex?: number;
  id_cadena: string;
  Activo: boolean;
  nombre: string;
  CodigoPostal: string;
  calle: string;
  numero: string;
  Colonia: string;
  Estado: string;
  Ciudad_Zona: string;
  municipio: string;
  tipo_negociacion: string;
  hay_convenio: boolean;
  vigencia_convenio: string;
  comentario_vigencia: string;
  URLImagenHotel: string;
  URLImagenHotelQ: string;
  URLImagenHotelQQ: string;
  tipo_pago: string;
  disponibilidad_precio: string;
  contacto_convenio: string;
  contacto_recepcion: string;
  iva: string;
  ish: string;
  otros_impuestos_porcentaje: string;
  otros_impuestos: string;
  MenoresEdad: string;
  Transportacion: string;
  TransportacionComentarios: string;
  mascotas: string;
  salones: string;
  rfc: string;
  razon_social: string;
  calificacion: string;
  tipo_hospedaje: string;
  Comentarios: string;
  notas_datosBasicos: string;
  notas_tarifasServicios: string;
  notas_informacionPagos: string;
  notas_informacion_adicional: string;
  notas_generales: string;
  latitud: string;
  longitud: string;
  cuenta_de_deposito: string;
  comentario_pago: string;
  costo_q: string;
  precio_q: string;
  costo_qq: string;
  precio_qq: string;
  precio_persona_extra: string;
  sencilla: HabitacionData;
  doble: HabitacionData;
  internacional?: boolean;
  pais?: string;
  score_operaciones?: number;
  score_sistemas?: number;
}

interface HotelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: FullHotelData | null;
  onSuccess?: () => void;
}

// Interface for preferential rate deletion (updated for both IDs)
interface DeleteTarifaPreferencialProps {
  id_tarifa_preferencial_sencilla?: number | null;
  id_tarifa_preferencial_doble?: number | null;
}

export function quitarAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
export function normalizarEstado(estado: string) {
  const limpio = quitarAcentos(estado.toUpperCase().trim());

  const mapa: Record<string, string> = {
    "COAHUILA DE ZARAGOZA": "COAHUILA",
    "MICHOACAN DE OCAMPO": "MICHOACAN",
    "VERACRUZ DE IGNACIO DE LA LLAVE": "VERACRUZ",
    "SAN LUIS POTOSI": "SAN LUIS POTOSI", // ya coincide
    "CIUDAD DE MÉXICO": "CIUDAD DE MEXICO",
    "ESTADO DE MÉXICO": "ESTADO DE MEXICO",
    MEXICO: "ESTADO DE MEXICO", // distingue entre "Estado de México" y "CDMX"
  };

  return mapa[limpio] || limpio;
}

const estadosMX = [
  "AGUASCALIENTES",
  "BAJA CALIFORNIA",
  "BAJA CALIFORNIA SUR",
  "CAMPECHE",
  "COAHUILA",
  "COLIMA",
  "CHIAPAS",
  "CHIHUAHUA",
  "CIUDAD DE MEXICO",
  "DURANGO",
  "GUANAJUATO",
  "GUERRERO",
  "HIDALGO",
  "JALISCO",
  "ESTADO DE MEXICO",
  "MICHOACAN",
  "MORELOS",
  "NAYARIT",
  "NUEVO LEON",
  "OAXACA",
  "PUEBLA",
  "QUERETARO",
  "QUINTANA ROO",
  "SAN LUIS POTOSI",
  "SINALOA",
  "SONORA",
  "TABASCO",
  "TAMAULIPAS",
  "TLAXCALA",
  "VERACRUZ",
  "YUCATAN",
  "ZACATECAS",
  "OTROS",
];
// Helper functions for date formatting
const convertToDateInputFormat = (dateString?: string | null): string => {
  if (!dateString) return "";

  // If already in format YYYY-MM-DD, return directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // If it's an ISO date, extract the YYYY-MM-DD part
  if (dateString.includes("T")) {
    return dateString.split("T")[0];
  }

  // If in format DD-MM-YYYY, convert it
  const parts = dateString.split("-");
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return "";
};

const convertToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "";

  // If already in format DD-MM-YYYY, return directly
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    return dateString;
  }

  // If it's an ISO date or YYYY-MM-DD, convert it
  const cleanDate = dateString.split("T")[0];
  const parts = cleanDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return "";
};

// Parse notes section from concatenated notes
const extractNotesSection = (notes: string, section: string): string => {
  if (!notes) return "";

  const pattern = new RegExp(`## ${section} ##\\s*([^#]+)`, "i");
  const match = notes.match(pattern);
  return match ? match[1].trim() : "";
};

// API Functions
const buscarCodigoPostal = async (CodigoPostal: string) => {
  try {
    const response = await fetch(
      `https://miaback.vercel.app/v1/sepoMex/buscar-codigo-postal?d_codigo=${CodigoPostal}`,
      //`http://localhost:3001/v1/sepoMex/buscar-codigo-postal?d_codigo=${CodigoPostal}`,
      {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`ERROR ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("ERROR AL BUSCAR CODIGO POSTAL:", error);
    return [];
  }
};

const buscarAgentes = async (nombre: string, correo: string) => {
  try {
    const response = await fetch(
      `${URL}agentes/get-agente-id?nombre=${encodeURIComponent(
        nombre
      )}&correo=${encodeURIComponent(correo)}`,
      //`http://localhost:3001/v1/mia/agentes/get-agente-id?nombre=${encodeURIComponent(nombre)}&correo=${encodeURIComponent(correo)}`
      {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("ERROR EN LA RESPUESTA:", response.status);
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("ERROR AL BUSCAR AGENTES:", error);
    return [];
  }
};

// Extract components from direccion (simple parsing)
const extractDireccionData = (direccion?: string) => {
  const defaultData = { calle: "", numero: "", municipio: "" };
  if (!direccion) return defaultData;

  // Try to parse the address - this is a simple approach, might need adjusting
  const match = direccion.match(/^([^,]+),([^,]+)/);
  if (match) {
    return {
      calle: match[1].trim(),
      numero: match[2].trim(),
    };
  }
  return defaultData;
};

export function HotelDialog({
  open,
  onOpenChange,
  hotel,
  onSuccess,
}: HotelDialogProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("datosBasicos");
  const [colonias, setColonias] = useState<CodigoPostalData[]>([]);
  const [buscandoCP, setBuscandoCP] = useState(false);
  const [tarifasPreferenciales, setTarifasPreferenciales] = useState<
    TarifaPreferencial[]
  >([]);
  const [hotelRates, setHotelRates] = useState<HotelRate | null>(null);
  const [editingTarifaId, setEditingTarifaId] = useState<number | null>(null);
  const [deleteTarifaDialogOpen, setDeleteTarifaDialogOpen] = useState(false);
  const [selectedTarifaToDelete, setSelectedTarifaToDelete] =
    useState<DeleteTarifaPreferencialProps | null>(null);

  const defaultFormData: FormData = {
    id_cadena: "",
    Activo: true,
    nombre: "",
    CodigoPostal: "",
    calle: "",
    numero: "",
    Colonia: "",
    Estado: "",
    Ciudad_Zona: "",
    municipio: "",
    tipo_negociacion: "",
    hay_convenio: true,
    vigencia_convenio: "",
    comentario_vigencia: "SIN CONVENIO",
    URLImagenHotel: "",
    URLImagenHotelQ: "",
    URLImagenHotelQQ: "",
    tipo_pago: "",
    disponibilidad_precio: "",
    contacto_convenio: "",
    contacto_recepcion: "",
    iva: "",
    ish: "",
    otros_impuestos: "",
    otros_impuestos_porcentaje: "",
    MenoresEdad: "",
    Transportacion: "",
    TransportacionComentarios: "",
    mascotas: "",
    salones: "",
    rfc: "",
    razon_social: "",
    calificacion: "",
    tipo_hospedaje: "hotel",
    Comentarios: "",
    notas_datosBasicos: "",
    notas_tarifasServicios: "",
    notas_informacionPagos: "",
    notas_informacion_adicional: "",
    notas_generales: "",
    latitud: "",
    longitud: "",
    cuenta_de_deposito: "",
    comentario_pago: "",
    costo_q: "",
    precio_q: "",
    costo_qq: "",
    precio_qq: "",
    precio_persona_extra: "",
    sencilla: {
      incluye: false,
      tipo_desayuno: "",
      precio: "",
      comentarios: "",
      precio_noche_extra: "",
    },
    doble: {
      incluye: false,
      tipo_desayuno: "",
      precio: "",
      comentarios: "",
      precio_noche_extra: "",
      precio_persona_extra: "",
    },
    internacional: false,
    pais: "",
    score_operaciones: 0,
    score_sistemas: 0,
  };

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const hasFetched = useRef<string | null>(null);

  // Sync breakfast data between single and double rooms
  useEffect(() => {
    if (mode === "edit" && formData.sencilla) {
      setFormData((prev) => ({
        ...prev,
        doble: {
          ...prev.doble,
          incluye: prev.sencilla.incluye,
          tipo_desayuno: prev.sencilla.tipo_desayuno,
          precio: prev.sencilla.precio,
          comentarios: prev.sencilla.comentarios,
        },
      }));
    }
  }, [
    formData.sencilla.incluye,
    formData.sencilla.tipo_desayuno,
    formData.sencilla.precio,
    formData.sencilla.comentarios,
    mode,
  ]);

  useEffect(() => {
    if (open && hotel?.id_hotel) {
      if (hasFetched.current !== hotel.id_hotel) {
        console.log("Fetching new hotel data for ID:", hotel.id_hotel);
        console.log("Data Completa de este hotel:", hotel);
        fetchHotelRates(hotel.id_hotel);
        hasFetched.current = hotel.id_hotel;
      }
    }

    if (!open) {
      console.log("Modal closed, resetting all state");
      hasFetched.current = null;
      setHotelRates(null);
      setFormData({ ...defaultFormData });
      setTarifasPreferenciales([]);
      setMode("view");
      setErrorMessage("");
      setSuccessMessage("");
      setEditingTarifaId(null);
      setSelectedTarifaToDelete(null);
      setActiveTab("datosBasicos");
      setColonias([]);
      setBuscandoCP(false);
    }
  }, [open, hotel?.id_hotel]);

  useEffect(() => {
    if (hotel && open) {
      console.log("Setting form data from hotel:", hotel.nombre);
      const direccionData = extractDireccionData(hotel.direccion);

      const hasConvention =
        !!hotel.vigencia_convenio && hotel.vigencia_convenio !== "";

      const notasDatosBasicos = hotel.Comentarios
        ? extractNotesSection(hotel.Comentarios, "DATOS BÁSICOS")
        : "";
      const notasTarifasServicios = hotel.Comentarios
        ? extractNotesSection(hotel.Comentarios, "TARIFAS Y SERVICIOS")
        : "";
      const notasInformacionPagos = hotel.Comentarios
        ? extractNotesSection(hotel.Comentarios, "INFORMACIÓN DE PAGOS")
        : "";
      const notasInformacionAdicional = hotel.Comentarios
        ? extractNotesSection(hotel.Comentarios, "INFORMACION ADICIONAL")
        : "";
      const rawComentarios = hotel.Comentarios || "";

      // Validamos si hay al menos un encabezado presente
      const tieneEncabezados = /##\s+[A-ZÁÉÍÓÚÑ\s]+?\s+##/.test(rawComentarios);

      // Verificamos si existe una sección explícita de 'NOTAS GENERALES'
      const tieneNotasGenerales = /##\s*NOTAS GENERALES\s*##/.test(
        rawComentarios
      );

      // Si tiene encabezados y hay sección de notas generales, extraerla
      // Si no tiene encabezados, es un comentario antiguo → usar todo
      // Si tiene encabezados pero no tiene 'NOTAS GENERALES', no mostrar nada
      const notasGenerales = tieneEncabezados
        ? tieneNotasGenerales
          ? extractNotesSection(rawComentarios, "NOTAS GENERALES")
          : ""
        : rawComentarios;

      setFormData({
        Id_hotel_excel: hotel.Id_hotel_excel?.toString() || "",
        id_cadena: hotel.id_cadena?.toString() || "",
        Activo: hotel.Activo === true || hotel.Activo === 1,
        nombre: hotel.nombre || "",
        CodigoPostal: hotel.CodigoPostal || "",
        calle: direccionData.calle,
        numero: direccionData.numero,
        Colonia: hotel.Colonia || "",
        Estado: hotel.Estado
          ? quitarAcentos(hotel.Estado.toUpperCase().trim())
          : "",
        Ciudad_Zona: hotel.Ciudad_Zona || "",
        municipio: "",
        tipo_negociacion: hotel.tipo_negociacion || "",
        hay_convenio: hasConvention,
        vigencia_convenio: hasConvention
          ? convertToDateInputFormat(hotel.vigencia_convenio)
          : "",
        comentario_vigencia: hotel.comentario_vigencia || "SIN CONVENIO",
        URLImagenHotel: hotel.URLImagenHotel || "",
        URLImagenHotelQ: hotel.URLImagenHotelQ || "",
        URLImagenHotelQQ: hotel.URLImagenHotelQQ || "",
        tipo_pago: hotel.tipo_pago || "",
        disponibilidad_precio: hotel.disponibilidad_precio || "",
        contacto_convenio: hotel.contacto_convenio || "",
        contacto_recepcion: hotel.contacto_recepcion || "",
        iva: hotel.iva || "",
        ish: hotel.ish || "",
        otros_impuestos: hotel.otros_impuestos || "",
        otros_impuestos_porcentaje: hotel.otros_impuestos_porcentaje || "",
        MenoresEdad: hotel.MenoresEdad || "",
        Transportacion: hotel.Transportacion || "",
        TransportacionComentarios: hotel.TransportacionComentarios || "",
        mascotas: hotel.mascotas || "",
        salones: hotel.salones || "",
        rfc: hotel.rfc || "",
        razon_social: hotel.razon_social || "",
        calificacion: hotel.calificacion?.toString() || "",
        tipo_hospedaje: hotel.tipo_hospedaje || "hotel",
        Comentarios: hotel.Comentarios || "",
        notas_datosBasicos: notasDatosBasicos,
        notas_tarifasServicios: notasTarifasServicios,
        notas_informacionPagos: notasInformacionPagos,
        notas_informacion_adicional: notasInformacionAdicional,
        notas_generales: notasGenerales,
        latitud: hotel.latitud || "",
        longitud: hotel.longitud || "",
        cuenta_de_deposito: hotel.cuenta_de_deposito || "",
        comentario_pago: hotel.comentario_pago || "",
        costo_q: hotel.costo_q || "",
        precio_q: hotel.precio_sencilla?.toString() || "",
        costo_qq: hotel.costo_qq || "",
        precio_qq: hotel.precio_doble?.toString() || "",
        precio_persona_extra: hotel.paxExtraPersona || "",
        sencilla: {
          incluye: hotel.desayunoincluido === "SI",
          tipo_desayuno: "",
          precio: hotel.desayunoprecioporpersona || "",
          comentarios: hotel.desayunocomentarios || "",
          precio_noche_extra: "",
        },
        doble: {
          incluye: hotel.desayunoincluido === "SI",
          tipo_desayuno: "",
          precio: hotel.desayunoprecioporpersona || "",
          comentarios: hotel.desayunocomentarios || "",
          precio_noche_extra: "",
          precio_persona_extra: hotel.paxExtraPersona || "",
        },
        pais: hotel.pais === "MEXICO" ? "" : hotel.pais,
        internacional: hotel.pais && hotel.pais !== "MEXICO",
        score_operaciones: hotel.score_operaciones || 0,
        score_sistemas: hotel.score_sistemas || 0,
      });

      // Fetch colonias if we have a valid postal code
      if (hotel.CodigoPostal && hotel.CodigoPostal.length === 5) {
        handleCodigoPostalChange(hotel.CodigoPostal);
      }
    }
  }, [hotel, open]);

  // Update form data with hotel rates when they're loaded
  useEffect(() => {
    if (!hotelRates || !hotel?.id_hotel) return;

    setFormData((prev) => {
      const newFormData = {
        ...prev,
        costo_q: hotelRates.costo_q || prev.costo_q,
        precio_q: hotelRates.precio_q || prev.precio_q,
        costo_qq: hotelRates.costo_qq || prev.costo_qq,
        precio_qq: hotelRates.precio_qq || prev.precio_qq,
        precio_persona_extra:
          hotelRates.precio_persona_extra || prev.precio_persona_extra,
      };

      if (hotelRates.sencilla) {
        newFormData.sencilla = {
          ...prev.sencilla,
          incluye: hotelRates.sencilla.incluye ?? prev.sencilla.incluye,
          tipo_desayuno:
            hotelRates.sencilla.tipo_desayuno || prev.sencilla.tipo_desayuno,
          precio: hotelRates.sencilla.precio || prev.sencilla.precio,
          comentarios:
            hotelRates.sencilla.comentarios || prev.sencilla.comentarios,
          precio_noche_extra:
            hotelRates.sencilla.precio_noche_extra ||
            prev.sencilla.precio_noche_extra,
        };
      }

      if (hotelRates.doble) {
        newFormData.doble = {
          ...prev.doble,
          incluye: hotelRates.doble.incluye ?? prev.doble.incluye,
          tipo_desayuno:
            hotelRates.doble.tipo_desayuno || prev.doble.tipo_desayuno,
          precio: hotelRates.doble.precio || prev.doble.precio,
          comentarios: hotelRates.doble.comentarios || prev.doble.comentarios,
          precio_noche_extra:
            hotelRates.doble.precio_noche_extra ||
            prev.doble.precio_noche_extra,
          precio_persona_extra:
            hotelRates.doble.precio_persona_extra ||
            prev.doble.precio_persona_extra,
        };
      }

      return newFormData;
    });
  }, [hotelRates, hotel?.id_hotel]);

  const fetchHotelRates = async (idHotel: string) => {
    try {
      setIsFetchingRates(true);
      const response = await fetch(
<<<<<<< HEAD
        `https://miaback.vercel.app/v1/hoteles/Consultar-tarifas-por-hotel/${idHotel}`,
=======
        `https://miaback.vercel.app/v1/mia/hoteles/Consultar-tarifas-por-hotel/${idHotel}`,
>>>>>>> e3878d92e481b7cc14bdba4af3ff718f7d339e1d
        //`http://localhost:3001/v1/mia/hoteles/Consultar-tarifas-por-hotel/${idHotel}`,
        {
          method: "GET",
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ERROR ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Tarifas obtenidas:", result);

      if (result.tarifas && Array.isArray(result.tarifas)) {
        const standardRates = result.tarifas.filter(
          (t: TarifaData) => t.id_agente === null
        );
        const preferentialRates = result.tarifas.filter(
          (t: TarifaData) => t.id_agente !== null
        );

        const processedRates: HotelRate = {
          costo_q: "",
          precio_q: "",
          costo_qq: "",
          precio_qq: "",
          precio_persona_extra: "",
          sencilla: {
            incluye: false,
            tipo_desayuno: "",
            precio: "",
            comentarios: "",
            precio_noche_extra: "",
          },
          doble: {
            incluye: false,
            tipo_desayuno: "",
            precio: "",
            comentarios: "",
            precio_noche_extra: "",
            precio_persona_extra: "",
          },
        };

        standardRates.forEach((tarifa: TarifaData) => {
          if (tarifa.id_tipos_cuartos === 1) {
            processedRates.id_tarifa_sencilla = tarifa.id_tarifa;
            processedRates.sencilla = {
              incluye: tarifa.incluye_desayuno === 1,
              tipo_desayuno: tarifa.tipo_desayuno || "",
              precio: tarifa.precio_desayuno || "",
              comentarios: tarifa.comentario_desayuno || "",
              precio_noche_extra: tarifa.precio_noche_extra || "",
            };
            processedRates.costo_q = tarifa.costo || "";
            processedRates.precio_q = tarifa.precio || "";
          }

          if (tarifa.id_tipos_cuartos === 2) {
            processedRates.id_tarifa_doble = tarifa.id_tarifa;
            processedRates.doble = {
              incluye: tarifa.incluye_desayuno === 1,
              tipo_desayuno: tarifa.tipo_desayuno || "",
              precio: tarifa.precio_desayuno || "",
              comentarios: tarifa.comentario_desayuno || "",
              precio_noche_extra: tarifa.precio_noche_extra || "",
              precio_persona_extra: tarifa.precio_persona_extra || "",
            };
            processedRates.costo_qq = tarifa.costo || "";
            processedRates.precio_qq = tarifa.precio || "";
          }
        });

        setHotelRates(processedRates);

        const groupedRates = new Map<
          string,
          { sencilla?: TarifaData; doble?: TarifaData }
        >();

        preferentialRates.forEach((rate: TarifaData) => {
          if (!rate.id_agente) return;

          if (!groupedRates.has(rate.id_agente)) {
            groupedRates.set(rate.id_agente, {});
          }

          const agentRates = groupedRates.get(rate.id_agente);
          if (agentRates) {
            if (rate.id_tipos_cuartos === 1) {
              agentRates.sencilla = rate;
            } else if (rate.id_tipos_cuartos === 2) {
              agentRates.doble = rate;
            }
          }
        });

        const tarifasArray: TarifaPreferencial[] = [];

        groupedRates.forEach((rates, agentId) => {
          const { sencilla, doble } = rates;

          const tarifaPreferencial: TarifaPreferencial = {
            id_agente: agentId,
            nombre_agente: "",
            correo_agente: "",
            costo_q: sencilla?.costo || "",
            precio_q: sencilla?.precio || "",
            costo_qq: doble?.costo || "",
            precio_qq: doble?.precio || "",
            sencilla: {
              incluye: sencilla?.incluye_desayuno === 1,
              tipo_desayuno: sencilla?.tipo_desayuno || "",
              precio: sencilla?.precio_desayuno || "",
              comentarios: sencilla?.comentario_desayuno || "",
              precio_noche_extra: sencilla?.precio_noche_extra || "",
            },
            doble: {
              incluye: doble?.incluye_desayuno === 1,
              tipo_desayuno: doble?.tipo_desayuno || "",
              precio: doble?.precio_desayuno || "",
              comentarios: doble?.comentario_desayuno || "",
              precio_noche_extra: doble?.precio_noche_extra || "",
              precio_persona_extra: doble?.precio_persona_extra || "",
            },
            busqueda: {
              nombre: "",
              correo: "",
              resultados: [],
              buscando: false,
            },
          };

          if (sencilla?.id_tarifa) {
            tarifaPreferencial.id_tarifa_sencilla = sencilla.id_tarifa;
          }
          if (doble?.id_tarifa) {
            tarifaPreferencial.id_tarifa_doble = doble.id_tarifa;
          }

          const rateWithInfo = sencilla || doble;
          if (rateWithInfo?.info_agente) {
            const [nombre = "", correo = ""] =
              rateWithInfo.info_agente.split(" ");
            tarifaPreferencial.nombre_agente = nombre;
            tarifaPreferencial.correo_agente = correo;
            tarifaPreferencial.busqueda.nombre = nombre;
            tarifaPreferencial.busqueda.correo = correo;
          }

          tarifasArray.push(tarifaPreferencial);
        });

        setTarifasPreferenciales(tarifasArray);
      }
    } catch (error) {
      console.error("ERROR AL CONSULTAR TARIFAS:", error);
      setErrorMessage("ERROR AL CARGAR LAS TARIFAS DEL HOTEL");
    } finally {
      setIsFetchingRates(false);
    }
  };
  //handler for international hotel
  const handleInternacionalChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      internacional: checked,
      pais: checked ? prev.pais || "" : "MEXICO",
      Estado: checked ? "OTROS" : "",
    }));
  };
  // Handler for código postal search
  const handleCodigoPostalChange = async (codigo: string) => {
    setFormData((prev) => ({ ...prev, CodigoPostal: codigo }));

    if (codigo.length === 5) {
      setBuscandoCP(true);
      try {
        const data = await buscarCodigoPostal(codigo);
        setColonias(data);

        if (data.length > 0) {
          const primerResultado = data[0];
          setFormData((prev) => ({
            ...prev,
            Estado: normalizarEstado(primerResultado.d_estado.toUpperCase()),
            municipio: quitarAcentos(primerResultado.D_mnpio.toUpperCase()),
            idSepomex: primerResultado.id,
          }));
        }
      } catch (error) {
        console.error("ERROR AL BUSCAR CODIGO POSTAL:", error);
      } finally {
        setBuscandoCP(false);
      }
    } else {
      setColonias([]);
    }
  };

  // Handler for Colonia selection
  const handleColoniaChange = (coloniaId: string) => {
    const coloniaSeleccionada = colonias.find(
      (c) => c.id.toString() === coloniaId
    );
    if (coloniaSeleccionada) {
      setFormData((prev) => ({
        ...prev,
        Colonia: coloniaSeleccionada.d_asenta.toUpperCase(),
        idSepomex: coloniaSeleccionada.id,
      }));
    }
  };

  // Handle checkbox for convention
  const handleHayConvenioChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hay_convenio: checked,
      vigencia_convenio: checked ? prev.vigencia_convenio : "",
      comentario_vigencia: checked ? prev.comentario_vigencia : "SIN CONVENIO",
    }));
  };

  // Generic form field change handler
  const handleChange = (field: string, value: any) => {
    if (mode === "view") return;

    // Convert text values to uppercase if they're strings
    const processedValue =
      typeof value === "string" ? value.toUpperCase() : value;

    if (field === "pais") {
      setFormData((prev) => ({
        ...prev,
        pais: processedValue,
        internacional: processedValue && processedValue !== "MEXICO",
        Estado:
          processedValue && processedValue !== "MEXICO" ? "OTROS" : prev.Estado,
      }));
      return;
    }

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as object),
          [child]: processedValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));
    }
  };

  // Handler for agent search within preferential rates
  const handleSearch = async (index: number) => {
    const tarifa = tarifasPreferenciales[index];
    if (
      tarifa.busqueda.nombre.trim() === "" &&
      tarifa.busqueda.correo.trim() === ""
    ) {
      const newTarifas = [...tarifasPreferenciales];
      newTarifas[index].busqueda.resultados = [];
      setTarifasPreferenciales(newTarifas);
      return;
    }

    const newTarifas = [...tarifasPreferenciales];
    newTarifas[index].busqueda.buscando = true;
    setTarifasPreferenciales(newTarifas);

    try {
      const agentes = await buscarAgentes(
        tarifa.busqueda.nombre,
        tarifa.busqueda.correo
      );
      newTarifas[index].busqueda.resultados = agentes;
      newTarifas[index].busqueda.buscando = false;
      setTarifasPreferenciales(newTarifas);
    } catch (error) {
      console.error("ERROR AL BUSCAR AGENTES:", error);
      newTarifas[index].busqueda.buscando = false;
      setTarifasPreferenciales(newTarifas);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (
    index: number,
    field: "nombre" | "correo",
    value: string
  ) => {
    const newTarifas = [...tarifasPreferenciales];
    newTarifas[index].busqueda[field] =
      field === "nombre" ? value.toUpperCase() : value;
    setTarifasPreferenciales(newTarifas);
  };

  // Handle agent selection
  const handleSelectAgente = (index: number, agente: Agente) => {
    const newTarifas = [...tarifasPreferenciales];
    newTarifas[index].id_agente = agente.id_agente;
    newTarifas[index].nombre_agente = agente.primer_nombre.toUpperCase();
    newTarifas[index].correo_agente = agente.correo;
    newTarifas[index].busqueda.nombre = agente.primer_nombre.toUpperCase();
    newTarifas[index].busqueda.correo = agente.correo;
    newTarifas[index].busqueda.resultados = [];
    setTarifasPreferenciales(newTarifas);
  };

  // Handle preferential rate change
  const handleTarifaPreferencialChange = (
    index: number,
    field: string,
    value: any
  ) => {
    if (mode === "view" && editingTarifaId !== index) return;

    const newTarifas = [...tarifasPreferenciales];

    // Convert text to uppercase if it's a stringS
    const processedValue =
      typeof value === "string" && field !== "busqueda.correo"
        ? value.toUpperCase()
        : value;

    if (field.includes(".")) {
      const [parent, child] = field.split(".") as [
        keyof TarifaPreferencial,
        string
      ];
      if (parent === "sencilla" || parent === "doble") {
        newTarifas[index][parent] = {
          ...newTarifas[index][parent],
          [child]: processedValue,
        };

        // Sync breakfast data between single and double rooms
        if (
          parent === "sencilla" &&
          (child === "incluye" ||
            child === "tipo_desayuno" ||
            child === "precio" ||
            child === "comentarios")
        ) {
          newTarifas[index].doble = {
            ...newTarifas[index].doble,
            [child]: processedValue,
          };
        }
      } else if (parent === "busqueda") {
        newTarifas[index].busqueda = {
          ...newTarifas[index].busqueda,
          [child]: processedValue,
        };
      }
    } else {
      // For top-level properties
      newTarifas[index] = {
        ...newTarifas[index],
        [field]: processedValue,
      };
    }

    setTarifasPreferenciales(newTarifas);
  };
const [imageUploadStatus, setImageUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setImageUploadStatus("loading");

    const res = await fetch(
      `${URL_VERCEL}hoteles/carga-imagen?filename=${encodeURIComponent(file.name)}&filetype=${file.type}`,
      {
        method: "GET",
        headers: {
          "x-api-key": API_KEY || "",
        },
      }
    );

    const { url, publicUrl } = await res.json();

    const uploadRes = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadRes.ok) throw new Error("Error al subir imagen");

    setFormData((prev) => ({
      ...prev,
      URLImagenHotel: publicUrl,
    }));

    setImageUploadStatus("success");
  } catch (error) {
    console.error("Error al subir imagen", error);
    setImageUploadStatus("error");
  }
};

  // Add a new preferential rate
  const addTarifaPreferencial = () => {
    if (mode === "view") return;

    setTarifasPreferenciales([
      ...tarifasPreferenciales,
      {
        id_agente: "",
        nombre_agente: "",
        correo_agente: "",
        costo_q: formData.costo_q || "",
        precio_q: formData.precio_q || "",
        costo_qq: formData.costo_qq || "",
        precio_qq: formData.precio_qq || "",
        sencilla: {
          incluye: false,
          tipo_desayuno: "",
          precio: "",
          comentarios: "",
          precio_noche_extra: "",
        },
        doble: {
          incluye: false,
          tipo_desayuno: "",
          precio: "",
          comentarios: "",
          precio_persona_extra: "",
          precio_noche_extra: "",
        },
        busqueda: {
          nombre: "",
          correo: "",
          resultados: [],
          buscando: false,
        },
      },
    ]);
  };

  // Remove a preferential rate
  const removeTarifaPreferencial = (index: number) => {
    if (mode === "view" && editingTarifaId !== index) return;

    const newTarifas = tarifasPreferenciales.filter((_, i) => i !== index);
    setTarifasPreferenciales(newTarifas);
  };

  // Concatenate all notes fields
  const combineNotes = () => {
    const notesMap = [
      { section: "DATOS BÁSICOS", content: formData.notas_datosBasicos },
      {
        section: "TARIFAS Y SERVICIOS",
        content: formData.notas_tarifasServicios,
      },
      {
        section: "INFORMACIÓN DE PAGOS",
        content: formData.notas_informacionPagos,
      },
      {
        section: "INFORMACION ADICIONAL",
        content: formData.notas_informacion_adicional,
      },
      { section: "NOTAS GENERALES", content: formData.notas_generales },
    ];

    return notesMap
      .filter((note) => note.content.trim())
      .map((note) => `## ${note.section} ##\n${note.content}`)
      .join("\n\n");
  };

  // Handle delete hotel
  const handleDelete = async () => {
    const id_hotel = hotel?.id_hotel;

    if (!id_hotel) {
      setErrorMessage("ID DE HOTEL NO ENCONTRADO");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${URL}hoteles/Eliminar-hotel/`,
        //`http://localhost:3001/v1/mia/hoteles/Eliminar-hotel/`,
        {
          method: "PATCH",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id_hotel }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `ERROR ${response.status}: ${response.statusText}`
        );
      }

      setSuccessMessage("HOTEL ELIMINADO EXITOSAMENTE");

      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || "ERROR AL ELIMINAR EL HOTEL");
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle update hotel
  const handleUpdate = async () => {
    if (!hotel?.id_hotel) {
      setErrorMessage("ID DE HOTEL NO ENCONTRADO");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // First, get the current rates to obtain the IDs
      const response = await fetch(
<<<<<<< HEAD
        `https://miaback.vercel.app/v1/hoteles/Consultar-tarifas-por-hotel/${hotel.id_hotel}`,
=======
        `${URL}hoteles/Consultar-tarifas-por-hotel/${hotel.id_hotel}`,
>>>>>>> e3878d92e481b7cc14bdba4af3ff718f7d339e1d
        //`http://localhost:3001/v1/mia/hoteles/Consultar-tarifas-por-hotel/${hotel.id_hotel}`,
        {
          method: "GET",
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("ERROR AL OBTENER LAS TARIFAS ACTUALES");
      }

      const result = await response.json();
      const currentRates = result.tarifas || [];

      // Helper function to find rate ID
      const findRateId = (agentId: string | null, roomType: number) => {
        return currentRates.find(
          (rate: TarifaData) =>
            rate.id_agente === agentId && rate.id_tipos_cuartos === roomType
        )?.id_tarifa;
      };

      // Get IDs for standard rates
      const sencillaId = findRateId(null, 1);
      const dobleId = findRateId(null, 2);

      // Construir la dirección completa
      const direccionCompleta = `${formData.calle || ""},${
        formData.numero || ""
      } ,${formData.Colonia}, ${formData.municipio}, ${formData.Estado}, CP ${
        formData.CodigoPostal
      }`;

      // Combine all notes fields
      const combinedNotes = combineNotes();

      // 1. Actualizar información del hotel
      const hotelPayload = {
        id_hotel: hotel.id_hotel,
        Id_hotel_excel: formData.Id_hotel_excel
          ? Number(formData.Id_hotel_excel)
          : null,
        tipo_negociacion: formData.tipo_negociacion || null,
        vigencia_convenio: formData.hay_convenio
          ? convertToDateInputFormat(formData.vigencia_convenio)
          : null,
        comentario_vigencia: !formData.hay_convenio
          ? formData.comentario_vigencia
          : null,
        nombre: formData.nombre,
        id_cadena: Number(formData.id_cadena),
        rfc: formData.rfc || null,
        razon_social: formData.razon_social || null,
        direccion: direccionCompleta,
        latitud: formData.latitud || null,
        longitud: formData.longitud || null,
        Estado: formData.Estado,
        Ciudad_Zona: formData.Ciudad_Zona,
        CodigoPostal: formData.CodigoPostal,
        Colonia: formData.Colonia,
        municipio: formData.municipio,
        tipo_hospedaje: formData.tipo_hospedaje || "hotel",
        cuenta_de_deposito: formData.cuenta_de_deposito || null,
        tipo_pago: formData.tipo_pago || null,
        disponibilidad_precio: formData.disponibilidad_precio || null,
        contacto_convenio: formData.contacto_convenio || null,
        contacto_recepcion: formData.contacto_recepcion || null,
        iva: formData.iva || null,
        ish: formData.ish || null,
        otros_impuestos: formData.otros_impuestos || null,
        otros_impuestos_porcentaje: formData.otros_impuestos_porcentaje || null,
        MenoresEdad: formData.MenoresEdad || null,
        paxExtraPersona: formData.doble.precio_persona_extra || null,
        Transportacion: formData.Transportacion || null,
        TransportacionComentarios: formData.TransportacionComentarios || null,
        mascotas: formData.mascotas || null,
        salones: formData.salones || null,
        URLImagenHotel: formData.URLImagenHotel || null,
        URLImagenHotelQ: formData.URLImagenHotelQ || null,
        URLImagenHotelQQ: formData.URLImagenHotelQQ || null,
        calificacion: formData.calificacion
          ? Number(formData.calificacion)
          : null,
        Activo: formData.Activo,
        Comentarios: combinedNotes || null,
        idSepomex: formData.idSepomex ? Number(formData.idSepomex) : null,
        comentario_pago: formData.comentario_pago || null,
        pais: formData.pais || null,
        score_operaciones: formData.score_operaciones || 0,
        score_sistemas: formData.score_sistemas || 0,
      };

      console.log("Actualizando hotel:", hotelPayload);

      const hotelResponse = await fetch(
        `${URL}hoteles/Editar-hotel/`,
        //`http://localhost:3001/v1/mia/hoteles/Editar-hotel/`
        {
          method: "PATCH",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(hotelPayload),
        }
      );

      if (!hotelResponse.ok) {
        const errorData = await hotelResponse.json();
        throw new Error(
          errorData.message ||
            `ERROR ${hotelResponse.status}: ${hotelResponse.statusText}`
        );
      }

      // 2. Update standard rates
      const formatNumber = (value: any) => {
        if (value === null || value === undefined || value === "")
          return "0.00";
        const num = Number(value);
        return isNaN(num) ? "0.00" : num.toFixed(2);
      };

      // Standard rate - Single room (type 1)
      const sencillaPayload = {
        id_tarifa: sencillaId,
        id_hotel: hotel.id_hotel,
        id_tipos_cuartos: 1,
        precio: formatNumber(formData.precio_q),
        costo: formatNumber(formData.costo_q),
        incluye_desayuno: formData.sencilla.incluye ? 1 : 0,
        precio_desayuno: formData.sencilla.incluye
          ? null
          : formatNumber(formData.sencilla.precio),
        precio_noche_extra: formatNumber(formData.sencilla.precio_noche_extra),
        comentario_desayuno: formData.sencilla.comentarios,
        tipo_desayuno: formData.sencilla.tipo_desayuno,
        precio_persona_extra: null,
      };

      // Standard rate - Double room (type 2)
      const doblePayload = {
        id_tarifa: dobleId,
        id_hotel: hotel.id_hotel,
        id_tipos_cuartos: 2,
        precio: formatNumber(formData.precio_qq),
        costo: formatNumber(formData.costo_qq),
        incluye_desayuno: formData.doble.incluye ? 1 : 0,
        precio_desayuno: formData.doble.incluye
          ? null
          : formatNumber(formData.doble.precio),
        precio_noche_extra: formatNumber(formData.doble.precio_noche_extra),
        comentario_desayuno: formData.doble.comentarios,
        tipo_desayuno: formData.doble.tipo_desayuno,
        precio_persona_extra: formatNumber(formData.doble.precio_persona_extra),
      };

      // 3. Update preferential rates
      const tarifasPreferencialesPayloads = tarifasPreferenciales.flatMap(
        (tarifa) => {
          if (!tarifa.id_agente) return [];

          // Use the stored tarifa IDs if available
          const sencillaPreferencialId =
            tarifa.id_tarifa_sencilla || findRateId(tarifa.id_agente, 1);
          const doblePreferencialId =
            tarifa.id_tarifa_doble || findRateId(tarifa.id_agente, 2);

          return [
            // Single room
            {
              id_tarifa: sencillaPreferencialId,
              id_hotel: hotel.id_hotel,
              id_agente: tarifa.id_agente,
              id_tipos_cuartos: 1,
              precio: formatNumber(tarifa.precio_q),
              costo: formatNumber(tarifa.costo_q),
              incluye_desayuno: tarifa.sencilla.incluye ? 1 : 0,
              precio_desayuno: tarifa.sencilla.incluye
                ? null
                : formatNumber(tarifa.sencilla.precio),
              precio_noche_extra: formatNumber(
                tarifa.sencilla.precio_noche_extra
              ),
              comentario_desayuno: tarifa.sencilla.comentarios,
              tipo_desayuno: tarifa.sencilla.tipo_desayuno,
              precio_persona_extra: null,
            },
            // Double room
            {
              id_tarifa: doblePreferencialId,
              id_hotel: hotel.id_hotel,
              id_agente: tarifa.id_agente,
              id_tipos_cuartos: 2,
              precio: formatNumber(tarifa.precio_qq),
              costo: formatNumber(tarifa.costo_qq),
              incluye_desayuno: tarifa.doble.incluye ? 1 : 0,
              precio_desayuno: tarifa.doble.incluye
                ? null
                : formatNumber(tarifa.doble.precio),
              precio_noche_extra: formatNumber(tarifa.doble.precio_noche_extra),
              comentario_desayuno: tarifa.doble.comentarios,
              tipo_desayuno: tarifa.doble.tipo_desayuno,
              precio_persona_extra: formatNumber(
                tarifa.doble.precio_persona_extra
              ),
            },
          ];
        }
      );

      // 4. Execute all rate updates
      const allTarifasPayloads = [
        sencillaPayload,
        doblePayload,
        ...tarifasPreferencialesPayloads,
      ];

      const tarifasPromises = allTarifasPayloads.map((payload) =>
        fetch(
          `${URL}hoteles/Actualiza-tarifa`,
          //`http://localhost:3001/v1/mia/hoteles/Actualiza-tarifa`
          {
            method: "PATCH",
            headers: {
              "x-api-key": API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        )
      );

      const tarifasResults = await Promise.all(tarifasPromises);
      const tarifasErrors = tarifasResults.filter((r) => !r.ok);

      if (tarifasErrors.length > 0) {
        throw new Error("ERROR AL ACTUALIZAR ALGUNAS TARIFAS");
      }

      setSuccessMessage("HOTEL Y TARIFAS ACTUALIZADOS CORRECTAMENTE");
      setMode("view");
      setEditingTarifaId(null);

      // Refresh data
      if (onSuccess) onSuccess();
      await fetchHotelRates(hotel.id_hotel);
    } catch (error: any) {
      setErrorMessage(error.message || "ERROR EN LA ACTUALIZACION");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logical delete of tarifa preferential (updated to handle both IDs)
  const handleDeleteTarifa = async () => {
    if (!selectedTarifaToDelete) {
      setErrorMessage("IDS DE TARIFA NO ENCONTRADOS");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // Call the endpoint for logical deletion with both IDs
      const response = await fetch(
        `${URL}hoteles/Eliminar-tarifa-preferencial`,
        //`http://localhost:3001/v1/mia/hoteles/Eliminar-tarifa-preferencial`
        {
          method: "PATCH",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_tarifa_preferencial_sencilla:
              selectedTarifaToDelete.id_tarifa_preferencial_sencilla,
            id_tarifa_preferencial_doble:
              selectedTarifaToDelete.id_tarifa_preferencial_doble,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `ERROR ${response.status}: ${response.statusText}`
        );
      }

      setSuccessMessage("TARIFA PREFERENCIAL INACTIVADA CORRECTAMENTE");

      // Refresh the hotel rates to reflect the changes
      if (hotel?.id_hotel) {
        await fetchHotelRates(hotel.id_hotel);
      }

      // Close the dialog
      setDeleteTarifaDialogOpen(false);
      setSelectedTarifaToDelete(null);
    } catch (error: any) {
      setErrorMessage(
        error.message || "ERROR AL INACTIVAR LA TARIFA PREFERENCIAL"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing a specific tarifa
  const startEditingTarifa = (index: number) => {
    setEditingTarifaId(index);
  };

  // Cancel editing a tarifa
  const cancelEditingTarifa = () => {
    setEditingTarifaId(null);
  };

  // Open delete confirmation for a tarifa preferencial (updated to send both IDs)
  const openDeleteTarifaDialog = (index: number) => {
    const tarifa = tarifasPreferenciales[index];

    if (!tarifa.id_tarifa_sencilla && !tarifa.id_tarifa_doble) {
      setErrorMessage("NO SE ENCONTRARON TARIFAS PREFERENCIALES PARA ELIMINAR");
      return;
    }

    setSelectedTarifaToDelete({
      id_tarifa_preferencial_sencilla: tarifa.id_tarifa_sencilla || null,
      id_tarifa_preferencial_doble: tarifa.id_tarifa_doble || null,
    });

    setDeleteTarifaDialogOpen(true);
  };

  if (!hotel) return null;
  const currentMode = mode as "view" | "edit";



  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {mode === "view" ? "DETALLE DEL HOTEL" : "EDITAR HOTEL"}
            </DialogTitle>

            {mode === "view" && (
              <div className="flex gap-2  mr-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("edit")}
                >
                  <Pencil size={16} className="mr-1" /> EDITAR
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 size={16} className="mr-1" /> ELIMINAR
                </Button>
              </div>
            )}

            {mode === "edit" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("view")}
                >
                  <ArrowLeft size={16} className="mr-1" /> CANCELAR
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </Button>
              </div>
            )}
          </DialogHeader>

          {/* Loading, Success and Error Messages */}
          {(isLoading || isFetchingRates) && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3">
                {isLoading ? "PROCESANDO..." : "CARGANDO TARIFAS..."}
              </span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Tabs Navigation */}
          <Tabs
            defaultValue="datosBasicos"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="datosBasicos" className="text-sm">
                DATOS BASICOS
              </TabsTrigger>
              <TabsTrigger value="tarifasServicios" className="text-sm">
                TARIFAS Y SERVICIOS
              </TabsTrigger>
              <TabsTrigger value="informacionPagos" className="text-sm">
                INFORMACION DE PAGOS
              </TabsTrigger>
              <TabsTrigger value="informacionAdicional" className="text-sm">
                INFORMACION ADICIONAL
              </TabsTrigger>
            </TabsList>

            {/* Tab: Datos Básicos */}
            <TabsContent
              value="datosBasicos"
              className="space-y-6 min-h-[400px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required fields first */}
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="nombre">
                    NOMBRE DEL PROVEEDOR <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="tipo_negociacion">
                    TIPO DE NEGOCIACION <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tipo_negociacion"
                    value={formData.tipo_negociacion}
                    onChange={(e) =>
                      handleChange("tipo_negociacion", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="hay_convenio"
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center">
                      <Checkbox
                        id="hay_convenio"
                        checked={formData.hay_convenio}
                        onCheckedChange={handleHayConvenioChange}
                        disabled={mode === "view"}
                        style={
                          mode === "view"
                            ? {
                                color: "black",
                                opacity: 1,
                                backgroundColor: "white",
                              }
                            : {}
                        }
                      />
                      <span className="ml-2 font-medium">¿HAY CONVENIO?</span>
                    </div>
                  </Label>
                </div>

                {formData.hay_convenio ? (
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="vigencia_convenio">
                      VIGENCIA DEL CONVENIO{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="vigencia_convenio"
                      type="date"
                      value={
                        formData.vigencia_convenio
                          ? convertToDateInputFormat(formData.vigencia_convenio)
                          : ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "vigencia_convenio",
                          convertToDateInputFormat(e.target.value)
                        )
                      }
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="font-medium"
                      required
                    />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="comentario_vigencia">
                      COMENTARIO VIGENCIA
                    </Label>
                    <Input
                      id="comentario_vigencia"
                      value={formData.comentario_vigencia}
                      onChange={(e) =>
                        handleChange("comentario_vigencia", e.target.value)
                      }
                      disabled={mode === "view" || mode == "edit"}
                      className="font-medium"
                    />
                  </div>
                )}

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="Activo">ESTATUS</Label>
                  <Select
                    value={String(formData.Activo)} // convierte true/false a "true"/"false"
                    onValueChange={(value) =>
                      handleChange("Activo", value === "true")
                    }
                    disabled={mode === "view"}
                  >
                    <SelectTrigger id="Activo" className="font-medium">
                      <SelectValue placeholder="SELECCIONA ESTATUS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true" className="uppercase">
                        ACTIVO
                      </SelectItem>
                      <SelectItem value="false" className="uppercase">
                        INACTIVO
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/*Logica del check de internacionales */}
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="internacional"
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center">
                      <Checkbox
                        id="internacional"
                        checked={formData.internacional}
                        onCheckedChange={handleInternacionalChange}
                        disabled={mode === "view"}
                      />
                      <span className="ml-2 font-medium">
                        Hotel internacional
                      </span>
                    </div>
                  </Label>
                </div>

                {formData.internacional && (
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="pais">
                      PAÍS <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pais"
                      value={formData.pais}
                      onChange={(e) => handleChange("pais", e.target.value)}
                      disabled={mode === "view"}
                      className="font-medium"
                      required
                    />
                  </div>
                )}
                {/*Fin logica check internacionales */}
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="estadoSelect">
                    ESTADO <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.Estado.toUpperCase()}
                    onValueChange={(val) =>
                      handleChange("Estado", val.toUpperCase())
                    }
                    disabled={mode === "view" || formData.internacional}
                    required
                  >
                    <SelectTrigger id="estadoSelect" className="font-medium">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700">
                      {estadosMX.map((estado) => (
                        <SelectItem
                          key={estado}
                          value={estado}
                          className="uppercase"
                        >
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="Ciudad_Zona">
                    CIUDAD <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="Ciudad_Zona"
                    value={formData.Ciudad_Zona}
                    onChange={(e) =>
                      handleChange("Ciudad_Zona", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    required
                  />
                </div>

                {/* Optional fields */}
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="Id_hotel_excel">ID EXCEL (SEGUIMIENTO)</Label>
                  <Input
                    id="Id_hotel_excel"
                    value={formData.Id_hotel_excel || ""}
                    onChange={(e) =>
                      handleChange("Id_hotel_excel", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="CodigoPostal">CODIGO POSTAL</Label>
                  <Input
                    id="CodigoPostal"
                    value={formData.CodigoPostal}
                    onChange={(e) =>
                      mode === "edit" &&
                      handleCodigoPostalChange(e.target.value)
                    }
                    maxLength={5}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                  />
                  {buscandoCP && (
                    <span className="text-xs text-blue-600">
                      BUSCANDO CODIGO POSTAL...
                    </span>
                  )}
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="calle">CALLE</Label>
                  <Input
                    id="calle"
                    value={formData.calle || ""}
                    onChange={(e) => handleChange("calle", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="numero">NUMERO</Label>
                  <Input
                    id="numero"
                    value={formData.numero || ""}
                    onChange={(e) => handleChange("numero", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                  />
                </div>

                {mode === "edit" && colonias.length > 0 ? (
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="Colonia">COLONIA</Label>
                    <Select
                      onValueChange={(value) => {
                        // Al seleccionar del dropdown, limpiamos el valor manual
                        handleChange("Colonia", ""); // Resetear input
                        handleColoniaChange(value); // Procesar selección
                      }}
                      value="" // Forzamos a que no haya selección para que siempre muestre el placeholder
                      disabled={currentMode === "view"}
                    >
                      <SelectTrigger
                        id="Colonia"
                        className="w-full font-medium"
                      >
                        <SelectValue
                          placeholder={
                            formData.Colonia || "SELECCIONA UNA COLONIA"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {colonias.map((colonia) => (
                          <SelectItem
                            key={colonia.id}
                            value={colonia.id.toString()}
                            className="uppercase"
                          >
                            {colonia.d_asenta.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="Colonia">COLONIA</Label>
                    <Input
                      id="Colonia"
                      value={formData.Colonia}
                      onChange={(e) => {
                        // Al escribir manualmente, limpiamos cualquier selección previa
                        handleColoniaChange(""); // Resetear selección
                        handleChange("Colonia", e.target.value); // Guardar valor manual
                      }}
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="font-medium"
                    />
                  </div>
                )}

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="municipio">MUNICIPIO</Label>
                  <Input
                    id="municipio"
                    value={formData.municipio}
                    onChange={(e) => handleChange("municipio", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="disponibilidad_precio">
                    ¿COMO SE SOLICITA LA DISPONIBILIDAD?
                  </Label>
                  <Textarea
                    id="disponibilidad_precio"
                    value={formData.disponibilidad_precio || ""}
                    onChange={(e) =>
                      handleChange("disponibilidad_precio", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[80px] font-medium"
                    placeholder="EMAIL, TELEFONO, ETC."
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="contacto_convenio">
                    CONTACTOS DE CONVENIO
                  </Label>
                  <Textarea
                    id="contacto_convenio"
                    value={formData.contacto_convenio}
                    onChange={(e) =>
                      handleChange("contacto_convenio", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[80px] font-medium"
                    placeholder="NOMBRE Y DATOS DE CONTACTO"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="contacto_recepcion">
                    CONTACTOS DE RECEPCION
                  </Label>
                  <Textarea
                    id="contacto_recepcion"
                    value={formData.contacto_recepcion}
                    onChange={(e) =>
                      handleChange("contacto_recepcion", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[80px] font-medium"
                    placeholder="NOMBRE Y DATOS DE CONTACTO"
                  />
                </div>

               <div className="flex flex-col space-y-1">
  <Label htmlFor="uploadImage">Imagen del Hotel</Label>
  {formData.URLImagenHotel && (
    <span className="text-xs text-muted-foreground break-all">{formData.URLImagenHotel}</span>
  )}

      <Button
        variant="outline"
        type="button"
        disabled={mode === "view" || imageUploadStatus === "loading"}
        onClick={() => document.getElementById("uploadImageInput")?.click()}
      >
        {imageUploadStatus === "loading" ? "Subiendo..." : "Subir Imagen"}
      </Button>

      <input
        id="uploadImageInput"
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageChange}
      />

      {imageUploadStatus === "success" && (
        <p className="text-green-600 text-sm">Imagen subida correctamente</p>
      )}
      {imageUploadStatus === "error" && (
        <p className="text-red-600 text-sm">Error al subir la imagen</p>
      )}
    </div>



                <div className="flex flex-col space-y-1">
                  <Label htmlFor="URLImagenHotelQ">
                    IMAGEN HABITACION SENCILLA (URL)
                  </Label>
                  <Input
                    id="URLImagenHotelQ"
                    value={formData.URLImagenHotelQ}
                    onChange={(e) =>
                      handleChange("URLImagenHotelQ", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="HTTPS://EJEMPLO.COM/IMAGEN.JPG"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="URLImagenHotelQQ">
                    IMAGEN HABITACION DOBLE (URL)
                  </Label>
                  <Input
                    id="URLImagenHotelQQ"
                    value={formData.URLImagenHotelQQ}
                    onChange={(e) =>
                      handleChange("URLImagenHotelQQ", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="HTTPS://EJEMPLO.COM/IMAGEN.JPG"
                  />
                </div>

                {/* Notes field for this tab */}
                <div className="col-span-1 md:col-span-2 flex flex-col space-y-1 mt-4 border-t pt-4">
                  <Label htmlFor="notas_datosBasicos">
                    NOTAS DATOS BÁSICOS
                  </Label>
                  <Textarea
                    id="notas_datosBasicos"
                    value={formData.notas_datosBasicos}
                    onChange={(e) =>
                      handleChange("notas_datosBasicos", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[100px] font-medium"
                    placeholder="NOTAS ESPECÍFICAS SOBRE LOS DATOS BÁSICOS"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Tarifas y Servicios */}
            <TabsContent
              value="tarifasServicios"
              className="space-y-6 min-h-[400px]"
            >
              <div>
                <h3 className="text-lg font-semibold mb-4">TARIFA GENERAL</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Required fields first */}
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="costo_q">
                      COSTO PROVEEDOR HABITACION SENCILLA CON IMPUESTOS{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="costo_q"
                      placeholder="0.00"
                      value={formData.costo_q}
                      onChange={(e) => handleChange("costo_q", e.target.value)}
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="font-medium"
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="precio_q">
                      PRECIO DE VENTA HABITACION SENCILLA CON IMPUESTOS{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="precio_q"
                      placeholder="0.00"
                      value={formData.precio_q}
                      onChange={(e) => handleChange("precio_q", e.target.value)}
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="font-medium"
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="costo_qq">
                      COSTO PROVEEDOR HABITACION DOBLE CON IMPUESTOS{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="costo_qq"
                      placeholder="0.00"
                      value={formData.costo_qq}
                      onChange={(e) => handleChange("costo_qq", e.target.value)}
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="font-medium"
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="precio_qq">
                      PRECIO DE VENTA HABITACION DOBLE CON IMPUESTOS{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="precio_qq"
                      placeholder="0.00"
                      value={formData.precio_qq}
                      onChange={(e) =>
                        handleChange("precio_qq", e.target.value)
                      }
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="precio_persona_extra">
                      COSTO POR PERSONA EXTRA CON IMPUESTOS
                    </Label>
                    <Input
                      id="precio_persona_extra"
                      placeholder="0.00"
                      value={formData.doble.precio_persona_extra}
                      onChange={(e) =>
                        handleChange(
                          "doble.precio_persona_extra",
                          e.target.value
                        )
                      }
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="font-medium"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="MenoresEdad">MENORES DE EDAD</Label>
                    <Textarea
                      id="MenoresEdad"
                      value={formData.MenoresEdad}
                      onChange={(e) =>
                        handleChange("MenoresEdad", e.target.value)
                      }
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="min-h-[80px] font-medium"
                      placeholder="INFORMACION SOBRE ESTADIA DE MENORES"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="iva">IMPUESTOS (IVA) EN %</Label>
                  <Input
                    id="iva"
                    value={formData.iva}
                    onChange={(e) => handleChange("iva", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="EJ: 16.00"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="ish">IMPUESTOS (ISH) EN %</Label>
                  <Input
                    id="ish"
                    value={formData.ish}
                    onChange={(e) => handleChange("ish", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="EJ: 3.00"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="otros_impuestos_porcentaje">
                    IMPUESTOS (OTROS) EN %
                  </Label>
                  <Input
                    id="otros_impuestos_porcentaje"
                    value={formData.otros_impuestos_porcentaje}
                    onChange={(e) =>
                      handleChange("otros_impuestos_porcentaje", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="EJ: 5.00"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="otros_impuestos">
                    IMPUESTOS (OTROS) MONTO
                  </Label>
                  <Input
                    id="otros_impuestos"
                    value={formData.otros_impuestos}
                    onChange={(e) =>
                      handleChange("otros_impuestos", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="EJ: 100.00"
                  />
                </div>

                {/* Opciones de desayuno para habitación sencilla */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="incluye-sencilla-general"
                      checked={formData.sencilla.incluye}
                      onChange={(e) =>
                        handleChange("sencilla.incluye", e.target.checked)
                      }
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="incluye-sencilla-general"
                      className="font-medium"
                    >
                      ¿INCLUYE DESAYUNO EN HABITACION SENCILLA?
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="sencilla_tipo_desayuno">
                        TIPO DE DESAYUNO
                      </Label>
                      <Input
                        id="sencilla_tipo_desayuno"
                        value={formData.sencilla.tipo_desayuno}
                        onChange={(e) =>
                          handleChange("sencilla.tipo_desayuno", e.target.value)
                        }
                        disabled={mode === "view"}
                        style={
                          mode === "view"
                            ? {
                                color: "black",
                                opacity: 1,
                                backgroundColor: "white",
                              }
                            : {}
                        }
                        className="font-medium"
                        placeholder="CONTINENTAL, AMERICANO, ETC."
                      />
                    </div>

                    {!formData.sencilla.incluye && (
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="sencilla_precio">
                          COSTO DEL DESAYUNO CON IMPUESTOS
                        </Label>
                        <Input
                          id="sencilla_precio"
                          type="number"
                          placeholder="0.00"
                          value={formData.sencilla.precio}
                          onChange={(e) =>
                            handleChange("sencilla.precio", e.target.value)
                          }
                          disabled={mode === "view"}
                          style={
                            mode === "view"
                              ? {
                                  color: "black",
                                  opacity: 1,
                                  backgroundColor: "white",
                                }
                              : {}
                          }
                          className="font-medium"
                        />
                      </div>
                    )}

                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="sencilla_comentarios">COMENTARIO</Label>
                      <Textarea
                        id="sencilla_comentarios"
                        value={formData.sencilla.comentarios}
                        onChange={(e) =>
                          handleChange("sencilla.comentarios", e.target.value)
                        }
                        disabled={mode === "view"}
                        style={
                          mode === "view"
                            ? {
                                color: "black",
                                opacity: 1,
                                backgroundColor: "white",
                              }
                            : {}
                        }
                        className="min-h-[80px] font-medium"
                        placeholder="DETALLES ADICIONALES"
                      />
                    </div>
                  </div>
                </div>

                {/* Opciones de desayuno para habitación doble */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="incluye-doble-general"
                      checked={formData.doble.incluye}
                      onChange={(e) =>
                        handleChange("doble.incluye", e.target.checked)
                      }
                      disabled={mode === "view"}
                      style={
                        mode === "view"
                          ? {
                              color: "black",
                              opacity: 1,
                              backgroundColor: "white",
                            }
                          : {}
                      }
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="incluye-doble-general"
                      className="font-medium"
                    >
                      ¿INCLUYE DESAYUNO EN HABITACION DOBLE?
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="doble_tipo_desayuno">
                        TIPO DE DESAYUNO
                      </Label>
                      <Input
                        id="doble_tipo_desayuno"
                        value={formData.doble.tipo_desayuno}
                        onChange={(e) =>
                          handleChange("doble.tipo_desayuno", e.target.value)
                        }
                        disabled={mode === "view"}
                        style={
                          mode === "view"
                            ? {
                                color: "black",
                                opacity: 1,
                                backgroundColor: "white",
                              }
                            : {}
                        }
                        className="font-medium"
                        placeholder="CONTINENTAL, AMERICANO, ETC."
                      />
                    </div>

                    {!formData.doble.incluye && (
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="doble_precio">
                          COSTO DEL DESAYUNO CON IMPUESTOS
                        </Label>
                        <Input
                          id="doble_precio"
                          type="number"
                          placeholder="0.00"
                          value={formData.doble.precio}
                          onChange={(e) =>
                            handleChange("doble.precio", e.target.value)
                          }
                          disabled={mode === "view"}
                          style={
                            mode === "view"
                              ? {
                                  color: "black",
                                  opacity: 1,
                                  backgroundColor: "white",
                                }
                              : {}
                          }
                          className="font-medium"
                        />
                      </div>
                    )}

                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="doble_comentarios">COMENTARIO</Label>
                      <Textarea
                        id="doble_comentarios"
                        value={formData.doble.comentarios}
                        onChange={(e) =>
                          handleChange("doble.comentarios", e.target.value)
                        }
                        disabled={mode === "view"}
                        style={
                          mode === "view"
                            ? {
                                color: "black",
                                opacity: 1,
                                backgroundColor: "white",
                              }
                            : {}
                        }
                        className="min-h-[80px] font-medium"
                        placeholder="DETALLES ADICIONALES"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarifas preferenciales */}
              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    TARIFAS PREFERENCIALES
                  </h3>
                  {mode === "edit" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addTarifaPreferencial}
                      className="flex items-center gap-1"
                    >
                      <Plus size={16} /> AGREGAR
                    </Button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2">
                  {tarifasPreferenciales.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-md">
                      NO HAY TARIFAS PREFERENCIALES.
                      {mode === "edit" && " AGREGA UNA PARA COMENZAR."}
                    </div>
                  ) : (
                    tarifasPreferenciales.map((tarifa, index) => (
                      <div
                        key={index}
                        className="border rounded-md p-4 mb-4 space-y-4"
                      >
                        {/* Header de tarifa con botones de edición/eliminación */}
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">TARIFA {index + 1}</h4>
                          {mode === "view" && editingTarifaId !== index && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingTarifa(index)}
                              >
                                <Pencil size={16} className="mr-1" /> EDITAR
                              </Button>
                              {/* Botón para eliminar ambas tarifas en un solo click */}
                              {(tarifa.id_tarifa_sencilla ||
                                tarifa.id_tarifa_doble) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => openDeleteTarifaDialog(index)}
                                >
                                  <Trash2 size={16} className="mr-1" /> ELIMINAR
                                  TARIFA
                                </Button>
                              )}
                            </div>
                          )}
                          {editingTarifaId === index && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditingTarifa}
                              >
                                <ArrowLeft size={16} className="mr-1" />{" "}
                                CANCELAR
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUpdate()}
                                disabled={isLoading}
                              >
                                {isLoading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                              </Button>
                              {/* Botón para eliminar ambas tarifas en un solo click (en modo edición) */}
                              {(tarifa.id_tarifa_sencilla ||
                                tarifa.id_tarifa_doble) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => openDeleteTarifaDialog(index)}
                                >
                                  <Trash2 size={16} className="mr-1" /> ELIMINAR
                                  TARIFA
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Búsqueda de agente */}
                        {mode === "edit" || editingTarifaId === index ? (
                          <div className="grid grid-cols-1 gap-4">
                            <div className="relative">
                              <Label className="mb-2 block">
                                BUSCAR AGENTE
                              </Label>
                              <div className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`nombre-agente-${index}`}
                                    className="sr-only"
                                  >
                                    NOMBRE DEL AGENTE
                                  </Label>
                                  <Input
                                    id={`nombre-agente-${index}`}
                                    placeholder="NOMBRE DEL AGENTE"
                                    value={tarifa.busqueda.nombre}
                                    onChange={(e) =>
                                      handleSearchInputChange(
                                        index,
                                        "nombre",
                                        e.target.value
                                      )
                                    }
                                    className="font-medium"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`correo-agente-${index}`}
                                    className="sr-only"
                                  >
                                    CORREO DEL AGENTE
                                  </Label>
                                  <Input
                                    id={`correo-agente-${index}`}
                                    placeholder="CORREO DEL AGENTE"
                                    value={tarifa.busqueda.correo}
                                    onChange={(e) =>
                                      handleSearchInputChange(
                                        index,
                                        "correo",
                                        e.target.value
                                      )
                                    }
                                    className="font-medium"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleSearch(index)}
                                  className="flex-shrink-0"
                                >
                                  <Search size={18} />
                                </Button>
                              </div>

                              {tarifa.busqueda.resultados.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 border bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-[150px] overflow-y-auto">
                                  {tarifa.busqueda.resultados.map((agente) => (
                                    <div
                                      key={agente.id_agente}
                                      className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      onClick={() =>
                                        handleSelectAgente(index, agente)
                                      }
                                    >
                                      <div className="font-medium">
                                        {agente.primer_nombre.toUpperCase()}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {agente.correo}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {tarifa.busqueda.buscando && (
                                <div className="text-sm text-blue-500 mt-1">
                                  BUSCANDO AGENTES...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm p-2 rounded border border-gray-200 bg-gray-50 font-medium">
                            <span className="font-semibold">AGENTE:</span>{" "}
                            {tarifa.nombre_agente || "NO ESPECIFICADO"}{" "}
                            {tarifa.correo_agente
                              ? `(${tarifa.correo_agente})`
                              : ""}
                          </div>
                        )}

                        {tarifa.id_agente &&
                          (mode === "edit" || editingTarifaId === index) && (
                            <div className="text-sm bg-blue-50 dark:bg-blue-900 p-2 rounded border border-blue-200 dark:border-blue-800 font-medium">
                              <span className="font-semibold">
                                AGENTE SELECCIONADO:
                              </span>{" "}
                              {tarifa.nombre_agente} ({tarifa.correo_agente})
                            </div>
                          )}

                        {/* Tarifas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="flex flex-col space-y-1">
                            <Label htmlFor={`costo_q_${index}`}>
                              COSTO PROVEEDOR HABITACION SENCILLA
                            </Label>
                            <Input
                              id={`costo_q_${index}`}
                              placeholder="0.00"
                              value={tarifa.costo_q}
                              onChange={(e) =>
                                handleTarifaPreferencialChange(
                                  index,
                                  "costo_q",
                                  e.target.value
                                )
                              }
                              disabled={
                                mode === "view" && editingTarifaId !== index
                              }
                              className="font-medium"
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Label htmlFor={`precio_q_${index}`}>
                              PRECIO DE VENTA HABITACION SENCILLA
                            </Label>
                            <Input
                              id={`precio_q_${index}`}
                              placeholder="0.00"
                              value={tarifa.precio_q}
                              onChange={(e) =>
                                handleTarifaPreferencialChange(
                                  index,
                                  "precio_q",
                                  e.target.value
                                )
                              }
                              disabled={
                                mode === "view" && editingTarifaId !== index
                              }
                              className="font-medium"
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Label htmlFor={`costo_qq_${index}`}>
                              COSTO PROVEEDOR HABITACION DOBLE
                            </Label>
                            <Input
                              id={`costo_qq_${index}`}
                              placeholder="0.00"
                              value={tarifa.costo_qq}
                              onChange={(e) =>
                                handleTarifaPreferencialChange(
                                  index,
                                  "costo_qq",
                                  e.target.value
                                )
                              }
                              disabled={
                                mode === "view" && editingTarifaId !== index
                              }
                              className="font-medium"
                            />
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Label htmlFor={`precio_qq_${index}`}>
                              PRECIO DE VENTA HABITACION DOBLE
                            </Label>
                            <Input
                              id={`precio_qq_${index}`}
                              placeholder="0.00"
                              value={tarifa.precio_qq}
                              onChange={(e) =>
                                handleTarifaPreferencialChange(
                                  index,
                                  "precio_qq",
                                  e.target.value
                                )
                              }
                              disabled={
                                mode === "view" && editingTarifaId !== index
                              }
                              className="font-medium"
                            />
                          </div>
                        </div>

                        {/* Opciones de desayuno para habitación sencilla (tarifa preferencial) */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              id={`pref-sencilla-${index}`}
                              checked={tarifa.sencilla.incluye}
                              onChange={(e) =>
                                handleTarifaPreferencialChange(
                                  index,
                                  "sencilla.incluye",
                                  e.target.checked
                                )
                              }
                              disabled={
                                mode === "view" && editingTarifaId !== index
                              }
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={`pref-sencilla-${index}`}
                              className="font-medium"
                            >
                              ¿INCLUYE DESAYUNO EN HABITACION SENCILLA?
                            </Label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                            <div className="flex flex-col space-y-1">
                              <Label
                                htmlFor={`sencilla_tipo_desayuno_${index}`}
                              >
                                TIPO DE DESAYUNO
                              </Label>
                              <Input
                                id={`sencilla_tipo_desayuno_${index}`}
                                value={tarifa.sencilla.tipo_desayuno}
                                onChange={(e) =>
                                  handleTarifaPreferencialChange(
                                    index,
                                    "sencilla.tipo_desayuno",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  mode === "view" && editingTarifaId !== index
                                }
                                className="font-medium"
                                placeholder="CONTINENTAL, AMERICANO, ETC."
                              />
                            </div>

                            {!tarifa.sencilla.incluye && (
                              <div className="flex flex-col space-y-1">
                                <Label htmlFor={`sencilla_precio_${index}`}>
                                  COSTO DEL DESAYUNO CON IMPUESTOS
                                </Label>
                                <Input
                                  id={`sencilla_precio_${index}`}
                                  type="number"
                                  placeholder="0.00"
                                  value={tarifa.sencilla.precio}
                                  onChange={(e) =>
                                    handleTarifaPreferencialChange(
                                      index,
                                      "sencilla.precio",
                                      e.target.value
                                    )
                                  }
                                  disabled={
                                    mode === "view" && editingTarifaId !== index
                                  }
                                  className="font-medium"
                                />
                              </div>
                            )}

                            <div className="flex flex-col space-y-1">
                              <Label htmlFor={`sencilla_comentarios_${index}`}>
                                COMENTARIO
                              </Label>
                              <Textarea
                                id={`sencilla_comentarios_${index}`}
                                value={tarifa.sencilla.comentarios}
                                onChange={(e) =>
                                  handleTarifaPreferencialChange(
                                    index,
                                    "sencilla.comentarios",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  mode === "view" && editingTarifaId !== index
                                }
                                className="min-h-[80px] font-medium"
                                placeholder="DETALLES ADICIONALES"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Opciones de desayuno para habitación doble (tarifa preferencial) */}
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              id={`pref-doble-${index}`}
                              checked={tarifa.doble.incluye}
                              onChange={(e) =>
                                handleTarifaPreferencialChange(
                                  index,
                                  "doble.incluye",
                                  e.target.checked
                                )
                              }
                              disabled={
                                mode === "view" && editingTarifaId !== index
                              }
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={`pref-doble-${index}`}
                              className="font-medium"
                            >
                              ¿INCLUYE DESAYUNO EN HABITACION DOBLE?
                            </Label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                            <div className="flex flex-col space-y-1">
                              <Label htmlFor={`doble_tipo_desayuno_${index}`}>
                                TIPO DE DESAYUNO
                              </Label>
                              <Input
                                id={`doble_tipo_desayuno_${index}`}
                                value={tarifa.doble.tipo_desayuno}
                                onChange={(e) =>
                                  handleTarifaPreferencialChange(
                                    index,
                                    "doble.tipo_desayuno",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  mode === "view" && editingTarifaId !== index
                                }
                                className="font-medium"
                                placeholder="CONTINENTAL, AMERICANO, ETC."
                              />
                            </div>

                            {!tarifa.doble.incluye && (
                              <div className="flex flex-col space-y-1">
                                <Label htmlFor={`doble_precio_${index}`}>
                                  COSTO DEL DESAYUNO CON IMPUESTOS
                                </Label>
                                <Input
                                  id={`doble_precio_${index}`}
                                  type="number"
                                  placeholder="0.00"
                                  value={tarifa.doble.precio}
                                  onChange={(e) =>
                                    handleTarifaPreferencialChange(
                                      index,
                                      "doble.precio",
                                      e.target.value
                                    )
                                  }
                                  disabled={
                                    mode === "view" && editingTarifaId !== index
                                  }
                                  className="font-medium"
                                />
                              </div>
                            )}

                            <div className="flex flex-col space-y-1">
                              <Label htmlFor={`doble_comentarios_${index}`}>
                                COMENTARIO
                              </Label>
                              <Textarea
                                id={`doble_comentarios_${index}`}
                                value={tarifa.doble.comentarios}
                                onChange={(e) =>
                                  handleTarifaPreferencialChange(
                                    index,
                                    "doble.comentarios",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  mode === "view" && editingTarifaId !== index
                                }
                                className="min-h-[80px] font-medium"
                                placeholder="DETALLES ADICIONALES"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción específicos para tarifas */}
                        <div className="flex justify-end mt-4 gap-2">
                          {mode === "edit" && (
                            <Button
                              variant="outline"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => removeTarifaPreferencial(index)}
                              size="sm"
                            >
                              <Trash2 size={16} className="mr-1" /> ELIMINAR
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Notes field for this tab */}
                <div className="col-span-1 md:col-span-2 flex flex-col space-y-1 mt-4 border-t pt-4">
                  <Label htmlFor="notas_tarifasServicios">
                    NOTAS TARIFAS Y SERVICIOS
                  </Label>
                  <Textarea
                    id="notas_tarifasServicios"
                    value={formData.notas_tarifasServicios}
                    onChange={(e) =>
                      handleChange("notas_tarifasServicios", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[100px] font-medium"
                    placeholder="NOTAS ESPECÍFICAS SOBRE TARIFAS Y SERVICIOS"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Información de Pagos */}
            <TabsContent
              value="informacionPagos"
              className="space-y-6 min-h-[400px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="tipo_pago">
                    PROVEEDOR: A CREDITO O PREPAGO
                  </Label>
                  <Select
                    value={formData.tipo_pago}
                    onValueChange={(value) => handleChange("tipo_pago", value)}
                    disabled={mode === "view"}
                  >
                    <SelectTrigger id="tipo_pago" className="font-medium">
                      <SelectValue placeholder="SELECCIONA EL TIPO DE PAGO" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDITO" className="uppercase">
                        CREDITO
                      </SelectItem>
                      <SelectItem value="PREPAGO" className="uppercase">
                        PREPAGO
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="comentario_pago">DETALLES TIPO DE PAGO</Label>
                  <Textarea
                    id="comentario_pago"
                    value={formData.comentario_pago || ""}
                    onChange={(e) =>
                      handleChange("comentario_pago", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[80px] font-medium"
                    placeholder="INFORMACION ADICIONAL SOBRE EL PAGO"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="razon_social">RAZON SOCIAL</Label>
                  <Input
                    id="razon_social"
                    value={formData.razon_social}
                    onChange={(e) =>
                      handleChange("razon_social", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="NOMBRE LEGAL DE LA EMPRESA"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={formData.rfc}
                    onChange={(e) => handleChange("rfc", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="font-medium"
                    placeholder="REGISTRO FEDERAL DE CONTRIBUYENTES"
                  />
                </div>

                {/* Notes field for this tab */}
                <div className="col-span-1 md:col-span-2 flex flex-col space-y-1 mt-4 border-t pt-4">
                  <Label htmlFor="notas_informacionPagos">
                    NOTAS INFORMACIÓN DE PAGOS
                  </Label>
                  <Textarea
                    id="notas_informacionPagos"
                    value={formData.notas_informacionPagos}
                    onChange={(e) =>
                      handleChange("notas_informacionPagos", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[100px] font-medium"
                    placeholder="NOTAS ESPECÍFICAS SOBRE INFORMACIÓN DE PAGOS"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Información Adicional */}
            <TabsContent
              value="informacionAdicional"
              className="space-y-6 min-h-[400px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="mascotas">MASCOTAS</Label>
                  <Textarea
                    id="mascotas"
                    value={formData.mascotas || ""}
                    onChange={(e) => handleChange("mascotas", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[100px] font-medium"
                    placeholder="POLITICAS PARA MASCOTAS"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="salones">SALONES</Label>
                  <Textarea
                    id="salones"
                    value={formData.salones || ""}
                    onChange={(e) => handleChange("salones", e.target.value)}
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[100px] font-medium"
                    placeholder="INFORMACION SOBRE SALONES DISPONIBLES"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="Transportacion">TRANSPORTACION</Label>
                  <Textarea
                    id="Transportacion"
                    value={formData.Transportacion}
                    onChange={(e) =>
                      handleChange("Transportacion", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[100px] font-medium"
                    placeholder="DETALLES DE TRANSPORTACION"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="score_operaciones">SCORE </Label>
                  <Input
                    type="number"
                    id="salones"
                    value={formData.score_operaciones || ""}
                    onChange={(e) =>
                      handleChange("score_operaciones", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className=" font-medium"
                    placeholder="SCORE DEL PROVEEDOR"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="notas_informacion_adicional">
                    NOTA INFORMACION ADICIONAL
                  </Label>
                  <Textarea
                    id="notas_informacion_adicional"
                    value={formData.notas_informacion_adicional}
                    onChange={(e) =>
                      handleChange(
                        "notas_informacion_adicional",
                        e.target.value
                      )
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[100px] font-medium"
                    placeholder="INFORMACION ADICIONAL"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col space-y-1 mt-4 border-t pt-4">
                  <Label htmlFor="notas_generales">NOTAS GENERALES</Label>
                  <Textarea
                    id="notas_generales"
                    value={formData.notas_generales}
                    onChange={(e) =>
                      handleChange("notas_generales", e.target.value)
                    }
                    disabled={mode === "view"}
                    style={
                      mode === "view"
                        ? {
                            color: "black",
                            opacity: 1,
                            backgroundColor: "white",
                          }
                        : {}
                    }
                    className="min-h-[120px] font-medium"
                    placeholder="INFORMACIÓN GENERAL ADICIONAL"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿ESTAS SEGURO?</AlertDialogTitle>
            <AlertDialogDescription>
              ESTA ACCION NO SE PUEDE DESHACER. SE ELIMINARA PERMANENTEMENTE EL
              HOTEL <strong>{hotel.nombre?.toUpperCase()}</strong> Y TODOS SUS
              DATOS ASOCIADOS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>CANCELAR</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 text-white border-b-2 rounded-full"></div>
                  <span>ELIMINANDO...</span>
                </div>
              ) : (
                "ELIMINAR"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tarifa Confirmation Dialog */}
      <AlertDialog
        open={deleteTarifaDialogOpen}
        onOpenChange={setDeleteTarifaDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿INACTIVAR TARIFA PREFERENCIAL?</AlertDialogTitle>
            <AlertDialogDescription>
              ESTA ACCION MARCARA AMBAS TARIFAS PREFERENCIALES (SENCILLA Y
              DOBLE) COMO INACTIVAS EN EL SISTEMA. SE REALIZARA UNA ELIMINACION
              LOGICA DE LA TARIFA PREFERENCIAL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>CANCELAR</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTarifa}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 text-white border-b-2 rounded-full"></div>
                  <span>INACTIVANDO...</span>
                </div>
              ) : (
                "INACTIVAR TARIFA PREFERENCIAL"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
