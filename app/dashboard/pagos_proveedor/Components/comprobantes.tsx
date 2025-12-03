import React, { useState, useEffect } from "react";
import { Send, X, Info, Upload } from "lucide-react";
import { URL as API_URL, API_KEY } from "@/lib/constants/index";

type Comprobante = {
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
};

// Helper para validar archivos PDF
const validatePDFFiles = (files: FileList): { isValid: boolean; error?: string; validFiles?: File[] } => {
  const validFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Verificar tipo MIME
    if (file.type !== "application/pdf") {
      return {
        isValid: false,
        error: `El archivo "${file.name}" no es un PDF válido. Solo se permiten archivos PDF.`
      };
    }

    // Verificar extensión por seguridad
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return {
        isValid: false,
        error: `El archivo "${file.name}" debe tener extensión .pdf`
      };
    }

    validFiles.push(file);
  }

  return {
    isValid: true,
    validFiles
  };
};

// Helper para validar archivos CSV
const validateCSVFile = (file: File): { isValid: boolean; error?: string } => {
  // Verificar tipo MIME (puede variar según navegador)
  const validMimeTypes = [
    'text/csv',
    'application/csv',
    'text/comma-separated-values',
    'application/vnd.ms-excel' // Algunos CSV se detectan como Excel
  ];

  // Verificar extensión
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith('.csv')) {
    return {
      isValid: false,
      error: `El archivo debe tener extensión .csv`
    };
  }

  // Verificar tamaño (opcional, máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB en bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Máximo permitido: 10MB`
    };
  }

  return {
    isValid: true
  };
};

