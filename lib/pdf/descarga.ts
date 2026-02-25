export const downloadPdfSafely = (pdf: any, filename: string) => {
  // más robusto que pdf.save() en algunos navegadores/bloqueos
  try {
    if (typeof pdf?.output === "function") {
      const blob: Blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }
  } catch (e) {
    // fallback abajo
  }

  // fallback clásico
  pdf?.save?.(filename);
};
