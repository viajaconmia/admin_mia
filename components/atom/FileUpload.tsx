import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "success" | "error";
  progress: number;
}

interface FileUploadProps {
  onFilesUpload?: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUpload,
  acceptedTypes = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"],
  maxFileSize = 10,
  maxFiles = 5,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(
        `El archivo ${file.name} es demasiado grande. Máximo ${maxFileSize}MB.`
      );
      return false;
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      alert(`Tipo de archivo no permitido: ${fileExtension}`);
      return false;
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const newUploadedFiles: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      if (uploadedFiles.length + validFiles.length >= maxFiles) {
        alert(`Máximo ${maxFiles} archivos permitidos.`);
        return;
      }

      if (validateFile(file)) {
        validFiles.push(file);
        newUploadedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          status: "uploading",
          progress: 0,
        });
      }
    });

    if (validFiles.length > 0) {
      // Simulate upload progress
      const updatedFiles = [...uploadedFiles, ...newUploadedFiles];
      setUploadedFiles(updatedFiles);

      // Simulate upload completion
      newUploadedFiles.forEach((uploadedFile, index) => {
        setTimeout(() => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: "success", progress: 100 }
                : f
            )
          );
        }, (index + 1) * Math.round(Math.random() * 1000));
      });

      onFilesUpload?.(validFiles);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl px-28 py-6 text-center transition-all duration-300 cursor-pointer
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div
            className={`
            p-4 rounded-full transition-all duration-300
            ${
              isDragOver
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-500"
            }
          `}
          >
            <Upload size={24} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">
              {isDragOver
                ? "Suelta los archivos aquí"
                : "Arrastra archivos aquí"}
            </h3>
            <p className="text-sm text-gray-500">
              o{" "}
              <span className="text-blue-600 font-medium">
                haz clic para seleccionar
              </span>
            </p>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>Tipos permitidos: {acceptedTypes.join(", ")}</p>
            <p>Tamaño máximo: {maxFileSize}MB por archivo</p>
            <p>Máximo {maxFiles} archivos</p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Archivos seleccionados ({uploadedFiles.length})
        </h4>
        {uploadedFiles.length > 0 && (
          <>
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <File className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {uploadedFile.status === "uploading" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {uploadedFile.status === "success" && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {uploadedFile.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}

                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
