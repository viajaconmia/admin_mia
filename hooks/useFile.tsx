import { useState } from "react";

export const useFile = () => {
  const [loadingFile, setLoadingFile] = useState(false);
  const csv = (data, filename = "new_file") => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.map((key) => key.replace(/_/g, " ").toUpperCase()).join(","),
      ...data.map((row) =>
        headers
          .map((field) => {
            let val = row[field];
            return `"${(val ?? "").toString().replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { csv, loadingFile, setLoadingFile };
};
