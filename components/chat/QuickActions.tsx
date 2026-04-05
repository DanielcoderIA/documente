"use client";

/**
 * QuickActions — Botones de acciones rápidas del panel IA
 * Cada botón envía un prompt predefinido al chat
 */
import type { AccionRapida } from "@/types/app";

interface QuickActionsProps {
  acciones: AccionRapida[];
  onAccion: (prompt: string) => void;
  deshabilitado?: boolean;
}

export function QuickActions({
  acciones,
  onAccion,
  deshabilitado = false,
}: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-3 border-b border-[rgba(255,255,255,0.06)]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#636363] mb-1">
        Acciones rápidas
      </p>

      {acciones.map((accion) => (
        <button
          key={accion.id}
          id={`accion-${accion.id}`}
          onClick={() => onAccion(accion.prompt)}
          disabled={deshabilitado}
          className="
            w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left
            hover:brightness-125 transition-all duration-150
            disabled:opacity-40 disabled:cursor-not-allowed
            cursor-pointer
          "
          style={{ backgroundColor: accion.bgColor }}
        >
          {/* Indicador de color */}
          <span
            className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1"
            style={{ backgroundColor: accion.color }}
          />

          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-semibold leading-tight"
              style={{ color: accion.color }}
            >
              {accion.label}
            </p>
            <p className="text-[10px] text-[#636363] mt-0.5 leading-tight">
              {accion.descripcion}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
