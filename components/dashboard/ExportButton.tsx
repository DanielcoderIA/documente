"use client";

import { useState } from "react";

interface ExportButtonProps {
  proyectoId: string;
}

export default function ExportButton({ proyectoId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!proyectoId) return;

    try {
      setIsExporting(true);
      
      // Hacemos el request a nuestra nueva ruta API
      const response = await fetch(`/api/exportar/excel?proyecto_id=${proyectoId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Error al generar el reporte de Excel");
      }

      // Capturamos el archivo binario como un Blob (Large Binary Object)
      const blob = await response.blob();
      
      // Creamos una URL que temporalmente apunta a este Blob en memoria
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Creamos un link <a> y hacemos click programáticamente
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "reporte.xlsx"; // Nombre final del archivo
      document.body.appendChild(a);
      a.click();
      
      // Limpieza en el Documento para liberar recursos
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error("Error exportando a Excel:", error);
      alert("Hubo un fallo al intentar exportar el proyecto a Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white transition-all duration-150 border rounded-md shadow-sm focus:outline-none w-max ${
        isExporting 
          ? "bg-[#27272a] border-[#2dd4bf]/40 cursor-not-allowed" 
          : "bg-[#18181b] border-[#2dd4bf] hover:bg-[#27272a]"
      }`}
    >
      {isExporting ? (
        <>
          <svg className="w-3.5 h-3.5 text-[#2dd4bf] animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generando...
        </>
      ) : (
        "Exportar a Excel"
      )}
    </button>
  );
}
