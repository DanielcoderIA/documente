"use client";

/**
 * ProjectList — Lista de proyectos en el sidebar izquierdo
 * Muestra cada proyecto con su color, nombre y contador de documentos
 */
import { FileText, Plus } from "lucide-react";
import type { ProyectoUI } from "@/types/app";

interface ProjectListProps {
  proyectos: ProyectoUI[];
  proyectoActivoId: string | null;
  onSeleccionar: (id: string) => void;
  onNuevoProyecto: () => void;
}

export function ProjectList({
  proyectos,
  proyectoActivoId,
  onSeleccionar,
  onNuevoProyecto,
}: ProjectListProps) {
  return (
    <div className="flex flex-col gap-0.5 px-2">
      {proyectos.map((proyecto) => {
        const activo = proyecto.id === proyectoActivoId;

        return (
          <button
            key={proyecto.id}
            id={`proyecto-${proyecto.id}`}
            onClick={() => onSeleccionar(proyecto.id)}
            className={`
              group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left
              transition-all duration-150 cursor-pointer
              ${
                activo
                  ? "bg-[rgba(29,158,117,0.15)] text-white"
                  : "text-[#858585] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#cccccc]"
              }
            `}
          >
            {/* Punto de color del proyecto */}
            <span
              className="flex-shrink-0 w-2 h-2 rounded-full transition-transform duration-150 group-hover:scale-110"
              style={{ backgroundColor: proyecto.color }}
            />

            {/* Nombre del proyecto */}
            <span className="flex-1 text-xs font-medium truncate">
              {proyecto.nombre}
            </span>

            {/* Badge con cantidad de documentos */}
            <span
              className={`
                flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                transition-colors duration-150
                ${
                  activo
                    ? "bg-[rgba(29,158,117,0.3)] text-[#1D9E75]"
                    : "bg-[rgba(255,255,255,0.06)] text-[#636363] group-hover:text-[#858585]"
                }
              `}
            >
              {proyecto.cantidadDocs}
            </span>
          </button>
        );
      })}

      {/* Separador */}
      <div className="h-px bg-[rgba(255,255,255,0.06)] my-2 mx-2" />

      {/* Botón nuevo proyecto */}
      <button
        id="btn-nuevo-proyecto"
        onClick={onNuevoProyecto}
        className="
          flex items-center gap-2.5 px-2.5 py-2 rounded-md w-full text-left
          text-[#636363] hover:text-[#1D9E75] hover:bg-[rgba(29,158,117,0.08)]
          transition-all duration-150 cursor-pointer group
        "
      >
        <Plus
          size={13}
          className="flex-shrink-0 transition-transform duration-150 group-hover:rotate-90"
        />
        <span className="text-xs font-medium">Nuevo proyecto</span>
      </button>

      {/* Estado vacío */}
      {proyectos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <FileText size={24} className="text-[#3a3a3a]" />
          <p className="text-xs text-[#636363]">Sin proyectos aún</p>
        </div>
      )}
    </div>
  );
}
