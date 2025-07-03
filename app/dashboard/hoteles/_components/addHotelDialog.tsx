"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Search, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_KEY } from "@/lib/constants";
import { URL } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { quitarAcentos } from "./hotel-dialog";
import { normalizarEstado } from "./hotel-dialog";
import { uploadHotelImage } from "../_utils/uploadHotelImage";

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

interface AddHotelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface HabitacionData {
  incluye: boolean;
  tipo_desayuno: string;
  precio: string;
  comentarios: string;
  precio_noche_extra: string;
  precio_persona_extra?: string;
}

interface TarifaPreferencial {
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

interface FormData {
  id_excel?: string;
  id_cadena: string;
  activo: number;
  nombre: string;
  codigoPostal: string;
  calle: string;
  numero: string;
  colonia: string;
  internacional: boolean;
  pais: string;
  estado: string;
  ciudad_zona: string;
  municipio: string;
  tipo_negociacion: string;
  hay_convenio: boolean;
  vigencia_convenio: string;
  comentario_vigencia: string;
  urlImagenHotel: string;
  urlImagenHotelQ: string;
  urlImagenHotelQQ: string;
  tipo_pago: string;
  disponibilidad_precio: string;
  contacto_convenio: string;
  contacto_recepcion: string;
  iva: string;
  ish: string;
  otros_impuestos: string;
  otros_impuestos_porcentaje: string;
  menoresEdad: string;
  transportacion: string;
  transportacionComentarios: string;
  mascotas: string;
  salones: string;
  rfc: string;
  razon_social: string;
  calificacion: string;
  tipo_hospedaje: string;
  id_sepomex: string;
  notas_datosBasicos: string;
  notas_tarifasServicios: string;
  notas_informacionPagos: string;
  notas_informacion_adicional: string;
  notas_generales: string;
  notas: string;
  latitud: string;
  longitud: string;
  solicitud_disponibilidad: string;
  comentario_pago: string;
  costo_q: string;
  precio_q: string;
  costo_qq: string;
  precio_qq: string;
  precio_persona_extra: string;
  sencilla: HabitacionData;
  doble: HabitacionData;
  score_operaciones?: number;
}

// API Functions
const buscarCodigoPostal = async (codigo: string) => {
  try {
    const response = await fetch(
      // `http://localhost:5173/v1/sepoMex/buscar-codigo-postal?d_codigo=${codigo}`,
      `${URL}/sepoMex/buscar-codigo-postal?d_codigo=${codigo}`,
      {
        method: "GET",
        headers: {
          "x-api-key": API_KEY,
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
      //`http://localhost:5173/v1/mia/agentes/get-agente-id?nombre=${encodeURIComponent(nombre)}&correo=${encodeURIComponent(correo)}`,
      `${URL}/mia/agentes/get-agente-id?nombre=${encodeURIComponent(
        nombre
      )}&correo=${encodeURIComponent(correo)}`,
      {
        method: "GET",
        headers: {
          "x-api-key": API_KEY,
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

// Convierte 'DD-MM-YYYY' a 'YYYY-MM-DD' para el campo date
const convertToDateInputFormat = (dateString: string): string => {
  if (!dateString) return "";
  const [day, month, year] = dateString.split("-");
  return `${year}-${month}-${day}`; // Devuelve 'YYYY-MM-DD'
};

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

// Convierte 'YYYY-MM-DD' a 'DD-MM-YYYY' para almacenarlo en el estado
const convertToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`; // Devuelve 'DD-MM-YYYY'
};

export function AddHotelDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddHotelDialogProps) {
  // Initial form state
  const [formData, setFormData] = useState<FormData>({
    id_cadena: "",
    activo: 1,
    nombre: "",
    codigoPostal: "",
    calle: "",
    numero: "",
    colonia: "",
    estado: "",
    internacional: false,
    pais: "",
    ciudad_zona: "",
    municipio: "",
    tipo_negociacion: "",
    hay_convenio: true,
    vigencia_convenio: "",
    comentario_vigencia: "SIN CONVENIO",
    urlImagenHotel: "",
    urlImagenHotelQ: "",
    urlImagenHotelQQ: "",
    tipo_pago: "",
    disponibilidad_precio: "",
    contacto_convenio: "",
    contacto_recepcion: "",
    iva: "",
    ish: "",
    otros_impuestos: "",
    otros_impuestos_porcentaje: "",
    menoresEdad: "",
    transportacion: "",
    transportacionComentarios: "",
    mascotas: "",
    salones: "",
    rfc: "",
    razon_social: "",
    calificacion: "",
    tipo_hospedaje: "hotel",
    notas_datosBasicos: "",
    notas_tarifasServicios: "",
    notas_informacionPagos: "",
    notas_generales: "",
    notas_informacion_adicional: "",
    notas: "",
    id_sepomex: "",
    latitud: "",
    longitud: "",
    solicitud_disponibilidad: "",
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
      precio_persona_extra: "",
      precio_noche_extra: "",
    },
    score_operaciones: 0,
  });

  // State for CP search and form management
  const [colonias, setColonias] = useState<CodigoPostalData[]>([]);
  const [buscandoCP, setBuscandoCP] = useState(false);
  const [tarifasPreferenciales, setTarifasPreferenciales] = useState<
    TarifaPreferencial[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("datosBasicos");
  const [imageUploadStatus, setImageUploadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Sync breakfast data between single and double rooms
  useEffect(() => {
    if (formData.sencilla) {
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
  ]);

  // Handler for código postal search
  const handleCodigoPostalChange = async (codigo: string) => {
    setFormData((prev) => ({ ...prev, codigoPostal: codigo }));

    if (codigo.length === 5) {
      setBuscandoCP(true);
      try {
        const data = await buscarCodigoPostal(codigo);
        setColonias(data);

        if (data.length > 0) {
          const primerResultado = data[0];
          setFormData((prev) => ({
            ...prev,
            estado: normalizarEstado(primerResultado.d_estado.toUpperCase()),
            ciudad_zona: quitarAcentos(primerResultado.d_ciudad.toUpperCase()),
            municipio: quitarAcentos(primerResultado.D_mnpio.toUpperCase()),
            id_sepomex: primerResultado.id.toString(),
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

  // Handler for colonia selection
  const handleColoniaChange = (coloniaId: string) => {
    const coloniaSeleccionada = colonias.find(
      (c) => c.id.toString() === coloniaId
    );
    if (coloniaSeleccionada) {
      setFormData((prev) => ({
        ...prev,
        colonia: coloniaSeleccionada.d_asenta,
      }));
    }
  };

  // Handle checkbox for convention
  const handleHayConvenioChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hay_convenio: checked,
      // Reset vigencia_convenio if unchecked
      vigencia_convenio: checked ? prev.vigencia_convenio : "",
      // Set default comment if unchecked
      comentario_vigencia: checked ? "" : "SIN CONVENIO",
    }));
  };

  // Handle checkbox for international
  const handleInternacionalChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      internacional: checked,
      pais: checked ? prev.pais || "" : "MEXICO",
      estado: checked ? "OTROS" : "",
    }));
  };
  // Generic form field change handler
  const handleChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as object),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
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

  // Debounced agent search
  useEffect(() => {
    tarifasPreferenciales.forEach((_, index) => {
      const delayDebounce = setTimeout(() => {
        handleSearch(index);
      }, 500);

      return () => clearTimeout(delayDebounce);
    });
  }, [
    tarifasPreferenciales
      .map((t) => t.busqueda.nombre + t.busqueda.correo)
      .join(),
  ]);

  // Handle search input change
  const handleSearchInputChange = (
    index: number,
    field: "nombre" | "correo",
    value: string
  ) => {
    const newTarifas = [...tarifasPreferenciales];
    newTarifas[index].busqueda[field] = value;
    setTarifasPreferenciales(newTarifas);
  };

  // Handle agent selection
  const handleSelectAgente = (index: number, agente: Agente) => {
    const newTarifas = [...tarifasPreferenciales];
    newTarifas[index].id_agente = agente.id_agente;
    newTarifas[index].nombre_agente = agente.primer_nombre;
    newTarifas[index].correo_agente = agente.correo;
    newTarifas[index].busqueda.nombre = agente.primer_nombre;
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
    const newTarifas = [...tarifasPreferenciales];

    if (field.includes(".")) {
      const [parent, child] = field.split(".") as [
        keyof TarifaPreferencial,
        string
      ];
      if (parent === "sencilla" || parent === "doble") {
        newTarifas[index][parent] = {
          ...newTarifas[index][parent],
          [child]: value,
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
            [child]: value,
          };
        }
      } else if (parent === "busqueda") {
        newTarifas[index].busqueda = {
          ...newTarifas[index].busqueda,
          [child]: value,
        };
      }
    } else {
      // For top-level properties
      newTarifas[index] = {
        ...newTarifas[index],
        [field]: value,
      };
    }

    setTarifasPreferenciales(newTarifas);
  };

  // Add a new preferential rate
  const addTarifaPreferencial = () => {
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
          precio_noche_extra: "",
          // No precio_persona_extra for preferential rates
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

  // Form submission handler
  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const requiredFields = {
        nombre: "NOMBRE",
        tipo_negociacion: "TIPO DE NEGOCIACION",
        estado: "ESTADO",
        ciudad_zona: "CIUDAD",
        costo_q: "COSTO PROVEEDOR HABITACION SENCILLA",
        precio_q: "PRECIO DE VENTA HABITACION SENCILLA",
        costo_qq: "COSTO PROVEEDOR HABITACION DOBLE",
        precio_qq: "PRECIO DE VENTA HABITACION DOBLE",
      };

      // Add vigencia_convenio as required if hay_convenio is checked
      if (formData.hay_convenio) {
        requiredFields["vigencia_convenio" as keyof typeof requiredFields] =
          "VIGENCIA DEL CONVENIO";
      }
      // add pais as required if internacional is checked
      if (formData.internacional) {
        requiredFields["pais" as keyof typeof requiredFields] = "PAIS";
      }

      const missingFields = Object.entries(requiredFields)
        .filter(
          ([field]) =>
            !formData[field as keyof FormData] &&
            formData[field as keyof FormData] !== 0
        )
        .map(([_, name]) => name);

      if (missingFields.length > 0) {
        throw new Error(
          `FALTAN CAMPOS OBLIGATORIOS: ${missingFields.join(", ")}`
        );
      }

      const formatNumber = (value: any) => {
        if (value === null || value === undefined || value === "") return null;
        const num = Number(value);
        return isNaN(num) ? null : num.toFixed(2);
      };

      // Construir la dirección completa
      const direccionCompleta = `${formData.calle || ""},${
        formData.numero || ""
      } ,${formData.colonia}, ${formData.municipio}, ${formData.estado}, CP ${
        formData.codigoPostal
      }`;

      // Combine all notes fields
      const combinedNotes = combineNotes();

      // Subir imagen si hay archivo seleccionado
      let imageUrl = formData.urlImagenHotel;
      if (selectedImageFile) {
        setImageUploadStatus("loading");
        const { publicUrl } = await uploadHotelImage({
          file: selectedImageFile,
          url: URL,
          apiKey: API_KEY || "",
        });
        imageUrl = publicUrl;
        setImageUploadStatus("success");
      }

      const payload = {
        id_excel: formData.id_excel ? Number(formData.id_excel) : null,
        tipo_negociacion: formData.tipo_negociacion || null,
        vigencia_convenio: formData.hay_convenio
          ? formData.vigencia_convenio
          : null,
        comentario_vigencia: !formData.hay_convenio
          ? formData.comentario_vigencia
          : null,
        nombre: formData.nombre,
        id_cadena: 11,
        rfc: formData.rfc || null,
        razon_social: formData.razon_social || null,
        direccion: direccionCompleta,
        latitud: formData.latitud || null,
        longitud: formData.longitud || null,
        estado: formData.estado,
        ciudad_zona: formData.ciudad_zona,
        codigoPostal: formData.codigoPostal,
        colonia: formData.colonia,
        tipo_hospedaje: formData.tipo_hospedaje || "hotel",
        tipo_pago: formData.tipo_pago || null,
        disponibilidad_precio: formData.disponibilidad_precio || null,
        contacto_convenio: formData.contacto_convenio || null,
        contacto_recepcion: formData.contacto_recepcion || null,
        iva: formData.iva ? Number(formData.iva) : null,
        ish: formData.ish ? Number(formData.ish) : null,
        otros_impuestos: formData.otros_impuestos
          ? Number(formData.otros_impuestos)
          : null,
        otros_impuestos_porcentaje: formData.otros_impuestos_porcentaje
          ? Number(formData.otros_impuestos_porcentaje)
          : null,
        menoresEdad: formData.menoresEdad || null,
        paxExtraPersona: formData.doble.precio_persona_extra
          ? Number(formData.doble.precio_persona_extra)
          : null,
        transportacion: formData.transportacion || null,
        transportacionComentarios: formData.transportacionComentarios || null,
        mascotas: formData.mascotas || null,
        salones: formData.salones || null,
        urlImagenHotel: imageUrl || null,
        urlImagenHotelQ: formData.urlImagenHotelQ || null,
        urlImagenHotelQQ: formData.urlImagenHotelQQ || null,
        comentario_pago: formData.comentario_pago || null,
        calificacion: formData.calificacion
          ? Number(formData.calificacion)
          : null,
        id_sepomex: formData.id_sepomex || null,
        Comentarios: combinedNotes || null,
        activo: formData.activo !== undefined ? formData.activo : 1,
        tarifas: {
          general: {
            costo_q: formatNumber(formData.costo_q) || "0.00",
            precio_q: formatNumber(formData.precio_q) || "0.00",
            costo_qq: formatNumber(formData.costo_qq) || "0.00",
            precio_qq: formatNumber(formData.precio_qq) || "0.00",
            precio_persona_extra: formData.doble.precio_persona_extra
              ? formatNumber(formData.doble.precio_persona_extra)
              : null,

            sencilla: {
              incluye: formData.sencilla.incluye,
              tipo_desayuno: formData.sencilla.tipo_desayuno || null,
              precio: formData.sencilla.incluye
                ? formatNumber(formData.sencilla.precio)
                : null,
              comentarios: formData.sencilla.comentarios || null,
              precio_noche_extra: formData.sencilla.precio_noche_extra
                ? formatNumber(formData.sencilla.precio_noche_extra)
                : null,
            },

            doble: {
              incluye: formData.doble.incluye,
              tipo_desayuno: formData.doble.tipo_desayuno || null,
              precio: formData.doble.incluye
                ? formatNumber(formData.doble.precio)
                : null,
              comentarios: formData.doble.comentarios || null,
              precio_persona_extra: formData.doble.precio_persona_extra
                ? formatNumber(formData.doble.precio_persona_extra)
                : null,
              precio_noche_extra: formData.doble.precio_noche_extra
                ? formatNumber(formData.doble.precio_noche_extra)
                : null,
            },
          },

          preferenciales: tarifasPreferenciales.map((t) => ({
            id_agente: t.id_agente || null,
            costo_q: formatNumber(t.costo_q) || "0.00",
            precio_q: formatNumber(t.precio_q) || "0.00",
            costo_qq: formatNumber(t.costo_qq) || "0.00",
            precio_qq: formatNumber(t.precio_qq) || "0.00",

            sencilla: {
              incluye: t.sencilla.incluye,
              tipo_desayuno: t.sencilla.tipo_desayuno || null,
              precio: t.sencilla.incluye
                ? formatNumber(t.sencilla.precio)
                : null,
              comentarios: t.sencilla.comentarios || null,
              precio_noche_extra: null,
            },

            doble: {
              incluye: t.doble.incluye,
              tipo_desayuno: t.doble.tipo_desayuno || null,
              precio: t.doble.incluye ? formatNumber(t.doble.precio) : null,
              comentarios: t.doble.comentarios || null,
              precio_noche_extra: null,
            },
          })),
        },
        pais: formData.pais || null,
        score_operaciones: formData.score_operaciones || 0,
      };

      const response = await fetch(
        //"http://localhost:3001/v1/mia/hoteles/Agregar-hotel/"
        `${URL}/mia/hoteles/Agregar-hotel/`,
        {
          method: "POST",
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `ERROR ${response.status}: ${response.statusText}`
        );
      }

      setSuccessMessage("HOTEL CREADO EXITOSAMENTE!");

      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("ERROR AL CREAR HOTEL:", error);
      setErrorMessage(error.message || "ERROR AL CREAR HOTEL");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form after successful submission
  const resetForm = () => {
    setFormData({
      id_cadena: "",
      activo: 1,
      nombre: "",
      codigoPostal: "",
      calle: "",
      numero: "",
      colonia: "",
      estado: "",
      internacional: false,
      pais: "MEXICO",
      ciudad_zona: "",
      municipio: "",
      tipo_negociacion: "",
      hay_convenio: true,
      vigencia_convenio: "",
      comentario_vigencia: "SIN CONVENIO",
      urlImagenHotel: "",
      urlImagenHotelQ: "",
      urlImagenHotelQQ: "",
      tipo_pago: "",
      disponibilidad_precio: "",
      contacto_convenio: "",
      contacto_recepcion: "",
      iva: "",
      ish: "",
      otros_impuestos: "",
      otros_impuestos_porcentaje: "",
      menoresEdad: "",
      transportacion: "",
      transportacionComentarios: "",
      mascotas: "",
      salones: "",
      rfc: "",
      razon_social: "",
      calificacion: "",
      tipo_hospedaje: "hotel",
      notas_datosBasicos: "",
      notas_tarifasServicios: "",
      notas_informacionPagos: "",
      notas_informacion_adicional: "",
      notas_generales: "",
      notas: "",
      id_sepomex: "",
      latitud: "",
      longitud: "",
      solicitud_disponibilidad: "",
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
        precio_persona_extra: "",
        precio_noche_extra: "",
      },
      score_operaciones: 0,
    });
    setTarifasPreferenciales([]);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Handler for image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setFormData((prev) => ({
      ...prev,
      urlImagenHotel: "", // Limpiar la URL previa si hay una nueva selección
    }));
    setImageUploadStatus("idle");
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setFormData((prev) => ({
      ...prev,
      urlImagenHotel: "",
    }));
    setImageUploadStatus("idle");
    const input = document.getElementById(
      "uploadImageInput"
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSuccessMessage("");
          setErrorMessage("");
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            AGREGAR NUEVO PROVEEDOR
          </DialogTitle>
        </DialogHeader>

        {/* Loading, Success and Error Messages */}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">PROCESANDO...</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-100">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100">
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
          <TabsContent value="datosBasicos" className="space-y-6 min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required fields first */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="nombre">
                  NOMBRE DEL PROVEEDOR <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    handleChange("nombre", e.target.value.toUpperCase())
                  }
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
                    handleChange(
                      "tipo_negociacion",
                      e.target.value.toUpperCase()
                    )
                  }
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
                    />
                    <span className="ml-2">¿HAY CONVENIO?</span>
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
                        convertToDDMMYYYY(e.target.value)
                      )
                    }
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
                      handleChange(
                        "comentario_vigencia",
                        e.target.value.toUpperCase()
                      )
                    }
                    disabled
                  />
                </div>
              )}

              {/*Aqui vamos a poner el checkbox de pais*/}

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
                    />
                    <span className="ml-2">Hotel internacional</span>
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
                    onChange={(e) =>
                      handleChange("pais", e.target.value.toUpperCase())
                    }
                    required
                  />
                </div>
              )}

              {/* Aqui termina la lógica para el nuevo campo de pais */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="estadoSelect">
                  ESTADO <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.estado}
                  onValueChange={(val) =>
                    handleChange("estado", val.toUpperCase())
                  }
                  required
                  disabled={formData.internacional}
                >
                  <SelectTrigger
                    id="estadoSelect"
                    className="bg-gray-100 dark:bg-gray-800"
                  >
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    {estadosMX.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="ciudad_zona">
                  CIUDAD <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ciudad_zona"
                  value={formData.ciudad_zona.toUpperCase()}
                  onChange={(e) =>
                    handleChange("ciudad_zona", e.target.value.toUpperCase())
                  }
                  className="bg-gray-100 dark:bg-gray-800"
                  required
                />
              </div>

              {/* Optional fields */}
              <div className="flex flex-col space-y-1">
                <Label htmlFor="id_excel">ID EXCEL (SEGUIMIENTO)</Label>
                <Input
                  id="id_excel"
                  value={formData.id_excel || ""}
                  onChange={(e) =>
                    handleChange("id_excel", e.target.value.toUpperCase())
                  }
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="codigoPostal">CODIGO POSTAL</Label>
                <Input
                  id="codigoPostal"
                  value={formData.codigoPostal}
                  onChange={(e) => handleCodigoPostalChange(e.target.value)}
                  maxLength={5}
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
                  onChange={(e) =>
                    handleChange("calle", e.target.value.toUpperCase())
                  }
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="numero">NUMERO</Label>
                <Input
                  id="numero"
                  value={formData.numero || ""}
                  onChange={(e) =>
                    handleChange("numero", e.target.value.toUpperCase())
                  }
                />
              </div>

              {colonias.length > 0 && (
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="colonia">COLONIA</Label>
                  <Select onValueChange={handleColoniaChange}>
                    <SelectTrigger id="colonia" className="w-full">
                      <SelectValue placeholder="SELECCIONA UNA COLONIA" />
                    </SelectTrigger>
                    <SelectContent>
                      {colonias.map((colonia) => (
                        <SelectItem
                          key={colonia.id}
                          value={colonia.id.toString()}
                        >
                          {quitarAcentos(colonia.d_asenta.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <Label htmlFor="municipio">MUNICIPIO</Label>
                <Input
                  id="municipio"
                  value={formData.municipio}
                  onChange={(e) =>
                    handleChange("municipio", e.target.value.toUpperCase())
                  }
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
                    handleChange(
                      "disponibilidad_precio",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="EMAIL, TELEFONO, ETC."
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="contacto_convenio">CONTACTOS DE CONVENIO</Label>
                <Textarea
                  id="contacto_convenio"
                  value={formData.contacto_convenio}
                  onChange={(e) =>
                    handleChange(
                      "contacto_convenio",
                      e.target.value.toUpperCase()
                    )
                  }
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
                    handleChange(
                      "contacto_recepcion",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="NOMBRE Y DATOS DE CONTACTO"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="uploadImage">Imagen del Hotel</Label>
                {selectedImageFile && (
                  <span className="text-xs text-muted-foreground break-all">
                    {selectedImageFile.name}
                  </span>
                )}
                {formData.urlImagenHotel && !selectedImageFile && (
                  <span className="text-xs text-muted-foreground break-all">
                    {formData.urlImagenHotel}
                  </span>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    disabled={imageUploadStatus === "loading"}
                    onClick={() =>
                      document.getElementById("uploadImageInput")?.click()
                    }
                  >
                    Seleccionar Imagen
                  </Button>
                  {(selectedImageFile || formData.urlImagenHotel) && (
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={handleRemoveImage}
                    >
                      Eliminar selección
                    </Button>
                  )}
                </div>

                <input
                  id="uploadImageInput"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />

                {imageUploadStatus === "success" && (
                  <p className="text-green-600 text-sm">
                    Imagen subida correctamente
                  </p>
                )}
                {imageUploadStatus === "error" && (
                  <p className="text-red-600 text-sm">
                    Error al subir la imagen
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="urlImagenHotelQ">
                  IMAGEN HABITACION SENCILLA (URL)
                </Label>
                <Input
                  id="urlImagenHotelQ"
                  value={formData.urlImagenHotelQ}
                  onChange={(e) =>
                    handleChange("urlImagenHotelQ", e.target.value)
                  }
                  placeholder="HTTPS://EJEMPLO.COM/IMAGEN.JPG"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="urlImagenHotelQQ">
                  IMAGEN HABITACION DOBLE (URL)
                </Label>
                <Input
                  id="urlImagenHotelQQ"
                  value={formData.urlImagenHotelQQ}
                  onChange={(e) =>
                    handleChange("urlImagenHotelQQ", e.target.value)
                  }
                  placeholder="HTTPS://EJEMPLO.COM/IMAGEN.JPG"
                />
              </div>

              {/* Notes field for this tab */}
              <div className="col-span-1 md:col-span-2 flex flex-col space-y-1 mt-4 border-t pt-4">
                <Label htmlFor="notas_datosBasicos">NOTAS DATOS BÁSICOS</Label>
                <Textarea
                  id="notas_datosBasicos"
                  value={formData.notas_datosBasicos}
                  onChange={(e) =>
                    handleChange(
                      "notas_datosBasicos",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="NOTAS ESPECÍFICAS SOBRE LOS DATOS BÁSICOS"
                  className="min-h-[100px]"
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
                    onChange={(e) => handleChange("precio_qq", e.target.value)}
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
                    type="number"
                    placeholder="0.00"
                    value={formData.doble.precio_persona_extra}
                    onChange={(e) =>
                      handleChange("doble.precio_persona_extra", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="menoresEdad">MENORES DE EDAD</Label>
                  <Textarea
                    id="menoresEdad"
                    value={formData.menoresEdad}
                    onChange={(e) => {
                      console.log("hiola");
                      handleChange("menoresEdad", e.target.value.toUpperCase());
                    }}
                    placeholder="INFORMACION SOBRE ESTADIA DE MENORES"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="iva">IMPUESTOS (IVA) EN %</Label>
                  <Input
                    id="iva"
                    value={formData.iva}
                    onChange={(e) => handleChange("iva", e.target.value)}
                    placeholder="EJ: 16.00"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <Label htmlFor="ish">IMPUESTOS (ISH) EN %</Label>
                  <Input
                    id="ish"
                    value={formData.ish}
                    onChange={(e) => handleChange("ish", e.target.value)}
                    placeholder="EJ: 3.00"
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
                    placeholder="EJ: 100.00"
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
                    placeholder="EJ: 5.00"
                  />
                </div>
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
                    className="h-4 w-4"
                  />
                  <Label htmlFor="incluye-sencilla-general">
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
                        handleChange(
                          "sencilla.tipo_desayuno",
                          e.target.value.toUpperCase()
                        )
                      }
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
                      />
                    </div>
                  )}

                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="sencilla_comentarios">COMENTARIO</Label>
                    <Textarea
                      id="sencilla_comentarios"
                      value={formData.sencilla.comentarios}
                      onChange={(e) =>
                        handleChange(
                          "sencilla.comentarios",
                          e.target.value.toUpperCase()
                        )
                      }
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
                    className="h-4 w-4"
                  />
                  <Label htmlFor="incluye-doble-general">
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
                        handleChange(
                          "doble.tipo_desayuno",
                          e.target.value.toUpperCase()
                        )
                      }
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
                      />
                    </div>
                  )}

                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="doble_comentarios">COMENTARIO</Label>
                    <Textarea
                      id="doble_comentarios"
                      value={formData.doble.comentarios}
                      onChange={(e) =>
                        handleChange(
                          "doble.comentarios",
                          e.target.value.toUpperCase()
                        )
                      }
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTarifaPreferencial}
                  className="flex items-center gap-1"
                >
                  <Plus size={16} /> AGREGAR
                </Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-2">
                {tarifasPreferenciales.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-md">
                    NO HAY TARIFAS PREFERENCIALES. AGREGA UNA PARA COMENZAR.
                  </div>
                ) : (
                  tarifasPreferenciales.map((tarifa, index) => (
                    <div
                      key={index}
                      className="border rounded-md p-4 mb-4 space-y-4"
                    >
                      {/* Búsqueda de agente */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="relative">
                          <Label className="mb-2 block">BUSCAR AGENTE</Label>
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
                                    e.target.value.toUpperCase()
                                  )
                                }
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

                        {tarifa.id_agente && (
                          <div className="text-sm bg-blue-50 dark:bg-blue-900 p-2 rounded border border-blue-200 dark:border-blue-800">
                            <span className="font-semibold">
                              AGENTE SELECCIONADO:
                            </span>{" "}
                            {tarifa.nombre_agente.toUpperCase()} (
                            {tarifa.correo_agente})
                          </div>
                        )}
                      </div>

                      {/* Tarifas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex flex-col space-y-1">
                          <Label htmlFor={`costo_q_${index}`}>
                            COSTO PROVEEDOR HABITACION SENCILLA CON IMPUESTOS
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
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Label htmlFor={`precio_q_${index}`}>
                            PRECIO DE VENTA HABITACION SENCILLA CON IMPUESTOS
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
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Label htmlFor={`costo_qq_${index}`}>
                            COSTO PROVEEDOR HABITACION DOBLE CON IMPUESTOS
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
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Label htmlFor={`precio_qq_${index}`}>
                            PRECIO DE VENTA HABITACION DOBLE CON IMPUESTOS
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
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`pref-sencilla-${index}`}>
                            ¿INCLUYE DESAYUNO EN HABITACION SENCILLA?
                          </Label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                          <div className="flex flex-col space-y-1">
                            <Label htmlFor={`sencilla_tipo_desayuno_${index}`}>
                              TIPO DE DESAYUNO
                            </Label>
                            <Input
                              id={`sencilla_tipo_desayuno_${index}`}
                              value={tarifa.sencilla.tipo_desayuno}
                              onChange={(e) =>
                                handleTarifaPreferencialChange(
                                  index,
                                  "sencilla.tipo_desayuno",
                                  e.target.value.toUpperCase()
                                )
                              }
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
                                  e.target.value.toUpperCase()
                                )
                              }
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
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`pref-doble-${index}`}>
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
                                  e.target.value.toUpperCase()
                                )
                              }
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
                                  e.target.value.toUpperCase()
                                )
                              }
                              placeholder="DETALLES ADICIONALES"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          variant="outline"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeTarifaPreferencial(index)}
                          size="sm"
                        >
                          <Trash2 size={16} className="mr-1" /> ELIMINAR
                        </Button>
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
                    handleChange(
                      "notas_tarifasServicios",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="NOTAS ESPECÍFICAS SOBRE TARIFAS Y SERVICIOS"
                  className="min-h-[100px]"
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
                >
                  <SelectTrigger id="tipo_pago">
                    <SelectValue placeholder="SELECCIONA EL TIPO DE PAGO" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDITO">CREDITO</SelectItem>
                    <SelectItem value="PREPAGO">PREPAGO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="comentario_pago">DETALLES TIPO DE PAGO</Label>
                <Textarea
                  id="comentario_pago"
                  value={formData.comentario_pago || ""}
                  onChange={(e) =>
                    handleChange(
                      "comentario_pago",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="INFORMACION ADICIONAL SOBRE EL PAGO"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="razon_social">RAZON SOCIAL</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) =>
                    handleChange("razon_social", e.target.value.toUpperCase())
                  }
                  placeholder="NOMBRE LEGAL DE LA EMPRESA"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) =>
                    handleChange("rfc", e.target.value.toUpperCase())
                  }
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
                    handleChange(
                      "notas_informacionPagos",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="NOTAS ESPECÍFICAS SOBRE INFORMACIÓN DE PAGOS"
                  className="min-h-[100px]"
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
                  value={formData.mascotas}
                  onChange={(e) =>
                    handleChange("mascotas", e.target.value.toUpperCase())
                  }
                  placeholder="POLITICAS PARA MASCOTAS"
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="salones">SALONES</Label>
                <Textarea
                  id="salones"
                  value={formData.salones}
                  onChange={(e) =>
                    handleChange("salones", e.target.value.toUpperCase())
                  }
                  placeholder="INFORMACION SOBRE SALONES DISPONIBLES"
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <Label htmlFor="transportacion">TRANSPORTACION</Label>
                <Textarea
                  id="transportacion"
                  value={formData.transportacion}
                  onChange={(e) =>
                    handleChange("transportacion", e.target.value.toUpperCase())
                  }
                  placeholder="DETALLES DE TRANSPORTACION"
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="score_operaciones">SCORE</Label>
                <Input
                  type="number"
                  id="score_operaciones"
                  value={formData.score_operaciones ?? ""}
                  onChange={(e) =>
                    handleChange("score_operaciones", e.target.value)
                  }
                  style={{
                    color: "black",
                    opacity: 1,
                    backgroundColor: "white",
                  }}
                  className="font-medium"
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
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="INFORMACION ADICIONAL"
                  className="min-h-[100px]"
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex flex-col space-y-1 mt-4 border-t pt-4">
                <Label htmlFor="notas_generales">NOTAS GENERALES</Label>
                <Textarea
                  id="notas_generales"
                  value={formData.notas_generales}
                  onChange={(e) =>
                    handleChange(
                      "notas_generales",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="COMENTARIOS ADICIONALES SOBRE EL HOTEL"
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSubmit}
            className={cn(
              "bg-green-600 hover:bg-green-700 text-white",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 text-white border-b-2 rounded-full"></div>
                <span>PROCESANDO...</span>
              </div>
            ) : (
              "CREAR HOTEL"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
