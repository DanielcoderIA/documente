"use client";

/**
 * Header — Barra superior del panel central
 * Muestra el título del proyecto activo y los botones de acción
 */
import { Upload, Download, ScanText, ChevronRight, Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProyectoUI } from "@/types/app";
import ExportButton from "@/components/dashboard/ExportButton";

interface HeaderProps {
  proyectoActivo: ProyectoUI | null;
  onSubirPDF: () => void;
  onOCR: () => void;
  onExportar: () => void;
}

export function Header({
  proyectoActivo,
  onSubirPDF,
  onOCR,
  onExportar,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2.5 bg-[#1e1e1e] border-b border-[rgba(255,255,255,0.06)] flex-shrink-0 h-12">
      {/* ── BREADCRUMB ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Folder size={13} className="text-[#636363] flex-shrink-0" />
        <span className="text-xs text-[#636363]">Proyectos</span>
        <ChevronRight size={11} className="text-[#3a3a3a] flex-shrink-0" />

        {proyectoActivo ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="flex-shrink-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: proyectoActivo.color }}
            />
            <span className="text-xs font-semibold text-white truncate max-w-[180px]">
              {proyectoActivo.nombre}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] py-0 h-4 bg-[rgba(255,255,255,0.07)] text-[#636363] border-0 flex-shrink-0"
            >
              {proyectoActivo.cantidadDocs} docs
            </Badge>
          </div>
        ) : (
          <span className="text-xs text-[#858585] italic">
            Selecciona un proyecto
          </span>
        )}
      </div>

      {/* ── ACCIONES ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Botón OCR */}
        <button
          id="btn-ocr"
          onClick={onOCR}
          disabled={!proyectoActivo}
          className="
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
            text-[#858585] hover:text-[#cccccc] hover:bg-[rgba(255,255,255,0.06)]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150
          "
        >
          <ScanText size={13} />
          <span className="hidden sm:inline">OCR</span>
        </button>

        {/* Botón Exportar Excel */}
        {proyectoActivo ? (
          <ExportButton proyectoId={proyectoActivo.id} />
        ) : (
          <button
            disabled
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#858585] opacity-40 cursor-not-allowed transition-all duration-150"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        )}

        {/* Separador */}
        <div className="w-px h-4 bg-[rgba(255,255,255,0.08)]" />

        {/* Botón Agregar PDF — CTA principal */}
        <button
          id="btn-agregar-pdf"
          onClick={onSubirPDF}
          className="
            flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold
            bg-[#1D9E75] hover:bg-[#178f68] text-white
            transition-all duration-150 shadow-md shadow-[rgba(29,158,117,0.25)]
            hover:shadow-[rgba(29,158,117,0.4)]
          "
        >
          <Upload size={12} />
          <span className="hidden sm:inline">+ Agregar PDF</span>
        </button>
      </div>
    </header>
  );
}