export const ComprobanteModal: React.FC<Comprobante> = ({
  onClose,
  onSubmit,
}) => {
  const [isMasivo, setIsMasivo] = useState(false); // Switch para modo masivo
  const [pdfFiles, setPdfFiles] = useState<File[]>([]); // Archivos PDF
  const [csvFile, setCsvFile] = useState<File | null>(null); // Archivo CSV
  const [codigoDispersion, setCodigoDispersion] = useState<string[]>([]); // Array de títulos
  const [codigoDispersionMultiple, setCodigoDispersionMultiple] = useState<string>(""); // Código para múltiples PDFs
  const [montos, setMontos] = useState<{ [key: string]: string }>({}); // Montos para modo individual
  const [formError, setFormError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Efecto para establecer el código de dispersión cuando hay un solo PDF
  useEffect(() => {
    if (!isMasivo && pdfFiles.length === 1) {
      // Si es un solo PDF, establecer el nombre del archivo como código por defecto
      const fileName = pdfFiles[0].name;
      // Remover la extensión .pdf para un código más limpio
      const cleanFileName = fileName.replace(/\.pdf$/i, '');
      setCodigoDispersionMultiple(cleanFileName);
    } else if (!isMasivo && pdfFiles.length > 1 && codigoDispersionMultiple) {
      // Si se cambia de un PDF a múltiples PDFs, limpiar el campo
      // Solo si el valor actual es el nombre del archivo anterior
      const firstFileName = pdfFiles[0]?.name?.replace(/\.pdf$/i, '');
      if (codigoDispersionMultiple === firstFileName) {
        setCodigoDispersionMultiple("");
      }
    }
  }, []);

  const handlePdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);

    if (event.target.files && event.target.files.length > 0) {
      const validation = validatePDFFiles(event.target.files);

      if (!validation.isValid) {
        setFileError(validation.error || "Error al validar archivos PDF");
        // Limpiar el input
        event.target.value = '';
        return;
      }

      const files = validation.validFiles || [];
      setPdfFiles(files);

      // Inicializar montos vacíos para cada archivo (solo en modo individual)
      if (!isMasivo) {
        const nuevosMontos: { [key: string]: string } = {};
        const titles = files.map(file => file.name);
        titles.forEach(title => {
          if (!montos[title]) {
            nuevosMontos[title] = "";
          }
        });
        setMontos(prev => ({ ...prev, ...nuevosMontos }));
      }
    }
  };

  const handleMontoChange = (titulo: string, valor: string) => {
    // Validar que solo se ingresen números y un punto decimal
    const regex = /^\d*\.?\d*$/;
    if (regex.test(valor) || valor === "") {
      setMontos(prev => ({
        ...prev,
        [titulo]: valor
      }));
    }
  };

  const handleCsvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const validation = validateCSVFile(file);

      if (!validation.isValid) {
        setFileError(validation.error || "Error al validar archivo CSV");
        // Limpiar el input
        event.target.value = '';
        return;
      }

      setCsvFile(file);

      // Leer el archivo CSV y extraer las columnas necesarias
      const reader = new FileReader();
      reader.onload = function (e: ProgressEvent<FileReader>) {
        const csvData = e.target?.result;
        if (typeof csvData === "string") {
          try {
            const lines = csvData.split("\n");
            if (lines.length > 0) {
              const headers = lines[0].split(",");
              console.log("Columnas del CSV:", headers);

              // Validar que el CSV tenga contenido
              if (lines.length < 2) {
                setFileError("El archivo CSV está vacío o no tiene datos");
                setCsvFile(null);
                event.target.value = '';
              }
            }
          } catch (error) {
            setFileError("Error al leer el archivo CSV. Verifica el formato.");
            setCsvFile(null);
            event.target.value = '';
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFileError(null);

    // Validaciones
    if (isMasivo && !csvFile) {
      setFormError("Por favor, sube el archivo CSV.");
      return;
    }

    if (pdfFiles.length === 0) {
      setFormError("Por favor, sube al menos un comprobante PDF.");
      return;
    }

    // Validar montos en modo individual
    if (!isMasivo) {
      const montosInvalidos = Object.values(montos).some(
        monto => monto === "" || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0
      );
      if (montosInvalidos) {
        setFormError("Por favor, ingresa un monto válido para cada PDF.");
        return;
      }

      // Validar código de dispersión en modo individual
      if (!codigoDispersionMultiple.trim()) {
        setFormError("Por favor, ingresa un código de dispersión.");
        return;
      }
    }

    // Preparar el array de códigos de dispersión
    let finalCodigoDispersion: string[];

    if (!isMasivo) {
      if (pdfFiles.length === 1) {
        // Si es un solo PDF, usar el código ingresado
        finalCodigoDispersion = [codigoDispersionMultiple.trim()];
      } else {
        // Si son múltiples PDFs, usar el código ingresado para todos
        finalCodigoDispersion = Array(pdfFiles.length).fill(codigoDispersionMultiple.trim());
      }
    } else {
      // En modo masivo, usar los nombres de los archivos
      finalCodigoDispersion = pdfFiles.map(file => file.name);
    }

    // Preparar payload
    const payload = {
      codigo_dispersion: finalCodigoDispersion,
      archivos: pdfFiles,
      csv_file: csvFile,
      montos: !isMasivo ? montos : undefined,
      codigo_dispersion_individual: !isMasivo ? codigoDispersionMultiple : undefined,
    };

    try {
      // Llamar a la función onSubmit pasada como prop
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Error inesperado:", err);
      setFormError("Ocurrió un error al guardar la dispersión.");
    }
  };

  // Función para limpiar archivos PDF
  const clearPdfFiles = () => {
    setPdfFiles([]);
    setCodigoDispersion([]);
    setCodigoDispersionMultiple("");
    if (!isMasivo) {
      setMontos({});
    }
  };

  // Función para limpiar archivo CSV
  const clearCsvFile = () => {
    setCsvFile(null);
    const csvInput = document.getElementById('csv-file') as HTMLInputElement;
    if (csvInput) csvInput.value = '';
  };

  return (
    <div className="h-fit w-[95vw] max-w-xl relative bg-white rounded-lg shadow-lg">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado del modal */}
        <div className="sticky top-0 z-10">
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex gap-3 items-start rounded-t-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">Crear dispersión</h3>
              <p className="text-xs text-blue-700">
                Sube los archivos correspondientes.
              </p>
            </div>
          </div>
          {formError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex gap-3 items-start">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">¡Ocurrió un error!</h3>
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            </div>
          )}
          {fileError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex gap-3 items-start">
              <X className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error en archivo</h3>
                <p className="text-xs text-red-700">{fileError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Switch personalizado mejorado */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-center">
            <div className="relative flex items-center bg-gray-100 rounded-full p-1 w-64">
              {/* Botón deslizante */}
              <div
                className={`absolute top-1 h-7 w-32 rounded-full bg-white border border-gray-200 shadow-sm transform transition-all duration-200 ease-in-out ${isMasivo ? 'translate-x-32' : 'translate-x-0'
                  }`}
              />

              {/* Opción 1 Solicitud */}
              <button
                type="button"
                onClick={() => setIsMasivo(false)}
                className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${!isMasivo
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                1 Solicitud
              </button>

              {/* Opción Masivo */}
              <button
                type="button"
                onClick={() => setIsMasivo(true)}
                className={`relative z-10 flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${isMasivo
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Masivo
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Campo para subir PDFs (siempre visible) */}
          <div className="space-y-4">
            <div>
              <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700 mb-1">
                Subir Comprobante PDF
              </label>
              <div className="relative">
                <input
                  id="pdf-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handlePdfChange}
                  className="w-full text-sm text-gray-800 border-2 border-dashed border-gray-300 rounded-lg p-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-1 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Solo archivos PDF. Puedes subir uno o varios.
                </p>
                {pdfFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={clearPdfFiles}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Limpiar PDFs
                  </button>
                )}
              </div>
            </div>

            {/* Lista de PDFs subidos */}
            {pdfFiles.length > 0 && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Comprobantes PDF ({pdfFiles.length})
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded ${isMasivo ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {isMasivo ? "Modo Masivo" : "Modo Individual"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pdfFiles.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded ${isMasivo ? 'bg-white' : 'bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full ${isMasivo ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>

                        {/* Campo de monto solo en modo individual */}
                        {!isMasivo && (
                          <div className="w-32">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                              <input
                                type="text"
                                placeholder="0.00"
                                value={montos[file.name] || ""}
                                onChange={(e) => handleMontoChange(file.name, e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campo para código de dispersión (siempre visible en modo individual) */}
                {!isMasivo && pdfFiles.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-1">
                            Código de Dispersión
                          </h4>
                          <p className="text-xs text-blue-700 mb-2">
                            {pdfFiles.length === 1
                              ? `Código para el documento "${pdfFiles[0].name.replace(/\.pdf$/i, '')}". Puedes editarlo si lo deseas.`
                              : `Ingresa un código de dispersión único que se aplicará a los ${pdfFiles.length} documentos para este pago.`
                            }
                          </p>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="codigo-dispersion-multiple" className="block text-xs font-medium text-gray-700 mb-1">
                          Código de Dispersión *
                        </label>
                        <div className="relative">
                          <input
                            id="codigo-dispersion-multiple"
                            type="text"
                            value={codigoDispersionMultiple}
                            onChange={(e) => setCodigoDispersionMultiple(e.target.value)}
                            placeholder={pdfFiles.length === 1 ? "Ej: PAGO-001-2024" : "Ej: PAGO-MULTIPLE-001"}
                            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {pdfFiles.length === 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const fileName = pdfFiles[0].name.replace(/\.pdf$/i, '');
                                setCodigoDispersionMultiple(fileName);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Restaurar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {pdfFiles.length === 1
                            ? "Este código identificará el pago de este documento."
                            : `Este código identificará el pago conjunto de los ${pdfFiles.length} documentos.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campo para CSV solo en modo masivo */}
          {isMasivo && (
            <div className="space-y-4">
              <div>
                <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1">
                  Subir archivo CSV
                </label>
                <div className="relative">
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvChange}
                    className="w-full text-sm text-gray-800 border-2 border-dashed border-gray-300 rounded-lg p-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="mt-1 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Solo archivos CSV. Máximo 10MB.
                  </p>
                  {csvFile && (
                    <button
                      type="button"
                      onClick={clearCsvFile}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Limpiar CSV
                    </button>
                  )}
                </div>
                {csvFile && (
                  <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Archivo CSV cargado:</p>
                        <p className="text-xs text-blue-600 truncate">{csvFile.name}</p>
                        <p className="text-xs text-blue-500 mt-1">
                          Tamaño: {(csvFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 px-4 pb-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 text-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                (isMasivo && !csvFile) ||
                (pdfFiles.length === 0) ||
                (!isMasivo && Object.values(montos).some(m => m === "")) ||
                (!isMasivo && !codigoDispersionMultiple.trim())
              }
              className={`flex-1 px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 ${(isMasivo && !csvFile) ||
                (pdfFiles.length === 0) ||
                (!isMasivo && Object.values(montos).some(m => m === "")) ||
                (!isMasivo && !codigoDispersionMultiple.trim())
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                }`}
            >
              <Send className="w-4 h-4" />
              Generar dispersión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};