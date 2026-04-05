"use client";

import { FileText, FileImage, File } from "lucide-react";
import type { DocumentoUI } from "@/types/app";

interface DocumentListProps {
  documentos: DocumentoUI[];
  documentoSeleccionado: string | null;
  onSeleccionar: (doc: DocumentoUI) => void;
}

export function DocumentList({ documentos, documentoSeleccionado, onSeleccionar }: DocumentListProps) {
  if (!documentos || documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 text-center border border-dashed border-[rgba(255,255,255,0.06)] rounded-lg mx-4">
        <File className="w-8 h-8 text-[#3a3a3a] mb-2" />
        <p className="text-xs text-[#636363]">No hay documentos en este proyecto</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#636363]">
          Documentos del Proyecto ({documentos.length})
        </span>
      </div>
      {/* Scroll Area de Tailwind */}
      <div className="overflow-y-auto max-h-[30vh] flex flex-col gap-0.5 p-2 custom-scrollbar">
        {documentos.map((doc) => {
          const isSelected = documentoSeleccionado === doc.id;
          const isPdf = doc.tipo === "pdf" || doc.nombre_archivo.toLowerCase().endsWith(".pdf");

          return (
            <button
              key={doc.id}
              onClick={() => onSeleccionar(doc)}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group
                ${
                  isSelected
                    ? "bg-[#1D9E75]/15 border border-[#1D9E75]/30 text-white shadow-sm"
                    : "border border-transparent text-[#858585] hover:bg-white/5 hover:text-[#cccccc]"
                }
              `}
            >
              <div className={`p-1.5 rounded-md ${isSelected ? 'bg-[#1D9E75]/20' : 'bg-transparent group-hover:bg-white/5'}`}>
                {isPdf ? (
                  <FileText className={`w-4 h-4 ${isSelected ? 'text-[#1D9E75]' : 'text-[#636363]'}`} />
                ) : (
                  <FileImage className={`w-4 h-4 ${isSelected ? 'text-[#1D9E75]' : 'text-[#636363]'}`} />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-xs font-medium truncate ${isSelected ? 'text-[#e8e8e8]' : ''}`}>
                  {doc.nombre_archivo}
                </span>
                <span className="text-[10px] text-[#636363] truncate flex items-center justify-between">
                  <span>{doc.estado === "listo" ? "✅ Listo" : "⏳ Pendiente"}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
